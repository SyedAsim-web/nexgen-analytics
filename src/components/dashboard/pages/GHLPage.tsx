'use client'
import { useState } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

export default function GHLPage({ projects }: Props) {
  const ghlProjects = projects.filter(p => p.integrations?.ghl?.connected)
  const [selected, setSelected] = useState(ghlProjects[0]?.id || projects[0]?.id || '')
  const selectedProject = projects.find(p => p.id === selected)
  const isConnected = selectedProject?.integrations?.ghl?.connected

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>GHL AI Leads</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>GoHighLevel Voice AI call tracking and lead outcomes</p>
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
          icon="🤖"
          title="No websites added yet"
          description="Add a website first, then connect your GoHighLevel account to track AI voice calls, lead outcomes, and booked appointments."
          features={['AI Call Tracking', 'Lead Outcomes', 'Booked Appointments', 'Call Duration', 'Sentiment Analysis']}
          color="#22d3a0"
          ctaLabel={null}
        />
      )}

      {/* Selected site is connected */}
      {selectedProject && isConnected && (
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(34,211,160,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3a0' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22d3a0' }}>GHL Connected</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{selectedProject.name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>Location ID</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>{selectedProject.integrations.ghl!.location_id || '—'}</div>
              </div>
            </div>
          </div>

          {/* Placeholder metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Calls', color: '#22d3a0' },
              { label: 'Booked', color: '#5b7fff' },
              { label: 'Qualified', color: '#f0b429' },
              { label: 'No Answer', color: '#f56565' },
              { label: 'Avg Duration', color: '#9f7aea' },
              { label: 'AI Resolved', color: '#f97316' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text3)', lineHeight: 1 }}>—</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>GHL Data Sync Coming Soon</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                Your GoHighLevel account is connected. Live call data, outcomes, lead scores, and AI resolution rates will appear here in the next update. Make sure your GHL API key has read access to call recordings and contacts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected site is NOT connected */}
      {selectedProject && !isConnected && (
        <NotIntegratedCard
          icon="🤖"
          title="GHL Voice AI not connected"
          description={`Connect GoHighLevel to ${selectedProject.name} to track AI voice calls, monitor lead outcomes, and measure booked appointments — all in one place.`}
          features={['AI Call Tracking', 'Lead Outcomes', 'Booked Appointments', 'Call Duration', 'Sentiment Analysis', 'AI Resolution Rate']}
          color="#22d3a0"
          ctaLabel="Set Up GHL in Site Settings →"
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
          Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> to connect GHL.
        </p>
      )}
    </div>
  )
}
