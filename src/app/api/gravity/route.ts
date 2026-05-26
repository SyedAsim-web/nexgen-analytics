export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const isActive = (val: any) =>
  val === true || val === 1 || val === '1' || val === 'true'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siteUrl        = searchParams.get('siteUrl')
  const consumerKey    = searchParams.get('consumerKey')
  const consumerSecret = searchParams.get('consumerSecret')
  const startDate      = searchParams.get('startDate')
  const endDate        = searchParams.get('endDate')

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'siteUrl, consumerKey and consumerSecret are required' },
      { status: 400 }
    )
  }

  try {
    const base  = siteUrl.replace(/\/$/, '')
    const creds = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`

    const dateQ = [
      startDate ? `start_date=${encodeURIComponent(startDate)}` : '',
      endDate   ? `end_date=${encodeURIComponent(endDate)}`     : '',
    ].filter(Boolean).join('&')

    const withDate = (extra = '') => [creds, extra, dateQ].filter(Boolean).join('&')
    const noDate   = (extra = '') => [creds, extra].filter(Boolean).join('&')

    const count = (url: string) =>
      fetch(url).then(r => r.json()).then(d => Number(d.total_count) || 0).catch(() => 0)

    const getEntries = (url: string) =>
      fetch(url).then(r => r.json()).then(d => (d.entries || []) as any[]).catch(() => [] as any[])

    // ── Fetch forms list ─────────────────────────────────────────────────────
    const formsRes = await fetch(`${base}/wp-json/gf/v2/forms?${creds}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!formsRes.ok) {
      const err = await formsRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: `Gravity Forms API error: ${JSON.stringify(err)}` },
        { status: formsRes.status }
      )
    }
    const forms     = await formsRes.json()
    const formsList = Array.isArray(forms) ? forms : Object.values(forms)

    // ── All fetches in parallel ───────────────────────────────────────────────
    const [
      formStats,
      activeAll,    // active entries all-time — part of totalSubmissions
      activeCount,  // active entries for selected period (summary card)
      spamCount,    // spam all-time — matches GF Spam folder
      trashCount,   // trash all-time — matches GF Trash folder
      activeEntries,
      spamEntries,
      trashEntries,
    ] = await Promise.all([

      // Per-form active entry counts — scoped to selected period
      Promise.all(
        formsList.map(async (form: any) => {
          try {
            const r    = await fetch(`${base}/wp-json/gf/v2/entries?form_ids[]=${form.id}&status=active&paging[page_size]=1&${withDate()}`)
            const data = await r.json()
            return {
              id: form.id, title: form.title,
              total_count: Number(data.total_count) || 0,
              is_active: isActive(form.is_active),
              date_created: form.date_created,
            }
          } catch {
            return { id: form.id, title: form.title, total_count: 0, is_active: isActive(form.is_active), date_created: form.date_created }
          }
        })
      ),

      // All-time active — for totalSubmissions calculation
      count(`${base}/wp-json/gf/v2/entries?status=active&paging[page_size]=1&${noDate()}`),

      // Active entries — scoped to selected period
      count(`${base}/wp-json/gf/v2/entries?status=active&paging[page_size]=1&${withDate()}`),

      // Spam — always all-time, matches GF Spam folder count
      count(`${base}/wp-json/gf/v2/entries?status=spam&paging[page_size]=1&${noDate()}`),

      // Trash — always all-time, matches GF Trash folder count
      count(`${base}/wp-json/gf/v2/entries?status=trash&paging[page_size]=1&${noDate()}`),

      // Recent active entries — period-scoped
      getEntries(`${base}/wp-json/gf/v2/entries?status=active&paging[page_size]=30&sorting[key]=date_created&sorting[direction]=DESC&${withDate()}`),

      // Spam entries — all-time (so Spam tab shows them)
      getEntries(`${base}/wp-json/gf/v2/entries?status=spam&paging[page_size]=20&sorting[key]=date_created&sorting[direction]=DESC&${noDate()}`),

      // Trash entries — all-time (so Trash tab shows them)
      getEntries(`${base}/wp-json/gf/v2/entries?status=trash&paging[page_size]=20&sorting[key]=date_created&sorting[direction]=DESC&${noDate()}`),
    ])

    // Tag each entry with its known status (GF API doesn't always include it in the entry object)
    const taggedActive = activeEntries.map((e: any) => ({ ...e, status: 'active' }))
    const taggedSpam   = spamEntries.map((e: any)   => ({ ...e, status: 'spam'   }))
    const taggedTrash  = trashEntries.map((e: any)  => ({ ...e, status: 'trash'  }))

    const merged = [...taggedActive, ...taggedSpam, ...taggedTrash]
      .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())

    return NextResponse.json({
      summary: {
        totalForms:       formsList.length,
        // GF "Total (N)" = all-time active + all-time spam + all-time trash
        totalSubmissions: activeAll + spamCount + trashCount,
        activeForms:      formStats.filter(f => f.is_active).length,
        statusCounts: {
          active: activeCount,  // period-scoped
          spam:   spamCount,    // all-time
          trash:  trashCount,   // all-time
        },
      },
      forms:   formStats.sort((a, b) => b.total_count - a.total_count),
      entries: merged.map((e: any) => ({
        id:           e.id,
        form_id:      e.form_id,
        date_created: e.date_created,
        status:       e.status,
        ip:           e.ip,
        source_url:   e.source_url,
      })),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
