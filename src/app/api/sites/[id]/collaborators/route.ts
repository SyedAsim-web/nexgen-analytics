export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { email, role = 'viewer' } = body
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: project } = await supabase.from('projects').select('id, name').eq('id', id).eq('owner_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found or not owner' }, { status: 403 })

  const { data, error } = await supabase.from('collaborators')
    .upsert({ project_id: id, invited_by: user.id, email, role, accepted: false }, { onConflict: 'project_id,email' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collaborator: data, message: `Invitation sent to ${email}` })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const collaboratorEmail = searchParams.get('email')
  const supabase = createServerClient()

  const { error } = await supabase.from('collaborators').delete().eq('project_id', id).eq('email', collaboratorEmail)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
