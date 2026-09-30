import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { loadStoredAlerts, saveStoredAlerts, useDueNotifications } from '../hooks/useDueNotifications'

function timeAgo(ts) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  return `Hace ${Math.round(hours / 24)} día${hours >= 48 ? 's' : ''}`
}

export default function AlertsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  useDueNotifications(isAuthenticated)
  const [alerts, setAlerts] = useState(() => loadStoredAlerts())

  useEffect(() => {
    const id = setInterval(() => setAlerts(loadStoredAlerts()), 2000)
    return () => clearInterval(id)
  }, [])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  function clearAll() {
    saveStoredAlerts([])
    setAlerts([])
  }

  function markRead(id) {
    const next = alerts.map((a) => (a.id === id ? { ...a, unread: false } : a))
    saveStoredAlerts(next)
    setAlerts(next)
  }

  return (
    <AppShell>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 md:mb-8">
        <div className="flex items-center gap-2">
          <span className="text-brand">
            <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 17h12l-1.2-1.5V11a4.8 4.8 0 1 0-9.6 0v4.5L6 17Z" strokeLinejoin="round" />
              <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl md:text-3xl">Notificaciones</h1>
        </div>
        <button type="button" onClick={clearAll} className="text-sm font-bold text-brand">
          Limpiar todo
        </button>
      </header>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-14 text-center md:py-20">
          <p className="font-semibold text-ink">Sin notificaciones</p>
          <p className="mt-1 text-sm text-muted">Te avisaremos cuando una tarea esté por vencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => markRead(a.id)}
              className={`relative w-full rounded-2xl border p-4 text-left shadow-sm sm:p-5 ${
                a.unread ? 'border-indigo-100 bg-indigo-50/70' : 'border-line bg-white'
              }`}
            >
              {a.unread && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-sky-500" />}
              <div className="flex gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    a.type === 'done'
                      ? 'bg-emerald-50 text-emerald-600'
                      : a.type === 'event'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-indigo-100 text-brand'
                  }`}
                >
                  {a.type === 'done' ? <CheckIcon /> : a.type === 'event' ? <CalIcon /> : <ClockIcon />}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-ink">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted sm:text-sm">{a.body}</p>
                  <p className="mt-2 text-[11px] font-medium text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  )
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" strokeLinecap="round" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" strokeLinecap="round" />
    </svg>
  )
}
