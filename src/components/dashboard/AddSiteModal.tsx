'use client'
import { useState } from 'react'
import { Project } from '@/types'

interface Props { onClose: () => void; onAdded: (p: Project) => void }

export default function AddSiteModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({ name: '', domain: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.name || !form.domain) { setError('Name and domain are required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create'); return }
      onAdded(data.project)
    } catch (e) { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, width: 480, maxWidth: 'calc(100vw - 24px)', boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: '#e4e7f0' }}>Add New Website</div>
          <button onClick={onClose} style={{ width: 26, height: 26, background: '#1a1e28', borderRadius: 6, border: 'none', color: '#8c95ad', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: '#8c95ad', marginBottom: 18, lineHeight: 1.6 }}>
            Add a website to your NexGen workspace. You can connect Google Search Console, GA4, GHL and Gravity Forms in the site settings after adding.
          </p>
          {[{ key: 'name', label: 'Website Name', placeholder: 'e.g. My Agency Website' }, { key: 'domain', label: 'Domain', placeholder: 'e.g. mysite.com' }].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8c95ad', marginBottom: 5, display: 'block' }}>{f.label}</label>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '9px 12px', background: '#1a1e28', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#e4e7f0', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          ))}
          {error && <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f56565', marginTop: 8 }}>{error}</div>}
          <div style={{ padding: '14px 0 0', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#8c95ad', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', background: '#5b7fff', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Adding…' : 'Add Website'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
