'use client'
import { useState } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[]; loading: boolean; onViewSite: (p: Project) => void; onAddSite: () => void; onRefresh: () => void; onDeleteSite: (id: string) => void }

const INTEG_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  gsc:     { label: 'GSC',     color: '#5b7fff', bg: 'rgba(91,127,255,0.12)' },
  ga4:     { label: 'GA4',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  ghl:     { label: 'GHL',     color: '#22d3a0', bg: 'rgba(34,211,160,0.12)' },
  gravity: { label: 'Gravity', color: '#9f7aea', bg: 'rgba(159,122,234,0.12)' },
}

export default function SitesPage({ projects, loading, onViewSite, onAddSite, onRefresh, onDeleteSite }: Props) {
  const [q, setQ] = useState('')
  const filtered = projects.filter(p =>
    !q || p.domain.toLowerCase().includes(q.toLowerCase()) || (p.name || '').toLowerCase().includes(q.toLowerCase())
  )

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>All Websites</div>
            <div style={{ fontSize: 15, color: 'var(--text3)' }}>Loading your websites…</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ borderRadius: 14, height: 160 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>All Websites</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>{filtered.length} website{filtered.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button onClick={onAddSite}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#4a6ee0'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#5b7fff'}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Add Website
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 18 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4" strokeLinecap="round"/></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search websites…"
          style={{ width: '100%', padding: '9px 12px 9px 33px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontSize: 15, outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(91,127,255,0.5)'}
          onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🌐</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {q ? 'No results found' : 'No websites yet'}
          </div>
          <p style={{ fontSize: 15, color: 'var(--text3)', marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>
            {q ? `No websites match "${q}"` : 'Add your first website to connect GSC, GA4, GHL, and more.'}
          </p>
          {!q && (
            <button onClick={onAddSite}
              style={{ padding: '10px 24px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Add Your First Website
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(p => <SiteCard key={p.id} project={p} onClick={() => onViewSite(p)} onDelete={onDeleteSite} />)}
        </div>
      )}
    </div>
  )
}

function SiteCard({ project: p, onClick, onDelete }: { project: Project; onClick: () => void; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const integ = p.integrations || {}
  const connected = ['gsc', 'ga4', 'ghl', 'gravity'].filter(k => (integ as any)[k]?.connected)
  const initials = (p.name || p.domain).split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const connCount = connected.length

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/sites/${p.id}`, { method: 'DELETE' })
      onDelete(p.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div onClick={onClick} className="card-hover"
      style={{ background: 'var(--bg2)', border: `1px solid ${confirm ? 'rgba(245,101,101,0.4)' : 'var(--border)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color 0.2s' }}>

      {/* Top: avatar + name + status + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg,rgba(91,127,255,0.15),rgba(159,122,234,0.15))',
          border: '1px solid rgba(91,127,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 800, color: '#5b7fff', flexShrink: 0,
        }}>{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name || p.domain}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.domain}</div>
        </div>
        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title={confirm ? 'Click again to confirm delete' : 'Delete website'}
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            background: confirm ? 'rgba(245,101,101,0.15)' : 'rgba(245,101,101,0.08)',
            color: '#f56565', fontSize: confirm ? 11 : 13, fontWeight: 700,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = confirm ? 'rgba(245,101,101,0.15)' : 'rgba(245,101,101,0.08)'}
        >
          {deleting ? '…' : confirm ? 'Sure?' : (
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          )}
        </button>
      </div>

      {confirm && (
        <div onClick={e => e.stopPropagation()} style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#f56565' }}>Delete this website?</span>
          <button onClick={e => { e.stopPropagation(); setConfirm(false) }}
            style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Integration badges */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['gsc', 'ga4', 'ghl', 'gravity'] as const).map(k => {
          const on = (integ as any)[k]?.connected
          const cfg = INTEG_LABELS[k]
          return (
            <span key={k} style={{
              fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
              background: on ? cfg.bg : 'var(--bg4)',
              color: on ? cfg.color : 'var(--text3)',
              border: on ? `1px solid ${cfg.color}22` : '1px solid transparent',
              transition: 'all 0.15s',
            }}>
              {cfg.label}
            </span>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ height: 4, width: 60, borderRadius: 2, background: 'var(--bg4)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(connCount / 4) * 100}%`, background: connCount === 4 ? '#22d3a0' : connCount >= 2 ? '#5b7fff' : '#f0b429', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{connCount}/4 connected</span>
        </div>
        <span style={{ fontSize: 14, color: '#5b7fff', fontWeight: 600 }}>View →</span>
      </div>
    </div>
  )
}
