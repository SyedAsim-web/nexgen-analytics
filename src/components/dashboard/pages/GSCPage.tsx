'use client'
import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props { projects: Project[]; session: Session }

export default function GSCPage({ projects, session }: Props) {
  const gscProjects = projects.filter(p => p.integrations?.gsc?.connected)
  const [selected, setSelected] = useState(gscProjects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [days, setDays] = useState(28)

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.gsc?.property_url) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(`/api/gsc?siteUrl=${encodeURIComponent(p.integrations.gsc.property_url)}&days=${days}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected, days])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Google Search Console</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Real-time data from your Google Search Console properties</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {gscProjects.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              {gscProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {gscProjects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(91,127,255,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No GSC properties connected</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>Go to <strong style={{ color: 'var(--text)' }}>All Websites → [your site] → Integrations</strong> and connect Google Search Console to see real data here.</p>
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Clicks', value: data.summary.clicks.toLocaleString(), color: '#5b7fff', change: '' },
              { label: 'Total Impressions', value: data.summary.impressions.toLocaleString(), color: '#f0b429', change: '' },
              { label: 'Avg. CTR', value: data.summary.ctr + '%', color: '#22d3a0', change: '' },
              { label: 'Avg. Position', value: data.summary.position, color: '#f97316', change: '' },
            ].map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Top Queries */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top Search Queries</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(91,127,255,0.1)', color: '#5b7fff' }}>Live Data</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['Query', 'Clicks', 'Impressions', 'CTR', 'Position'].map(h => <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.queries.map((q: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500 }}>{q.query}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{q.clicks.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{q.impressions.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: q.ctr > 3 ? 'rgba(34,211,160,0.1)' : 'rgba(240,180,41,0.1)', color: q.ctr > 3 ? '#22d3a0' : '#f0b429' }}>{q.ctr}%</span></td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{q.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Pages */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top Pages</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['Page URL', 'Clicks', 'Impressions', 'CTR', 'Position'].map(h => <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.pages.map((p: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.clicks.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.impressions.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: p.ctr > 3 ? 'rgba(34,211,160,0.1)' : 'rgba(240,180,41,0.1)', color: p.ctr > 3 ? '#22d3a0' : '#f0b429' }}>{p.ctr}%</span></td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: color }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
    </div>
  )
}
function Spinner() { return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text3)' }}><div style={{ width: 28, height: 28, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div> }
function ErrorBox({ msg }: { msg: string }) { return <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565', marginBottom: 16 }}>⚠️ {msg}</div> }
