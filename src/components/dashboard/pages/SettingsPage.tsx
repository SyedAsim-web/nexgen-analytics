'use client'
export default function SettingsPage(props: any) {
  return (
    <div>
      <h1 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        Settings
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text3)' }}>
        Connect your integrations to see live data here.
      </p>
    </div>
  )
}
