'use client'
import { useState } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[]; loading: boolean; onViewSite: (p: Project) => void; onAddSite: () => void; onRefresh: () => void }

export default function SitesPage({ projects, loading, onViewSite, onAddSite, onRefresh }: Props) {
  const [q, setQ] = useState('')
  const filtered = projects.filter(p => !q || p.domain.toLowerCase().includes(q.toLowerCase()) || (p.name || '').toLowerCase().includes(q.toLowerCase()))

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading websites…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>All Websites</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} website{filtered.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button onClick={onAddSite} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Add Website
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4" strokeLinecap="round"/></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search websites…" style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌐</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{q ? 'No results found' : 'No websites yet'}</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{q ? `No websites match "${q}"` : 'Add your first website to get started'}</p>
          {!q && <button onClick={onAddSite} style={{ padding: '9px 20px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Your First Website</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
          {filtered.map(p => <SiteCard key={p.id} project={p} onClick={() => onViewSite(p)} />)}
        </div>
      )}
    </div>
  )
}

function SiteCard({ project: p, onClick }: { project: Project; onClick: () => void }) {
  const integ = p.integrations || {}
  const connected = Object.keys(integ).filter(k => (integ as any)[k]?.connected)
  const initials = (p.name || p.domain).split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div onClick={onClick}
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#5b7fff'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(91,127,255,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,rgba(91,127,255,0.15),rgba(159,122,234,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#5b7fff', flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.domain}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22d3a0', fontWeight: 600, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a0' }} />
          Live
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
        {['gsc','ga4','ghl','gravity'].map(k => {
          const on = (integ as any)[k]?.connected
          return <span key={k} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: on ? 'rgba(34,211,160,0.1)' : 'var(--bg4)', color: on ? '#22d3a0' : 'var(--text3)' }}>{k.toUpperCase()}</span>
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{connected.length} of 4 connected</span>
        <span style={{ fontSize: 12, color: '#5b7fff', fontWeight: 600 }}>View Analytics →</span>
      </div>
    </div>
  )
}
