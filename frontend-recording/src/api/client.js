const API_BASE = import.meta.env.VITE_API_URL || '/api'
const CACHE_KEY = 'recording_cache_v1'

function getToken() {
  return localStorage.getItem('recording_token')
}

export function setAuthSession(token, user) {
  localStorage.setItem('recording_token', token)
  localStorage.setItem('recording_user', JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem('recording_token')
  localStorage.removeItem('recording_user')
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('recording_user') || 'null')
  } catch {
    return null
  }
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCache(key, data) {
  const cache = readCache()
  cache[key] = { data, savedAt: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function getCached(key) {
  return readCache()[key]?.data ?? null
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  let body = null
  const text = await response.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { message: text }
    }
  }

  if (!response.ok) {
    const error = new Error(body?.message || 'Error en la solicitud')
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  async getCategorias() {
    try {
      const data = await request('/categorias')
      writeCache('categorias', data.categorias)
      return data.categorias
    } catch (error) {
      const cached = getCached('categorias')
      if (cached && !navigator.onLine) return cached
      throw error
    }
  },

  createCategoria: (payload) => request('/categorias', { method: 'POST', body: JSON.stringify(payload) }),

  async getRecordatorios(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value)
    })
    const qs = query.toString()
    const cacheKey = `recordatorios:${qs || 'all'}`
    try {
      const data = await request(`/recordatorios${qs ? `?${qs}` : ''}`)
      writeCache(cacheKey, data.recordatorios)
      writeCache('recordatorios:last', data.recordatorios)
      return data.recordatorios
    } catch (error) {
      const cached = getCached(cacheKey) || getCached('recordatorios:last')
      if (cached && !navigator.onLine) return cached
      throw error
    }
  },

  getProximos: () => request('/recordatorios/proximos').then((d) => d.recordatorios),
  createRecordatorio: (payload) =>
    request('/recordatorios', { method: 'POST', body: JSON.stringify(payload) }),
  updateRecordatorio: (id, payload) =>
    request(`/recordatorios/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  patchEstado: (id, estado) =>
    request(`/recordatorios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  deleteRecordatorio: (id) => request(`/recordatorios/${id}`, { method: 'DELETE' }),
}
