export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get('locationId')
  const apiKey = searchParams.get('apiKey')

  if (!locationId || !apiKey) {
    return NextResponse.json({ error: 'locationId and apiKey required' }, { status: 400 })
  }

  try {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    }

    // Fetch conversations (live chat + voice)
    const convoRes = await fetch(
      `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&limit=20`,
      { headers }
    )

    // Fetch contacts
    const contactsRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=20`,
      { headers }
    )

    // Fetch opportunities (pipeline)
    const oppsRes = await fetch(
      `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&limit=20`,
      { headers }
    )

    // Fetch calls
    const callsRes = await fetch(
      `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&limit=20&type=TYPE_VOICE`,
      { headers }
    )

    const [convoData, contactsData, oppsData, callsData] = await Promise.all([
      convoRes.json(),
      contactsRes.json(),
      oppsRes.json(),
      callsRes.json(),
    ])

    const conversations = convoData.conversations || []
    const contacts = contactsData.contacts || []
    const opportunities = oppsData.opportunities || []
    const calls = callsData.conversations || []

    // Pipeline stages count
    const pipeline = {
      new: contacts.length,
      contacted: conversations.length,
      qualified: opportunities.filter((o: any) => o.status === 'open').length,
      booked: opportunities.filter((o: any) => o.status === 'won').length,
      lost: opportunities.filter((o: any) => o.status === 'lost').length,
    }

    // Format conversations for display
    const formattedConvos = conversations.slice(0, 10).map((c: any) => ({
      id: c.id,
      contactName: c.contactName || c.fullName || 'Unknown',
      lastMessage: c.lastMessage || c.lastMessageBody || '',
      lastActivity: c.lastMessageDate || c.dateUpdated,
      type: c.type || 'TYPE_LIVE_CHAT',
      unread: c.unreadCount || 0,
      status: c.inbox ? 'open' : 'closed',
    }))

    // Format calls
    const formattedCalls = calls.slice(0, 10).map((c: any) => ({
      id: c.id,
      contactName: c.contactName || 'Unknown',
      duration: c.callDuration || '0:00',
      date: c.dateCreated || c.lastMessageDate,
      status: c.callStatus || 'completed',
      direction: c.callDirection || 'inbound',
    }))

    return NextResponse.json({
      summary: {
        totalContacts: contactsData.total || contacts.length,
        totalConversations: convoData.total || conversations.length,
        totalCalls: callsData.total || calls.length,
        openOpportunities: opportunities.filter((o: any) => o.status === 'open').length,
        wonOpportunities: opportunities.filter((o: any) => o.status === 'won').length,
        totalOpportunities: opportunities.length,
      },
      pipeline,
      conversations: formattedConvos,
      calls: formattedCalls,
      opportunities: opportunities.slice(0, 10).map((o: any) => ({
        id: o.id,
        name: o.name,
        status: o.status,
        monetaryValue: o.monetaryValue || 0,
        stage: o.pipelineStage?.name || 'Unknown',
        contact: o.contact?.name || 'Unknown',
        createdAt: o.createdAt,
      })),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
