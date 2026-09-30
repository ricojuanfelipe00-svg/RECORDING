import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthFooterLink, AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Bienvenido de nuevo" subtitle="Accede a tus recordatorios desde cualquier dispositivo.">
      <form onSubmit={onSubmit} className="space-y-4 animate-fade-up">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Correo Electrónico</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carlos@diseno.com"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-brand/20 placeholder:text-slate-400 focus:ring-4"
            autoComplete="email"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">Contraseña</span>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-11 text-sm outline-none ring-brand/20 placeholder:text-slate-400 focus:ring-4"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-slate-400"
              aria-label="Mostrar contraseña"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setError('Recuperación de contraseña próximamente')}
            className="text-sm font-semibold text-brand"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-gradient py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Iniciar Sesión'}
        </button>
      </form>

      <AuthFooterLink prompt="¿No tienes una cuenta?" to="/register" label="Registrarse" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">O continúa con</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => setError('El acceso con Google no está habilitado. Usa correo y contraseña.')}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-ink shadow-sm"
      >
        <GoogleIcon />
        Google
      </button>
    </AuthLayout>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12s3.5-7 9-7c2 0 3.7.7 5.1 1.7M21 12s-1.2 2.4-3.2 4.2M9.9 9.9A2.5 2.5 0 0 1 14 13" />
      <path d="m4 4 16 16" strokeLinecap="round" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.8 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z" />
    </svg>
  )
}
