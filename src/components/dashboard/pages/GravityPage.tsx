'use client'
import { useState } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

export default function GravityPage({ projects }: Props) {
  const gravityProjects = projects.filter(p => p.integrations?.gravity?.connected)
  const [selected, setSelected] = useState(gravityProjects[0]?.id || projects[0]?.id || '')
  const selectedProject = projects.find(p => p.id === selected)
  const isConnected = selectedProject?.integrations?.gravity?.connected

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Gravity Forms</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>WordPress form submission tracking and analytics</p>
        </div>
        {projects.length > 0 && (
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        )}
      </div>

      {/* No projects at all */}
      {projects.length === 0 && (
        <NotIntegratedCard
          icon="📋"
          title="No websites added yet"
          description="Add a website first, then connect Gravity Forms to track submissions, completion rates, and abandonment across all your WordPress forms."
          features={['Form Submissions', 'Completion Rate', 'Abandonment Rate', 'Top Forms', 'Submission Timeline']}
          color="#9f7aea"
          ctaLabel={null}
        />
      )}

      {/* Selected site is connected */}
      {selectedProject && isConnected && (
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9f7aea' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9f7aea' }}>Gravity Forms Connected</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{selectedProject.name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>WordPress URL</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{selectedProject.integrations.gravity!.site_url || '—'}</div>
              </div>
            </div>
          </div>

          {/* Placeholder metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Submissions', color: '#9f7aea' },
              { label: 'This Week', color: '#5b7fff' },
              { label: 'Completion Rate', color: '#22d3a0' },
              { label: 'Abandonment', color: '#f56565' },
              { label: 'Top Form', color: '#f0b429' },
              { label: 'Avg per Day', color: '#f97316' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text3)', lineHeight: 1 }}>—</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(159,122,234,0.06)', border: '1px solid rgba(159,122,234,0.2)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Gravity Forms Data Sync Coming Soon</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                Your Gravity Forms API is connected. Submission counts, completion rates, top-performing forms, and abandonment data will appear here in the next update. Make sure your WordPress REST API key has read access to form entries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected site is NOT connected */}
      {selectedProject && !isConnected && (
        <NotIntegratedCard
          icon="📋"
          title="Gravity Forms not connected"
          description={`Connect Gravity Forms to ${selectedProject.name} to track form submissions, measure completion rates, and identify drop-off points across all your WordPress forms.`}
          features={['Form Submissions', 'Completion Rate', 'Abandonment Rate', 'Top Forms', 'Submission Timeline', 'Entry Details']}
          color="#9f7aea"
          ctaLabel="Set Up Gravity Forms in Site Settings →"
        />
      )}
    </div>
  )
}

function NotIntegratedCard({ icon, title, description, features, color, ctaLabel }: {
  icon: string; title: string; description: string; features: string[]; color: string; ctaLabel: string | null
}) {
  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${color}33`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{title}</div>
      <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 20px' }}>{description}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: ctaLabel ? 24 : 0 }}>
        {features.map(f => (
          <span key={f} style={{ fontSize: 11, padding: '3px 10px', background: `${color}14`, color, borderRadius: 20, fontWeight: 600 }}>{f}</span>
        ))}
      </div>
      {ctaLabel && (
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
          Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> to connect Gravity Forms.
        </p>
      )}
    </div>
  )
}
