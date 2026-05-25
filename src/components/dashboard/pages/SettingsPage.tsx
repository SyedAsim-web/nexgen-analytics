'use client'
import { useState } from 'react'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'

interface Props { session: Session }

export default function SettingsPage({ session }: Props) {
  const [theme, setTheme] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('nexgen_theme') || 'dark'
      : 'dark'
  )

  const toggleTheme = (t: string) => {
    setTheme(t)
    localStorage.setItem('nexgen_theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          👤 Profile
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0, background: '#5b7fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {session.user?.image
              ? <img src={session.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{session.user?.name?.[0] || '?'}</span>
            }
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{session.user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{session.user?.email}</div>
            <div style={{ fontSize: 11, color: '#22d3a0', fontWeight: 600, marginTop: 4 }}>● Signed in with Google</div>
          </div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          💡 Your profile is managed through your Google account. To update your name or photo, update your Google account at <a href="https://myaccount.google.com" target="_blank" style={{ color: '#5b7fff' }}>myaccount.google.com</a>
        </div>
      </div>

      {/* Appearance */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          🎨 Appearance
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Theme</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'dark', label: '🌙 Dark', desc: 'Easy on the eyes' },
            { id: 'light', label: '☀️ Light', desc: 'Clean and bright' },
          ].map(t => (
            <div
              key={t.id}
              onClick={() => toggleTheme(t.id)}
              style={{ flex: 1, padding: '14px 16px', background: theme === t.id ? 'rgba(91,127,255,0.12)' : 'var(--bg3)', border: `2px solid ${theme === t.id ? '#5b7fff' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected accounts */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          🔗 Connected Accounts
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Google Account</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{session.user?.email}</div>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: 'rgba(34,211,160,0.1)', color: '#22d3a0' }}>
            ✓ Connected
          </span>
        </div>
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Your Google account gives NexGen read-only access to Search Console and GA4 data. We never modify or post anything on your behalf.
        </div>
      </div>

      {/* Data & Privacy */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          🔒 Data & Privacy
        </div>
        {[
          { icon: '🔐', title: 'Data Security', desc: 'All your data is stored in Supabase with Row Level Security. Only you and your invited team members can access your projects.' },
          { icon: '👁️', title: 'Read-Only Access', desc: 'NexGen only reads your analytics data. It never writes, modifies or deletes anything in your Google Search Console or GA4.' },
          { icon: '🚫', title: 'No Data Selling', desc: 'Your analytics data is never shared with or sold to third parties. It exists solely to power your NexGen dashboard.' },
        ].map(item => (
          <div key={item.title} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Account actions */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          ⚙️ Account Actions
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 8, color: '#f56565', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.2)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.1)'}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
