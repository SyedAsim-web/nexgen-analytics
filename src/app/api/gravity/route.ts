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

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'siteUrl, consumerKey and consumerSecret are required' }, { status: 400 })
  }

  try {
    const baseUrl = siteUrl.replace(/\/$/, '')
    const auth = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`

    // Fetch forms
    const formsRes = await fetch(`${baseUrl}/wp-json/gf/v2/forms?${auth}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!formsRes.ok) {
      const err = await formsRes.json()
      return NextResponse.json({ error: `Gravity Forms API error: ${JSON.stringify(err)}` }, { status: formsRes.status })
    }
    const forms = await formsRes.json()
    const formsList = Array.isArray(forms) ? forms : Object.values(forms)

    // Fetch per-form submission counts + per-status entry counts — all in parallel
    const [formStats, activeCount, spamCount, trashCount, allEntries] = await Promise.all([
      // Per-form counts
      Promise.all(
        formsList.map(async (form: any) => {
          try {
            const r = await fetch(`${baseUrl}/wp-json/gf/v2/entries?form_ids[]=${form.id}&paging[page_size]=1&${auth}`)
            const d = await r.json()
            return { id: form.id, title: form.title, total_count: d.total_count || 0, is_active: form.is_active, date_created: form.date_created }
          } catch {
            return { id: form.id, title: form.title, total_count: 0, is_active: form.is_active, date_created: form.date_created }
          }
        })
      ),
      // Active count
      fetch(`${baseUrl}/wp-json/gf/v2/entries?status=active&paging[page_size]=1&${auth}`)
        .then(r => r.json()).then(d => d.total_count || 0).catch(() => 0),
      // Spam count
      fetch(`${baseUrl}/wp-json/gf/v2/entries?status=spam&paging[page_size]=1&${auth}`)
        .then(r => r.json()).then(d => d.total_count || 0).catch(() => 0),
      // Trash count
      fetch(`${baseUrl}/wp-json/gf/v2/entries?status=trash&paging[page_size]=1&${auth}`)
        .then(r => r.json()).then(d => d.total_count || 0).catch(() => 0),
      // Fetch last 50 entries across ALL statuses
      fetch(`${baseUrl}/wp-json/gf/v2/entries?paging[page_size]=50&sorting[key]=date_created&sorting[direction]=DESC&${auth}`)
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
          spam: spamCount,
          trash: trashCount,
        },
      },
      forms: formStats.sort((a, b) => b.total_count - a.total_count),
      entries: (allEntries.entries || []).map((e: any) => ({
        id: e.id,
        form_id: e.form_id,
        date_created: e.date_created,
        status: e.status,
        ip: e.ip,
        source_url: e.source_url,
      })),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
