import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthFooterLink, AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await register(nombre, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'No se pudo registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Guarda tus tareas y no olvides ningún compromiso.">
      <form onSubmit={onSubmit} className="space-y-4 animate-fade-up">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Nombre</span>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-brand/20 focus:ring-4"
            placeholder="Tu nombre"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Correo Electrónico</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-brand/20 focus:ring-4"
            placeholder="tu@correo.com"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-brand/20 focus:ring-4"
            placeholder="Mínimo 6 caracteres"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-gradient py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 disabled:opacity-60"
        >
          {loading ? 'Creando cuenta…' : 'Registrarse'}
        </button>
      </form>

      <AuthFooterLink prompt="¿Ya tienes cuenta?" to="/login" label="Iniciar Sesión" />
    </AuthLayout>
  )
}
