// Gap-honest placeholder exhibit. When the Visual Director cannot yet render an exhibit type (a
// renderer the capability map flags as needs_build) or the model lacks the content for it, it
// emits THIS — a clearly-marked "exhibit pending" card — never a fabricated or empty visual. This
// keeps the deck honest while the remaining renderers (PR4.x) land.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function gapCard(exhibitType: string, note: string): string {
  const W = 720;
  const H = 260;
  const label = note.length > 88 ? `${note.slice(0, 87)}…` : note;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Exhibit pending: ${esc(exhibitType)}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#FBFAF7"/>` +
    `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="8" fill="#FFFFFF" stroke="#B23B2E" stroke-width="1.5" stroke-dasharray="6 4"/>` +
    `<text x="${W / 2}" y="${H / 2 - 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.12em" fill="#B23B2E">EXHIBIT PENDING</text>` +
    `<text x="${W / 2}" y="${H / 2 + 10}" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#141414">${esc(exhibitType)}</text>` +
    `<text x="${W / 2}" y="${H / 2 + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11.5" fill="#6B6B6B">${esc(label)}</text>` +
    `</svg>`
  );
}
