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
  { id: 'dashboard', label: 'Overview', group: 'Main', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'sites', label: 'All Websites', group: 'Main', icon: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18' },
  { id: 'gsc', label: 'Search Console', group: 'Platforms', icon: 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6-6' },
  { id: 'ga4', label: 'GA4 Analytics', group: 'Platforms', icon: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6' },
  { id: 'ghl', label: 'GHL AI Leads', group: 'Platforms', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'gravity', label: 'Gravity Forms', group: 'Platforms', icon: 'M3 5h18M3 12h18M3 19h18' },
  { id: 'presentation', label: 'Presentation', group: 'Tools', icon: 'M2 3h20v14H2zM8 21h8M12 17v4' },
  { id: 'settings', label: 'Settings', group: 'Tools', icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4' },
]

export default function Sidebar({ page, navTo, sidebarOpen, projectCount, onAddSite, theme }: Props) {
  const dark = theme === 'dark'
  const groups = ['Main', 'Platforms', 'Tools']
  const bg = dark ? '#13161e' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const text2 = dark ? '#8c95ad' : '#4a5068'
  const text3 = dark ? '#50586e' : '#8c95ad'
  const hoverBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const activeBg = 'rgba(91,127,255,0.12)'

  return (
    <aside style={{
      width: 230, minWidth: 230, background: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
      transform: sidebarOpen ? 'translateX(0)' : undefined,
      transition: 'transform 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h3l3-8 4 16 3-8 2 4h3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 700, color: dark ? '#fff' : '#0d0f14', letterSpacing: '0.02em' }}>
            Nex<span style={{ color: '#5b7fff' }}>Gen</span>
          </div>
          <div style={{ fontSize: 9.5, color: text3, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Analytics Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {groups.map(group => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: text3, padding: '0 8px', marginBottom: 3 }}>{group}</div>
            {NAV.filter(n => n.group === group).map(item => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navTo(item.id as PageName)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    color: active ? '#5b7fff' : text2,
                    background: active ? activeBg : 'none',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s', position: 'relative',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = hoverBg }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                >
                  {active && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 2.5, background: '#5b7fff', borderRadius: 2 }} />}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }}>
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item.label}
                  {item.id === 'sites' && (
                    <span style={{ marginLeft: 'auto', background: active ? 'rgba(91,127,255,0.2)' : dark ? '#222737' : '#e8eaf2', color: active ? '#5b7fff' : text3, fontSize: 10, padding: '1px 7px', borderRadius: 10 }}>{projectCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Add site */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${border}` }}>
        <button
          onClick={onAddSite}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: 9, borderRadius: 8, background: '#5b7fff', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Add New Website
        </button>
      </div>
    </aside>
  )
}
