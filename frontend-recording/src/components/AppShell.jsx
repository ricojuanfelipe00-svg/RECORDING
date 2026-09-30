import { NavLink, useNavigate } from 'react-router-dom'
import { BrandMark } from './Brand'

const items = [
  { to: '/', label: 'Inicio', end: true, icon: HomeIcon },
  { to: '/tareas', label: 'Tareas', icon: ListIcon },
  { to: '/calendario', label: 'Calendario', icon: CalendarIcon },
  { to: '/nuevo', label: 'Añadir', icon: PlusIcon, primary: true },
  { to: '/alertas', label: 'Alertas', icon: BellIcon },
  { to: '/perfil', label: 'Perfil', icon: UserIcon },
]

export function AppShell({ children, wide = true, title }) {
  return (
    <div className="min-h-dvh w-full bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <BrandMark size="sm" />
          <div>
            <p className="font-display text-base font-extrabold text-ink">Recuérdame</p>
            <p className="text-[11px] text-muted">Asistente personal</p>
          </div>
        </div>
        <DesktopNav />
      </aside>

      {/* Tablet top nav */}
      <header className="sticky top-0 z-30 hidden border-b border-line bg-white/95 backdrop-blur md:block lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <BrandMark size="sm" />
          <p className="mr-auto font-display text-sm font-extrabold text-ink">Recuérdame</p>
          <TabletNav />
        </div>
      </header>

      <div className="w-full lg:pl-64">
        <main
          className={`mx-auto w-full px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-6 lg:px-10 lg:pb-12 lg:pt-8 ${
            wide ? 'max-w-6xl' : 'max-w-3xl'
          }`}
        >
          {title && (
            <h1 className="mb-4 font-display text-xl font-extrabold text-ink sm:mb-6 sm:text-2xl md:text-3xl">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

function DesktopNav() {
  const navigate = useNavigate()

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {items.map((item) => {
        if (item.primary) {
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate('/nuevo')}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl btn-gradient px-3 py-3 text-sm font-bold text-white shadow-md shadow-teal-200/50"
            >
              <item.icon className="h-5 w-5" />
              Nuevo recordatorio
            </button>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-brand' : 'text-slate-400'}`} />
                {item.label}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function TabletNav() {
  const navigate = useNavigate()
  const links = items.filter((i) => !i.primary)

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold whitespace-nowrap ${
              isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => navigate('/nuevo')}
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-full btn-gradient text-white shadow"
        aria-label="Nuevo recordatorio"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </nav>
  )
}

function MobileNav() {
  const navigate = useNavigate()
  const bar = [
    { to: '/', label: 'Inicio', end: true, icon: HomeIcon },
    { to: '/calendario', label: 'Agenda', icon: CalendarIcon },
    { to: '/nuevo', label: 'Añadir', icon: PlusIcon, primary: true },
    { to: '/alertas', label: 'Alertas', icon: BellIcon },
    { to: '/perfil', label: 'Perfil', icon: UserIcon },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-lg items-end justify-between px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {bar.map((item) => {
          if (item.primary) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate('/nuevo')}
                className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium text-muted"
              >
                <span className="flex h-11 w-11 -translate-y-1 items-center justify-center rounded-full btn-gradient text-white shadow-lg shadow-teal-200/70">
                  <item.icon className="h-5 w-5" />
                </span>
                {item.label}
              </button>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-brand' : 'text-slate-400'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function BottomNav() {
  return <MobileNav />
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  )
}

function ListIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h12M8 12h12M8 17h12" strokeLinecap="round" />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 17h12l-1.2-1.5V11a4.8 4.8 0 1 0-9.6 0v4.5L6 17Z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5" strokeLinecap="round" />
    </svg>
  )
}
