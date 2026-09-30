import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'

export default function ProfilePage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  const { stats } = useTasks()
  const navigate = useNavigate()
  const [push, setPush] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem('recuerdame_offline_pref') !== '0')

  useEffect(() => {
    localStorage.setItem('recuerdame_offline_pref', offlineMode ? '1' : '0')
  }, [offlineMode])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function togglePush() {
    if (!('Notification' in window)) {
      alert('Este navegador no soporta notificaciones')
      return
    }
    if (Notification.permission === 'granted') {
      setPush(false)
      return
    }
    const result = await Notification.requestPermission()
    setPush(result === 'granted')
  }

  const initial = (user?.nombre || 'U').slice(0, 1).toUpperCase()

  return (
    <AppShell title="Perfil">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left lg:flex-col lg:text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 text-2xl font-extrabold text-white shadow-lg sm:mb-0 sm:h-24 sm:w-24 sm:text-3xl lg:mb-4">
              {initial}
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink md:text-2xl">{user?.nombre}</h2>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-surface p-3 sm:p-4">
            <div className="text-center">
              <p className="font-display text-lg font-extrabold text-ink sm:text-2xl">{stats.total}</p>
              <p className="text-[11px] text-muted sm:text-sm">Totales</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-extrabold text-ink sm:text-2xl">{stats.completadas}</p>
              <p className="text-[11px] text-muted sm:text-sm">Hechas</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-extrabold text-ink sm:text-2xl">{stats.pendientes}</p>
              <p className="text-[11px] text-muted sm:text-sm">Pendientes</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <ToggleRow title="Notificaciones Push" icon={<Bell />} checked={push} onChange={togglePush} />
            <ToggleRow
              title="Modo Offline"
              subtitle="Guardar datos localmente"
              icon={<Wifi />}
              checked={offlineMode}
              onChange={() => setOfflineMode((v) => !v)}
            />
            <InfoRow title="Tema" value="Claro" icon={<Sun />} />
            <InfoRow title="Idioma" value="Español" icon={<Globe />} />
            <InfoRow title="Acerca de" value="Recuérdame 1.0" icon={<Info />} last />
          </div>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="mt-6 w-full rounded-xl border border-rose-200 bg-white py-3.5 text-sm font-bold text-rose-500 sm:max-w-xs"
          >
            Cerrar Sesión
          </button>
        </section>
      </div>
    </AppShell>
  )
}

function ToggleRow({ title, subtitle, icon, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <span className="text-brand">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-brand' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function InfoRow({ title, value, icon, last }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${last ? '' : 'border-b border-line'}`}>
      <span className="text-brand">{icon}</span>
      <p className="flex-1 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted sm:text-sm">{value}</p>
    </div>
  )
}

function Bell() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 17h12l-1.2-1.5V11a4.8 4.8 0 1 0-9.6 0v4.5L6 17Z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}
function Wifi() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5c4.5-4 11.5-4 16 0M7 13.5c2.8-2.4 7.2-2.4 10 0M10 16.5c1.2-1 2.8-1 4 0" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
}
function Sun() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" strokeLinecap="round" />
    </svg>
  )
}
function Globe() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" />
    </svg>
  )
}
function Info() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </svg>
  )
}
