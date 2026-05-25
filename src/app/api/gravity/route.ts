export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siteUrl = searchParams.get('siteUrl')
  const apiKey = searchParams.get('apiKey')
  const consumerKey = searchParams.get('consumerKey')
  const consumerSecret = searchParams.get('consumerSecret')

  const authKey = consumerKey && consumerSecret
    ? `${consumerKey}:${consumerSecret}`
    : apiKey

  if (!siteUrl || !authKey) {
    return NextResponse.json({ error: 'siteUrl and apiKey (or consumerKey + consumerSecret) required' }, { status: 400 })
  }

  try {
    const baseUrl = siteUrl.replace(/\/$/, '')
    const headers = {
      'Authorization': `Basic ${Buffer.from(authKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    }

    // Fetch all forms
    const formsRes = await fetch(`${baseUrl}/wp-json/gf/v2/forms`, { headers })
    if (!formsRes.ok) {
      const err = await formsRes.text()
      return NextResponse.json({ error: `Gravity Forms API error: ${err}` }, { status: formsRes.status })
    }
    const forms = await formsRes.json()

    // Fetch entries for each form
    const formStats = await Promise.all(
      Object.values(forms).map(async (form: any) => {
        try {
          const entriesRes = await fetch(
            `${baseUrl}/wp-json/gf/v2/entries?form_ids=${form.id}&paging[page_size]=1`,
            { headers }
          )
          const entriesData = await entriesRes.json()
          return {
            id: form.id,
            title: form.title,
            total_count: entriesData.total_count || 0,
            is_active: form.is_active,
          }
        } catch (e) {
          return { id: form.id, title: form.title, total_count: 0, is_active: form.is_active }
        }
      })
    )

    // Fetch recent entries across all forms
    const recentRes = await fetch(
      `${baseUrl}/wp-json/gf/v2/entries?paging[page_size]=10&sorting[key]=date_created&sorting[direction]=DESC`,
      { headers }
    )
    const recentData = await recentRes.json()

    const totalSubmissions = formStats.reduce((a, f) => a + f.total_count, 0)

    return NextResponse.json({
      summary: {
        totalForms: formStats.length,
        totalSubmissions,
        activeForms: formStats.filter(f => f.is_active === '1').length,
      },
      forms: formStats.sort((a, b) => b.total_count - a.total_count),
      recentEntries: (recentData.entries || []).map((e: any) => ({
        id: e.id,
        form_id: e.form_id,
        date_created: e.date_created,
        status: e.status,
        ip: e.ip,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
