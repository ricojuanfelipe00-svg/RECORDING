import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearAuthSession, getStoredUser, setAuthSession } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('recording_token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .me()
      .then((data) => {
        setUser(data.user)
        localStorage.setItem('recording_user', JSON.stringify(data.user))
      })
      .catch(() => {
        clearAuthSession()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const data = await api.login({ email, password })
    setAuthSession(data.token, data.user)
    setUser(data.user)
    return data
  }

  async function register(nombre, email, password) {
    const data = await api.register({ nombre, email, password })
    setAuthSession(data.token, data.user)
    setUser(data.user)
    return data
  }

  function logout() {
    clearAuthSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
