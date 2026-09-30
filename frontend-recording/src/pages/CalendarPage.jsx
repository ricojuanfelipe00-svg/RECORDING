import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { TaskCard } from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'
import { parseTaskDate } from '../lib/dates'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function CalendarPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { tasks, toggleComplete } = useTasks()
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())

  const taskDays = useMemo(() => {
    const map = new Set()
    tasks.forEach((t) => map.add(toKey(parseTaskDate(t.fecha_vencimiento))))
    return map
  }, [tasks])

  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => sameDay(parseTaskDate(t.fecha_vencimiento), selected))
      .sort((a, b) => parseTaskDate(a.fecha_vencimiento) - parseTaskDate(b.fecha_vencimiento))
  }, [tasks, selected])

  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    let offset = first.getDay() - 1
    if (offset < 0) offset = 6
    const total = daysInMonth(cursor)
    const list = []
    for (let i = 0; i < offset; i++) list.push(null)
    for (let d = 1; d <= total; d++) list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    return list
  }, [cursor])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const monthLabel = cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <AppShell title="Calendario">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-xl border border-line bg-white px-3 py-2 text-lg hover:bg-surface"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h2 className="font-display text-base font-extrabold capitalize text-ink sm:text-lg md:text-xl">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-xl border border-line bg-white px-3 py-2 text-lg hover:bg-surface"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-6 lg:gap-8">
        <div className="rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5 md:col-span-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted sm:text-sm">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="aspect-square sm:min-h-12" />
              const selectedDay = sameDay(day, selected)
              const hasTasks = taskDays.has(toKey(day))
              return (
                <button
                  key={toKey(day)}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={`relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl text-sm font-semibold sm:min-h-12 sm:text-base ${
                    selectedDay ? 'bg-brand text-white' : 'text-ink hover:bg-surface'
                  }`}
                >
                  {day.getDate()}
                  {hasTasks && (
                    <span
                      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                        selectedDay ? 'bg-white' : 'bg-sky-500'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="mb-3 font-display text-base font-bold text-ink md:text-lg">Tareas del día</h3>
          {dayTasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-muted">
              Sin tareas en esta fecha
            </p>
          ) : (
            <div className="space-y-3">
              {dayTasks.map((task) => (
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
        </div>
      </div>
    </AppShell>
  )
}
