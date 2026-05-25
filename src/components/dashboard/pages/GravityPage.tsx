'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function GravityPage({ projects }: Props) {
  const gravityProjects = projects.filter(p => p.integrations?.gravity?.connected)
  const [selected, setSelected] = useState(gravityProjects[0]?.id || projects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProject = projects.find(p => p.id === selected)
  const isConnected = selectedProject?.integrations?.gravity?.connected

  useEffect(() => {
    if (!selectedProject?.integrations?.gravity?.connected) { setData(null); return }
    const { site_url, api_key } = selectedProject.integrations.gravity!
    if (!site_url || !api_key) return
    setLoading(true); setError(''); setData(null)
    fetch(`/api/gravity?siteUrl=${encodeURIComponent(site_url)}&apiKey=${encodeURIComponent(api_key)}`)
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setData(json) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Gravity Forms</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>WordPress form submissions and analytics</p>
        </div>
        {projects.length > 0 && (
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        )}
      </div>

      {/* No projects */}
      {projects.length === 0 && <EmptyState />}

      {/* Not connected */}
      {selectedProject && !isConnected && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Gravity Forms not connected</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 20px' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → {selectedProject.name} → Integrations</strong> and add your WordPress URL and Gravity Forms API key.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Form Submissions', 'Completion Rate', 'Active Forms', 'Recent Entries'].map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(159,122,234,0.1)', color: '#9f7aea', borderRadius: 20, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isConnected && loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text3)', fontSize: 13 }}>
          <div style={{ width: 22, height: 22, border: '3px solid rgba(159,122,234,0.2)', borderTopColor: '#9f7aea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading Gravity Forms data…
        </div>
      )}

      {/* Error */}
      {isConnected && error && (
        <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Data */}
      {isConnected && data && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Submissions', value: data.summary.totalSubmissions.toLocaleString(), color: '#9f7aea' },
              { label: 'Total Forms', value: String(data.summary.totalForms), color: '#5b7fff' },
              { label: 'Active Forms', value: String(data.summary.activeForms), color: '#22d3a0' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
            {/* Forms table */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Forms by Submissions</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(159,122,234,0.1)', color: '#9f7aea' }}>
                  {data.forms.length} form{data.forms.length !== 1 ? 's' : ''}
                </span>
              </div>
              {data.forms.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>No forms found</div>
              ) : (
                <div>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '8px 18px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', gap: 12 }}>
                    {['Form Name', 'Entries', 'Status'].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{h}</span>
                    ))}
                  </div>
                  {data.forms.map((form: any) => {
                    const pct = data.summary.totalSubmissions > 0
                      ? Math.round(form.total_count / data.summary.totalSubmissions * 100)
                      : 0
                    return (
                      <div key={form.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{form.title}</div>
                          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: '#9f7aea', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {form.total_count.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', background: form.is_active === '1' ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.05)', color: form.is_active === '1' ? '#22d3a0' : 'var(--text3)' }}>
                          {form.is_active === '1' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent entries */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent Entries</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(91,127,255,0.1)', color: '#5b7fff' }}>Live</span>
              </div>
              {data.recentEntries.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>No entries yet</div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', padding: '8px 18px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', gap: 12 }}>
                    {['Form', 'Date', 'Status'].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{h}</span>
                    ))}
                  </div>
                  {data.recentEntries.map((entry: any) => {
                    const form = data.forms.find((f: any) => String(f.id) === String(entry.form_id))
                    return (
                      <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(159,122,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9f7aea', fontWeight: 700, flexShrink: 0 }}>
                          #{entry.form_id}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {form?.title || `Form #${entry.form_id}`}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(entry.date_created)}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', background: entry.status === 'active' ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.05)', color: entry.status === 'active' ? '#22d3a0' : 'var(--text3)' }}>
                          {entry.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No websites added yet</div>
      <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
        Add a website and connect Gravity Forms to start tracking form submissions.
      </p>
    </div>
  )
}
