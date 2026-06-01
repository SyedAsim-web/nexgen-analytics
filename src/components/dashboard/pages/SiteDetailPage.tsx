'use client'
import { useState } from 'react'
import { Session } from 'next-auth'
import { Project } from '@/types'

interface Props { project: Project; session: Session; onBack: () => void; onPresent: () => void; onRefresh: () => void; onDelete: () => void }
type Tab = 'overview' | 'integrations' | 'team'

export default function SiteDetailPage({ project, session, onBack, onPresent, onRefresh, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/sites/${project.id}`, { method: 'DELETE' })
      onDelete()
    } finally {
      setDeleting(false)
    }
  }
  const [integForm, setIntegForm] = useState({
    gsc_property: project.integrations?.gsc?.property_url || '',
    ga4_property_id: project.integrations?.ga4?.property_id || '',
    ga4_measurement_id: project.integrations?.ga4?.measurement_id || '',
    ghl_location: project.integrations?.ghl?.location_id || '',
    ghl_key: project.integrations?.ghl?.api_key || '',
    wp_url: project.integrations?.gravity?.site_url || '',
    wp_key: project.integrations?.gravity?.api_key || '',
    wp_ck: project.integrations?.gravity?.consumer_key || '',
    wp_cs: project.integrations?.gravity?.consumer_secret || '',
    semrush_key: project.integrations?.semrush?.api_key || '',
    semrush_db: project.integrations?.semrush?.database || 'us',
  })
  const [teamEmail, setTeamEmail] = useState('')
  const [teamRole, setTeamRole] = useState('viewer')
  const [teamMsg, setTeamMsg] = useState('')

const saveIntegration = async (platform: string, config: any) => {
    setSaving(platform)
    try {
      const res = await fetch('/api/integrations', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, platform, config }),
      })
      const data = await res.json()
      if (res.ok) {
        project.integrations = data.integrations
        onRefresh()
        setSaving('')
      }
    } catch (e) {} finally { setSaving('') }
  }

  const inviteTeam = async () => {
    if (!teamEmail) return
    setTeamMsg('')
    try {
      const res = await fetch(`/api/sites/${project.id}/collaborators`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teamEmail, role: teamRole }),
      })
      const data = await res.json()
      setTeamMsg(data.message || 'Invitation sent!')
      setTeamEmail('')
    } catch (e) { setTeamMsg('Failed to send invitation') }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'integrations', label: '🔗 Integrations' },
    { id: 'team', label: '👥 Team' },
  ]

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text2)', marginBottom: 16, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round"/></svg>
        All Websites
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{project.name}</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)' }}>{project.domain}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPresent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Present This Site
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 15, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--text)' : 'var(--text3)', background: tab === t.id ? 'var(--bg2)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          {/* Integration status cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { key: 'gsc', label: 'Search Console', icon: '🔍', color: '#5b7fff' },
              { key: 'ga4', label: 'GA4 Analytics', icon: '📈', color: '#f97316' },
              { key: 'ghl', label: 'GHL Voice AI', icon: '🤖', color: '#22d3a0' },
              { key: 'gravity', label: 'Gravity Forms', icon: '📋', color: '#9f7aea' },
              { key: 'semrush', label: 'SEMrush', icon: '📊', color: '#ff6d3b' },
            ].map(int => {
              const connected = (project.integrations as any)?.[int.key]?.connected
              const lastSync = (project.integrations as any)?.[int.key]?.last_sync
              return (
                <div key={int.key} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: int.color }} />
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{int.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{int.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22d3a0' : 'var(--text3)' }} />
                    <span style={{ color: connected ? '#22d3a0' : 'var(--text3)', fontWeight: 600 }}>{connected ? 'Connected' : 'Not connected'}</span>
                  </div>
                  {lastSync && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Last sync: {new Date(lastSync).toLocaleDateString()}</div>}
                </div>
              )
            })}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Getting Started</div>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>
              To see real analytics data, go to the <strong style={{ color: 'var(--text)' }}>Integrations</strong> tab and connect your platforms. Once connected, NexGen will use your Google account to fetch live data from Search Console and GA4.
            </p>
            <button onClick={() => setTab('integrations')} style={{ padding: '8px 16px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Set Up Integrations →
            </button>
          </div>

          {/* Danger Zone */}
          <div style={{ background: 'rgba(245,101,101,0.04)', border: '1px solid rgba(245,101,101,0.2)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: '#f56565', marginBottom: 6 }}>Danger Zone</div>
            <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 14 }}>
              Permanently delete <strong style={{ color: 'var(--text)' }}>{project.name || project.domain}</strong> and all its integration settings. This cannot be undone.
            </p>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{ padding: '8px 18px', background: 'transparent', color: '#f56565', border: '1px solid rgba(245,101,101,0.4)', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,101,101,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                Delete Website
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, color: 'var(--text2)' }}>Are you sure? This is permanent.</span>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ padding: '8px 18px', background: '#f56565', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ padding: '8px 14px', background: 'none', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <IntegCard
            title="Google Search Console"
            icon="🔍"
            color="#5b7fff"
            connected={project.integrations?.gsc?.connected || false}
            description="Connect GSC to track clicks, impressions, CTR and keyword rankings for this website. Your Google account must have access to this property."
            fields={[{ key: 'gsc_property', label: 'Property URL', placeholder: 'https://www.yoursite.com/ or sc-domain:yoursite.com' }]}
            form={integForm}
            setForm={setIntegForm}
            saving={saving === 'gsc'}
            onSave={() => saveIntegration('gsc', { property_url: integForm.gsc_property })}
            helpText="Find this in Search Console → Property Selector → your property URL"
          />
          <IntegCard
            title="Google Analytics 4"
            icon="📈"
            color="#f97316"
            connected={project.integrations?.ga4?.connected || false}
            description="Connect GA4 to pull sessions, users, bounce rate, conversions and device/country breakdowns."
            fields={[
              { key: 'ga4_property_id', label: 'GA4 Property ID', placeholder: 'e.g. 123456789' },
              { key: 'ga4_measurement_id', label: 'Measurement ID', placeholder: 'e.g. G-XXXXXXXXXX' },
            ]}
            form={integForm}
            setForm={setIntegForm}
            saving={saving === 'ga4'}
            onSave={() => saveIntegration('ga4', { property_id: `properties/${integForm.ga4_property_id}`, measurement_id: integForm.ga4_measurement_id })}
            helpText="GA4 → Admin → Property Settings → Property ID (the number) and Measurement ID (G-XXXXXXX)"
          />
          <IntegCard
            title="GoHighLevel Voice AI"
            icon="🤖"
            color="#22d3a0"
            connected={project.integrations?.ghl?.connected || false}
            description="Connect GHL to track AI voice calls, outcomes, qualified leads and booked appointments."
            fields={[
              { key: 'ghl_location', label: 'Location ID', placeholder: 'Your GHL Location ID' },
              { key: 'ghl_key', label: 'API Key', placeholder: 'Your GHL API Key', type: 'password' },
            ]}
            form={integForm}
            setForm={setIntegForm}
            saving={saving === 'ghl'}
            onSave={() => saveIntegration('ghl', { location_id: integForm.ghl_location, api_key: integForm.ghl_key })}
            helpText="GHL → Settings → Business Info → Location ID. API key from Settings → API Keys"
          />
          <IntegCard
            title="Gravity Forms (WordPress)"
            icon="📋"
            color="#9f7aea"
            connected={project.integrations?.gravity?.connected || false}
            description="Connect Gravity Forms to track form submissions, completion rates and abandonment across all forms on your WordPress site."
            fields={[
              { key: 'wp_url', label: 'WordPress Site URL', placeholder: 'https://yoursite.com' },
              { key: 'wp_ck', label: 'Consumer Key', placeholder: 'ck_xxxxxxxxxxxxxxxxxx' },
              { key: 'wp_cs', label: 'Consumer Secret', placeholder: 'cs_xxxxxxxxxxxxxxxxxx', type: 'password' },
            ]}
            form={integForm}
            setForm={setIntegForm}
            saving={saving === 'gravity'}
            onSave={() => saveIntegration('gravity', {
              site_url: integForm.wp_url,
              consumer_key: integForm.wp_ck,
              consumer_secret: integForm.wp_cs,
              api_key: `${integForm.wp_ck}:${integForm.wp_cs}`
            })}
            helpText="WordPress → Forms → Settings → REST API → Add Key → copy Consumer Key (ck_) and Consumer Secret (cs_) separately."
          />
          <IntegCard
            title="SEMrush"
            icon="📊"
            color="#ff6d3b"
            connected={project.integrations?.semrush?.connected || false}
            description="Connect SEMrush to track organic keyword rankings, estimated traffic, backlinks, authority score and competitor analysis for this domain."
            fields={[
              { key: 'semrush_key', label: 'API Key', placeholder: 'Your SEMrush API key', type: 'password' },
              { key: 'semrush_db', label: 'Default Database (Region)', placeholder: 'us' },
            ]}
            form={integForm}
            setForm={setIntegForm}
            saving={saving === 'semrush'}
            onSave={() => saveIntegration('semrush', { api_key: integForm.semrush_key, database: integForm.semrush_db || 'us' })}
            helpText="SEMrush → top-right account menu → Subscription info → API units → copy your API Key."
          />
        </div>
      )}

      {tab === 'team' && (
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Invite Team Member</div>
            <p style={{ fontSize: 15, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>Team members will only be able to see this website's data. They cannot access your other projects unless invited.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={teamEmail} onChange={e => setTeamEmail(e.target.value)} placeholder="teammate@example.com" style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none' }} />
              <select value={teamRole} onChange={e => setTeamRole(e.target.value)} style={{ padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none', cursor: 'pointer' }}>
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — can edit integrations</option>
                <option value="admin">Admin — full access</option>
              </select>
              <button onClick={inviteTeam} style={{ padding: '9px 18px', background: '#5b7fff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Send Invite</button>
            </div>
            {teamMsg && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)', borderRadius: 8, fontSize: 15, color: '#22d3a0' }}>{teamMsg}</div>}
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Role Permissions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, fontSize: 14 }}>
              {[['Permission', 'Viewer', 'Editor', 'Admin'], ['View analytics', '✓', '✓', '✓'], ['Edit integrations', '—', '✓', '✓'], ['Invite team', '—', '—', '✓'], ['Delete project', '—', '—', '✓']].map((row, i) => (
                row.map((cell, j) => (
                  <div key={`${i}-${j}`} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: i === 0 || j === 0 ? 600 : 400, color: i === 0 ? 'var(--text3)' : cell === '✓' ? '#22d3a0' : cell === '—' ? 'var(--text3)' : 'var(--text)', background: i === 0 ? 'var(--bg3)' : 'transparent' }}>{cell}</div>
                ))
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IntegCard({ title, icon, color, connected, description, fields, form, setForm, saving, onSave, helpText }: any) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: color }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: connected ? 'rgba(34,211,160,0.1)' : 'var(--bg4)', color: connected ? '#22d3a0' : 'var(--text3)' }}>
              {connected ? '✓ Connected' : 'Not connected'}
            </span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6 }}>{description}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
        {fields.map((f: any) => (
          <div key={f.key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.key]}
              onChange={(e: any) => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none' }}
            />
          </div>
        ))}
      </div>
      {helpText && (
        <div style={{ background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
          💡 <strong>Where to find this:</strong> {helpText}
        </div>
      )}
      <button onClick={onSave} disabled={saving} style={{ padding: '8px 18px', background: color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : connected ? 'Update Connection' : 'Connect'}
      </button>
    </div>
  )
}
