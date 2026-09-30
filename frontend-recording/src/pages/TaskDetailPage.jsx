import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { formatLongDate, formatTime, progressForEstado } from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'

export default function TaskDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { tasks, toggleComplete, removeTask } = useTasks()
  const navigate = useNavigate()
  const task = useMemo(() => tasks.find((t) => String(t.id_recordatorio) === String(id)), [tasks, id])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (!task) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-semibold text-ink">Tarea no encontrada</p>
          <button type="button" onClick={() => navigate('/tareas')} className="mt-3 text-sm font-bold text-brand">
            Volver a tareas
          </button>
        </div>
      </AppShell>
    )
  }

  const progress = progressForEstado(task.estado)
  const done = task.estado === 'Completada'

  async function onComplete() {
    if (!done) await toggleComplete(task)
  }

  async function onDelete() {
    if (!window.confirm('¿Eliminar este recordatorio?')) return
    await removeTask(task.id_recordatorio)
    navigate('/tareas')
  }

  async function onShare() {
    const text = `${task.titulo}\n${formatLongDate(task.fecha_vencimiento)} · ${formatTime(task.fecha_vencimiento)}`
    if (navigator.share) {
      await navigator.share({ title: task.titulo, text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('Copiado al portapapeles')
    }
  }

  return (
    <AppShell wide={false}>
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-10">
        <header className="mb-6 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Volver">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-display text-base font-bold text-ink sm:text-lg">Detalle de Tarea</h1>
          <button type="button" onClick={onShare} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Compartir">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
            {task.categoria_nombre || 'Sin categoría'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {task.prioridad}
          </span>
        </div>

        <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{task.titulo}</h2>

        <div className="mt-5 grid gap-3 rounded-2xl bg-surface p-4 text-sm text-muted sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <CalendarMini />
            {formatLongDate(task.fecha_vencimiento)}
          </p>
          <p className="flex items-center gap-2">
            <ClockMini />
            {formatTime(task.fecha_vencimiento)}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">Estado: {task.estado}</span>
            <span className="font-bold text-brand">{progress}% completado</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Descripción</h3>
          <p className="text-sm leading-relaxed text-muted md:text-base">
            {task.descripcion || 'Sin descripción adicional.'}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {!done && (
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-xl btn-gradient-teal py-3.5 text-sm font-bold text-white shadow-md sm:flex-1 sm:min-w-[200px]"
            >
              Marcar como Completada
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/editar/${task.id_recordatorio}`)}
            className="w-full rounded-xl border border-line bg-white py-3 text-sm font-bold text-ink sm:w-auto sm:px-8"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-xl py-3 text-sm font-bold text-rose-500 sm:w-auto sm:px-8"
          >
            Eliminar
          </button>
        </div>
      </div>
    </AppShell>
  )
}

function CalendarMini() {
  return (
    <svg className="h-4 w-4 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" strokeLinecap="round" />
    </svg>
  )
}

function ClockMini() {
  return (
    <svg className="h-4 w-4 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" strokeLinecap="round" />
    </svg>
  )
}
