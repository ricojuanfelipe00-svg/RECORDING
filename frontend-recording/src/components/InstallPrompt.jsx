import { useEffect, useState } from 'react'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!visible || !deferred) return null

  async function install() {
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-xl lg:bottom-6 lg:left-auto lg:right-8 lg:mx-0">
      <p className="font-display text-sm font-bold text-ink">Añadir a pantalla de inicio</p>
      <p className="mt-1 text-xs text-muted">Instala Recuérdame y úsala como una app nativa.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={install} className="flex-1 rounded-xl btn-gradient px-3 py-2 text-sm font-bold text-white">
          Instalar
        </button>
        <button type="button" onClick={() => setVisible(false)} className="rounded-xl border border-line px-3 py-2 text-sm text-muted">
          Ahora no
        </button>
      </div>
    </div>
  )
}
