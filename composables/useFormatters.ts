/**
 * Shared date formatters. Replaces 5+ inline formatDate duplicates.
 */
export function useFormatters() {
  function formatDate(dt: string | undefined | null): string {
    if (!dt) return ''
    return new Date(dt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  function formatDateShort(dt: string | undefined | null): string {
    if (!dt) return ''
    const d = new Date(dt)
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diff === 0) return 'today'
    if (diff === 1) return 'yesterday'
    if (diff < 7) return `${diff}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return { formatDate, formatDateShort }
}
