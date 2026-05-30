/**
 * W4-PR-6 · Shared email chrome.
 *
 * `EmailShell` is a pure HTML-string builder — not a React component.
 * Templates pass the rendered body HTML and a small reason/footer
 * descriptor; the shell wraps it in the locked AbarVa masthead,
 * the cream paper frame, and a CAN-SPAM compliant footer with:
 *
 *   1. Physical sender address.
 *   2. Per-message "you're receiving this because" reason.
 *   3. Unsubscribe / preferences link.
 *   4. Audit tail with timestamp + event id.
 *
 * Email clients reject most CSS, so the shell builds tables with
 * inline styles. There are NO `<style>` blocks anywhere; the shape
 * test asserts this.
 *
 * The .tsx extension is preserved per the W4 spec; the file is pure
 * TypeScript and contains no JSX so it runs unchanged through jest
 * without a React renderer in the loop.
 */

import { tenantHeader, formatTs, escapeHtml, type TenantBrand } from "./utils";

/**
 * Phase 1 sender address — shared `notifications@abarva.com`. The
 * official mailing address is governed by the signed customer agreement
 * until notification settings carry the entity address directly.
 *
 * CAN-SPAM §5 requires a valid postal address on every commercial
 * message. We surface it on transactional + governance messages too
 * because it's lighter-weight to be uniformly compliant than to gate
 * by audit_class.
 */
export const SENDER_ADDRESS =
  "AbarVa, Inc. · official mailing address on file in customer agreement";

/** Default preferences page used by every unsubscribe footer. */
export const PREFERENCES_PATH = "/admin/users-access/notifications";

export interface EmailShellInput {
  /** Brand applied to the masthead. */
  tenant: TenantBrand;
  /** Rendered body fragment — already inline-styled HTML. */
  bodyHtml: string;
  /**
   * Human-readable reason this user is receiving the email, e.g.
   * "you're a tenant admin subscribed to approval.requested". Surfaced
   * as the first footer line per CAN-SPAM "clear and conspicuous"
   * identification requirement.
   */
  reason: string;
  /** ISO timestamp when the event was produced (audit tail). */
  producedAtIso: string;
  /** Notification event id (audit tail; matches the broker row). */
  eventId: string;
  /** Absolute or relative URL to the preferences page. */
  preferencesUrl?: string;
}

/**
 * Compose the full HTML message — masthead, body, footer. The output
 * is a single-column table layout that renders consistently across
 * Apple Mail, Outlook desktop, Gmail (web + iOS + Android), Outlook
 * web, and Yahoo Mail.
 */
export function renderEmailShell(input: EmailShellInput): string {
  const preferencesHref = input.preferencesUrl ?? PREFERENCES_PATH;
  const reason = escapeHtml(input.reason);
  const eventIdSafe = escapeHtml(input.eventId);
  const tsHuman = formatTs(input.producedAtIso);
  const tsRaw = escapeHtml(input.producedAtIso);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    "<title>AbarVa notification</title>",
    "</head>",
    "<body style=\"margin:0;padding:0;background:#F1EFE8;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1A1A1A;\">",
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#F1EFE8;">',
    "<tr>",
    '<td align="center" style="padding:32px 16px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="border-collapse:collapse;max-width:620px;width:100%;background:#F8F7F4;border:1px solid #E5E1D8;">',
    // ── Masthead ────────────────────────────────────────────────
    "<tr><td>",
    tenantHeader(input.tenant),
    "</td></tr>",
    // ── Body ────────────────────────────────────────────────────
    '<tr><td style="padding:28px 28px 8px 28px;">',
    input.bodyHtml,
    "</td></tr>",
    // ── Footer ──────────────────────────────────────────────────
    "<tr><td style=\"padding:28px 28px 24px 28px;border-top:1px solid #E5E1D8;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:#5B6C8A;\">",
    `<p style="margin:0 0 6px 0;">${escapeHtml(SENDER_ADDRESS)}</p>`,
    `<p style="margin:0 0 6px 0;">You're receiving this because ${reason}.</p>`,
    `<p style="margin:0 0 12px 0;"><a href="${escapeHtml(preferencesHref)}" style="color:#1A1A1A;text-decoration:underline;">Manage notification preferences</a> &nbsp;·&nbsp; <a href="${escapeHtml(preferencesHref)}" style="color:#1A1A1A;text-decoration:underline;">Unsubscribe</a></p>`,
    `<p style="margin:0;font-family:'JetBrains Mono','SF Mono',Menlo,Monaco,Consolas,monospace;font-size:11px;color:#5B6C8A;">Sent at ${escapeHtml(tsHuman)} · event ${eventIdSafe} · ts ${tsRaw}</p>`,
    "</td></tr>",
    "</table>",
    "</td>",
    "</tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("");
}

/**
 * Plain-text footer reused by every template's `text()` output.
 * CAN-SPAM applies equally to plain-text — physical address + reason +
 * unsubscribe link must be present.
 */
export function renderTextFooter(input: {
  reason: string;
  producedAtIso: string;
  eventId: string;
  preferencesUrl?: string;
}): string {
  const href = input.preferencesUrl ?? PREFERENCES_PATH;
  return [
    "",
    "---",
    SENDER_ADDRESS,
    `You're receiving this because ${input.reason}.`,
    `Manage preferences or unsubscribe: ${href}`,
    `Sent at ${formatTs(input.producedAtIso)} · event ${input.eventId} · ts ${input.producedAtIso}`,
  ].join("\n");
}

/**
 * Shared button HTML — locked black/ghost CTA per design system.
 */
export function renderCtaButton(label: string, href: string): string {
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:18px 0 6px 0;">',
    "<tr>",
    `<td style="background:#1A1A1A;border-radius:2px;">`,
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:500;color:#F8F7F4;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(label)}</a>`,
    "</td>",
    "</tr>",
    "</table>",
  ].join("");
}

/** Headline used at the top of every body — Georgia 22px, locked. */
export function renderHeadline(text: string): string {
  return `<h1 style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;font-size:22px;line-height:1.3;color:#1A1A1A;">${escapeHtml(text)}</h1>`;
}

/** Standard body paragraph — DM Sans 14px, ink color. */
export function renderParagraph(html: string): string {
  return `<p style="margin:0 0 12px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1A1A1A;">${html}</p>`;
}

/**
 * Key/value meta block — paper-soft chip with a row per pair. Used by
 * every template to surface payload context (program, requester, etc.)
 * without bloating the body copy.
 */
export function renderMetaBlock(
  pairs: ReadonlyArray<{ label: string; value: string }>,
): string {
  if (pairs.length === 0) return "";
  const rows = pairs
    .map(
      ({ label, value }) =>
        `<tr><td style="padding:6px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#5B6C8A;text-transform:uppercase;letter-spacing:0.06em;width:40%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#1A1A1A;vertical-align:top;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#F1EFE8;border:1px solid #E5E1D8;margin:12px 0 18px 0;">',
    '<tr><td style="padding:14px 18px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">',
    rows,
    "</table>",
    "</td></tr>",
    "</table>",
  ].join("");
}
