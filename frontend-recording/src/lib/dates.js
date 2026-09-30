/**
 * Las fechas se guardan en UTC en MySQL como "YYYY-MM-DD HH:mm:ss" (sin Z).
 * Sin este parseo, el navegador las trata como hora local y se desfasan ~5h (Colombia).
 */
export function parseTaskDate(value) {
  if (!value) return new Date(NaN)
  if (value instanceof Date) return value

  const raw = String(value).trim()
  if (!raw) return new Date(NaN)

  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)
  if (!hasZone && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const normalized = raw.includes('T') || raw.includes(' ')
      ? `${raw.replace(' ', 'T')}Z`
      : `${raw}T00:00:00Z`
    return new Date(normalized)
  }

  return new Date(raw)
}
