import { parseTaskDate } from '../lib/dates'

const CATEGORY_STYLES = {
  Trabajo: 'bg-indigo-50 text-indigo-600',
  Personal: 'bg-emerald-50 text-emerald-600',
  Estudio: 'bg-violet-50 text-violet-600',
}

const PRIORITY_DOT = {
  Alta: 'bg-rose-500 text-rose-600',
  Media: 'bg-amber-500 text-amber-600',
  Baja: 'bg-slate-400 text-slate-500',
}

export function formatTaskWhen(iso) {
  const d = parseTaskDate(iso)
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startThat - startToday) / 86400000)
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (diffDays === 0) return `Hoy, ${time}`
  if (diffDays === 1) return `Mañana, ${time}`
  if (diffDays === -1) return `Ayer, ${time}`
  return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${time}`
}

export function formatLongDate(iso) {
  const d = parseTaskDate(iso)
  const text = d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatTime(iso) {
  return parseTaskDate(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function progressForEstado(estado) {
  if (estado === 'Completada') return 100
  if (estado === 'En Proceso') return 60
  return 15
}

export function TaskCard({
  task,
  onToggle,
  onOpen,
  showMenu = false,
  compactTime = false,
}) {
  const done = task.estado === 'Completada'
  const cat = task.categoria_nombre || 'Sin categoría'
  const catClass = CATEGORY_STYLES[cat] || 'bg-slate-100 text-slate-600'
  const prio = PRIORITY_DOT[task.prioridad] || PRIORITY_DOT.Media

  return (
    <article
      className={`animate-fade-up flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm sm:p-4 ${
        onOpen ? 'cursor-pointer transition hover:border-brand/30 hover:shadow-md' : ''
      }`}
      onClick={() => onOpen?.(task)}
      role={onOpen ? 'button' : undefined}
    >
      <button
        type="button"
        aria-label={done ? 'Marcar pendiente' : 'Marcar completada'}
        onClick={(e) => {
          e.stopPropagation()
          onToggle?.(task)
        }}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
          done ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {done && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5 4.8 8.8 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
          <h3 className={`font-display text-sm font-bold text-ink sm:text-base ${done ? 'text-slate-400 line-through' : ''}`}>
          {task.titulo}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${catClass}`}>{cat}</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${prio.split(' ')[1]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${prio.split(' ')[0]}`} />
            {task.prioridad}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 1.5" strokeLinecap="round" />
          </svg>
          {compactTime ? formatTime(task.fecha_vencimiento) : formatTaskWhen(task.fecha_vencimiento)}
        </span>
        {showMenu && (
          <span className="text-slate-300" aria-hidden>
            •••
          </span>
        )}
      </div>
    </article>
  )
}

export { CATEGORY_STYLES, PRIORITY_DOT }
