/**
 * audit-entry-mapper — Wave 2 PR-E (P0 Apex-leak fix · 2026-05-30).
 *
 * Bridges the canonical, tenant-scoped `AdminAuditEvent` shape
 * (returned by `getAdminAuditEvents(tenantSlug)`) into the legacy
 * `AuditEntry` shape that `SetupAuditPage` currently renders.
 *
 * Rationale: the existing card/row chrome of `SetupAuditPage` is
 * design-locked (AbarVa Design System v2 — DO NOT alter colors /
 * fonts / layout). Rather than rewriting the row UI on the same PR
 * that closes a P0 cross-tenant leak, we keep the visual contract
 * stable and reshape the broker response at the seam.
 *
 * PII hygiene: the mapper carries `summary` (already authored for
 * surface display in the fixture) and `action` only. It never
 * exposes `targetId`, `actorPersonId`, or any payload fingerprint.
 */

import type {
  AdminAuditCategory,
  AdminAuditEvent,
} from "@/lib/admin/data/admin-audit-log-adapter-types";
import type { AuditEntry } from "@/lib/setup/shell-setup-fixture";

/**
 * Map an admin audit category to the legacy surface label used by the
 * PR-6 source-filter wiring (`SOURCE_TO_SURFACE` in SetupAuditPage).
 *
 * - `approval` → "Programs" (matches PR-6 approval source filter).
 * - everything else → "Setup" (auth, role_change, connector, dataset,
 *   setup_progress, readiness_state, blocker, other).
 *
 * This keeps the existing `?source=approval` / `?source=auth` etc.
 * filters working without redesigning the audit page in this PR.
 */
export function surfaceForCategory(category: AdminAuditCategory): string {
  if (category === "approval") return "Programs";
  return "Setup";
}

/**
 * Map an admin audit category to a severity bucket. The legacy
 * `AuditEntry.severity` drives the colored dot + chip counts. We bias
 * conservatively: only true critical signals (`blocker`) get the
 * critical dot; warns are reserved for `readiness_state` (a state
 * transition operators must notice). Everything else is `info`.
 */
export function severityForCategory(
  category: AdminAuditCategory,
): AuditEntry["severity"] {
  if (category === "blocker") return "critical";
  if (category === "readiness_state") return "warn";
  return "info";
}

/**
 * Derive a stable 2-character glyph for the actor avatar circle.
 * Mirrors the existing fixture convention (e.g. "DC" for "David
 * Chen", "Sy" for "System").
 */
export function deriveActorInitials(
  actorDisplayName: string | null,
  actorPersonId: string | null,
): string {
  const raw = (actorDisplayName ?? "").trim();
  if (raw.length === 0) {
    // Fall back to first 2 chars of person id, or "—".
    if (actorPersonId && actorPersonId.length > 0) {
      return actorPersonId.slice(0, 2).toUpperCase();
    }
    return "—";
  }

  const parts = raw.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) return "—";
  if (parts.length === 1) {
    // Single word — first 2 chars, title-cased.
    const word = parts[0];
    if (word.length === 1) return word.toUpperCase();
    return (word[0].toUpperCase() + word[1].toLowerCase()).slice(0, 2);
  }
  // Multi-word — first letter of first two words, both upper-cased.
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Format an ISO timestamp into the legacy "MMM D · HH:MM" string the
 * fixture rows render (e.g. "Apr 27 · 14:22").
 */
export function formatLegacyTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const parts = TIMESTAMP_FORMATTER.formatToParts(new Date(ms));
  let month = "";
  let day = "";
  let hour = "";
  let minute = "";
  for (const part of parts) {
    if (part.type === "month") month = part.value;
    else if (part.type === "day") day = part.value;
    else if (part.type === "hour") hour = part.value;
    else if (part.type === "minute") minute = part.value;
  }
  if (!month || !day || !hour || !minute) return iso;
  return `${month} ${day} · ${hour}:${minute}`;
}

/**
 * Humanize an action verb (e.g. `approved_decision_grade` →
 * "Approved decision grade") so the legacy row's bold action line
 * stays readable.
 */
export function humanizeAction(action: string): string {
  if (action.length === 0) return action;
  const spaced = action.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (spaced.length === 0) return action;
  return spaced[0].toUpperCase() + spaced.slice(1);
}

/**
 * Reshape an `AdminAuditEvent` (broker contract) into the legacy
 * `AuditEntry` shape the design-locked row renderer expects.
 */
export function mapAdminAuditToLegacyEntry(
  event: AdminAuditEvent,
): AuditEntry {
  return {
    id: event.id,
    timestamp: formatLegacyTimestamp(event.createdAt),
    actor: event.actorDisplayName ?? "System",
    actorInitials: deriveActorInitials(
      event.actorDisplayName,
      event.actorPersonId,
    ),
    action: humanizeAction(event.action),
    surface: surfaceForCategory(event.category),
    detail: event.summary,
    severity: severityForCategory(event.category),
  };
}
