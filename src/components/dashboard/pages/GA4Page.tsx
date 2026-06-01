'use client'
import { useState, useEffect, useRef } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props { projects: Project[]; session: Session }

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (!inQ && ch === sep) {
      result.push(cur.trim()); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = parseCsvLine(lines[0], sep)
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line, sep)
    return Object.fromEntries(headers.map((h, i) => [h.toLowerCase().trim(), (vals[i] ?? '').trim()]))
  })
}

function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k.toLowerCase()]
    if (v !== undefined && v !== '') return v
  }
  return ''
}

function num(v: string): number {
  return parseFloat(v.replace(/[%,]/g, '')) || 0
}

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: filename })
  a.click()
}

function fmtN(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}

function fmtDate(d: string) {
  const s = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TOOLTIP_STYLE = {
  background: 'var(--bg3, #1e2436)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
  color: 'var(--text)',
}

function calcTrend(series: any[], key: string): number | null {
  if (!series || series.length < 4) return null
  const mid = Math.floor(series.length / 2)
  const prev = series.slice(0, mid).reduce((s, r) => s + (r[key] || 0), 0)
  const curr = series.slice(mid).reduce((s, r) => s + (r[key] || 0), 0)
  if (prev === 0) return null
  return +((curr - prev) / prev * 100).toFixed(1)
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct >= 0
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: up ? 'rgba(34,211,160,0.1)' : 'rgba(245,101,101,0.1)', color: up ? '#22d3a0' : '#f56565' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

export default function GA4Page({ projects }: Props) {
  const ga4Projects = projects.filter(p => p.integrations?.ga4?.connected)
  const [selected, setSelected] = useState(ga4Projects[0]?.id || '')
  const [days, setDays] = useState(28)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reauth, setReauth] = useState(false)
  const [importedData, setImportedData] = useState<any>(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selected) return
    const p = projects.find(x => x.id === selected)
    if (!p?.integrations?.ga4?.property_id) return
    setLoading(true); setError(''); setData(null); setReauth(false)
    fetch(`/api/ga4?propertyId=${encodeURIComponent(p.integrations.ga4.property_id)}&days=${days}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); setReauth(!!json.reauth) }
        else setData(json)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selected, days]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportError('')
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCsvText(ev.target?.result as string)
        if (!rows.length) { setImportError('Empty or unreadable CSV file.'); return }
        const first = rows[0]
        const dateVal = col(first, 'date', 'day')
        if (!dateVal && dateVal === '') {
          setImportError('CSV must have a Date column. Expected: Date, Sessions, Users, New Users, Bounce Rate, Conversions')
          return
        }
        const timeSeries = rows.map(r => ({
          date:        col(r, 'date', 'day'),
          sessions:    Math.round(num(col(r, 'sessions'))),
          users:       Math.round(num(col(r, 'users', 'total users'))),
          newUsers:    Math.round(num(col(r, 'new users', 'newusers', 'new_users'))),
          bounceRate:  num(col(r, 'bounce rate', 'bouncerate', 'bounce_rate')),
          conversions: Math.round(num(col(r, 'conversions'))),
        })).filter(r => r.date)

        if (!timeSeries.length) { setImportError('No valid rows found. Check that the CSV has a Date column.'); return }

        const totalSessions    = timeSeries.reduce((s, r) => s + r.sessions, 0)
        const totalUsers       = timeSeries.reduce((s, r) => s + r.users, 0)
        const totalNewUsers    = timeSeries.reduce((s, r) => s + r.newUsers, 0)
        const avgBounce        = +(timeSeries.reduce((s, r) => s + r.bounceRate, 0) / timeSeries.length).toFixed(1)
        const totalConversions = timeSeries.reduce((s, r) => s + r.conversions, 0)
        const convRate         = totalSessions > 0 ? +(totalConversions / totalSessions * 100).toFixed(2) : 0

        setImportedData({
          timeSeries,
          summary: { sessions: totalSessions, users: totalUsers, newUsers: totalNewUsers, bounceRate: avgBounce, convRate, conversions: totalConversions },
          devices: [],
          countries: [],
        })
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse CSV.')
      }
    }
    reader.readAsText(file)
  }

  const displayData = importedData || data

  const trends = displayData ? {
    sessions:    calcTrend(displayData.timeSeries, 'sessions'),
    users:       calcTrend(displayData.timeSeries, 'users'),
    newUsers:    calcTrend(displayData.timeSeries, 'newUsers'),
    bounceRate:  calcTrend(displayData.timeSeries, 'bounceRate'),
    conversions: calcTrend(displayData.timeSeries, 'conversions'),
  } : null

  const UploadIcon = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
  const DownloadIcon = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )

  return (
    <div className="fade-in">
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImport} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Google Analytics 4</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>Real-time audience and behaviour data from GA4</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {ga4Projects.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
              {ga4Projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
            </select>
          )}
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            <UploadIcon /> Import CSV
          </button>
          {displayData && (
            <button onClick={() => downloadCSV(displayData.timeSeries.map((r: any) => ({ Date: r.date, Sessions: r.sessions, Users: r.users, 'New Users': r.newUsers, 'Bounce Rate': r.bounceRate, Conversions: r.conversions })), 'ga4-timeseries.csv')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              <DownloadIcon /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Import banner */}
      {importedData && (
        <div style={{ background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#5b7fff' }}>📂 Showing imported CSV data — {importedData.timeSeries.length} rows</span>
          <button onClick={() => setImportedData(null)} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕ Clear &amp; use live data</button>
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#f56565', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>⚠️ {importError}</span>
          <button onClick={() => setImportError('')} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Not connected empty state */}
      {ga4Projects.length === 0 && !importedData && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📈</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No GA4 properties connected</div>
          <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 16px' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> and add your GA4 Property ID, or{' '}
            <span style={{ color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fileRef.current?.click()}>import a CSV</span>.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Sessions', 'Users', 'Bounce Rate', 'Conversions', 'Device Breakdown', 'Top Countries'].map(f => (
              <span key={f} style={{ fontSize: 13, padding: '3px 10px', background: 'rgba(249,115,22,0.08)', color: '#f97316', borderRadius: 20, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner />}
      {error && !importedData && <ErrorBox msg={error} reauth={reauth} />}

      {displayData && (
        <div>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Sessions',    value: displayData.summary.sessions.toLocaleString(),   color: '#f97316', trend: trends?.sessions },
              { label: 'Users',       value: displayData.summary.users.toLocaleString(),       color: '#f0b429', trend: trends?.users },
              { label: 'New Users',   value: displayData.summary.newUsers.toLocaleString(),    color: '#22d3a0', trend: trends?.newUsers },
              { label: 'Bounce Rate', value: displayData.summary.bounceRate + '%',             color: '#f56565', trend: trends?.bounceRate != null ? -(trends!.bounceRate!) : null },
              { label: 'Conversions', value: displayData.summary.conversions.toLocaleString(), color: '#9f7aea', trend: trends?.conversions },
              { label: 'Conv. Rate',  value: displayData.summary.convRate + '%',               color: '#5b7fff', trend: null },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <TrendBadge pct={s.trend ?? null} />
              </div>
            ))}
          </div>

          {/* Sessions & Users chart */}
          {displayData.timeSeries.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Sessions &amp; Users {importedData ? `— ${importedData.timeSeries.length} rows` : `— last ${days} days`}
                </span>
                <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text3)' }}>
                  <LegendDot color="#5b7fff" label="Sessions" />
                  <LegendDot color="#22d3a0" label="Users" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={displayData.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ga4ps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ga4pu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#5b7fff" strokeWidth={2} fill="url(#ga4ps)" dot={false} />
                  <Area type="monotone" dataKey="users" name="Users" stroke="#22d3a0" strokeWidth={2} fill="url(#ga4pu)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Device + Countries (only available from live data) */}
          {(displayData.devices?.length > 0 || displayData.countries?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {displayData.devices?.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Device Breakdown</div>
                  {(() => {
                    const total = displayData.devices.reduce((a: number, x: any) => a + x.sessions, 0)
                    const colors = ['#5b7fff', '#22d3a0', '#f97316']
                    return displayData.devices.map((d: any, i: number) => {
                      const pct = total > 0 ? Math.round(d.sessions / total * 100) : 0
                      return (
                        <div key={d.device} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 15, color: 'var(--text2)', textTransform: 'capitalize' }}>{d.device}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{pct}% <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 13 }}>({d.sessions.toLocaleString()})</span></span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: colors[i % colors.length], width: `${pct}%`, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
              {displayData.countries?.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Top Countries</div>
                  {displayData.countries.map((c: any) => (
                    <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 15, color: 'var(--text2)' }}>{c.country}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{c.sessions.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function ErrorBox({ msg, reauth }: { msg: string; reauth?: boolean }) {
  return (
    <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 15, color: '#f56565' }}>⚠️ {msg}</span>
      {reauth && (
        <button onClick={() => window.location.href = '/api/auth/signin'}
          style={{ padding: '7px 16px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Reconnect Google →
        </button>
      )}
    </div>
  )
}
