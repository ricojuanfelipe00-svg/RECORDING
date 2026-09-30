import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { TaskCard } from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'

export default function TasksPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { tasks, categorias, loading, toggleComplete } = useTasks()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [categoria, setCategoria] = useState('')

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (estado && t.estado !== estado) return false
      if (categoria && String(t.id_categoria) !== String(categoria)) return false
      if (q) {
        const hay = `${t.titulo} ${t.descripcion || ''}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [tasks, q, estado, categoria])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <AppShell title="Mis tareas">
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tareas…"
            className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-3 text-sm outline-none ring-brand/20 focus:ring-4"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm font-semibold text-ink md:w-56"
        >
          <option value="">Categoría: Todas</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: '', l: 'Todas' },
          { v: 'Pendiente', l: 'Pendientes' },
          { v: 'En Proceso', l: 'En Proceso' },
          { v: 'Completada', l: 'Completas' },
        ].map((f) => (
          <button
            key={f.l}
            type="button"
            onClick={() => setEstado(f.v)}
            className={`rounded-full px-4 py-2 text-xs font-bold sm:text-sm ${
              estado === f.v ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">{filtered.length} tareas encontradas</p>

      {loading && filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-14 text-center">
          <p className="font-semibold text-ink">No hay tareas con estos filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id_recordatorio}
              task={task}
              showMenu
              onToggle={toggleComplete}
              onOpen={(t) => navigate(`/tareas/${t.id_recordatorio}`)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/nuevo')}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full btn-gradient text-2xl font-bold text-white shadow-xl shadow-teal-200/80 md:bottom-8 md:right-8 lg:hidden"
        aria-label="Nueva tarea"
      >
        +
      </button>
    </AppShell>
  )
}
