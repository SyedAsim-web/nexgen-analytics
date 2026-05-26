'use client'
import { useState, useRef, useEffect } from 'react'
import { Session } from 'next-auth'
import { PageName } from './DashboardClient'

interface Props {
  session: Session
  page: PageName
  theme: string
  toggleTheme: () => void
  onHamburger: () => void
  onPresent: () => void
  onSignOut: () => void
  navTo: (p: PageName) => void
}

const PAGE_LABELS: Record<string, string> = {
  dashboard:    'Overview',
  sites:        'All Websites',
  'site-detail':'Site Settings',
  gsc:          'Search Console',
  ga4:          'GA4 Analytics',
  ghl:          'GHL AI Leads',
  gravity:      'Gravity Forms',
  presentation: 'Presentation Builder',
  settings:     'Settings',
  team:         'Team',
}

export default function Topbar({ session, page, theme, toggleTheme, onHamburger, onPresent, onSignOut, navTo }: Props) {
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const dark = theme === 'dark'
  const bg      = dark ? '#13161e' : '#ffffff'
  const border  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const inputBg = dark ? '#1a1e28' : '#f5f6fa'
  const text2   = dark ? '#8c95ad' : '#4a5068'
  const text3   = dark ? '#50586e' : '#8c95ad'
  const dropBg  = dark ? '#1a1e28' : '#ffffff'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = session.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div style={{
      height: 58, background: bg, borderBottom: `1px solid ${border}`,
      padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10,
      position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>

      {/* Hamburger (mobile) */}
      <button
        onClick={onHamburger}
        className="hamburger"
        style={{ display: 'none', padding: '6px', flexDirection: 'column', gap: 4.5, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 18, height: 1.5, background: dark ? '#e4e7f0' : '#0d0f14', display: 'block', borderRadius: 2 }} />
        ))}
      </button>

      {/* Breadcrumb / page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: text3 }}>NexGen</span>
        <svg width="12" height="12" fill="none" stroke={text3} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: dark ? '#e4e7f0' : '#0d0f14' }}>{PAGE_LABELS[page] || page}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${dark ? 'light' : 'dark'} mode`}
          style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: inputBg, border: `1px solid ${border}`, color: text2, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,127,255,0.4)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = border}
        >
          {dark ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>

        {/* Present button */}
        <button
          onClick={onPresent}
          className="btn-glow"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em', flexShrink: 0 }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Present
        </button>

        {/* User dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', background: dropOpen ? (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent', border: `1px solid ${dropOpen ? 'rgba(91,127,255,0.3)' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {/* Avatar */}
            <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid rgba(91,127,255,0.3)` }}>
              {session.user?.image
                ? <img src={session.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{initials}</span>}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dark ? '#e4e7f0' : '#0d0f14', lineHeight: 1.2 }}>
                {session.user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, color: text3, lineHeight: 1.2 }}>NexGen Analytics</div>
            </div>
            <svg width="12" height="12" fill="none" stroke={text3} strokeWidth="2" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div className="slide-down" style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              minWidth: 220, background: dropBg,
              border: `1px solid ${border}`,
              borderRadius: 12, boxShadow: 'var(--shadow-lg)',
              zIndex: 300, overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: dark ? '#e4e7f0' : '#0d0f14', marginBottom: 2 }}>{session.user?.name}</div>
                <div style={{ fontSize: 11, color: text3 }}>{session.user?.email}</div>
              </div>

              {/* Nav items */}
              {[
                { label: 'Settings', page: 'settings' as PageName, icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></> },
                { label: 'Team', page: 'team' as PageName, icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
              ].map(item => (
                <button key={item.page} onClick={() => { navTo(item.page); setDropOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: text2, fontSize: 13, textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>{item.icon}</svg>
                  {item.label}
                </button>
              ))}

              {/* Sign out */}
              <div style={{ padding: '6px 10px 10px' }}>
                <button onClick={() => { setDropOpen(false); onSignOut() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', background: 'rgba(245,101,101,0.06)', border: '1px solid rgba(245,101,101,0.15)', borderRadius: 8, cursor: 'pointer', color: '#f56565', fontSize: 12, fontWeight: 600, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.06)'}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
