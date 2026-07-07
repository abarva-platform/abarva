// Wave 1 PR-3 (2026-05-30) · This component used to render its own AppShell +
// SubNavStrip. Per SETUP_AUDIT_2026-05-30_VERDICT §5.3, the canonical Setup
// surface uses AdminCanonShellV2 + AdminSidebar — the legacy 5-tab
// SUB_NAV_ITEMS pattern is dead. This file now exports the *content only*;
// /admin/audit/page.tsx wraps it in AdminCanonShellV2.
//
// Wave 1 PR-6 (2026-05-30) · accepts an optional `filterSource` prop driven
// by the landing-page AuditRibbon click (`/admin/audit?source=<source>`).
//
// Wave 2 PR-E (2026-05-30) · P0 Apex-leak fix. This component no longer
// imports `AUDIT_LOG_FIXTURE` directly — the fixture contains Apex-only
// content (APX-CDP-2026 events, AMS BAFO Stage 7, etc.) and rendering it
// for every tenant leaked Apex data to all 5 demo tenants. The page is
// now an async server component that reads via `getAdminAuditEvents`
// (tenant-scoped broker). Non-Apex tenants render the clean empty
// state (locked palette) until their tenant-scoped audit log is seeded.

import { SHELL } from "@/lib/shell/shell-tokens";
import { getAdminAuditEvents } from "@/lib/admin/data/admin-audit-log-adapter";
import type { AuditEntry } from "@/lib/setup/shell-setup-fixture";
import { mapAdminAuditToLegacyEntry } from "./audit-entry-mapper";

/**
 * Audit ribbon source filter · Wave 1 PR-6.
 *
 * The `/admin/audit?source=<source>` query param (set by the
 * landing-page ribbon click) maps each TrustSpine audit source to
 * the legacy fixture's `surface` string so we can scope the
 * rendered list without redesigning the audit page in this PR.
 *
 * - substrate / connector  → "Setup"  (the setup pipeline)
 * - approval               → "Programs" (approvals live here today)
 * - auth / invite          → "Setup"  (auth/invite events surface in Setup)
 * - policy                 → "Setup"  (policy edits live in Setup admin)
 *
 * If the param is unrecognized we fall back to the full list.
 */
export type AuditSourceFilter =
  | "substrate"
  | "auth"
  | "policy"
  | "connector"
  | "invite"
  | "approval";

const VALID_FILTERS: ReadonlySet<string> = new Set([
  "substrate",
  "auth",
  "policy",
  "connector",
  "invite",
  "approval",
]);

export function isAuditSourceFilter(
  value: string | null | undefined,
): value is AuditSourceFilter {
  return typeof value === "string" && VALID_FILTERS.has(value);
}

const SOURCE_TO_SURFACE: Record<AuditSourceFilter, ReadonlyArray<string>> = {
  substrate: ["Setup"],
  auth: ["Setup"],
  policy: ["Setup"],
  connector: ["Setup"],
  invite: ["Setup"],
  approval: ["Programs"],
};

function filterEntries(
  entries: ReadonlyArray<AuditEntry>,
  filter: AuditSourceFilter | null,
): AuditEntry[] {
  if (!filter) return [...entries];
  const allowed = SOURCE_TO_SURFACE[filter];
  return entries.filter((e) => allowed.includes(e.surface));
}

const SOURCE_LABEL: Record<AuditSourceFilter, string> = {
  substrate: "Substrate",
  auth: "Auth",
  policy: "Policy",
  connector: "Connector",
  invite: "Invite",
  approval: "Approval",
};

function severityDotColor(severity: AuditEntry["severity"]): string {
  if (severity === "critical") return SHELL.RUST_TEXT;
  if (severity === "warn") return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}

function AuditRow({ item }: { item: AuditEntry }) {
  const dotColor = severityDotColor(item.severity);

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: "1px solid " + SHELL.CARD_LINE_SOFT,
      }}
    >
      {/* Top row: timestamp + surface pill + severity dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            lineHeight: 1,
          }}
        >
          {item.timestamp}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: SHELL.GRAY_TEXT,
            background: SHELL.GRAY_BG,
            borderRadius: 8,
            padding: "2px 7px",
            lineHeight: 1,
          }}
        >
          {item.surface}
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Actor glyph + action */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: SHELL.PAPER_DEEP,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {item.actorInitials}
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            {item.action}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {item.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface SetupAuditPageProps {
  /**
   * Tenant slug for the active admin context. Required so the page
   * reads through the tenant-scoped broker instead of the legacy
   * Apex-only fixture. Wave 2 PR-E (2026-05-30) P0 Apex-leak fix.
   */
  tenantSlug: string;
  /**
   * Optional source filter from the landing-page audit ribbon click.
   * When set, only audit entries whose surface maps to that source
   * are rendered. Wave 1 PR-6 wiring; future PRs will replace the
   * surface heuristic with first-class source metadata on each row.
   */
  filterSource?: AuditSourceFilter | null;
}

export async function SetupAuditPage({
  tenantSlug,
  filterSource,
}: SetupAuditPageProps) {
  const events = await getAdminAuditEvents(tenantSlug);
  const mapped = events.map((event) => mapAdminAuditToLegacyEntry(event));
  const visible = filterEntries(mapped, filterSource ?? null);
  const criticalCount = visible.filter(
    (entry) => entry.severity === "critical",
  ).length;
  const warnCount = visible.filter((entry) => entry.severity === "warn").length;
  const headerTitle = filterSource
    ? `Audit log · ${SOURCE_LABEL[filterSource]} · ${visible.length} event${visible.length === 1 ? "" : "s"}`
    : `Audit log · ${visible.length} events`;
  // When the broker returns nothing (non-Apex fixture tenants today, or any
  // tenant whose admin_audit_log is empty), distinguish "tenant has no data
  // yet" from "filter excluded all rows". This keeps the empty state
  // honest for tenant admins instead of suggesting their filter is at
  // fault.
  const emptyReason: "no-events" | "filter-empty" | null =
    visible.length === 0
      ? mapped.length === 0
        ? "no-events"
        : "filter-empty"
      : null;

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        background: SHELL.PAPER,
        padding: "24px 32px",
      }}
    >
      {/* Eyebrow + header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: SHELL.INK_MUTED,
            marginBottom: 6,
            lineHeight: 1,
          }}
        >
          Setup
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: SHELL.PEACH_TEXT,
            marginBottom: 8,
            lineHeight: 1,
          }}
        >
          Canonical route · /admin/audit
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 24,
            fontWeight: 700,
            color: SHELL.INK,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {headerTitle}
        </h1>
        {filterSource && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/admin/audit"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: SHELL.INK,
                textDecoration: "none",
                borderBottom: "1px solid " + SHELL.CARD_LINE,
                paddingBottom: 1,
              }}
            >
              Clear filter · show all sources →
            </a>
            {filterSource === "approval" && (
              <>
                <AuditExportLink
                  href="/api/admin/programs/approvals/export?format=json"
                  label="Export approvals JSON"
                />
                <AuditExportLink
                  href="/api/admin/programs/approvals/export?format=csv"
                  label="Export approvals CSV"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}
      >
        <AuditChip label="Critical" value={criticalCount} tone="critical" />
        <AuditChip label="Warn" value={warnCount} tone="warn" />
        <AuditChip
          label="Info"
          value={visible.length - criticalCount - warnCount}
          tone="info"
        />
      </div>

      {/* Audit rows */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: "1px solid " + SHELL.CARD_LINE,
          borderRadius: 10,
          padding: visible.length === 0 ? "16px" : "0 16px",
        }}
      >
        {emptyReason !== null ? (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              padding: "4px 0",
            }}
          >
            {emptyReason === "filter-empty"
              ? "No audit events match this filter."
              : "No activity in this tenant yet."}
          </div>
        ) : (
          visible.map((entry) => <AuditRow key={entry.id} item={entry} />)
        )}
      </div>
    </div>
  );
}

function AuditExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: SHELL.PEACH_TEXT,
        textDecoration: "none",
        borderBottom: "1px solid " + SHELL.PEACH_TEXT,
        paddingBottom: 1,
      }}
    >
      {label} →
    </a>
  );
}

function AuditChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "critical" | "warn" | "info";
}) {
  const styles =
    tone === "critical"
      ? { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT }
      : tone === "warn"
        ? { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT }
        : { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: styles.text,
        background: styles.bg,
        borderRadius: 999,
        padding: "5px 11px",
        lineHeight: 1,
      }}
    >
      <span style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 700 }}>
        {value}
      </span>
      {label}
    </span>
  );
}
