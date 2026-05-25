'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

export default function GravityPage({ projects }: Props) {
  const gravityProjects = projects.filter(p => p.integrations?.gravity?.connected)
  const [selected, setSelected] = useState(gravityProjects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.gravity?.site_url || !p?.integrations?.gravity?.api_key) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(
        `/api/gravity?siteUrl=${encodeURIComponent(p.integrations.gravity.site_url)}&apiKey=${encodeURIComponent(p.integrations.gravity.api_key)}`
      )
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Gravity Forms
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Real form submission data from your WordPress sites
          </p>
        </div>
        {gravityProjects.length > 0 && (
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            {gravityProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Not connected state */}
      {gravityProjects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            No Gravity Forms sites connected
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> and connect Gravity Forms to see real submission data here.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(159,122,234,0.2)', borderTopColor: '#9f7aea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading form data…</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565', marginBottom: 16, lineHeight: 1.6 }}>
          ⚠️ {error}
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
            Make sure your WordPress REST API is enabled and the API key has read access to form entries.
          </div>
        </div>
      )}

      {/* Data */}
      {data && (
        <div>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Forms', value: String(data.summary.totalForms), color: '#9f7aea', icon: '📋' },
              { label: 'Active Forms', value: String(data.summary.activeForms), color: '#22d3a0', icon: '✅' },
              { label: 'Total Submissions', value: data.summary.totalSubmissions.toLocaleString(), color: '#5b7fff', icon: '📨' },
              { label: 'Avg per Form', value: data.summary.totalForms > 0 ? Math.round(data.summary.totalSubmissions / data.summary.totalForms).toLocaleString() : '0', color: '#f0b429', icon: '📊' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Forms table */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Forms Performance
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(159,122,234,0.1)', color: '#9f7aea' }}>
                Live Data
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Form Name', 'Submissions', 'Status', 'Share'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.forms.map((form: any) => {
                    const share = data.summary.totalSubmissions > 0
                      ? Math.round((form.total_count / data.summary.totalSubmissions) * 100)
                      : 0
                    return (
                      <tr key={form.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{form.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Form ID: {form.id}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                            {form.total_count.toLocaleString()}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: form.is_active === '1' ? 'rgba(34,211,160,0.1)' : 'rgba(245,101,101,0.1)', color: form.is_active === '1' ? '#22d3a0' : '#f56565' }}>
                            {form.is_active === '1' ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ width: `${share}%`, height: '100%', background: '#9f7aea', borderRadius: 3, transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, minWidth: 32 }}>{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent entries */}
          {data.recentEntries.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Recent Submissions
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Entry ID', 'Form ID', 'Date', 'Status'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEntries.map((entry: any) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500 }}>#{entry.id}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>Form {entry.form_id}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>
                          {new Date(entry.date_created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: entry.status === 'active' ? 'rgba(34,211,160,0.1)' : 'rgba(240,180,41,0.1)', color: entry.status === 'active' ? '#22d3a0' : '#f0b429' }}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
