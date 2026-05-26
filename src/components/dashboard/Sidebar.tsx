'use client'
import { PageName } from './DashboardClient'

interface Props {
  page: PageName
  navTo: (p: PageName) => void
  sidebarOpen: boolean
  projectCount: number
  onAddSite: () => void
  theme: string
}

const NAV = [
  {
    group: 'Main',
    items: [
      { id: 'dashboard',     label: 'Overview',        icon: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></> },
      { id: 'sites',         label: 'All Websites',    icon: <><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/></> },
      { id: 'team',          label: 'Team',            icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
    ],
  },
  {
    group: 'Platforms',
    items: [
      { id: 'gsc',     label: 'Search Console', icon: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></> },
      { id: 'ga4',     label: 'GA4 Analytics',  icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></> },
      { id: 'ghl',     label: 'GHL AI Leads',   icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></> },
      { id: 'gravity', label: 'Gravity Forms',  icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
    ],
  },
  {
    group: 'Tools',
    items: [
      { id: 'presentation', label: 'Presentations',  icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></> },
      { id: 'settings',     label: 'Settings',       icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
    ],
  },
]

function Icon({ d, size = 15 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d}
    </svg>
  )
}

export default function Sidebar({ page, navTo, sidebarOpen, projectCount, onAddSite, theme }: Props) {
  const dark = theme === 'dark'
  const bg = dark ? '#13161e' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const text2 = dark ? '#8c95ad' : '#4a5068'
  const text3 = dark ? '#50586e' : '#8c95ad'
  const hoverBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  return (
    <aside style={{
      width: 232, minWidth: 232, background: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
      transform: sidebarOpen ? 'translateX(0)' : undefined,
      transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '16px 14px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#5b7fff 0%,#9f7aea 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(91,127,255,0.35)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h3l3-8 4 16 3-8 2 4h3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 800, color: dark ? '#fff' : '#0d0f14', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Nex<span style={{ color: '#5b7fff' }}>Gen</span>
          </div>
          <div style={{ fontSize: 9, color: text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Analytics Platform</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: text3, padding: '0 8px', marginBottom: 4 }}>
              {group.group}
            </div>
            {group.items.map(item => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navTo(item.id as PageName)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '8px 10px', borderRadius: 9,
                    color: active ? '#5b7fff' : text2,
                    background: active ? 'rgba(91,127,255,0.1)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = hoverBg }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  {active && (
                    <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, background: '#5b7fff', borderRadius: 4 }} />
                  )}
                  <span style={{ opacity: active ? 1 : 0.6, transition: 'opacity 0.15s' }}>
                    <Icon d={item.icon} />
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.id === 'sites' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                      background: active ? 'rgba(91,127,255,0.2)' : (dark ? '#222737' : '#e8eaf2'),
                      color: active ? '#5b7fff' : text3,
                      transition: 'all 0.15s',
                    }}>{projectCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Plan badge ── */}
      <div style={{ padding: '10px 10px 6px', borderTop: `1px solid ${border}` }}>
        <div style={{ background: dark ? 'rgba(91,127,255,0.06)' : 'rgba(91,127,255,0.04)', border: `1px solid rgba(91,127,255,0.15)`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a0', boxShadow: '0 0 6px rgba(34,211,160,0.6)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#e4e7f0' : '#0d0f14' }}>Free Plan</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(91,127,255,0.15)', color: '#5b7fff', letterSpacing: '0.05em' }}>BETA</span>
          </div>
          <div style={{ fontSize: 10, color: text3, marginBottom: 7, lineHeight: 1.5 }}>
            {projectCount}/3 sites used
          </div>
          <div style={{ height: 3, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#5b7fff,#9f7aea)', width: `${Math.min(100, (projectCount / 3) * 100)}%`, transition: 'width 0.6s ease' }} />
          </div>
          <button
            style={{ width: '100%', padding: '5px 0', borderRadius: 6, background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.03em', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            Upgrade to Pro →
          </button>
        </div>

        {/* Add site button */}
        <button
          onClick={onAddSite}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '8px', borderRadius: 8, background: dark ? 'rgba(91,127,255,0.12)' : 'rgba(91,127,255,0.08)', color: '#5b7fff', fontSize: 12, fontWeight: 600, border: `1px solid rgba(91,127,255,0.25)`, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,127,255,0.18)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(91,127,255,0.12)' : 'rgba(91,127,255,0.08)' }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add New Website
        </button>
      </div>
    </aside>
  )
}
