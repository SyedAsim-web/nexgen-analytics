export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siteUrl = searchParams.get('siteUrl')
  const startDate = searchParams.get('startDate') || getDateDaysAgo(28)
  const endDate = searchParams.get('endDate') || getDateDaysAgo(0)

  if (!siteUrl) return NextResponse.json({ error: 'siteUrl required' }, { status: 400 })
  if (!session.accessToken) return NextResponse.json({ error: 'No Google access token. Please reconnect.' }, { status: 401 })

  try {
    // Fetch summary
    const summaryRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['date'],
          rowLimit: 90,
        }),
      }
    )

    if (!summaryRes.ok) {
      const err = await summaryRes.json()
      return NextResponse.json({ error: err.error?.message || 'GSC API error' }, { status: summaryRes.status })
    }

    const summaryData = await summaryRes.json()

    // Fetch top queries
    const queriesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['query'],
          rowLimit: 20,
        }),
      }
    )
    const queriesData = await queriesRes.json()

    // Fetch top pages
    const pagesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['page'],
          rowLimit: 10,
        }),
      }
    )
    const pagesData = await pagesRes.json()

    // Aggregate totals
    const rows = summaryData.rows || []
    const totals = rows.reduce((acc: any, row: any) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
      ctr: acc.ctr + row.ctr,
      position: acc.position + row.position,
    }), { clicks: 0, impressions: 0, ctr: 0, position: 0 })

    const count = rows.length || 1

    return NextResponse.json({
      summary: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: +(totals.ctr / count * 100).toFixed(2),
        position: +(totals.position / count).toFixed(1),
      },
      timeSeries: rows.map((r: any) => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: +(r.ctr * 100).toFixed(2),
        position: +r.position.toFixed(1),
      })),
      queries: (queriesData.rows || []).map((r: any) => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: +(r.ctr * 100).toFixed(2),
        position: +r.position.toFixed(1),
      })),
      pages: (pagesData.rows || []).map((r: any) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: +(r.ctr * 100).toFixed(2),
        position: +r.position.toFixed(1),
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function getDateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
