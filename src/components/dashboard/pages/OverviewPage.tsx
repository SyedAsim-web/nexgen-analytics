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
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TOOLTIP_STYLE = {
  background: 'var(--bg3, #1e2436)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
}

export default function OverviewPage({ projects, loading, session, onViewSite }: Props) {
  // projects[0] = most recently added (API sorts by created_at DESC)
  const [selectedId, setSelectedId] = useState('')
  const [ga4Days, setGa4Days] = useState(28)
  const [ga4Data, setGa4Data] = useState<any>(null)
  const [gscData, setGscData] = useState<any>(null)
  const [ga4Loading, setGa4Loading] = useState(false)
  const [gscLoading, setGscLoading] = useState(false)
  const [ga4Error, setGa4Error] = useState('')
  const [gscError, setGscError] = useState('')

  // Set default selection once projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedId) {
      setSelectedId(projects[0].id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProject = projects.find(p => p.id === selectedId)

  // Fetch GA4 data when site or days changes
  useEffect(() => {
    if (!selectedProject?.integrations?.ga4?.connected) { setGa4Data(null); return }
    const pid = selectedProject.integrations.ga4.property_id
    if (!pid) return
    setGa4Loading(true); setGa4Error(''); setGa4Data(null)
    fetch(`/api/ga4?propertyId=${encodeURIComponent(pid)}&days=${ga4Days}`)
      .then(r => r.json())
      .then(json => { if (json.error) setGa4Error(json.error); else setGa4Data(json) })
      .catch(e => setGa4Error(e.message))
      .finally(() => setGa4Loading(false))
  }, [selectedId, ga4Days]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch GSC data when site changes
  useEffect(() => {
    if (!selectedProject?.integrations?.gsc?.connected) { setGscData(null); return }
    const url = selectedProject.integrations.gsc.property_url
    if (!url) return
    setGscLoading(true); setGscError(''); setGscData(null)
    fetch(`/api/gsc?siteUrl=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(json => { if (json.error) setGscError(json.error); else setGscData(json) })
      .catch(e => setGscError(e.message))
      .finally(() => setGscLoading(false))
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#8c95ad' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14 }}>Loading your dashboard…</div>
      </div>
    </div>
  )

  // Empty state — no projects yet
  if (projects.length === 0) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Welcome back, {session.user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Let's get started — add your first website to see analytics here.</p>
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 56, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🚀</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Add your first website</div>
        <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Connect your websites to start tracking Google Search Console, GA4 analytics, GHL Voice AI calls, and Gravity Forms submissions all in one place.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Google Search Console', 'GA4 Analytics', 'GHL Voice AI', 'Gravity Forms'].map(pl => (
            <span key={pl} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(91,127,255,0.1)', color: '#5b7fff', borderRadius: 20, fontWeight: 600 }}>{pl}</span>
          ))}
        </div>
      </div>
    </div>
  )

  const ga4 = selectedProject?.integrations?.ga4
  const gsc = selectedProject?.integrations?.gsc
  const ghl = selectedProject?.integrations?.ghl
  const gravity = selectedProject?.integrations?.gravity

  return (
    <div>
      {/* Header + site selector */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Welcome back, {session.user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Analytics overview for <strong style={{ color: 'var(--text)' }}>{selectedProject?.name || '…'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Website:</span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: 180 }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        </div>
      </div>

      {/* Integration status pills */}
      {selectedProject && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'gsc', label: 'Search Console', color: '#5b7fff', connected: gsc?.connected },
            { key: 'ga4', label: 'GA4 Analytics', color: '#f97316', connected: ga4?.connected },
            { key: 'ghl', label: 'GHL Voice AI', color: '#22d3a0', connected: ghl?.connected },
            { key: 'gravity', label: 'Gravity Forms', color: '#9f7aea', connected: gravity?.connected },
          ].map(int => (
            <div key={int.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: int.connected ? `${int.color}14` : 'var(--bg2)', border: `1px solid ${int.connected ? `${int.color}40` : 'var(--border)'}`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: int.connected ? int.color : 'var(--text3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: int.connected ? int.color : 'var(--text3)', display: 'inline-block', flexShrink: 0 }} />
              {int.label}
              <span style={{ fontWeight: 400, opacity: 0.75 }}>{int.connected ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── GA4 Section ── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <SectionTitle icon="📈" title="Google Analytics 4" />
          {ga4?.connected && (
            <select value={ga4Days} onChange={e => setGa4Days(parseInt(e.target.value))}
              style={{ padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          )}
        </div>

        {!ga4?.connected && (
          <NotIntegratedCard
            icon="📈"
            title="GA4 Analytics not integrated yet"
            description="Connect Google Analytics 4 to see sessions, users, bounce rate, conversions, and device breakdowns for this website."
            features={['Sessions', 'Users', 'Bounce Rate', 'Conversions', 'Device Breakdown', 'Top Countries']}
            color="#f97316"
            onSetup={() => selectedProject && onViewSite(selectedProject)}
          />
        )}

        {ga4?.connected && ga4Loading && <ChartSkeleton label="Loading GA4 data…" />}
        {ga4?.connected && ga4Error && <ErrorBox msg={ga4Error} />}

        {ga4?.connected && ga4Data && (
          <div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 14 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Sessions & Users — last {ga4Days} days</span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                    <LegendDot color="#5b7fff" label="Sessions" />
                    <LegendDot color="#22d3a0" label="Users" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={ga4Data.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovga4s" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} /><stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ovga4u" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.25} /><stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#5b7fff" strokeWidth={2} fill="url(#ovga4s)" dot={false} />
                    <Area type="monotone" dataKey="users" name="Users" stroke="#22d3a0" strokeWidth={2} fill="url(#ovga4u)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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

      {/* ── GSC Section ── */}
      <section style={{ marginBottom: 28 }}>
        <SectionTitle icon="🔍" title="Google Search Console" style={{ marginBottom: 14 }} />

        {!gsc?.connected && (
          <NotIntegratedCard
            icon="🔍"
            title="Search Console not integrated yet"
            description="Connect Google Search Console to see clicks, impressions, CTR, and keyword rankings for this website."
            features={['Total Clicks', 'Impressions', 'Avg. CTR', 'Avg. Position', 'Top Queries', 'Top Pages']}
            color="#5b7fff"
            onSetup={() => selectedProject && onViewSite(selectedProject)}
          />
        )}

        {gsc?.connected && gscLoading && <ChartSkeleton label="Loading Search Console data…" />}
        {gsc?.connected && gscError && <ErrorBox msg={gscError} />}

        {gsc?.connected && gscData && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Clicks', value: fmtN(gscData.summary.clicks), color: '#5b7fff' },
                { label: 'Impressions', value: fmtN(gscData.summary.impressions), color: '#f0b429' },
                { label: 'Avg. CTR', value: gscData.summary.ctr + '%', color: '#22d3a0' },
                { label: 'Avg. Position', value: String(gscData.summary.position), color: '#f97316' },
              ].map(s => <MiniStatCard key={s.label} {...s} />)}
            </div>
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
                  <AreaChart data={gscData.timeSeries.map((d: any) => ({ ...d, dateLabel: fmtDate(d.date) }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovgscc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b7fff" stopOpacity={0.3} /><stop offset="95%" stopColor="#5b7fff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ovgsci" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f0b429" stopOpacity={0.25} /><stop offset="95%" stopColor="#f0b429" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={fmtN} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#5b7fff" strokeWidth={2} fill="url(#ovgscc)" dot={false} />
                    <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#f0b429" strokeWidth={2} fill="url(#ovgsci)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Queries</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(91,127,255,0.1)', color: '#5b7fff' }}>Live</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '6px 16px', background: 'var(--bg3)' }}>
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
        )}
      </section>

      {/* ── GHL + Gravity row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>

        {/* GHL Section */}
        <section>
          <SectionTitle icon="🤖" title="GHL Voice AI" style={{ marginBottom: 14 }} />
          {!ghl?.connected ? (
            <NotIntegratedCard
              icon="🤖"
              title="Not integrated yet"
              description="Connect GoHighLevel to track AI voice calls, lead outcomes, and booked appointments."
              features={['AI Call Tracking', 'Lead Outcomes', 'Booked Appointments']}
              color="#22d3a0"
              onSetup={() => selectedProject && onViewSite(selectedProject)}
              compact
            />
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid rgba(34,211,160,0.3)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3a0' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22d3a0' }}>GHL Connected</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Location ID</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', marginBottom: 16 }}>{ghl.location_id || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['Total Calls', 'Booked', 'Qualified'].map(l => (
                  <div key={l} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text3)' }}>—</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)', background: 'rgba(34,211,160,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                ⚡ Live call data sync coming soon
              </div>
            </div>
          )}
        </section>

        {/* Gravity Forms Section */}
        <section>
          <SectionTitle icon="📋" title="Gravity Forms" style={{ marginBottom: 14 }} />
          {!gravity?.connected ? (
            <NotIntegratedCard
              icon="📋"
              title="Not integrated yet"
              description="Connect Gravity Forms to track submissions, completion rates, and abandonment across your WordPress forms."
              features={['Form Submissions', 'Completion Rate', 'Abandonment']}
              color="#9f7aea"
              onSetup={() => selectedProject && onViewSite(selectedProject)}
              compact
            />
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9f7aea' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#9f7aea' }}>Gravity Forms Connected</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>WordPress URL</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{gravity.site_url || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['Submissions', 'Completion', 'Abandonment'].map(l => (
                  <div key={l} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text3)' }}>—</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)', background: 'rgba(159,122,234,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                ⚡ Live submission data sync coming soon
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Your Websites grid ── */}
      {projects.length > 1 && (
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>All Websites</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {projects.map(p => {
              const intCount = Object.keys(p.integrations || {}).filter(k => (p.integrations as any)[k]?.connected).length
              const initials = (p.name || p.domain).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              const isActive = p.id === selectedId
              return (
                <div key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{ background: isActive ? 'rgba(91,127,255,0.06)' : 'var(--bg2)', border: `1px solid ${isActive ? '#5b7fff' : 'var(--border)'}`, borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.borderColor = '#5b7fff80'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' } }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: isActive ? 'rgba(91,127,255,0.2)' : 'linear-gradient(135deg,rgba(91,127,255,0.15),rgba(159,122,234,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#5b7fff', flexShrink: 0 }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.domain}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: intCount > 0 ? '#22d3a0' : 'var(--text3)', fontWeight: 600 }}>{intCount} of 4 connected</span>
                    <span style={{ fontSize: 11, color: isActive ? '#5b7fff' : 'var(--text3)', fontWeight: 600 }}>{isActive ? '● Viewing' : 'View →'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ icon, title, style }: { icon: string; title: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
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

function NotIntegratedCard({ icon, title, description, features, color, onSetup, compact }: {
  icon: string; title: string; description: string; features: string[]; color: string; onSetup: () => void; compact?: boolean
}) {
  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${color}30`, borderRadius: 12, padding: compact ? 20 : 32, textAlign: 'center' }}>
      {!compact && <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: compact ? 13 : 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 14, maxWidth: 360, margin: compact ? '0 auto 14px' : '0 0 14px' }}>{description}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {features.map(f => (
          <span key={f} style={{ fontSize: 10, padding: '2px 9px', background: `${color}14`, color, borderRadius: 20, fontWeight: 600 }}>{f}</span>
        ))}
      </div>
      <button onClick={onSetup}
        style={{ padding: '7px 16px', background: color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: 0.9 }}>
        Set Up Integration →
      </button>
    </div>
  )
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 12, marginBottom: 16, color: 'var(--text3)', fontSize: 13 }}>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      {label}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#f56565', marginBottom: 16 }}>
      ⚠️ {msg}
    </div>
  )
}
