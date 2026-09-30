export function BrandMark({ size = 'md' }) {
  const box = size === 'lg' ? 'h-[72px] w-[72px]' : size === 'sm' ? 'h-10 w-10' : 'h-14 w-14'
  const icon = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  return (
    <div
      className={`${box} flex items-center justify-center rounded-2xl btn-gradient shadow-lg shadow-indigo-200/60`}
      aria-hidden
    >
      <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 3.75A1.75 1.75 0 0 0 5.25 5.5v15.1c0 .62.7.98 1.2.62L12 17.25l5.55 3.97a.75.75 0 0 0 1.2-.62V5.5A1.75 1.75 0 0 0 17 3.75H7Z" />
      </svg>
    </div>
  )
}

export function LogoLockup({ centered = false }) {
  return (
    <div className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start'} gap-3`}>
      <BrandMark size="lg" />
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">Recuérdame</h1>
        <p className="mt-1 text-sm text-muted">Tu asistente de memoria personal</p>
      </div>
    </div>
  )
}
