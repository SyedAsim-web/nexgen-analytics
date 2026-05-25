'use client'
import { useState, useEffect, useRef } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props {
  project: Project | null
  projects: Project[]
  session: Session
  onSelectProject: (p: Project) => void
}

function fmtN(n: number) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}

const SLIDE_W = 900
const SLIDE_H = 506 // 16:9

export default function PresentationPage({ project, projects, session, onSelectProject }: Props) {
  const [selectedId, setSelectedId] = useState(project?.id || projects[0]?.id || '')
  const [days, setDays] = useState(28)
  const [sections, setSections] = useState({ ga4: true, gsc: true, ghl: true, gravity: true })
  const [ga4Data, setGa4Data] = useState<any>(null)
  const [gscData, setGscData] = useState<any>(null)
  const [ghlData, setGhlData] = useState<any>(null)
  const [gravityData, setGravityData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [presenting, setPresenting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const selectedProject = projects.find(p => p.id === selectedId) || null

  useEffect(() => {
    if (!selectedId) return
    const p = projects.find(x => x.id === selectedId)
    if (p) onSelectProject(p)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedProject) return
    fetchAll(selectedProject)
  }, [selectedId, days]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async (p: Project) => {
    setLoading(true)
    setGa4Data(null); setGscData(null); setGhlData(null); setGravityData(null)

    const fetches: Promise<void>[] = []

    if (p.integrations?.ga4?.connected && p.integrations.ga4.property_id) {
      fetches.push(
        fetch(`/api/ga4?propertyId=${encodeURIComponent(p.integrations.ga4.property_id)}&days=${days}`)
          .then(r => r.json()).then(j => { if (!j.error) setGa4Data(j) }).catch(() => {})
      )
    }
    if (p.integrations?.gsc?.connected && p.integrations.gsc.property_url) {
      fetches.push(
        fetch(`/api/gsc?siteUrl=${encodeURIComponent(p.integrations.gsc.property_url)}`)
          .then(r => r.json()).then(j => { if (!j.error) setGscData(j) }).catch(() => {})
      )
    }
    if (p.integrations?.ghl?.connected && p.integrations.ghl.location_id && p.integrations.ghl.api_key) {
      fetches.push(
        fetch(`/api/ghl?locationId=${encodeURIComponent(p.integrations.ghl.location_id)}&apiKey=${encodeURIComponent(p.integrations.ghl.api_key)}`)
          .then(r => r.json()).then(j => { if (!j.error) setGhlData(j) }).catch(() => {})
      )
    }
    if (p.integrations?.gravity?.connected && p.integrations.gravity.site_url && p.integrations.gravity.consumer_key) {
      const params = new URLSearchParams({
        siteUrl: p.integrations.gravity.site_url,
        consumerKey: p.integrations.gravity.consumer_key!,
        consumerSecret: p.integrations.gravity.consumer_secret || '',
      })
      fetches.push(
        fetch(`/api/gravity?${params}`)
          .then(r => r.json()).then(j => { if (!j.error) setGravityData(j) }).catch(() => {})
      )
    }

    await Promise.all(fetches)
    setLoading(false)
    setActiveSlide(0)
  }

  // Build slide list
  const slides: { id: string; label: string }[] = [{ id: 'cover', label: 'Cover' }]
  if (sections.ga4 && ga4Data) slides.push({ id: 'ga4', label: 'GA4 Analytics' })
  if (sections.gsc && gscData) slides.push({ id: 'gsc', label: 'Search Console' })
  if (sections.ghl && ghlData) slides.push({ id: 'ghl', label: 'GHL Leads' })
  if (sections.gravity && gravityData) slides.push({ id: 'gravity', label: 'Gravity Forms' })
  slides.push({ id: 'summary', label: 'Summary' })

  const handlePrint = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Presentation Builder
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Generate a client-ready report from your live analytics data
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#5b7fff', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left config panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Site selector */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>Website</div>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
            </select>
          </div>

          {/* Date range */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>Date Range</div>
            <select value={days} onChange={e => setDays(parseInt(e.target.value))}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {/* Sections */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Include Sections</div>
            {[
              { key: 'ga4', label: 'GA4 Analytics', icon: '📈', avail: !!selectedProject?.integrations?.ga4?.connected },
              { key: 'gsc', label: 'Search Console', icon: '🔍', avail: !!selectedProject?.integrations?.gsc?.connected },
              { key: 'ghl', label: 'GHL AI Leads', icon: '🤖', avail: !!selectedProject?.integrations?.ghl?.connected },
              { key: 'gravity', label: 'Gravity Forms', icon: '📋', avail: !!selectedProject?.integrations?.gravity?.connected },
            ].map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, color: s.avail ? 'var(--text2)' : 'var(--text3)' }}>{s.label}</span>
                  {!s.avail && <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>N/A</span>}
                </div>
                <div
                  onClick={() => s.avail && setSections(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof prev] }))}
                  style={{
                    width: 32, height: 18, borderRadius: 9, cursor: s.avail ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
                    background: s.avail && sections[s.key as keyof typeof sections] ? '#5b7fff' : 'rgba(255,255,255,0.1)',
                    position: 'relative', flexShrink: 0,
                  }}>
                  <div style={{
                    position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    left: s.avail && sections[s.key as keyof typeof sections] ? 16 : 2,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Slide list */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Slides</div>
            {slides.map((s, i) => (
              <div key={s.id} onClick={() => setActiveSlide(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: activeSlide === i ? 'rgba(91,127,255,0.12)' : 'transparent',
                  border: activeSlide === i ? '1px solid rgba(91,127,255,0.3)' : '1px solid transparent',
                }}>
                <span style={{ fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: 4, background: activeSlide === i ? '#5b7fff' : 'var(--bg3)', color: activeSlide === i ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: activeSlide === i ? '#5b7fff' : 'var(--text2)', fontWeight: activeSlide === i ? 600 : 400 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={() => selectedProject && fetchAll(selectedProject)} disabled={loading}
            style={{ padding: '9px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading ? (
              <><div style={{ width: 12, height: 12, border: '2px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Loading data…</>
            ) : (
              <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/></svg>Refresh Data</>
            )}
          </button>
        </div>

        {/* ── Slide preview area ── */}
        <div>
          {/* Slide viewer */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            {/* Toolbar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0}
                  style={{ padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, cursor: 'pointer', opacity: activeSlide === 0 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeSlide + 1} / {slides.length}</span>
                <button onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1}
                  style={{ padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, cursor: 'pointer', opacity: activeSlide === slides.length - 1 ? 0.4 : 1 }}>Next →</button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{slides[activeSlide]?.label}</span>
            </div>

            {/* Slide canvas */}
            <div style={{ padding: 24, background: 'var(--bg3)', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: SLIDE_W, aspectRatio: '16/9', position: 'relative' }}>
                {loading ? (
                  <div style={{ ...slideBase, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(91,127,255,0.2)', borderTopColor: '#5b7fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Fetching live data…</div>
                  </div>
                ) : (
                  <SlideRenderer
                    slideId={slides[activeSlide]?.id}
                    project={selectedProject}
                    ga4Data={ga4Data}
                    gscData={gscData}
                    ghlData={ghlData}
                    gravityData={gravityData}
                    days={days}
                    today={today}
                    session={session}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Slide strip */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {slides.map((s, i) => (
              <div key={s.id} onClick={() => setActiveSlide(i)}
                style={{ flexShrink: 0, width: 130, cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                  border: `2px solid ${activeSlide === i ? '#5b7fff' : 'var(--border)'}`,
                  opacity: activeSlide === i ? 1 : 0.65, transition: 'all 0.15s' }}>
                <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg,#0f111a,#1a1d2e)', padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{i + 1}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print stylesheet */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden !important; }
          .print-slide, .print-slide * { visibility: visible !important; }
          .print-slide { position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; page-break-after: always; }
        }
      `}</style>
    </div>
  )
}

const slideBase: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #0f111a 0%, #1a1d2e 100%)',
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
  color: '#fff',
}

function StatBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 800, color, lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SlideHeader({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{subtitle}</div>
      </div>
    </div>
  )
}

function SlideRenderer({ slideId, project, ga4Data, gscData, ghlData, gravityData, days, today, session }: {
  slideId: string; project: Project | null; ga4Data: any; gscData: any; ghlData: any; gravityData: any; days: number; today: string; session: Session
}) {
  const name = project?.name || project?.domain || 'Your Website'
  const domain = project?.domain || ''

  if (slideId === 'cover') return (
    <div style={{ ...slideBase }}>
      {/* Gradient orbs */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,127,255,0.2) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,160,0.15) 0%, transparent 70%)' }} />
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5b7fff', marginBottom: 16 }}>Analytics Report</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 12, maxWidth: 480 }}>{name}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>{domain}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ga4Data && { label: 'GA4 Analytics', color: '#f97316' },
            gscData && { label: 'Search Console', color: '#5b7fff' },
            ghlData && { label: 'GHL AI Leads', color: '#22d3a0' },
            gravityData && { label: 'Gravity Forms', color: '#9f7aea' },
          ].filter(Boolean).map((t: any) => (
            <span key={t.label} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}>{t.label}</span>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 28, right: 40, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Prepared by</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{session.user?.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{today}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5b7fff, #9f7aea, #22d3a0)' }} />
      </div>
    </div>
  )

  if (slideId === 'ga4' && ga4Data) return (
    <div style={{ ...slideBase, padding: '28px 36px' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />
      <SlideHeader icon="📈" title="Google Analytics 4" subtitle={`Last ${days} days · ${name}`} color="#f97316" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <StatBox label="Sessions" value={fmtN(ga4Data.summary.sessions)} color="#f97316" />
        <StatBox label="Users" value={fmtN(ga4Data.summary.users)} color="#f0b429" />
        <StatBox label="New Users" value={fmtN(ga4Data.summary.newUsers)} color="#22d3a0" />
        <StatBox label="Bounce Rate" value={ga4Data.summary.bounceRate + '%'} color="#f56565" />
        <StatBox label="Conversions" value={fmtN(ga4Data.summary.conversions)} color="#9f7aea" />
        <StatBox label="Conv. Rate" value={ga4Data.summary.convRate + '%'} color="#5b7fff" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Device Breakdown</div>
          {(() => {
            const total = ga4Data.devices.reduce((a: number, x: any) => a + x.sessions, 0)
            const colors = ['#5b7fff', '#22d3a0', '#f97316']
            return ga4Data.devices.map((d: any, i: number) => {
              const pct = total > 0 ? Math.round(d.sessions / total * 100) : 0
              return (
                <div key={d.device} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{d.device}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: colors[i % colors.length] }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: colors[i % colors.length] }} />
                  </div>
                </div>
              )
            })
          })()}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Top Countries</div>
          {ga4Data.countries.slice(0, 5).map((c: any) => (
            <div key={c.country} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{c.country}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316' }}>{c.sessions.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#f97316' }} />
    </div>
  )

  if (slideId === 'gsc' && gscData) return (
    <div style={{ ...slideBase, padding: '28px 36px' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,127,255,0.12) 0%, transparent 70%)' }} />
      <SlideHeader icon="🔍" title="Google Search Console" subtitle={`Last 28 days · ${name}`} color="#5b7fff" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <StatBox label="Total Clicks" value={fmtN(gscData.summary.clicks)} color="#5b7fff" />
        <StatBox label="Impressions" value={fmtN(gscData.summary.impressions)} color="#f0b429" />
        <StatBox label="Avg. CTR" value={gscData.summary.ctr + '%'} color="#22d3a0" />
        <StatBox label="Avg. Position" value={String(gscData.summary.position)} color="#f97316" />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '7px 14px', background: 'rgba(255,255,255,0.04)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', gap: 12 }}>
          <span>Query</span><span>Clicks</span><span>Impressions</span><span>CTR</span>
        </div>
        {gscData.queries.slice(0, 7).map((q: any, i: number) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11, gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
            <span style={{ color: '#5b7fff', fontWeight: 700, textAlign: 'right' }}>{q.clicks}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{q.impressions.toLocaleString()}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: q.ctr > 3 ? 'rgba(34,211,160,0.15)' : 'rgba(240,180,41,0.15)', color: q.ctr > 3 ? '#22d3a0' : '#f0b429', textAlign: 'center' }}>{q.ctr}%</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#5b7fff' }} />
    </div>
  )

  if (slideId === 'ghl' && ghlData) return (
    <div style={{ ...slideBase, padding: '28px 36px' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,160,0.12) 0%, transparent 70%)' }} />
      <SlideHeader icon="🤖" title="GHL AI Leads" subtitle={`Voice AI & Lead Pipeline · ${name}`} color="#22d3a0" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <StatBox label="Total Contacts" value={fmtN(ghlData.summary.totalContacts)} color="#22d3a0" />
        <StatBox label="Conversations" value={fmtN(ghlData.summary.totalConversations)} color="#5b7fff" />
        <StatBox label="Voice Calls" value={fmtN(ghlData.summary.totalCalls)} color="#f0b429" />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Lead Pipeline</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { label: 'New', value: ghlData.pipeline.new, color: '#5b7fff' },
            { label: 'Contacted', value: ghlData.pipeline.contacted, color: '#f0b429' },
            { label: 'Qualified', value: ghlData.pipeline.qualified, color: '#2dd4bf' },
            { label: 'Booked', value: ghlData.pipeline.booked, color: '#22d3a0' },
            { label: 'Lost', value: ghlData.pipeline.lost, color: '#f56565' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, borderBottom: `3px solid ${s.color}` }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatBox label="Open Deals" value={String(ghlData.summary.openOpportunities)} color="#9f7aea" />
        <StatBox label="Won Deals" value={String(ghlData.summary.wonOpportunities)} color="#22d3a0" />
        <StatBox label="Total Deals" value={String(ghlData.summary.totalOpportunities)} color="#f97316" />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#22d3a0' }} />
    </div>
  )

  if (slideId === 'gravity' && gravityData) return (
    <div style={{ ...slideBase, padding: '28px 36px' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,122,234,0.12) 0%, transparent 70%)' }} />
      <SlideHeader icon="📋" title="Gravity Forms" subtitle={`Form Submissions · ${name}`} color="#9f7aea" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <StatBox label="Total Submissions" value={String(gravityData.summary.totalSubmissions)} color="#9f7aea" />
        <StatBox label="Active Forms" value={String(gravityData.summary.activeForms)} color="#22d3a0" />
        <StatBox label="Spam Entries" value={String(gravityData.summary.statusCounts?.spam ?? 0)} color="#f0b429" />
        <StatBox label="Trash Entries" value={String(gravityData.summary.statusCounts?.trash ?? 0)} color="#f56565" />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '7px 14px', background: 'rgba(255,255,255,0.04)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', gap: 12 }}>
          <span>Form Name</span><span>Submissions</span><span>Status</span>
        </div>
        {gravityData.forms.slice(0, 5).map((form: any) => (
          <div key={form.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11, gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title}</span>
            <span style={{ color: '#9f7aea', fontWeight: 700, textAlign: 'right' }}>{form.total_count}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: form.is_active ? 'rgba(34,211,160,0.15)' : 'rgba(245,101,101,0.15)', color: form.is_active ? '#22d3a0' : '#f56565', textAlign: 'center' }}>
              {form.is_active ? '● Active' : '● Inactive'}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#9f7aea' }} />
    </div>
  )

  if (slideId === 'summary') return (
    <div style={{ ...slideBase, padding: '28px 36px' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,127,255,0.15) 0%, transparent 70%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Summary</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Key performance highlights for {name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ga4Data && (
            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>📈 GA4 Analytics</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                {fmtN(ga4Data.summary.sessions)} sessions · {fmtN(ga4Data.summary.users)} users<br />
                {ga4Data.summary.bounceRate}% bounce · {ga4Data.summary.convRate}% conversion
              </div>
            </div>
          )}
          {gscData && (
            <div style={{ background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5b7fff', marginBottom: 8 }}>🔍 Search Console</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                {fmtN(gscData.summary.clicks)} clicks · {fmtN(gscData.summary.impressions)} impressions<br />
                {gscData.summary.ctr}% CTR · avg. position {gscData.summary.position}
              </div>
            </div>
          )}
          {ghlData && (
            <div style={{ background: 'rgba(34,211,160,0.08)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3a0', marginBottom: 8 }}>🤖 GHL AI Leads</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                {fmtN(ghlData.summary.totalContacts)} contacts · {fmtN(ghlData.summary.totalCalls)} calls<br />
                {ghlData.summary.wonOpportunities} deals won · {ghlData.summary.openOpportunities} open
              </div>
            </div>
          )}
          {gravityData && (
            <div style={{ background: 'rgba(159,122,234,0.08)', border: '1px solid rgba(159,122,234,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9f7aea', marginBottom: 8 }}>📋 Gravity Forms</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                {gravityData.summary.totalSubmissions} total submissions<br />
                {gravityData.summary.activeForms} active forms · {gravityData.summary.statusCounts?.spam ?? 0} spam
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: -180, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          Generated by NexGen Analytics · {today}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5b7fff, #9f7aea, #22d3a0)' }} />
    </div>
  )

  return (
    <div style={{ ...slideBase, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 32 }}>📭</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No data available for this slide</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Connect the integration or toggle it on in the sidebar</div>
    </div>
  )
}
