'use client'
import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props { projects: Project[]; session: Session }

export default function GA4Page({ projects }: Props) {
  const ga4Projects = projects.filter(p => p.integrations?.ga4?.connected)
  const [selected, setSelected] = useState(ga4Projects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.ga4?.property_id) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(`/api/ga4?propertyId=${encodeURIComponent(p.integrations.ga4.property_id)}&days=28`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Google Analytics 4</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Real-time audience and behaviour data from GA4</p>
        </div>
        {ga4Projects.length > 0 && (
          <select value={selected} onChange={e => setSelected(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {ga4Projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {ga4Projects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No GA4 properties connected</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>Go to <strong style={{ color: 'var(--text)' }}>All Websites → [your site] → Integrations</strong> and add your GA4 Property ID to see real analytics data.</p>
        </div>
      )}

      {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><div style={{ width: 28, height: 28, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>}
      {error && <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565' }}>⚠️ {error}</div>}

      {data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Sessions', value: data.summary.sessions.toLocaleString(), color: '#f97316' },
              { label: 'Users', value: data.summary.users.toLocaleString(), color: '#f0b429' },
              { label: 'New Users', value: data.summary.newUsers.toLocaleString(), color: '#22d3a0' },
              { label: 'Bounce Rate', value: data.summary.bounceRate + '%', color: '#f56565' },
              { label: 'Conversions', value: data.summary.conversions.toLocaleString(), color: '#9f7aea' },
              { label: 'Conv. Rate', value: data.summary.convRate + '%', color: '#5b7fff' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Device Breakdown</div>
              {data.devices.map((d: any) => (
                <div key={d.device} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{d.device}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.sessions.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Top Countries</div>
              {data.countries.map((c: any) => (
                <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{c.country}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.sessions.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
