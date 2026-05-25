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

    // Gravity Forms REST API uses query params for authentication
    const authParams = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`

    // Test connection first
    const testRes = await fetch(
      `${baseUrl}/wp-json/gf/v2/forms?${authParams}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!testRes.ok) {
      const err = await testRes.json()
      return NextResponse.json(
        { error: `Gravity Forms API error: ${JSON.stringify(err)}` },
        { status: testRes.status }
      )
    }

    const forms = await testRes.json()
    const formsList = Array.isArray(forms) ? forms : Object.values(forms)

    // Fetch entry counts for each form
    const formStats = await Promise.all(
      formsList.map(async (form: any) => {
        try {
          const entriesRes = await fetch(
            `${baseUrl}/wp-json/gf/v2/entries?form_ids[]=${form.id}&paging[page_size]=1&${authParams}`
          )
          const entriesData = await entriesRes.json()
          return {
            id: form.id,
            title: form.title,
            total_count: entriesData.total_count || 0,
            is_active: form.is_active,
            date_created: form.date_created,
          }
        } catch (e) {
          return {
            id: form.id,
            title: form.title,
            total_count: 0,
            is_active: form.is_active,
            date_created: form.date_created,
          }
        }
      })
    )

    // Fetch recent entries
    const recentRes = await fetch(
      `${baseUrl}/wp-json/gf/v2/entries?paging[page_size]=10&sorting[key]=date_created&sorting[direction]=DESC&${authParams}`
    )
    const recentData = await recentRes.json()

    const totalSubmissions = formStats.reduce((a, f) => a + (f.total_count || 0), 0)

    return NextResponse.json({
      summary: {
        totalForms: formsList.length,
        totalSubmissions,
        activeForms: formStats.filter(f => f.is_active === '1' || f.is_active === true).length,
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
