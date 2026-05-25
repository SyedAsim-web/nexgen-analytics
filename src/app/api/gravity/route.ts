export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siteUrl = searchParams.get('siteUrl')
  const consumerKey = searchParams.get('consumerKey')
  const consumerSecret = searchParams.get('consumerSecret')
  const startDate = searchParams.get('startDate') // YYYY-MM-DD
  const endDate   = searchParams.get('endDate')   // YYYY-MM-DD

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'siteUrl, consumerKey and consumerSecret are required' }, { status: 400 })
  }

  try {
    const baseUrl = siteUrl.replace(/\/$/, '')
    const creds = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`

    // Date params — applied to submission counts and entries but NOT to spam/trash totals
    const dateQ = [
      startDate ? `start_date=${encodeURIComponent(startDate)}` : '',
      endDate   ? `end_date=${encodeURIComponent(endDate)}`     : '',
    ].filter(Boolean).join('&')

    const d = (extra = '') => `${creds}${extra ? `&${extra}` : ''}`

    // Helper: GF REST API v2 uses search[status] for status filtering
    const statusQ = (s: string) => `search%5Bstatus%5D=${s}` // search[status]=s URL-encoded

    // ── Fetch forms ──────────────────────────────────────────────────────────
    const formsRes = await fetch(`${baseUrl}/wp-json/gf/v2/forms?${creds}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!formsRes.ok) {
      const err = await formsRes.json()
      return NextResponse.json({ error: `Gravity Forms API error: ${JSON.stringify(err)}` }, { status: formsRes.status })
    }
    const forms = await formsRes.json()
    const formsList = Array.isArray(forms) ? forms : Object.values(forms)

    // ── All parallel fetches ─────────────────────────────────────────────────
    const [
      formStats,
      activeCount,
      spamCount,    // always all-time — matches GF dashboard
      trashCount,   // always all-time — matches GF dashboard
      allEntries,
    ] = await Promise.all([

      // Per-form active submission counts (scoped to selected period)
      Promise.all(
        formsList.map(async (form: any) => {
          try {
            const q = dateQ ? `&${dateQ}` : ''
            const r = await fetch(
              `${baseUrl}/wp-json/gf/v2/entries?form_ids[]=${form.id}&${statusQ('active')}&paging[page_size]=1&${creds}${q}`
            )
            const data = await r.json()
            return {
              id: form.id,
              title: form.title,
              total_count: data.total_count || 0,
              is_active: form.is_active,
              date_created: form.date_created,
            }
          } catch {
            return { id: form.id, title: form.title, total_count: 0, is_active: form.is_active, date_created: form.date_created }
          }
        })
      ),

      // Active entries count — scoped to period
      fetch(`${baseUrl}/wp-json/gf/v2/entries?${statusQ('active')}&paging[page_size]=1&${d(dateQ)}`)
        .then(r => r.json()).then(data => data.total_count || 0).catch(() => 0),

      // Spam total — NO date filter, always matches GF spam folder
      fetch(`${baseUrl}/wp-json/gf/v2/entries?${statusQ('spam')}&paging[page_size]=1&${creds}`)
        .then(r => r.json()).then(data => data.total_count || 0).catch(() => 0),

      // Trash total — NO date filter, always matches GF trash folder
      fetch(`${baseUrl}/wp-json/gf/v2/entries?${statusQ('trash')}&paging[page_size]=1&${creds}`)
        .then(r => r.json()).then(data => data.total_count || 0).catch(() => 0),

      // Last 50 entries across ALL statuses — scoped to period
      fetch(`${baseUrl}/wp-json/gf/v2/entries?paging[page_size]=50&sorting[key]=date_created&sorting[direction]=DESC&${d(dateQ)}`)
        .then(r => r.json()).catch(() => ({ entries: [] })),
    ])

    const totalSubmissions = formStats.reduce((a, f) => a + (f.total_count || 0), 0)

    return NextResponse.json({
      summary: {
        totalForms: formsList.length,
        totalSubmissions,
        activeForms: formStats.filter(f => f.is_active === '1' || f.is_active === true || f.is_active === 1).length,
        statusCounts: {
          active: activeCount,
          spam:   spamCount,
          trash:  trashCount,
        },
      },
      forms: formStats.sort((a, b) => b.total_count - a.total_count),
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
