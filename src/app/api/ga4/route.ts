export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId') // e.g. "properties/123456789"
  const days = parseInt(searchParams.get('days') || '28')

  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
  if ((session as any).error === 'RefreshAccessTokenError') return NextResponse.json({ error: 'Your Google session has expired. Please sign out and sign in again to reconnect.', reauth: true }, { status: 401 })
  if (!session.accessToken) return NextResponse.json({ error: 'No Google access token. Please sign out and sign in again.', reauth: true }, { status: 401 })

  const startDate = `${days}daysAgo`

  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'GA4 API error' }, { status: res.status })
    }

    const data = await res.json()
    const rows = data.rows || []

    // Device breakdown
    const deviceRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
        }),
      }
    )
    const deviceData = await deviceRes.json()

    // Country breakdown
    const countryRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 5,
        }),
      }
    )
    const countryData = await countryRes.json()

    const timeSeries = rows.map((row: any) => ({
      date: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      newUsers: parseInt(row.metricValues[2].value),
      bounceRate: +(parseFloat(row.metricValues[3].value) * 100).toFixed(1),
      avgDuration: +parseFloat(row.metricValues[4].value).toFixed(0),
      conversions: parseInt(row.metricValues[5].value),
    }))

    const totals = timeSeries.reduce((acc: any, row: any) => ({
      sessions: acc.sessions + row.sessions,
      users: acc.users + row.users,
      newUsers: acc.newUsers + row.newUsers,
      bounceRate: acc.bounceRate + row.bounceRate,
      conversions: acc.conversions + row.conversions,
    }), { sessions: 0, users: 0, newUsers: 0, bounceRate: 0, conversions: 0 })

    return NextResponse.json({
      summary: {
        sessions: totals.sessions,
        users: totals.users,
        newUsers: totals.newUsers,
        bounceRate: +(totals.bounceRate / (rows.length || 1)).toFixed(1),
        conversions: totals.conversions,
        convRate: totals.sessions > 0 ? +((totals.conversions / totals.sessions) * 100).toFixed(2) : 0,
      },
      timeSeries,
      devices: (deviceData.rows || []).map((r: any) => ({
        device: r.dimensionValues[0].value,
        sessions: parseInt(r.metricValues[0].value),
      })),
      countries: (countryData.rows || []).map((r: any) => ({
        country: r.dimensionValues[0].value,
        sessions: parseInt(r.metricValues[0].value),
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
