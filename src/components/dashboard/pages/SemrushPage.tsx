'use client'
import { useState, useEffect, useRef } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

const DATABASES = [
  { value: 'us', label: '🇺🇸 United States' },
  { value: 'uk', label: '🇬🇧 United Kingdom' },
  { value: 'ca', label: '🇨🇦 Canada' },
  { value: 'au', label: '🇦🇺 Australia' },
  { value: 'de', label: '🇩🇪 Germany' },
  { value: 'fr', label: '🇫🇷 France' },
  { value: 'es', label: '🇪🇸 Spain' },
  { value: 'it', label: '🇮🇹 Italy' },
  { value: 'br', label: '🇧🇷 Brazil' },
  { value: 'in', label: '🇮🇳 India' },
]

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
  return parseFloat(v.replace(/[%,$,]/g, '')) || 0
}

function fmtN(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}

function diffColor(kd: number) {
  if (kd <= 29) return '#22d3a0'
  if (kd <= 59) return '#f0b429'
  if (kd <= 79) return '#f97316'
  return '#f56565'
}

function diffLabel(kd: number) {
  if (kd <= 29) return 'Easy'
  if (kd <= 59) return 'Medium'
  if (kd <= 79) return 'Hard'
  return 'Very Hard'
}

function posChange(pos: number, prev: number) {
  if (!prev || prev === 0) return null
  const delta = prev - pos
  if (delta === 0) return null
  return delta
}

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function SemrushPage({ projects }: Props) {
  const srProjects = projects.filter(p => p.integrations?.semrush?.connected)
  const [selected, setSelected]         = useState(srProjects[0]?.id || '')
  const [database, setDatabase]         = useState(srProjects[0]?.integrations?.semrush?.database || 'us')
  const [data, setData]                 = useState<any>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [kwSearch, setKwSearch]         = useState('')
  const [kwSort, setKwSort]             = useState<'position' | 'volume' | 'cpc' | 'difficulty'>('position')
  const [importedKeywords, setImportedKeywords] = useState<any[] | null>(null)
  const [importError, setImportError]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = async (projectId: string, db: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.semrush?.api_key) return
    setLoading(true); setError(''); setData(null)
    try {
      const params = new URLSearchParams({
        apiKey:   p.integrations.semrush.api_key,
        domain:   p.domain,
        database: db,
      })
      const res  = await fetch(`/api/semrush?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (selected) fetchData(selected, database)
  }, [selected, database]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const kwVal = col(first, 'keyword')
        if (!kwVal && kwVal === '') {
          setImportError('CSV must have a Keyword column. Expected: Keyword, Position, Prev Position, Volume, CPC, Difficulty, Traffic, URL')
          return
        }
        const keywords = rows.map(r => ({
          keyword:      col(r, 'keyword'),
          position:     Math.round(num(col(r, 'position'))),
          prevPosition: Math.round(num(col(r, 'prev position', 'previous position', 'prev_position'))),
          volume:       Math.round(num(col(r, 'volume', 'search volume'))),
          cpc:          num(col(r, 'cpc')),
          difficulty:   Math.round(num(col(r, 'difficulty', 'keyword difficulty'))),
          traffic:      Math.round(num(col(r, 'traffic'))),
          url:          col(r, 'url', 'landing page', 'landing url'),
        })).filter(r => r.keyword && r.position > 0)

        if (!keywords.length) { setImportError('No valid keyword rows found. Check that the CSV has Keyword and Position columns.'); return }
        setImportedKeywords(keywords)
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse CSV.')
      }
    }
    reader.readAsText(file)
  }

  const liveKeywords: any[] = data?.keywords || []
  const keywords = importedKeywords ?? liveKeywords

  const filtered = keywords
    .filter(k => !kwSearch || k.keyword.toLowerCase().includes(kwSearch.toLowerCase()))
    .sort((a, b) => {
      if (kwSort === 'position')   return a.position   - b.position
      if (kwSort === 'volume')     return b.volume      - a.volume
      if (kwSort === 'cpc')        return b.cpc         - a.cpc
      if (kwSort === 'difficulty') return a.difficulty  - b.difficulty
      return 0
    })

  const ov = data?.overview || {}
  const bl = data?.backlinks || {}
  const competitors: any[] = data?.competitors || []

  const summaryCards = [
    { label: 'Organic Keywords',   value: fmtN(ov.organicKeywords || 0), icon: '🔑', color: '#5b7fff' },
    { label: 'Organic Traffic / mo', value: fmtN(ov.organicTraffic || 0), icon: '📈', color: '#22d3a0' },
    { label: 'Traffic Value',      value: `$${fmtN(ov.organicCost || 0)}`, icon: '💰', color: '#f0b429' },
    { label: 'Paid Keywords',      value: fmtN(ov.paidKeywords || 0), icon: '💳', color: '#f97316' },
    { label: 'Backlinks',          value: fmtN(bl.total || 0), icon: '🔗', color: '#9f7aea' },
    { label: 'Referring Domains',  value: fmtN(bl.domains || 0), icon: '🌐', color: '#ff6d3b' },
    { label: 'Authority Score',    value: String(bl.ascore || 0), icon: '⭐', color: '#22d3a0' },
    { label: 'Dofollow Links',     value: fmtN(bl.follows || 0), icon: '✅', color: '#5b7fff' },
  ]

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
    <div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImport} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>SEMrush</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>Keyword rankings · Traffic estimates · Backlinks · Competitors</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={database} onChange={e => setDatabase(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
            {DATABASES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          {srProjects.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
              {srProjects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
            </select>
          )}
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            <UploadIcon /> Import CSV
          </button>
          {filtered.length > 0 && (
            <button
              onClick={() => downloadCSV(filtered.map(k => ({
                Keyword: k.keyword, Position: k.position, 'Prev Position': k.prevPosition,
                Volume: k.volume, CPC: k.cpc, Difficulty: k.difficulty, Traffic: k.traffic, URL: k.url,
              })), `semrush-keywords${data?.domain ? '-' + data.domain : ''}.csv`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              <DownloadIcon /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Import banner */}
      {importedKeywords && (
        <div style={{ background: 'rgba(255,109,59,0.08)', border: '1px solid rgba(255,109,59,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#ff6d3b' }}>📂 Showing imported CSV keywords — {importedKeywords.length} rows</span>
          <button onClick={() => setImportedKeywords(null)} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕ Clear &amp; use live data</button>
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#f56565', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>⚠️ {importError}</span>
          <button onClick={() => setImportError('')} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Not connected */}
      {srProjects.length === 0 && !importedKeywords && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(255,109,59,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No SEMrush sites connected</div>
          <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> and connect SEMrush with your API key, or{' '}
            <span style={{ color: '#ff6d3b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fileRef.current?.click()}>import a keyword CSV</span>.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(255,109,59,0.2)', borderTopColor: '#ff6d3b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, color: 'var(--text3)' }}>Loading SEMrush data…</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && !importedKeywords && (
        <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 15, color: '#f56565', marginBottom: 16, lineHeight: 1.6 }}>
          ⚠️ {error}
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text3)' }}>Check your SEMrush API key and ensure your plan includes API access.</div>
        </div>
      )}

      {/* Summary cards — only from live data */}
      {data && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {summaryCards.map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
              <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Keywords table — shown when live data OR imported keywords exist */}
      {(data || importedKeywords) && !loading && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              Organic Keyword Rankings
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>
                {importedKeywords ? `${importedKeywords.length} imported` : `${fmtN(ov.organicKeywords || 0)} total · showing top ${liveKeywords.length}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={kwSearch} onChange={e => setKwSearch(e.target.value)} placeholder="Search keywords…"
                style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 14, outline: 'none', width: 180 }} />
              <select value={kwSort} onChange={e => setKwSort(e.target.value as any)}
                style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                <option value="position">Sort: Position</option>
                <option value="volume">Sort: Volume</option>
                <option value="cpc">Sort: CPC</option>
                <option value="difficulty">Sort: Difficulty</option>
              </select>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 15 }}>
              {kwSearch ? 'No keywords match your search' : 'No keywords found — try importing a CSV'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr>
                    {['Position', 'Change', 'Keyword', 'Volume', 'CPC', 'Difficulty', 'Traffic', 'URL'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k: any, i: number) => {
                    const delta  = posChange(k.position, k.prevPosition)
                    const kdCol  = diffColor(k.difficulty)
                    const kdLbl  = diffLabel(k.difficulty)
                    const path   = k.url ? (() => { try { return new URL(k.url).pathname } catch { return k.url } })() : '—'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: k.position <= 3 ? '#22d3a0' : k.position <= 10 ? '#5b7fff' : 'var(--text)' }}>
                            #{k.position}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {delta === null ? (
                            <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 700, color: delta > 0 ? '#22d3a0' : '#f56565' }}>
                              {delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {k.keyword}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{fmtN(k.volume)}</span>
                          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>/mo</span>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 14 }}>
                          ${k.cpc.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {k.difficulty > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: `${kdCol}18`, color: kdCol }}>
                              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: kdCol }} />
                              {k.difficulty} · {kdLbl}
                            </span>
                          ) : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 14 }}>{fmtN(k.traffic)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#5b7fff', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={k.url}>
                          {path}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bottom grid: Competitors + Backlinks — only from live data */}
      {data && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {/* Competitors */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Organic Competitors</div>
              {competitors.length > 0 && (
                <button onClick={() => downloadCSV(competitors.map(c => ({ Domain: c.domain, 'Common Keywords': c.commonKeywords, 'Their Keywords': c.organicKeywords, 'Their Traffic': c.organicTraffic })), `semrush-competitors-${data.domain}.csv`)}
                  style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  CSV
                </button>
              )}
            </div>
            {competitors.length === 0 ? (
              <div style={{ padding: '24px 18px', color: 'var(--text3)', fontSize: 15 }}>No competitor data available</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['Domain', 'Common KWs', 'Their KWs', 'Their Traffic'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#5b7fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.domain}</td>
                        <td style={{ padding: '9px 14px', color: 'var(--text2)' }}>{fmtN(c.commonKeywords)}</td>
                        <td style={{ padding: '9px 14px', color: 'var(--text2)' }}>{fmtN(c.organicKeywords)}</td>
                        <td style={{ padding: '9px 14px', color: 'var(--text2)' }}>{fmtN(c.organicTraffic)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Backlink profile */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Backlink Profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Authority Score',    value: bl.ascore || 0,  max: 100, color: bl.ascore >= 60 ? '#22d3a0' : bl.ascore >= 30 ? '#f0b429' : '#f56565' },
                { label: 'Total Backlinks',    value: bl.total || 0,   max: null, color: '#5b7fff' },
                { label: 'Referring Domains',  value: bl.domains || 0, max: null, color: '#9f7aea' },
                { label: 'Dofollow Links',     value: bl.follows || 0, max: null, color: '#22d3a0' },
                { label: 'Nofollow Links',     value: bl.nofollow || 0,max: null, color: '#f0b429' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 130, fontSize: 14, color: 'var(--text3)', flexShrink: 0 }}>{row.label}</div>
                  {row.max ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((row.value / row.max) * 100, 100)}%`, height: '100%', background: row.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.color, minWidth: 28 }}>{row.value}</span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{fmtN(row.value)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
