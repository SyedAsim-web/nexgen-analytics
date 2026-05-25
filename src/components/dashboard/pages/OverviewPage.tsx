'use client'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props { projects: Project[]; loading: boolean; session: Session; onViewSite: (p: Project) => void }

function fmtN(n: number) { return n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n) }

export default function OverviewPage({ projects, loading, session, onViewSite }: Props) {
  const totalSites = projects.length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#8c95ad' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14 }}>Loading your dashboard…</div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Welcome back, {session.user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Here's your analytics overview across {totalSites} website{totalSites !== 1 ? 's' : ''}.</p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Websites', value: String(totalSites), color: '#5b7fff', icon: '🌐' },
          { label: 'Integrations', value: String(projects.reduce((a, p) => a + Object.keys(p.integrations || {}).filter(k => (p.integrations as any)[k]?.connected).length, 0)), color: '#22d3a0', icon: '🔗' },
          { label: 'GSC Connected', value: String(projects.filter(p => p.integrations?.gsc?.connected).length), color: '#f0b429', icon: '🔍' },
          { label: 'GA4 Connected', value: String(projects.filter(p => p.integrations?.ga4?.connected).length), color: '#f97316', icon: '📈' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card, var(--bg2))', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent sites */}
      {projects.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Add your first website</div>
          <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Connect your websites to start tracking Google Search Console, GA4 analytics, GHL Voice AI calls, and Gravity Forms submissions all in one place.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Google Search Console', 'GA4 Analytics', 'GHL Voice AI', 'Gravity Forms'].map(p => (
              <span key={p} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(91,127,255,0.1)', color: '#5b7fff', borderRadius: 20, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Your Websites</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
            {projects.slice(0, 6).map(p => {
              const intCount = Object.keys(p.integrations || {}).filter(k => (p.integrations as any)[k]?.connected).length
              const initials = (p.name || p.domain).split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
              return (
                <div key={p.id} onClick={() => onViewSite(p)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#5b7fff'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,rgba(91,127,255,0.2),rgba(159,122,234,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#5b7fff', flexShrink: 0 }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.domain}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#22d3a0', fontWeight: 600 }}>{intCount} integration{intCount !== 1 ? 's' : ''} connected</span>
                    <span style={{ fontSize: 11, color: '#5b7fff', fontWeight: 600 }}>View →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
