import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { parseTaskDate } from '../lib/dates'

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)

  const refresh = useCallback(async (params = {}) => {
    if (!isAuthenticated) return
    setLoading(true)
    setError('')
    try {
      const [cats, records] = await Promise.all([
        api.getCategorias(),
        api.getRecordatorios(params),
      ])
      setCategorias(cats)
      setTasks(records)
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) refresh()
    else {
      setTasks([])
      setCategorias([])
    }
  }, [isAuthenticated, refresh])

  useEffect(() => {
    const on = () => {
      setOffline(false)
      refresh()
    }
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [refresh])

  const stats = useMemo(() => {
    const pendientes = tasks.filter((t) => t.estado === 'Pendiente').length
    const proceso = tasks.filter((t) => t.estado === 'En Proceso').length
    const completadas = tasks.filter((t) => t.estado === 'Completada').length
    return { pendientes, proceso, completadas, total: tasks.length }
  }, [tasks])

  const todayTasks = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return tasks
      .filter((t) => {
        const d = parseTaskDate(t.fecha_vencimiento)
        return d >= start && d <= end
      })
      .sort((a, b) => parseTaskDate(a.fecha_vencimiento) - parseTaskDate(b.fecha_vencimiento))
  }, [tasks])

  async function toggleComplete(task) {
    const next = task.estado === 'Completada' ? 'Pendiente' : 'Completada'
    const updated = await api.patchEstado(task.id_recordatorio, next)
    setTasks((prev) => prev.map((t) => (t.id_recordatorio === task.id_recordatorio ? updated.recordatorio : t)))
    return updated.recordatorio
  }

  async function saveTask(payload, id) {
    const result = id
      ? await api.updateRecordatorio(id, payload)
      : await api.createRecordatorio(payload)
    await refresh()
    return result.recordatorio
  }

  async function removeTask(id) {
    await api.deleteRecordatorio(id)
    setTasks((prev) => prev.filter((t) => t.id_recordatorio !== id))
  }

  return (
    <TasksContext.Provider
      value={{
        tasks,
        categorias,
        loading,
        error,
        offline,
        stats,
        todayTasks,
        refresh,
        toggleComplete,
        saveTask,
        removeTask,
        setTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks dentro de TasksProvider')
  return ctx
}
