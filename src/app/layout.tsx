import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NexGen — Analytics Platform',
  description: 'Multi-platform analytics: Google Search Console, GA4, GHL Voice AI & Gravity Forms in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>{children}</body>
    </html>
  )
}
