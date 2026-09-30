import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'
import { parseTaskDate } from '../lib/dates'

function splitDateTime(iso) {
  if (!iso) return { date: '', time: '' }
  const d = parseTaskDate(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export default function TaskFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { tasks, categorias, saveTask } = useTasks()
  const navigate = useNavigate()
  const existing = useMemo(() => tasks.find((t) => String(t.id_recordatorio) === String(id)), [tasks, id])

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [idCategoria, setIdCategoria] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [prioridad, setPrioridad] = useState('Media')
  const [estado, setEstado] = useState('Pendiente')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!existing) return
    const { date: d, time: t } = splitDateTime(existing.fecha_vencimiento)
    setTitulo(existing.titulo || '')
    setDescripcion(existing.descripcion || '')
    setIdCategoria(existing.id_categoria ? String(existing.id_categoria) : '')
    setDate(d)
    setTime(t)
    setPrioridad(existing.prioridad || 'Media')
    setEstado(existing.estado || 'Pendiente')
  }, [existing])

  useEffect(() => {
    if (editing || idCategoria || !categorias[0]) return
    setIdCategoria(String(categorias[0].id_categoria))
  }, [editing, categorias, idCategoria])

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!titulo.trim() || !date || !time) {
      setError('Título, fecha y hora son obligatorios')
      return
    }
    setSaving(true)
    try {
      const fecha_vencimiento = new Date(`${date}T${time}:00`).toISOString()
      const saved = await saveTask(
        {
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          fecha_vencimiento,
          prioridad,
          estado,
          id_categoria: idCategoria ? Number(idCategoria) : null,
        },
        editing ? Number(id) : undefined
      )
      navigate(`/tareas/${saved.id_recordatorio}`)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell wide={false}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-10">
          <header className="mb-6 flex items-center gap-3 md:mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl p-2 text-ink hover:bg-slate-100"
              aria-label="Volver"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="font-display text-lg font-bold text-ink sm:text-xl md:text-2xl">
              {editing ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
            </h1>
          </header>

          <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2 md:gap-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 md:col-span-2">
                {error}
              </div>
            )}

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Título</span>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none ring-brand/20 focus:ring-4"
                placeholder="Ej. Entregar informe"
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Descripción</span>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none ring-brand/20 focus:ring-4"
                placeholder="Detalles del recordatorio"
              />
            </label>

            <div className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Categoría</span>
              <div className="grid grid-cols-3 gap-2 sm:max-w-lg">
                {categorias.map((c) => (
                  <button
                    key={c.id_categoria}
                    type="button"
                    onClick={() => setIdCategoria(String(c.id_categoria))}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-bold sm:text-sm ${
                      String(idCategoria) === String(c.id_categoria)
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-white text-muted'
                    }`}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">Fecha</span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm outline-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">Hora</span>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm outline-none"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">Prioridad</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'Alta', c: 'border-rose-400 bg-rose-50 text-rose-600' },
                  { v: 'Media', c: 'border-amber-400 bg-amber-50 text-amber-600' },
                  { v: 'Baja', c: 'border-slate-400 bg-slate-50 text-slate-600' },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => setPrioridad(p.v)}
                    className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold sm:text-sm ${
                      prioridad === p.v ? p.c : 'border-line bg-white text-muted'
                    }`}
                  >
                    {p.v}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">Estado</span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none"
              >
                <option>Pendiente</option>
                <option>En Proceso</option>
                <option>Completada</option>
              </select>
            </label>

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                disabled={saving}
                className="mt-2 w-full rounded-xl btn-gradient py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-60 md:mt-0 md:w-auto md:min-w-[220px] md:px-8"
              >
                {saving ? 'Guardando…' : 'Guardar Recordatorio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
