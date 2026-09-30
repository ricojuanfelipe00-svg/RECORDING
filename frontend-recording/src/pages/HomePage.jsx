import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { InstallPrompt } from '../components/InstallPrompt'
import { TaskCard } from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'
import { AlertsBanner, useDueNotifications } from '../hooks/useDueNotifications'
import { parseTaskDate } from '../lib/dates'

function todayLabel() {
  const text = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { stats, todayTasks, tasks, loading, offline, toggleComplete } = useTasks()
  const navigate = useNavigate()
  useDueNotifications(isAuthenticated)

  if (authLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const firstName = user?.nombre?.split(' ')[0] || 'Usuario'
  const upcoming = [...tasks]
    .filter((t) => t.estado !== 'Completada')
    .sort((a, b) => parseTaskDate(a.fecha_vencimiento) - parseTaskDate(b.fecha_vencimiento))
    .slice(0, 4)

  return (
    <AppShell>
      <header className="mb-5 flex items-start justify-between gap-3 animate-fade-up md:mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink md:text-3xl">Hola, {firstName}</h1>
          <p className="mt-1 text-sm text-muted md:text-base">{todayLabel()}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 text-sm font-bold text-white shadow-md md:h-12 md:w-12 md:text-base lg:hidden"
          aria-label="Perfil"
        >
          {firstName.slice(0, 1).toUpperCase()}
        </button>
      </header>

      {offline && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Sin conexión — mostrando datos guardados.
        </div>
      )}

      <AlertsBanner />

      <div className="mb-6 grid grid-cols-3 gap-2.5 animate-fade-up sm:gap-4 md:mb-8">
        <StatCard label="Pendientes" value={stats.pendientes} tone="blue" icon="clock" />
        <StatCard label="En Proceso" value={stats.proceso} tone="amber" icon="sun" />
        <StatCard label="Completadas" value={stats.completadas} tone="green" icon="check" />
      </div>

      <div className="grid gap-6 md:grid-cols-5 md:gap-6 lg:gap-8">
        <section className="md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink md:text-lg">Tareas de Hoy</h2>
            <Link to="/tareas" className="text-sm font-semibold text-brand">
              Ver todo
            </Link>
          </div>

          {loading && todayTasks.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Cargando tareas…</p>
          ) : todayTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center md:py-14">
              <p className="font-semibold text-ink">No hay tareas para hoy</p>
              <p className="mt-1 text-sm text-muted">Crea un recordatorio con el botón +</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id_recordatorio}
                  task={task}
                  compactTime
                  onToggle={toggleComplete}
                  onOpen={(t) => navigate(`/tareas/${t.id_recordatorio}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink md:text-lg">Próximas</h2>
          </div>
          <div className="space-y-3 rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-4">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Sin pendientes próximos</p>
            ) : (
              upcoming.map((task) => (
                <TaskCard
                  key={`up-${task.id_recordatorio}`}
                  task={task}
                  onToggle={toggleComplete}
                  onOpen={(t) => navigate(`/tareas/${t.id_recordatorio}`)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <InstallPrompt />
    </AppShell>
  )
}

function StatCard({ label, value, tone, icon }) {
  const tones = {
    blue: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-4 md:p-5">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${tones[tone]}`}>
        {icon === 'clock' && (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 1.5" strokeLinecap="round" />
          </svg>
        )}
        {icon === 'sun' && (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" strokeLinecap="round" />
          </svg>
        )}
        {icon === 'check' && (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <p className="text-[11px] font-medium text-muted sm:text-sm">{label}</p>
      <p className="font-display text-xl font-extrabold text-ink sm:text-2xl md:text-3xl">{value}</p>
    </div>
  )
}
