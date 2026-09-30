import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { parseTaskDate } from '../lib/dates'

const NOTIFIED_KEY = 'recuerdame_notified_ids'
const ALERTS_KEY = 'recuerdame_alerts_v1'

function loadNotified() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveNotified(set) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]))
}

export function loadStoredAlerts() {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveStoredAlerts(alerts) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
}

export function useDueNotifications(enabled) {
  const [alertas, setAlertas] = useState([])
  const notified = useRef(loadNotified())

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    async function ensurePermission() {
      if (!('Notification' in window)) return false
      if (Notification.permission === 'granted') return true
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission()
        return result === 'granted'
      }
      return false
    }

    async function check() {
      try {
        const proximos = await api.getProximos()
        if (cancelled) return
        setAlertas(proximos)

        const existing = loadStoredAlerts()
        const merged = [...existing]
        proximos.forEach((item) => {
          const id = `due-${item.id_recordatorio}`
          if (!merged.some((a) => a.id === id)) {
            merged.unshift({
              id,
              type: 'due',
              title: `${item.titulo} vence pronto`,
              body: `Programado para ${parseTaskDate(item.fecha_vencimiento).toLocaleString('es-CO')}`,
              createdAt: Date.now(),
              unread: true,
            })
          }
        })
        saveStoredAlerts(merged.slice(0, 40))

        const granted = await ensurePermission()
        proximos.forEach((item) => {
          const id = String(item.id_recordatorio)
          if (notified.current.has(id)) return
          notified.current.add(id)
          saveNotified(notified.current)
          if (granted) {
            new Notification('Recuérdame', {
              body: `${item.titulo} — ${parseTaskDate(item.fecha_vencimiento).toLocaleString('es-CO')}`,
              tag: `recuerdame-${id}`,
            })
          }
        })
      } catch {
        // offline / api down
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [enabled])

  return alertas
}

export function AlertsBanner() {
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    api
      .getProximos()
      .then(setAlertas)
      .catch(() => setAlertas([]))
  }, [])

  if (!alertas?.length) return null

  return (
    <div className="mb-4 animate-fade-up rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
      <p className="font-semibold">Próximos a vencer ({alertas.length})</p>
      <ul className="mt-1 space-y-0.5 text-orange-700/90">
        {alertas.slice(0, 2).map((a) => (
          <li key={a.id_recordatorio}>
            {a.titulo} · {parseTaskDate(a.fecha_vencimiento).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
          </li>
        ))}
      </ul>
    </div>
  )
}
