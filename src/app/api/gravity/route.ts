export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siteUrl       = searchParams.get('siteUrl')
  const consumerKey   = searchParams.get('consumerKey')
  const consumerSecret= searchParams.get('consumerSecret')
  const startDate     = searchParams.get('startDate') // YYYY-MM-DD
  const endDate       = searchParams.get('endDate')   // YYYY-MM-DD

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'siteUrl, consumerKey and consumerSecret are required' },
      { status: 400 }
    )
  }

  try {
    const base  = siteUrl.replace(/\/$/, '')
    const creds = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`

    // Date range — only applied to period-scoped queries, NOT to totals/spam/trash
    const dateQ = [
      startDate ? `start_date=${encodeURIComponent(startDate)}` : '',
      endDate   ? `end_date=${encodeURIComponent(endDate)}`     : '',
    ].filter(Boolean).join('&')
    const withDate = (extra = '') => [creds, extra, dateQ].filter(Boolean).join('&')
    const noDate   = (extra = '') => [creds, extra].filter(Boolean).join('&')

    const count = (url: string) =>
      fetch(url).then(r => r.json()).then(d => Number(d.total_count) || 0).catch(() => 0)

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
      totalAll,    // GF "Total" tab — all statuses, all time — no date filter
      activeCount, // active entries for selected period
      spamCount,   // always all-time to match GF Spam folder
      trashCount,  // always all-time to match GF Trash folder
      allEntries,
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
              is_active: form.is_active, date_created: form.date_created,
            }
          } catch {
            return { id: form.id, title: form.title, total_count: 0, is_active: form.is_active, date_created: form.date_created }
          }
        })
      ),

      // Total ALL entries all-time (active + spam + trash) — matches GF "Total (N)"
      count(`${base}/wp-json/gf/v2/entries?status=all&paging[page_size]=1&${noDate()}`),

      // Active entries — scoped to selected period
      count(`${base}/wp-json/gf/v2/entries?status=active&paging[page_size]=1&${withDate()}`),

      // Spam — always all-time, matches GF Spam folder count
      count(`${base}/wp-json/gf/v2/entries?status=spam&paging[page_size]=1&${noDate()}`),

      // Trash — always all-time, matches GF Trash folder count
      count(`${base}/wp-json/gf/v2/entries?status=trash&paging[page_size]=1&${noDate()}`),

      // Last 50 entries (all statuses) — scoped to selected period
      fetch(`${base}/wp-json/gf/v2/entries?status=all&paging[page_size]=50&sorting[key]=date_created&sorting[direction]=DESC&${withDate()}`)
        .then(r => r.json()).catch(() => ({ entries: [] })),
    ])

    return NextResponse.json({
      summary: {
        totalForms:       formsList.length,
        totalSubmissions: totalAll,   // matches GF "Total (N)" exactly
        activeForms:      formStats.filter(f => f.is_active === '1' || f.is_active === true || f.is_active === 1).length,
        statusCounts: {
          active: activeCount,
          spam:   spamCount,
          trash:  trashCount,
        },
      },
      forms:   formStats.sort((a, b) => b.total_count - a.total_count),
      entries: (allEntries.entries || []).map((e: any) => ({
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
