'use client'
import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props {
  projects: Project[]
  project: Project | null
  session: Session
  onViewSite: (p: Project) => void
}

type Role = 'admin' | 'editor' | 'viewer'

interface Member {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: Role
  accepted: boolean
  invited_at: string
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; perms: string }> = {
  admin:  { label: 'Admin',  color: '#9f7aea', bg: 'rgba(159,122,234,0.1)', perms: 'Full access · Can invite members' },
  editor: { label: 'Editor', color: '#5b7fff', bg: 'rgba(91,127,255,0.1)',  perms: 'View & edit integrations' },
  viewer: { label: 'Viewer', color: '#22d3a0', bg: 'rgba(34,211,160,0.1)',  perms: 'View-only access' },
}

const PERMISSIONS = [
  { perm: 'View analytics data',        admin: true,  editor: true,  viewer: true  },
  { perm: 'Edit integrations',          admin: true,  editor: true,  viewer: false },
  { perm: 'Add / remove websites',      admin: true,  editor: false, viewer: false },
  { perm: 'Invite team members',        admin: true,  editor: false, viewer: false },
  { perm: 'Remove team members',        admin: true,  editor: false, viewer: false },
  { perm: 'Export presentations',       admin: true,  editor: true,  viewer: true  },
  { perm: 'Manage billing & plan',      admin: true,  editor: false, viewer: false },
]

function RoleBadge({ role }: { role: Role }) {
  const c = ROLE_CONFIG[role]
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function Avatar({ name, image, size = 36 }: { name: string; image?: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {image
        ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.36, fontWeight: 700, color: '#fff' }}>{initials}</span>}
    </div>
  )
}

function Check({ yes }: { yes: boolean }) {
  return yes
    ? <span style={{ color: '#22d3a0', fontSize: 15 }}>✓</span>
    : <span style={{ color: 'var(--text3)', fontSize: 15 }}>—</span>
}

export default function TeamPage({ projects, project, session, onViewSite }: Props) {
  const [selectedId, setSelectedId] = useState(project?.id || projects[0]?.id || '')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const selectedProject = projects.find(p => p.id === selectedId) || null

  useEffect(() => {
    if (!selectedId) return
    fetchMembers(selectedId)
  }, [selectedId])

  const fetchMembers = async (projectId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/team?projectId=${projectId}`)
      const json = await res.json()
      setMembers(json.members || [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedId) return
    setInviting(true); setInviteMsg(null)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedId, email: inviteEmail.trim(), role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) {
        setInviteMsg({ type: 'err', text: json.error || 'Invite failed' })
      } else {
        setInviteMsg({ type: 'ok', text: `Invite sent to ${inviteEmail.trim()}` })
        setInviteEmail('')
        fetchMembers(selectedId)
      }
    } catch (e: any) {
      setInviteMsg({ type: 'err', text: e.message })
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!selectedId) return
    setRemoving(memberId)
    try {
      await fetch(`/api/team?projectId=${selectedId}&memberId=${memberId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch {}
    finally { setRemoving(null) }
  }

  const pending  = members.filter(m => !m.accepted)
  const accepted = members.filter(m => m.accepted)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Team</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>Manage members and permissions for your website</p>
        </div>
        {projects.length > 1 && (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        )}
      </div>

      {projects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No websites yet</div>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>Add a website first to start managing team access.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Invite form */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(91,127,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" fill="none" stroke="#5b7fff" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                </span>
                Invite a Team Member
              </div>

              <form onSubmit={handleInvite}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    style={{ flex: 1, minWidth: 180, padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as Role)}
                    style={{ padding: '9px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    style={{ padding: '9px 18px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: inviting ? 0.7 : 1, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
                  >
                    {inviting ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </form>

              {inviteMsg && (
                <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 8, fontSize: 14, background: inviteMsg.type === 'ok' ? 'rgba(34,211,160,0.08)' : 'rgba(245,101,101,0.08)', border: `1px solid ${inviteMsg.type === 'ok' ? 'rgba(34,211,160,0.25)' : 'rgba(245,101,101,0.25)'}`, color: inviteMsg.type === 'ok' ? '#22d3a0' : '#f56565' }}>
                  {inviteMsg.type === 'ok' ? '✓' : '⚠️'} {inviteMsg.text}
                </div>
              )}

              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(91,127,255,0.05)', borderRadius: 8, fontSize: 14, color: 'var(--text3)', lineHeight: 1.6 }}>
                💡 Invited members will receive an email link to access this project with the selected permissions.
              </div>
            </div>

            {/* Active members */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Team Members</div>
                <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>{accepted.length + 1} member{accepted.length !== 0 ? 's' : ''}</span>
              </div>

              {loading ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 22, height: 22, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
              ) : (
                <>
                  {/* Current user (owner) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                    <Avatar name={session.user?.name || '?'} image={session.user?.image || undefined} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        {session.user?.name} <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>(you)</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{session.user?.email}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(240,180,41,0.12)', color: '#f0b429' }}>Owner</span>
                  </div>

                  {accepted.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <Avatar name={m.name || m.email} image={m.avatar_url} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.name || m.email}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{m.email}</div>
                      </div>
                      <RoleBadge role={m.role} />
                      <button onClick={() => handleRemove(m.id)} disabled={removing === m.id}
                        style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.2)', color: '#f56565', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.16)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.08)'}
                        title="Remove member">
                        {removing === m.id ? '…' : '×'}
                      </button>
                    </div>
                  ))}

                  {accepted.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: 15, color: 'var(--text3)' }}>
                      No other members yet — invite your team above.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pending invites */}
            {pending.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Pending Invites</div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(240,180,41,0.12)', color: '#f0b429' }}>{pending.length}</span>
                </div>
                {pending.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,180,41,0.1)', border: '1px dashed rgba(240,180,41,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="#f0b429" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: 'var(--text2)', fontStyle: 'italic' }}>{m.email}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Invited · awaiting acceptance</div>
                    </div>
                    <RoleBadge role={m.role} />
                    <button onClick={() => handleRemove(m.id)} disabled={removing === m.id}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.2)', color: '#f56565', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}
                      title="Cancel invite">
                      {removing === m.id ? '…' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column — permissions + plan info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Permissions matrix */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Permissions</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>What each role can do</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>Action</th>
                      {(['admin', 'editor', 'viewer'] as Role[]).map(r => (
                        <th key={r} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: ROLE_CONFIG[r].color, background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                          {ROLE_CONFIG[r].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '9px 14px', color: 'var(--text2)', fontWeight: 500 }}>{p.perm}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}><Check yes={p.admin} /></td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}><Check yes={p.editor} /></td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}><Check yes={p.viewer} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role descriptions */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Role Descriptions</div>
              {(['admin', 'editor', 'viewer'] as Role[]).map(r => {
                const c = ROLE_CONFIG[r]
                return (
                  <div key={r} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <RoleBadge role={r} />
                    <span style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.5 }}>{c.perms}</span>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
