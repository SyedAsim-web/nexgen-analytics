'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

type StatusFilter = 'all' | 'active' | 'spam' | 'trash'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:  { label: 'Active',  bg: 'rgba(34,211,160,0.1)',   color: '#22d3a0' },
  spam:    { label: 'Spam',    bg: 'rgba(240,180,41,0.12)',  color: '#f0b429' },
  trash:   { label: 'Trash',   bg: 'rgba(245,101,101,0.1)',  color: '#f56565' },
  read:    { label: 'Read',    bg: 'rgba(91,127,255,0.1)',   color: '#5b7fff' },
}

function statusStyle(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, bg: 'rgba(255,255,255,0.07)', color: 'var(--text3)' }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function GravityPage({ projects }: Props) {
  const gravityProjects = projects.filter(p => p.integrations?.gravity?.connected)
  const [selected, setSelected] = useState(gravityProjects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.gravity?.site_url) return
    setLoading(true); setError(''); setData(null)
    try {
      const params = new URLSearchParams({
        siteUrl: p.integrations.gravity.site_url,
        ...(p.integrations.gravity.consumer_key && {
          consumerKey: p.integrations.gravity.consumer_key,
          consumerSecret: p.integrations.gravity.consumer_secret || '',
        }),
        ...(p.integrations.gravity.api_key && {
          apiKey: p.integrations.gravity.api_key,
        }),
      })
      const res = await fetch(`/api/gravity?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected])

  // Filtered entries based on active tab
  const allEntries: any[] = data?.entries || []
  const filteredEntries = statusFilter === 'all'
    ? allEntries
    : allEntries.filter(e => e.status === statusFilter)

  const statusCounts = data?.summary?.statusCounts ?? {}
  const tabs: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'all',    label: 'All',    count: allEntries.length,         color: '#5b7fff' },
    { key: 'active', label: 'Active', count: statusCounts.active ?? 0,  color: '#22d3a0' },
    { key: 'spam',   label: 'Spam',   count: statusCounts.spam ?? 0,    color: '#f0b429' },
    { key: 'trash',  label: 'Trash',  count: statusCounts.trash ?? 0,   color: '#f56565' },
  ]

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
          <select value={selected} onChange={e => { setSelected(e.target.value); setStatusFilter('all') }}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {gravityProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Not connected */}
      {gravityProjects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No Gravity Forms sites connected</div>
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
            Make sure your WordPress REST API is enabled and the Consumer Key/Secret have read access to form entries.
          </div>
        </div>
      )}

      {/* Data */}
      {data && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Forms',      value: String(data.summary.totalForms),                                               color: '#9f7aea', icon: '📋' },
              { label: 'Active Forms',     value: String(data.summary.activeForms),                                              color: '#22d3a0', icon: '✅' },
              { label: 'Total Submissions',value: data.summary.totalSubmissions.toLocaleString(),                                color: '#5b7fff', icon: '📨' },
              { label: 'Spam Entries',     value: (statusCounts.spam ?? 0).toLocaleString(),                                     color: '#f0b429', icon: '🚫' },
              { label: 'Trash Entries',    value: (statusCounts.trash ?? 0).toLocaleString(),                                    color: '#f56565', icon: '🗑️' },
              { label: 'Avg / Form',       value: data.summary.totalForms > 0 ? Math.round(data.summary.totalSubmissions / data.summary.totalForms).toLocaleString() : '0', color: '#f97316', icon: '📊' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Forms performance table */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Forms Performance</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(159,122,234,0.1)', color: '#9f7aea' }}>Live Data</span>
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
                    const share = data.summary.totalSubmissions > 0 ? Math.round((form.total_count / data.summary.totalSubmissions) * 100) : 0
                    const active = form.is_active === '1' || form.is_active === true || form.is_active === 1
                    return (
                      <tr key={form.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{form.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Form ID: {form.id}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{form.total_count.toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: active ? 'rgba(34,211,160,0.1)' : 'rgba(245,101,101,0.1)', color: active ? '#22d3a0' : '#f56565' }}>
                            {active ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
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

          {/* Entries section with filter tabs */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header + tabs */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Submissions</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: statusFilter === tab.key ? `1px solid ${tab.color}50` : '1px solid var(--border)',
                      background: statusFilter === tab.key ? `${tab.color}14` : 'transparent',
                      color: statusFilter === tab.key ? tab.color : 'var(--text3)',
                      transition: 'all 0.15s',
                    }}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: statusFilter === tab.key ? `${tab.color}25` : 'rgba(255,255,255,0.07)', color: statusFilter === tab.key ? tab.color : 'var(--text3)' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Spam warning banner */}
            {statusFilter === 'spam' && filteredEntries.length > 0 && (
              <div style={{ padding: '10px 18px', background: 'rgba(240,180,41,0.06)', borderBottom: '1px solid rgba(240,180,41,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f0b429' }}>
                <span>⚠️</span>
                <span>{statusCounts.spam} spam entr{statusCounts.spam === 1 ? 'y' : 'ies'} detected — showing from recent {allEntries.length} loaded</span>
              </div>
            )}

            {/* Empty state for filter */}
            {filteredEntries.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                {statusFilter === 'all' ? 'No entries found' : `No ${statusFilter} entries in recent submissions`}
              </div>
            )}

            {/* Entries table */}
            {filteredEntries.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Entry', 'Form', 'Date', 'Status', 'Source'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry: any) => {
                      const form = data.forms.find((f: any) => String(f.id) === String(entry.form_id))
                      const st = statusStyle(entry.status)
                      const sourcePath = entry.source_url ? (() => { try { return new URL(entry.source_url).pathname } catch { return entry.source_url } })() : '—'
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            #{entry.id}
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--text2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {form?.title || `Form ${entry.form_id}`}
                          </td>
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                              {new Date(entry.date_created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(entry.date_created)}</div>
                          </td>
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: st.bg, color: st.color }}>
                              ● {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sourcePath}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
