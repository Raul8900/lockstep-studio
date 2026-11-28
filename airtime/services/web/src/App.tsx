import { BookOpen, ChartColumn, Clapperboard, LayoutDashboard, Monitor, Moon, Settings, Sun, TrendingUp } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router'
import { useControlEvents, useSettings } from './api/hooks'
import { cx, Empty, Loading } from './components/ui'
import { useTheme } from './lib/theme'

const Overview = lazy(() => import('./pages/Overview'))
const Opportunities = lazy(() => import('./pages/Opportunities'))
const Productions = lazy(() => import('./pages/Productions'))
const Production = lazy(() => import('./pages/Production'))
const Channel = lazy(() => import('./pages/Channel'))
const Video = lazy(() => import('./pages/Video'))
const Playbook = lazy(() => import('./pages/Playbook'))
const SettingsPage = lazy(() => import('./pages/Settings'))

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/opportunities', label: 'Trends & Opportunities', short: 'Trends', icon: TrendingUp },
  { to: '/productions', label: 'Productions', icon: Clapperboard },
  { to: '/channel', label: 'Channel', icon: ChartColumn },
  { to: '/playbook', label: 'Playbook', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const STREAM_LABEL = { open: 'Live', connecting: 'Connecting', retrying: 'Reconnecting', closed: 'Offline' } as const

function ThemeButton() {
  const { pref, next } = useTheme()
  const Icon = pref === 'dark' ? Moon : pref === 'light' ? Sun : Monitor
  return (
    <button
      type="button"
      onClick={next}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-fg-2 hover:bg-surface-2 hover:text-fg"
      title="Theme: system, light or dark"
    >
      <Icon aria-hidden className="size-4" />
      <span className="capitalize">{pref}</span>
    </button>
  )
}

function Status() {
  const stream = useControlEvents()
  const mode = useSettings().data?.settings?.mode
  return (
    <div className="flex items-center gap-3 text-xs text-fg-2">
      {mode && (
        <Link to="/settings" className="hover:text-fg" title="Autopilot mode">
          Autopilot <span className="font-semibold text-fg">{mode}</span>
        </Link>
      )}
      <span className="inline-flex items-center gap-1.5" title="Control's event stream">
        <span className={cx('size-2 rounded-full', stream === 'open' ? 'bg-good' : stream === 'closed' ? 'bg-bad' : 'bg-warn')} />
        {STREAM_LABEL[stream]}
      </span>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[13.5rem_1fr]">
      <aside className="sticky top-0 z-20 border-b border-line bg-surface lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-6" />
            Airtime
          </Link>
          <div className="lg:hidden">
            <Status />
          </div>
        </div>
        <nav aria-label="Main" className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-2">
          {NAV.map(({ to, label, short, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm',
                  isActive ? 'bg-accent-soft font-medium text-accent-ink' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              <Icon aria-hidden className="size-4" />
              <span className="lg:hidden">{short ?? label}</span>
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-4 py-3 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block lg:space-y-2 lg:border-t lg:border-line">
          <Status />
          <ThemeButton />
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-5 lg:px-6">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="productions" element={<Productions />} />
            <Route path="productions/:id/:tab?" element={<Production />} />
            <Route path="channel" element={<Channel />} />
            <Route path="channel/:videoId" element={<Video />} />
            <Route path="playbook" element={<Playbook />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Empty>Nothing here. Pick a page from the menu.</Empty>} />
          </Routes>
        </Suspense>
        <footer className="mt-8 flex justify-end lg:hidden">
          <ThemeButton />
        </footer>
      </main>
    </div>
  )
}
