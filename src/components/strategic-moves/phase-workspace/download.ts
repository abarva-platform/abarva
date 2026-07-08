// Moves phase workspace — client-side file download (no backend).
// Browser side-effect only; a no-op during SSR/tests. No hooks, no state — keeps
// the phase-workspace surface within its "no runtime coupling" contract.

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/markdown',
): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
