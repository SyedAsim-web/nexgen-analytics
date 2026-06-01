export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  domain: string
  owner_id: string
  created_at: string
  updated_at: string
  integrations: {
    gsc?: { property_url: string; connected: boolean; last_sync?: string }
    ga4?: { measurement_id: string; property_id: string; connected: boolean; last_sync?: string }
    ghl?: { location_id: string; api_key: string; connected: boolean; last_sync?: string }
    gravity?: { site_url: string; api_key?: string; consumer_key?: string; consumer_secret?: string; connected: boolean; last_sync?: string }
    semrush?: { api_key: string; database?: string; connected: boolean; last_sync?: string }
  }
}

export interface Collaborator {
  id: string
  project_id: string
  user_id: string
  email: string
  name: string
  avatar_url?: string
  role: 'admin' | 'editor' | 'viewer'
  invited_at: string
  accepted: boolean
}

export interface GSCData {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
  query?: string
  page?: string
}

export interface GA4Data {
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  date?: string
}

export interface GHLCall {
  id: string
  date: string
  duration: string
  outcome: 'booked' | 'qualified' | 'info' | 'no_answer'
  sentiment: 'positive' | 'neutral' | 'negative'
  ai_resolved: boolean
  contact_name?: string
}

export interface FormSubmission {
  id: string
  form_name: string
  submitted_at: string
  status: 'new' | 'read' | 'spam'
}
