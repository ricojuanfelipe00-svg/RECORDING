import { Link } from 'react-router-dom'
import { BrandMark, LogoLockup } from './Brand'

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#5b5ce2] via-[#4f46e5] to-[#14b8a6] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <BrandMark size="sm" />
          <span className="font-display text-xl font-bold text-white">Recuérdame</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Organiza tu día sin olvidar nada
          </h2>
          <p className="mt-4 text-base text-white/80">
            Tareas, recordatorios y alertas en una PWA lista para celular, tablet y escritorio.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/60">Tu asistente de memoria personal</p>
      </aside>

      <div className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <LogoLockup centered />
          </div>
          {(title || subtitle) && (
            <div className="mb-6 hidden lg:block">
              {title && <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthFooterLink({ prompt, to, label }) {
  return (
    <p className="mt-6 text-center text-sm text-muted">
      {prompt}{' '}
      <Link to={to} className="font-bold text-brand">
        {label}
      </Link>
    </p>
  )
}
