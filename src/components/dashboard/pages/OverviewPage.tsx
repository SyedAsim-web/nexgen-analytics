'use client'
import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  projects: Project[]
  loading: boolean
  session: Session
  onViewSite: (p: Project) => void
}

function fmtN(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}

function fmtDate(d: string) {
  const s = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d
  const dt = new Date(s)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TOOLTIP_STYLE = {
  background: 'var(--bg3, #1e2436)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
}

export default function OverviewPage({ projects, loading, session, onViewSite }: Props) {
  const totalSites = projects.length
  const connectedProjects = projects.filter(
    p => p.integrations?.ga4?.connected || p.integrations?.gsc?.connected
  )

  const [selectedId, setSelectedId] = useState(
    connectedProjects[0]?.id || projects[0]?.id || ''
  )
  const [ga4Data, setGa4Data] = useState<any>(null)
  const [gscData, setGscData] = useState<any>(null)
  const [ga4Loading, setGa4Loading] = useState(false)
  const [gscLoading, setGscLoading] = useState(false)
  const [ga4Error, setGa4Error] = useState('')
  const [gscError, setGscError] = useState('')

  const selectedProject = projects.find(p => p.id === selectedId)

  useEffect(() => {
    if (!selectedProject) return
    setGa4Data(null)
    setGscData(null)
    setGa4Error('')
    setGscError('')

    if (selectedProject.integrations?.ga4?.connected && selectedProject.integrations.ga4.property_id) {
      setGa4Loading(true)
      fetch(`/api/ga4?propertyId=${encodeURIComponent(selectedProject.integrations.ga4.property_id)}&days=28`)
        .then(r => r.json())
        .then(json => {
          if (json.error) setGa4Error(json.error)
          else setGa4Data(json)
        })
        .catch(e => setGa4Error(e.message))
        .finally(() => setGa4Loading(false))
    }

    if (selectedProject.integrations?.gsc?.connected && selectedProject.integrations.gsc.property_url) {
      setGscLoading(true)
      fetch(`/api/gsc?siteUrl=${encodeURIComponent(selectedProject.integrations.gsc.property_url)}`)
        .then(r => r.json())
        .then(json => {
          if (json.error) setGscError(json.error)
          else setGscData(json)
        })
        .catch(e => setGscError(e.message))
        .finally(() => setGscLoading(false))
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#8c95ad' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14 }}>Loading your dashboard…</div>
      </div>
    </div>
  )

  const totalIntegrations = projects.reduce(
    (a, p) => a + Object.keys(p.integrations || {}).filter(k => (p.integrations as any)[k]?.connected).length, 0
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Welcome back, {session.user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Here's your analytics overview across {totalSites} website{totalSites !== 1 ? 's' : ''}.
          </p>
        </div>
        {projects.length > 0 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        )}
      </div>

      {/* Aggregate stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Websites', value: String(totalSites), color: '#5b7fff', icon: '🌐' },
          { label: 'Integrations', value: String(totalIntegrations), color: '#22d3a0', icon: '🔗' },
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

      {/* Selected site analytics */}
      {selectedProject && (
        <div>
          {/* GA4 section */}
          {selectedProject.integrations?.ga4?.connected && (
            <section style={{ marginBottom: 28 }}>
              <SectionHeader icon="📈" title="Google Analytics 4" site={selectedProject.name} />
              {ga4Loading && <ChartSkeleton label="Loading GA4 data…" />}
              {ga4Error && <ErrorBox msg={ga4Error} />}
              {ga4Data && (
                <div>
                  {/* GA4 metric cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Sessions', value: fmtN(ga4Data.summary.sessions), color: '#f97316' },
                      { label: 'Users', value: fmtN(ga4Data.summary.users), color: '#f0b429' },
                      { label: 'New Users', value: fmtN(ga4Data.summary.newUsers), color: '#22d3a0' },
                      { label: 'Bounce Rate', value: ga4Data.summary.bounceRate + '%', color: '#f56565' },
                      { label: 'Conversions', value: fmtN(ga4Data.summary.conversions), color: '#9f7aea' },
                      { label: 'Conv. Rate', value: ga4Data.summary.convRate + '%', color: '#5b7fff' },
                    ].map(s => <MiniStatCard key={s.label} {...s} />)}
                  </div>

                  {/* Chart + sidebar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 14 }}>
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Sessions & Users — last 28 days</span>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                          <LegendDot color="#5b7fff" label="Sessions" />
                          <LegendDot color="#22d3a0" label="Users" />
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={190}>
                        <AreaChart
                          data={ga4Data.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="ga4s" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="ga4u" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#5b7fff" strokeWidth={2} fill="url(#ga4s)" dot={false} />
                          <Area type="monotone" dataKey="users" name="Users" stroke="#22d3a0" strokeWidth={2} fill="url(#ga4u)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Device + Countries sidebar */}
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Device Breakdown</div>
                        {(() => {
                          const total = ga4Data.devices.reduce((a: number, x: any) => a + x.sessions, 0)
                          const colors = ['#5b7fff', '#22d3a0', '#f97316']
                          return ga4Data.devices.map((d: any, i: number) => {
                            const pct = total > 0 ? Math.round(d.sessions / total * 100) : 0
                            return (
                              <div key={d.device} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                  <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{d.device}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{pct}%</span>
                                </div>
                                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                                  <div style={{ height: '100%', borderRadius: 3, background: colors[i % colors.length], width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Top Countries</div>
                        {ga4Data.countries.slice(0, 5).map((c: any) => (
                          <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.country}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.sessions.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* GSC section */}
          {selectedProject.integrations?.gsc?.connected && (
            <section style={{ marginBottom: 28 }}>
              <SectionHeader icon="🔍" title="Search Console" site={selectedProject.name} />
              {gscLoading && <ChartSkeleton label="Loading Search Console data…" />}
              {gscError && <ErrorBox msg={gscError} />}
              {gscData && (
                <div>
                  {/* GSC metric cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Clicks', value: fmtN(gscData.summary.clicks), color: '#5b7fff' },
                      { label: 'Impressions', value: fmtN(gscData.summary.impressions), color: '#f0b429' },
                      { label: 'Avg. CTR', value: gscData.summary.ctr + '%', color: '#22d3a0' },
                      { label: 'Avg. Position', value: String(gscData.summary.position), color: '#f97316' },
                    ].map(s => <MiniStatCard key={s.label} {...s} />)}
                  </div>

                  {/* Chart + top queries */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 14 }}>
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Clicks & Impressions — last 28 days</span>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                          <LegendDot color="#5b7fff" label="Clicks" />
                          <LegendDot color="#f0b429" label="Impressions" />
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={190}>
                        <AreaChart
                          data={gscData.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="gscc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gsci" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f0b429" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#f0b429" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#5b7fff" strokeWidth={2} fill="url(#gscc)" dot={false} />
                          <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#f0b429" strokeWidth={2} fill="url(#gsci)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Top queries */}
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Queries</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(91,127,255,0.1)', color: '#5b7fff' }}>Live</span>
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '6px 16px', borderBottom: '1px solid var(--border)' }}>
                          {['Query', 'Clicks', 'CTR'].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{h}</span>
                          ))}
                        </div>
                        {gscData.queries.slice(0, 9).map((q: any, i: number) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                            <span style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>{q.clicks}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: q.ctr > 3 ? 'rgba(34,211,160,0.12)' : 'rgba(240,180,41,0.12)', color: q.ctr > 3 ? '#22d3a0' : '#f0b429', textAlign: 'center' }}>{q.ctr}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* No integrations for selected site */}
          {!selectedProject.integrations?.ga4?.connected && !selectedProject.integrations?.gsc?.connected && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔌</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No integrations connected for this site</div>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
                Connect Google Search Console or GA4 in <strong style={{ color: 'var(--text)' }}>All Websites → {selectedProject.name} → Integrations</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Websites grid */}
      {projects.length > 0 ? (
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Your Websites</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
            {projects.slice(0, 6).map(p => {
              const intCount = Object.keys(p.integrations || {}).filter(k => (p.integrations as any)[k]?.connected).length
              const initials = (p.name || p.domain).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
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
                    <span style={{ fontSize: 11, color: intCount > 0 ? '#22d3a0' : 'var(--text3)', fontWeight: 600 }}>{intCount} integration{intCount !== 1 ? 's' : ''} connected</span>
                    <span style={{ fontSize: 11, color: '#5b7fff', fontWeight: 600 }}>View →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Add your first website</div>
          <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Connect your websites to start tracking Google Search Console, GA4 analytics, GHL Voice AI calls, and Gravity Forms submissions all in one place.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Google Search Console', 'GA4 Analytics', 'GHL Voice AI', 'Gravity Forms'].map(pl => (
              <span key={pl} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(91,127,255,0.1)', color: '#5b7fff', borderRadius: 20, fontWeight: 600 }}>{pl}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon, title, site }: { icon: string; title: string; site: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>— {site}</span>
    </div>
  )
}

function MiniStatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: color }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
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

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, gap: 12, marginBottom: 16, color: 'var(--text3)', fontSize: 13 }}>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      {label}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565', marginBottom: 16 }}>
      ⚠️ {msg}
    </div>
  )
}
