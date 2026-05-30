/**
 * W4-PR-6 · Email template helpers.
 *
 * Pure functions — no React, no DOM, no I/O. Templates compose these
 * to build email-safe HTML strings. Every helper is deterministic so
 * snapshot tests stay stable.
 */

/** Brand identity passed to every template — keeps the masthead consistent. */
export interface TenantBrand {
  /** Display name in the masthead (e.g. "Apex Retail"). */
  name: string;
  /** Industry pill text (e.g. "Retail"). Optional surface element. */
  industryTag: string;
  /** Stable slug used in audit refs (e.g. "apex-retail"). */
  canonicalKey: string;
}

/**
 * Escape HTML entities. Every interpolated payload field passes through
 * this — payloads come from the broker and may contain user-supplied
 * text (program names, rationale strings, etc.).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Human-friendly UTC timestamp ("30 May 2026 · 14:02 UTC"). The "UTC"
 * suffix is intentional — recipients across timezones need a single
 * shared reference. The audit footer also surfaces the raw ISO.
 */
export function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm} UTC`;
}

/**
 * Mask an email for display so we never leak full PII in a body.
 * "alice.example@example.com" becomes "a***@example.com". Falsy or
 * malformed addresses degrade to a neutral placeholder.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'a teammate';
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf('@');
  if (atIdx <= 0) return 'a teammate';
  const first = trimmed[0] ?? '';
  const domain = trimmed.slice(atIdx);
  return `${first}***${domain}`;
}

/**
 * Truncate long free-text fields (rationale, error messages) so the
 * email body stays readable. Adds a single-character ellipsis when
 * truncated.
 */
export function truncate(value: string, maxLen = 280): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Reusable masthead block — AbarVa wordmark left, tenant name + industry
 * tag right. Returns inline-styled HTML. Single source of truth so all
 * 5 templates render an identical header.
 */
export function tenantHeader(tenant: TenantBrand): string {
  const name = escapeHtml(tenant.name);
  const tag = escapeHtml(tenant.industryTag);
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">',
    '<tr>',
    '<td style="padding:24px 24px 18px 24px;border-bottom:1px solid #E5E1D8;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">',
    '<tr>',
    '<td align="left" style="font-family:Georgia,\'Times New Roman\',Times,serif;font-size:18px;color:#1A1A1A;letter-spacing:0.02em;">AbarVa</td>',
    `<td align="right" style="font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#5B6C8A;text-transform:uppercase;letter-spacing:0.08em;">${name} · ${tag}</td>`,
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
  ].join('');
}
