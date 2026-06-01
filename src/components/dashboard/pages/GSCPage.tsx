'use client'
import { useState, useEffect, useRef } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface Props { projects: Project[]; session: Session }

// ── CSV utilities ────────────────────────────────────────────────────────────

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (c === sep && !inQ) { result.push(cur); cur = '' }
    else cur += c
  }
  result.push(cur)
  return result
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = parseCsvLine(lines[0], sep).map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line, sep)
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim().replace(/^"|"$/g, '')]))
  }).filter(r => Object.values(r).some(v => v))
}

function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase())
    if (found && row[found]) return row[found]
  }
  return ''
}

function num(v: string)   { return parseFloat(v.replace(/[%,]/g, '')) || 0 }
function intN(v: string)  { return parseInt(v.replace(/,/g, ''))     || 0 }

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: filename,
  })
  a.click()
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtN(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}
function getDateDaysAgo(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
function calcTrend(series: any[], key: string): number | null {
  if (series.length < 4) return null
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
    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
      background: up ? 'rgba(34,211,160,0.1)' : 'rgba(245,101,101,0.1)',
      color: up ? '#22d3a0' : '#f56565' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

const TOOLTIP_STYLE = { background: 'var(--bg3, #1e2436)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)' }

// ── Component ────────────────────────────────────────────────────────────────

export default function GSCPage({ projects }: Props) {
  const gscProjects = projects.filter(p => p.integrations?.gsc?.connected)
  const [selected, setSelected]       = useState(gscProjects[0]?.id || '')
  const [data, setData]               = useState<any>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [reauth, setReauth]           = useState(false)
  const [days, setDays]               = useState(28)
  const [chart, setChart]             = useState<'clicks' | 'impressions'>('clicks')
  const [importedData, setImportedData] = useState<any>(null)
  const [importError, setImportError]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.gsc?.property_url) return
    setLoading(true); setError(''); setData(null); setReauth(false); setImportedData(null)
    try {
      const startDate = getDateDaysAgo(days)
      const endDate   = getDateDaysAgo(0)
      const res  = await fetch(`/api/gsc?siteUrl=${encodeURIComponent(p.integrations.gsc.property_url)}&startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); setReauth(!!json.reauth); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected, days]) // eslint-disable-line

  // Import handler — accepts NexGen export OR native GSC export
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCsvText(ev.target?.result as string)
        if (!rows.length) { setImportError('Empty or unreadable CSV file.'); return }

        const firstKey = Object.keys(rows[0])[0]
        const isQuery = /^query$/i.test(firstKey)
        const isPage  = /^(page|page url|url)$/i.test(firstKey)

        if (!isQuery && !isPage) {
          setImportError('Unrecognised format. First column must be "Query" (for query data) or "Page" (for page data).')
          return
        }

        const base = importedData || data || { timeSeries: [], summary: { clicks: 0, impressions: 0, ctr: '0.00', position: '0.0' }, queries: [], pages: [] }

        if (isQuery) {
          const queries = rows.map(r => ({
            query:       col(r, 'query'),
            clicks:      intN(col(r, 'clicks')),
            impressions: intN(col(r, 'impressions')),
            ctr:         num(col(r, 'ctr')),
            position:    num(col(r, 'position')),
          }))
          const totClicks = queries.reduce((s, q) => s + q.clicks, 0)
          const totImpr   = queries.reduce((s, q) => s + q.impressions, 0)
          setImportedData({ ...base, queries, summary: { ...base.summary, clicks: totClicks, impressions: totImpr, ctr: totImpr ? (totClicks / totImpr * 100).toFixed(2) : '0.00' } })
        } else {
          const pages = rows.map(r => ({
            page:        col(r, 'page', 'page url', 'url'),
            clicks:      intN(col(r, 'clicks')),
            impressions: intN(col(r, 'impressions')),
            ctr:         num(col(r, 'ctr')),
            position:    num(col(r, 'position')),
          }))
          setImportedData({ ...base, pages })
        }
      } catch { setImportError('Failed to parse CSV. Check the file format.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const displayData  = importedData || data
  const isImported   = !!importedData
  const trends = displayData ? {
    clicks:      calcTrend(displayData.timeSeries || [], 'clicks'),
    impressions: calcTrend(displayData.timeSeries || [], 'impressions'),
    ctr:         calcTrend(displayData.timeSeries || [], 'ctr'),
    position:    calcTrend(displayData.timeSeries || [], 'position'),
  } : null

  const btnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }
  const DownloadIcon = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
  const UploadIcon = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Google Search Console</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>Live data from your Search Console properties</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {gscProjects.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
              {gscProjects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
            </select>
          )}
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          {/* Import */}
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>
            <UploadIcon /> Import CSV
          </button>
          {/* Export */}
          {displayData && (
            <button onClick={() => {
              if (displayData.queries?.length) downloadCSV(displayData.queries.map((q: any) => ({ Query: q.query, Clicks: q.clicks, Impressions: q.impressions, CTR: q.ctr + '%', Position: q.position })), 'gsc-queries.csv')
              if (displayData.pages?.length)   downloadCSV(displayData.pages.map((p: any) => ({ Page: p.page, Clicks: p.clicks, Impressions: p.impressions, CTR: p.ctr + '%', Position: p.position })), 'gsc-pages.csv')
            }} style={btnStyle}>
              <DownloadIcon /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#f0b429', marginBottom: 14 }}>
          ⚠️ {importError}
        </div>
      )}

      {/* Import banner */}
      {isImported && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: '#5b7fff', fontWeight: 600 }}>📂 Showing imported CSV data</span>
          <button onClick={() => { setImportedData(null); setImportError('') }}
            style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>
            ✕ Clear &amp; use live data
          </button>
        </div>
      )}

      {gscProjects.length === 0 && !isImported && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(91,127,255,0.3)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No GSC properties connected</div>
          <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 16px' }}>
            Connect Google Search Console, or <button onClick={() => fileRef.current?.click()} style={{ color: '#5b7fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>import a CSV</button> exported from GSC.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Total Clicks', 'Impressions', 'CTR', 'Avg Position', 'Top Queries', 'Top Pages'].map(f => (
              <span key={f} style={{ fontSize: 13, padding: '3px 10px', background: 'rgba(91,127,255,0.08)', color: '#5b7fff', borderRadius: 20, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner />}
      {error && !isImported && <ErrorBox msg={error} reauth={reauth} />}

      {displayData && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Clicks',      value: Number(displayData.summary.clicks).toLocaleString(),      color: '#5b7fff', trend: trends?.clicks },
              { label: 'Total Impressions', value: Number(displayData.summary.impressions).toLocaleString(), color: '#f0b429', trend: trends?.impressions },
              { label: 'Avg. CTR',          value: displayData.summary.ctr + '%',                            color: '#22d3a0', trend: trends?.ctr },
              { label: 'Avg. Position',     value: displayData.summary.position,                             color: '#f97316', trend: trends?.position !== null ? -(trends!.position!) : null },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <TrendBadge pct={s.trend ?? null} />
              </div>
            ))}
          </div>

          {/* Chart — only when time series available */}
          {displayData.timeSeries?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Performance — last {days} days</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['clicks', 'impressions'] as const).map(m => (
                    <button key={m} onClick={() => setChart(m)}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: chart === m ? (m === 'clicks' ? 'rgba(91,127,255,0.15)' : 'rgba(240,180,41,0.15)') : 'var(--bg3)',
                        color: chart === m ? (m === 'clicks' ? '#5b7fff' : '#f0b429') : 'var(--text3)' }}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={displayData.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gscClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} /><stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gscImpr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0b429" stopOpacity={0.25} /><stop offset="95%" stopColor="#f0b429" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  {chart === 'clicks'
                    ? <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#5b7fff" strokeWidth={2} fill="url(#gscClicks)" dot={false} />
                    : <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#f0b429" strokeWidth={2} fill="url(#gscImpr)" dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Queries */}
          {displayData.queries?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top Search Queries</div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: isImported ? 'rgba(91,127,255,0.1)' : 'rgba(91,127,255,0.1)', color: '#5b7fff' }}>{isImported ? 'Imported' : 'Live Data'}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr>{['Query', 'Clicks', 'Impressions', 'CTR', 'Position'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {displayData.queries.map((q: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(91,127,255,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500 }}>{q.query}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)', fontWeight: 600 }}>{Number(q.clicks).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{Number(q.impressions).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: q.ctr > 3 ? 'rgba(34,211,160,0.1)' : 'rgba(240,180,41,0.1)', color: q.ctr > 3 ? '#22d3a0' : '#f0b429' }}>{q.ctr}%</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{q.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Pages */}
          {displayData.pages?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top Pages</div>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>by clicks</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr>{['Page URL', 'Clicks', 'Impressions', 'CTR', 'Position'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {displayData.pages.map((p: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(91,127,255,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)', fontWeight: 600 }}>{Number(p.clicks).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{Number(p.impressions).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: p.ctr > 3 ? 'rgba(34,211,160,0.1)' : 'rgba(240,180,41,0.1)', color: p.ctr > 3 ? '#22d3a0' : '#f0b429' }}>{p.ctr}%</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorBox({ msg, reauth }: { msg: string; reauth?: boolean }) {
  return (
    <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
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
