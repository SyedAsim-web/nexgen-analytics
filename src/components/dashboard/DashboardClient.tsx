'use client'
import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import OverviewPage from './pages/OverviewPage'
import SitesPage from './pages/SitesPage'
import SiteDetailPage from './pages/SiteDetailPage'
import GSCPage from './pages/GSCPage'
import GA4Page from './pages/GA4Page'
import GHLPage from './pages/GHLPage'
import GravityPage from './pages/GravityPage'
import PresentationPage from './pages/PresentationPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import AddSiteModal from './AddSiteModal'
import { Project } from '@/types'

interface Props { session: Session }

export type PageName = 'dashboard' | 'sites' | 'site-detail' | 'gsc' | 'ga4' | 'ghl' | 'gravity' | 'presentation' | 'settings' | 'team'

export default function DashboardClient({ session }: Props) {
  const [page, setPage] = useState<PageName>('dashboard')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddSite, setShowAddSite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('nexgen_theme') as 'dark' | 'light' || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nexgen_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sites')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const navTo = (p: PageName, project?: Project) => {
    setPage(p)
    if (project) setSelectedProject(project)
    setSidebarOpen(false)
  }

  const viewSite = (project: Project) => navTo('site-detail', project)

  const onProjectAdded = (project: Project) => {
    setProjects(prev => [project, ...prev])
    setShowAddSite(false)
  }

  const styles = getStyles(theme)

  return (
    <div style={styles.root}>
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        page={page}
        navTo={navTo}
        sidebarOpen={sidebarOpen}
        projectCount={projects.length}
        onAddSite={() => setShowAddSite(true)}
        theme={theme}
      />

      <div style={styles.main}>
        <Topbar
          session={session}
          page={page}
          theme={theme}
          toggleTheme={toggleTheme}
          onHamburger={() => setSidebarOpen(!sidebarOpen)}
          onPresent={() => {
            if (!selectedProject) { navTo('sites'); return }
            navTo('presentation', selectedProject)
          }}
          onSignOut={() => signOut({ callbackUrl: '/auth/login' })}
          navTo={navTo}
        />

        <div style={styles.content}>
          {page === 'dashboard' && (
            <OverviewPage projects={projects} loading={loading} session={session} onViewSite={viewSite} />
          )}
          {page === 'sites' && (
            <SitesPage
              projects={projects}
              loading={loading}
              onViewSite={viewSite}
              onAddSite={() => setShowAddSite(true)}
              onRefresh={fetchProjects}
              onDeleteSite={async (id) => {
                await fetch(`/api/sites/${id}`, { method: 'DELETE' })
                fetchProjects()
              }}
            />
          )}
          {page === 'site-detail' && selectedProject && (
            <SiteDetailPage
              project={selectedProject}
              session={session}
              onBack={() => navTo('sites')}
              onPresent={() => navTo('presentation', selectedProject)}
              onRefresh={fetchProjects}
              onDelete={() => { setSelectedProject(null); navTo('sites'); fetchProjects() }}
            />
          )}
          {page === 'gsc' && <GSCPage projects={projects} session={session} />}
          {page === 'ga4' && <GA4Page projects={projects} session={session} />}
          {page === 'ghl' && <GHLPage projects={projects} />}
          {page === 'gravity' && <GravityPage projects={projects} />}
          {page === 'presentation' && (
            <PresentationPage project={selectedProject} projects={projects} session={session} onSelectProject={setSelectedProject} />
          )}
          {page === 'settings' && <SettingsPage session={session} />}
          {page === 'team' && (
            <TeamPage projects={projects} project={selectedProject} session={session} onViewSite={viewSite} />
          )}
        </div>
      </div>

      {showAddSite && (
        <AddSiteModal
          onClose={() => setShowAddSite(false)}
          onAdded={onProjectAdded}
        />
      )}
    </div>
  )
}

function getStyles(theme: string) {
  const dark = theme === 'dark'
  return {
    root: { display: 'flex', minHeight: '100vh', background: dark ? '#0d0f14' : '#f0f2f7', position: 'relative' as const },
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199 },
    main: { marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column' as const, minHeight: '100vh', minWidth: 0 },
    content: { padding: 24, flex: 1 },
  }
}
