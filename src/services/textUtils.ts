/** Convierte HTML (p. ej. el cuerpo de una minuta) en texto plano legible, conservando saltos de línea. */
export function htmlToPlainText(html?: string): string {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = withBreaks;
    return (el.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }
  return withBreaks.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
