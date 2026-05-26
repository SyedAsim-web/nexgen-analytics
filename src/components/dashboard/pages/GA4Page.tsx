'use client'
import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props { projects: Project[]; session: Session }

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
  fontSize: 12,
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
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: up ? 'rgba(34,211,160,0.1)' : 'rgba(245,101,101,0.1)', color: up ? '#22d3a0' : '#f56565' }}>
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

  const trends = data ? {
    sessions:   calcTrend(data.timeSeries, 'sessions'),
    users:      calcTrend(data.timeSeries, 'users'),
    newUsers:   calcTrend(data.timeSeries, 'newUsers'),
    bounceRate: calcTrend(data.timeSeries, 'bounceRate'),
    conversions:calcTrend(data.timeSeries, 'conversions'),
  } : null

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Google Analytics 4</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Real-time audience and behaviour data from GA4</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ga4Projects.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              {ga4Projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
            </select>
          )}
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Not connected empty state */}
      {ga4Projects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📈</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No GA4 properties connected</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 16px' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> and add your GA4 Property ID to see real analytics data.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Sessions', 'Users', 'Bounce Rate', 'Conversions', 'Device Breakdown', 'Top Countries'].map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(249,115,22,0.08)', color: '#f97316', borderRadius: 20, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} reauth={reauth} />}

      {data && (
        <div>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Sessions',     value: data.summary.sessions.toLocaleString(),     color: '#f97316', trend: trends?.sessions },
              { label: 'Users',        value: data.summary.users.toLocaleString(),         color: '#f0b429', trend: trends?.users },
              { label: 'New Users',    value: data.summary.newUsers.toLocaleString(),      color: '#22d3a0', trend: trends?.newUsers },
              { label: 'Bounce Rate',  value: data.summary.bounceRate + '%',               color: '#f56565', trend: trends?.bounceRate !== null && trends?.bounceRate !== undefined ? -(trends!.bounceRate!) : null },
              { label: 'Conversions',  value: data.summary.conversions.toLocaleString(),   color: '#9f7aea', trend: trends?.conversions },
              { label: 'Conv. Rate',   value: data.summary.convRate + '%',                 color: '#5b7fff', trend: null },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <TrendBadge pct={s.trend ?? null} />
              </div>
            ))}
          </div>

          {/* Sessions & Users chart */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Sessions & Users — last {days} days
              </span>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text3)' }}>
                <LegendDot color="#5b7fff" label="Sessions" />
                <LegendDot color="#22d3a0" label="Users" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={data.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))}
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
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#5b7fff" strokeWidth={2} fill="url(#ga4ps)" dot={false} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#22d3a0" strokeWidth={2} fill="url(#ga4pu)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device + Countries */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Device Breakdown</div>
              {(() => {
                const total = data.devices.reduce((a: number, x: any) => a + x.sessions, 0)
                const colors = ['#5b7fff', '#22d3a0', '#f97316']
                return data.devices.map((d: any, i: number) => {
                  const pct = total > 0 ? Math.round(d.sessions / total * 100) : 0
                  return (
                    <div key={d.device} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{d.device}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{pct}% <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 11 }}>({d.sessions.toLocaleString()})</span></span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: colors[i % colors.length], width: `${pct}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })
              })()}
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
      <span style={{ fontSize: 13, color: '#f56565' }}>⚠️ {msg}</span>
      {reauth && (
        <button onClick={() => window.location.href = '/api/auth/signin'}
          style={{ padding: '7px 16px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Reconnect Google →
        </button>
      )}
    </div>
  )
}
