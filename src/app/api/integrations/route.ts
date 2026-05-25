export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, platform, config } = body

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('email', session.user.email).single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify ownership
  const { data: project } = await supabase
    .from('projects').select('id, integrations').eq('id', projectId).eq('owner_id', user.id).single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const updatedIntegrations = {
    ...project.integrations,
    [platform]: { ...config, connected: true, last_sync: new Date().toISOString() },
  }

  const { error } = await supabase
    .from('projects')
    .update({ integrations: updatedIntegrations })
    .eq('id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, integrations: updatedIntegrations })
}
