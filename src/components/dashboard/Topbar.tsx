'use client'
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
}

export default function Topbar({ session, theme, toggleTheme, onHamburger, onPresent, onSignOut }: Props) {
  const dark = theme === 'dark'
  const bg = dark ? '#13161e' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const inputBg = dark ? '#1a1e28' : '#f5f6fa'
  const text2 = dark ? '#8c95ad' : '#4a5068'
  const text3 = dark ? '#50586e' : '#8c95ad'

  return (
    <div style={{ height: 58, background: bg, borderBottom: `1px solid ${border}`, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Hamburger */}
      <button onClick={onHamburger} style={{ display: 'none', padding: 4, flexDirection: 'column', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }} className="hamburger">
        {[0,1,2].map(i => <span key={i} style={{ width: 18, height: 1.5, background: dark ? '#e4e7f0' : '#0d0f14', display: 'block', borderRadius: 2 }} />)}
      </button>

      {/* Search placeholder */}
      <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: text3, pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4" strokeLinecap="round"/></svg>
        <input placeholder="Search websites…" style={{ width: '100%', padding: '7px 12px 7px 32px', background: inputBg, border: `1px solid ${border}`, borderRadius: 8, color: dark ? '#e4e7f0' : '#0d0f14', fontSize: 12.5, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} title="Toggle theme" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: inputBg, border: `1px solid ${border}`, color: text2, cursor: 'pointer' }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {dark
              ? <circle cx="12" cy="12" r="4"/> 
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
        </button>

        {/* Present */}
        <button onClick={onPresent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>
          Present
        </button>

        {/* User avatar + sign out */}
        <div style={{ position: 'relative' }}>
          <button
            title="Sign out"
            onClick={onSignOut}
            style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${border}`, cursor: 'pointer', background: '#5b7fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {session.user?.image
              ? <img src={session.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{session.user?.name?.[0] || '?'}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
