export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
  if (!user) return NextResponse.json({ members: [] })

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('owner_id', user.id).single()
  if (!project) {
    const { data: collab } = await supabase.from('collaborators').select('role').eq('project_id', projectId).eq('email', session.user.email).eq('accepted', true).single()
    if (!collab || collab.role !== 'admin') return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: collaborators, error } = await supabase
    .from('collaborators')
    .select('id, email, role, accepted, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const emails = (collaborators || []).map((c: any) => c.email)
  const { data: userRecords } = emails.length
    ? await supabase.from('users').select('email, name, avatar_url').in('email', emails)
    : { data: [] }

  const userMap = new Map((userRecords || []).map((u: any) => [u.email, u]))

  const members = (collaborators || []).map((c: any) => {
    const u = userMap.get(c.email)
    return {
      id: c.id,
      email: c.email,
      name: u?.name || c.email.split('@')[0],
      avatar_url: u?.avatar_url || null,
      role: c.role,
      accepted: c.accepted,
      invited_at: c.created_at,
    }
  })

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, email, role = 'viewer' } = body
  if (!projectId || !email) return NextResponse.json({ error: 'projectId and email required' }, { status: 400 })
  if (!['admin', 'editor', 'viewer'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const supabase = createServerClient()

  const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: project } = await supabase.from('projects').select('id, name').eq('id', projectId).eq('owner_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })

  if (email === session.user.email) return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })

  const { data, error } = await supabase.from('collaborators')
    .upsert({ project_id: projectId, invited_by: user.id, email, role, accepted: false }, { onConflict: 'project_id,email' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collaborator: data, message: `Invitation sent to ${email}` })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const memberId = searchParams.get('memberId')
  if (!projectId || !memberId) return NextResponse.json({ error: 'projectId and memberId required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('owner_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const { error } = await supabase.from('collaborators').delete().eq('id', memberId).eq('project_id', projectId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
