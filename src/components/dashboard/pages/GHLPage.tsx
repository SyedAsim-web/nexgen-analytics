'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'

interface Props { projects: Project[] }

export default function GHLPage({ projects }: Props) {
  const ghlProjects = projects.filter(p => p.integrations?.ghl?.connected)
  const [selected, setSelected] = useState(ghlProjects[0]?.id || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (projectId: string) => {
    const p = projects.find(x => x.id === projectId)
    if (!p?.integrations?.ghl?.location_id || !p?.integrations?.ghl?.api_key) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(
        `/api/ghl?locationId=${encodeURIComponent(p.integrations.ghl.location_id)}&apiKey=${encodeURIComponent(p.integrations.ghl.api_key)}`
      )
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (selected) fetchData(selected) }, [selected])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            GHL AI Leads
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Voice AI calls · Live chat conversations · Lead pipeline
          </p>
        </div>
        {ghlProjects.length > 0 && (
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            {ghlProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Not connected */}
      {ghlProjects.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(34,211,160,0.3)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            No GHL accounts connected
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Go to <strong style={{ color: 'var(--text)' }}>All Websites → your site → Integrations</strong> and connect GoHighLevel to see voice AI and live chat data here.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(34,211,160,0.2)', borderTopColor: '#22d3a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading GHL data…</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#f56565', marginBottom: 16, lineHeight: 1.6 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Data */}
      {data && (
        <div>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Contacts', value: data.summary.totalContacts.toLocaleString(), color: '#22d3a0', icon: '👥' },
              { label: 'Conversations', value: data.summary.totalConversations.toLocaleString(), color: '#5b7fff', icon: '💬' },
              { label: 'Voice Calls', value: data.summary.totalCalls.toLocaleString(), color: '#f0b429', icon: '📞' },
              { label: 'Open Deals', value: data.summary.openOpportunities.toLocaleString(), color: '#9f7aea', icon: '🎯' },
              { label: 'Won Deals', value: data.summary.wonOpportunities.toLocaleString(), color: '#22d3a0', icon: '🏆' },
              { label: 'Total Deals', value: data.summary.totalOpportunities.toLocaleString(), color: '#f97316', icon: '💼' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: s.color }} />
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Lead Pipeline
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {[
                { label: 'New Leads', value: data.pipeline.new, color: '#5b7fff' },
                { label: 'Contacted', value: data.pipeline.contacted, color: '#f0b429' },
                { label: 'Qualified', value: data.pipeline.qualified, color: '#2dd4bf' },
                { label: 'Booked', value: data.pipeline.booked, color: '#22d3a0' },
                { label: 'Lost', value: data.pipeline.lost, color: '#f56565' },
              ].map(stage => (
                <div key={stage.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: stage.color }} />
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>{stage.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{stage.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live conversations */}
          {data.conversations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                Live Conversations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.conversations.map((c: any) => (
                  <div key={c.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#5b7fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#5b7fff,#9f7aea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {c.contactName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.contactName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.type === 'TYPE_VOICE' ? 'rgba(240,180,41,0.1)' : 'rgba(91,127,255,0.1)', color: c.type === 'TYPE_VOICE' ? '#f0b429' : '#5b7fff' }}>
                          {c.type === 'TYPE_VOICE' ? '📞 Voice' : '💬 Chat'}
                        </span>
                        {c.unread > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,101,101,0.1)', color: '#f56565' }}>
                            {c.unread} unread
                          </span>
                        )}
                      </div>
                    </div>
                    {c.lastMessage && (
                      <div style={{ background: 'var(--bg3)', borderRadius: '0 8px 8px 8px', padding: '8px 12px', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, borderLeft: '2px solid #5b7fff' }}>
                        "{c.lastMessage.slice(0, 120)}{c.lastMessage.length > 120 ? '…' : ''}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice calls table */}
          {data.calls.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Recent Voice AI Calls
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Contact', 'Date', 'Duration', 'Direction', 'Status'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.calls.map((call: any) => (
                      <tr key={call.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500 }}>{call.contactName}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>
                          {call.date ? new Date(call.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{call.duration || '—'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: call.direction === 'inbound' ? 'rgba(34,211,160,0.1)' : 'rgba(91,127,255,0.1)', color: call.direction === 'inbound' ? '#22d3a0' : '#5b7fff' }}>
                            {call.direction === 'inbound' ? '↙ Inbound' : '↗ Outbound'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(34,211,160,0.1)', color: '#22d3a0' }}>
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {data.opportunities.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Pipeline Opportunities
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Name', 'Contact', 'Stage', 'Value', 'Status'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.opportunities.map((opp: any) => (
                      <tr key={opp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 500 }}>{opp.name}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{opp.contact}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{opp.stage}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 600 }}>
                          {opp.monetaryValue ? `$${opp.monetaryValue.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: opp.status === 'won' ? 'rgba(34,211,160,0.1)' : opp.status === 'lost' ? 'rgba(245,101,101,0.1)' : 'rgba(91,127,255,0.1)', color: opp.status === 'won' ? '#22d3a0' : opp.status === 'lost' ? '#f56565' : '#5b7fff' }}>
                            {opp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
