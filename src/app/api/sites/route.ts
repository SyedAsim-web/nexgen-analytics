export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // Get user
  const { data: user } = await supabase
    .from('users').select('id').eq('email', session.user.email).single()

  if (!user) return NextResponse.json({ projects: [] })

  // Get owned projects
  const { data: owned } = await supabase
    .from('projects').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })

  // Get collaborated projects
  const { data: collabs } = await supabase
    .from('collaborators')
    .select('project_id, role, projects(*)')
    .eq('email', session.user.email)
    .eq('accepted', true)

  const collabProjects = (collabs || []).map((c: any) => ({ ...c.projects, _role: c.role, _is_collab: true }))

  return NextResponse.json({ projects: [...(owned || []), ...collabProjects] })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, domain } = body

  if (!name || !domain) return NextResponse.json({ error: 'Name and domain required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('email', session.user.email).single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('projects')
    .insert({ owner_id: user.id, name, domain, integrations: {} })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}
