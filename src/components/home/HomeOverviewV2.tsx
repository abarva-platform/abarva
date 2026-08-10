// HomeOverviewV2 · legacy Home overview component per the wireframe
// approved 2026-05-08. Renders the masthead + 5 sections inline:
//   01 Readiness across modules
//   02 Steward orientation (loaded vs missing + next-load)
//   03 Action queue
//   04 Recent activity
//   05 Admin action surfaces
//
// Type triad: Fraunces (display) · Inter (body) · JetBrains Mono
// (eyebrows / labels). Exposed as stable CSS variables in src/app/globals.css
// without build-time Google font fetches.
//
// All styles inline to match the wireframe at
// docs/training/setup-home-wireframe.html — single component, no
// CSS module needed for the first slice. Refactor into smaller
// components as the page evolves.

import { Suspense, type ReactNode } from "react";

import type { ClientKey } from "@/lib/client-config";
import type {
  ModuleReadinessV2,
  PanelStatusCard,
  HomeOverviewV2Extras,
} from "@/lib/admin/home-overview-v2";
import type { OverviewBlocks } from "@/lib/admin/overview-composer";
import type { TrustAuditEvent } from "@/lib/admin/broker/trust-spine-broker";
import { AuditRibbon } from "@/components/admin/AuditRibbon";
import {
  EmptyTenantUploadAffordance,
  PostureGrid,
  type PostureCard,
} from "@/components/admin/PostureGrid";
import { TrustStrip, type TrustStripChip } from "@/components/admin/TrustStrip";
import { PanelCardCta } from "@/components/home/PanelCardCta";
import {
  TenantSwitcher,
  type TenantSwitcherOption,
} from "@/components/admin/TenantSwitcher";
import {
  ActionQueueSkeleton,
  AuditRibbonSkeleton,
  PostureGridSkeleton,
  StewardOrientationSkeleton,
  TrustStripSkeleton,
} from "@/components/admin/skeletons";

const F_DISPLAY = "var(--font-fraunces), Georgia, serif";
const F_BODY =
  "var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: "#0A0C12",
  body: "#1F2433",
  muted: "#3D4454",
  faint: "#6B7280",
  navy: "#1B2B5C",
  navySoft: "rgba(27,43,92,0.06)",
  navyLine: "rgba(27,43,92,0.15)",
  teal: "#0E8A65",
  tealSoft: "rgba(14,138,101,0.09)",
  tealLine: "rgba(14,138,101,0.25)",
  amber: "#92400E",
  amberSoft: "rgba(146,64,14,0.08)",
  amberLine: "rgba(146,64,14,0.25)",
  red: "#991B1B",
  redSoft: "rgba(153,27,27,0.07)",
  redLine: "rgba(153,27,27,0.25)",
  border: "#D1D5DB",
  borderLight: "#E5E7EB",
  surface: "#FFFFFF",
  surface2: "#FBFAF7",
  surface3: "#F5F3EE",
};

interface TenantBrand {
  initials: string;
  bgColor: string;
  brandSoft: string;
  brandLine: string;
  industryLabel: string;
  tagline: string;
}

const TENANT_BRAND: Record<ClientKey, TenantBrand> = {
  meridian: {
    initials: "MH",
    bgColor: "#0F766E",
    brandSoft: "rgba(15,118,110,0.08)",
    brandLine: "rgba(15,118,110,0.20)",
    industryLabel: "Industry: Healthcare IDN",
    tagline: "Healthcare IDN · 30 hospitals · 280 ambulatory sites",
  },
  apexretail: {
    initials: "AR",
    bgColor: "#C2410C",
    brandSoft: "rgba(194,65,12,0.08)",
    brandLine: "rgba(194,65,12,0.20)",
    industryLabel: "Industry: Retail",
    tagline: "Omnichannel retail · 412 stores · $4.2B revenue",
  },
  arcturus: {
    initials: "FC",
    bgColor: "#1E3A8A",
    brandSoft: "rgba(30,58,138,0.08)",
    brandLine: "rgba(30,58,138,0.20)",
    industryLabel: "Industry: Financial Services",
    tagline: "Regional bank · $48B AUM · 142 branches",
  },
  northstar: {
    initials: "NS",
    bgColor: "#0F766E",
    brandSoft: "rgba(15,118,110,0.08)",
    brandLine: "rgba(15,118,110,0.20)",
    industryLabel: "Industry: Clinical Technology",
    tagline: "Clinical technology · $22.6B revenue · regulated AI products",
  },
  skyharbor: {
    initials: "SH",
    bgColor: "#075985",
    brandSoft: "rgba(7,89,133,0.08)",
    brandLine: "rgba(7,89,133,0.20)",
    industryLabel: "Industry: Global Airline",
    tagline: "Global airline · $52.1B revenue · IBM Z to AWS modernization",
  },
};

const FALLBACK_BRAND: TenantBrand = {
  initials: "·",
  bgColor: C.navy,
  brandSoft: C.navySoft,
  brandLine: C.navyLine,
  industryLabel: "Industry: —",
  tagline: "",
};

function fallbackInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[1]![0] ?? "")).toUpperCase();
}

interface Props {
  tenantName: string;
  clientKey: ClientKey | null;
  blocks: OverviewBlocks;
  extras: HomeOverviewV2Extras;
  /** Optional override tagline (defaults to brand-map tagline). */
  tagline?: string;
  /**
   * Wave 1 PR-5 · the four-chip Trust strip. Composed by the page
   * from `getTrustSpine` → `spineToChips`. When null, no spine is
   * available (e.g. broker resolution failed) and the strip is
   * omitted; the editorial header still renders so the page never
   * shows a full-page error.
   */
  trustChips?: ReadonlyArray<TrustStripChip> | null;
  /**
   * True iff `getSetupInventorySnapshot` returned a non-null snapshot
   * for the active tenant. Controls whether the "Substrate live" pill
   * renders — per verdict §5.6, that pill must NOT be unconditional.
   */
  liveSnapshotPresent?: boolean;
  /**
   * Wave 1 PR-6 · the unified audit ribbon events from the
   * TrustSpine broker. Surfaces as Zone E on the landing per the
   * verdict (`SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6). Pass [] to
   * render the empty-state line; omit to fall back to [].
   */
  auditEvents?: TrustAuditEvent[];
  /**
   * Wave 2 PR-5 · the inline masthead tenant-switcher chip.
   * - `canSwitchTenant === true` renders the TenantSwitcher chip
   *   ("acting as <Tenant> · switch") inline at the h1 baseline.
   * - `canSwitchTenant === false` (default) renders a static
   *   `<span>` with the same content; non-admins never see the
   *   switch affordance.
   * The 5 canonical tenants come from
   * `getCanonicalTenantSwitchOptions()` in
   * `src/lib/admin/tenant-switch-authority.ts`. The component
   * hard-validates the dropdown against this prop and only POSTs
   * canonical keys from the list.
   */
  canSwitchTenant?: boolean;
  /** Canonical key of the active tenant — required when canSwitchTenant is true. */
  currentCanonicalTenantKey?: string | null;
  /** The 5 canonical tenant options surfaced in the dropdown. */
  tenantSwitchOptions?: ReadonlyArray<TenantSwitcherOption>;
  /**
   * Wave 2 PR-4 · the 2×2 posture grid (Zone D, verdict §5.6).
   * Composed by the page from `spineToPostureCards(trustSpine)` and
   * passed through. When null/undefined the grid is omitted; an empty
   * spine should be expressed via `emptyPostureCards()` upstream so
   * the grid stays present with no-data state cards.
   */
  postureCards?: ReadonlyArray<PostureCard> | null;
  /**
   * Wave 3 PR-6 · brand-new-tenant empty-state contract.
   * True iff `trustSpine.substrate.segmentsTotal === 0` — meaning the
   * tenant has no substrate loaded yet. Switches three zones into
   * their editorial empty register per verdict §5.6:
   *   - Action queue   → single primary upload card.
   *   - Posture grid   → 4-column upload affordance (Organization /
   *                      KPIs / Vendors / Customer).
   *   - Steward orient → one editorial sentence (no two-column).
   * Existing non-empty paths are untouched.
   */
  emptyTenant?: boolean;
  /**
   * PR-2613 (P0 follow-up to PR-2606): true iff the live snapshot
   * broker (`getSetupInventorySnapshot`) threw, but the page still
   * has authored fallback content to render. Surfaces a "Live data
   * temporarily unavailable" banner above the Trust strip so users
   * see the divergence between the masthead pills (which read
   * authored counts) and the empty Trust strip / posture grid
   * (which depend on the broker spine). Pairs with a structured
   * `console.warn` in the page so Vercel logs carry the correlation
   * id (`admin_page.snapshot_load_failed_authored_fallback_active`).
   */
  snapshotLoadFailed?: boolean;
  /**
   * Wave 3 PR-7 · Per-zone streaming slots.
   *
   * When a slot is provided, the page wraps it in its own
   * `<Suspense>` boundary with the matching skeleton fallback. The
   * masthead remains synchronous and renders immediately; each zone
   * below streams independently as its async server component
   * resolves. No spinners — that's a founder principle per the
   * verdict §5.6 Loading state.
   *
   * Slot priority: when a slot is provided it WINS over the static
   * data prop for that zone (e.g. `trustStripSlot` supersedes
   * `trustChips`). The static props remain supported so existing
   * test fixtures and any synchronous caller (e.g. legacy DOM-order
   * tests) continue to render eagerly.
   */
  trustStripSlot?: ReactNode;
  actionQueueSlot?: ReactNode;
  postureGridSlot?: ReactNode;
  stewardOrientationSlot?: ReactNode;
  auditRibbonSlot?: ReactNode;
}

export function HomeOverviewV2({
  tenantName,
  clientKey,
  blocks,
  extras,
  tagline,
  trustChips,
  liveSnapshotPresent = false,
  auditEvents,
  canSwitchTenant = false,
  currentCanonicalTenantKey = null,
  tenantSwitchOptions,
  postureCards,
  emptyTenant = false,
  snapshotLoadFailed = false,
  trustStripSlot,
  actionQueueSlot,
  postureGridSlot,
  stewardOrientationSlot,
  auditRibbonSlot,
}: Props) {
  const known = clientKey ? TENANT_BRAND[clientKey] : undefined;
  const brand: TenantBrand = known ?? {
    ...FALLBACK_BRAND,
    initials: fallbackInitials(tenantName),
  };
  const taglineText = tagline ?? brand.tagline;

  return (
    <div
      data-testid="home-overview-v2"
      style={{
        background: C.surface2,
        fontFamily: F_BODY,
        color: C.body,
        minHeight: "100%",
      }}
    >
      {/* ── MASTHEAD ────────────────────────────────────────────────
          Verdict §5.6 Zone A: Tenant name, industry, refresh stamp.
          No logo tile, no brand color band — editorial black-on-cream.
          The 64×64 brand-initials tile that lived here through PR-H12
          was deleted in Wave 1 PR-5 per §5.4 "Brand-tile masthead
          avatar → DELETE. Replace with the Trust strip." */}
      <header
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.borderLight}`,
          padding: "28px 64px 22px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.faint,
              marginBottom: 6,
            }}
          >
            {/*
             * PRE-W4-PR-5 fix #6 (persona report §9 fix #6):
             *   Unify the three masthead labels — browser tab title is
             *   already "Setup · AbarVa" and the sidebar header reads
             *   "Setup · Admin", but this eyebrow used to read "HOME ·
             *   …". The conflict made the surface feel un-anchored to a
             *   single noun. Pick "SETUP" and use it consistently.
             */}
            SETUP ·{" "}
            <span style={{ color: C.ink }}>
              WHERE YOU STAND AND WHAT TO DO NEXT
            </span>
          </div>
          {/* Verdict §5.6 Zone A: the masthead carries a single inline
              switcher chip ("acting as <Tenant> · switch") for founder
              + multi-tenant admins. Non-admins see a static label in
              the same DOM slot (still inline with h1) so non-admin
              snapshots never carry the chip affordance. Wave 2 PR-5. */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 30,
                fontWeight: 400,
                color: C.ink,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
                margin: 0,
                marginBottom: 4,
              }}
            >
              {tenantName}
            </h1>
            {canSwitchTenant &&
            currentCanonicalTenantKey &&
            tenantSwitchOptions ? (
              <TenantSwitcher
                canSwitch
                currentCanonicalKey={currentCanonicalTenantKey}
                currentDisplayName={tenantName}
                options={tenantSwitchOptions}
              />
            ) : (
              <span
                data-testid="tenant-switcher-static"
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.faint,
                }}
              >
                Acting as · {tenantName}
              </span>
            )}
          </div>
          {taglineText && (
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              {taglineText}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Pill
              bg={brand.brandSoft}
              fg={brand.bgColor}
              border={brand.brandLine}
            >
              {brand.industryLabel}
            </Pill>
            <Pill>{extras.masthead.segmentsLoaded} segments loaded</Pill>
            <Pill>{extras.masthead.totalRecords.toLocaleString()} records</Pill>
            {liveSnapshotPresent && (
              <Pill bg={C.tealSoft} fg={C.teal} border={C.tealLine}>
                Substrate live
              </Pill>
            )}
            {extras.masthead.panelsAttention > 0 && (
              <Pill bg={C.amberSoft} fg={C.amber} border={C.amberLine}>
                {extras.masthead.panelsAttention} panel
                {extras.masthead.panelsAttention === 1 ? "" : "s"} need
                {extras.masthead.panelsAttention === 1 ? "s" : ""} attention
              </Pill>
            )}
            {extras.masthead.refreshedLabel && (
              <Pill muted>Refreshed {extras.masthead.refreshedLabel}</Pill>
            )}
          </div>
        </div>
      </header>

      {/* ── BROKER-FAILURE BANNER ────────────────────────────────────
          PR-2613 (P0 follow-up to PR-2606). When the live snapshot
          broker throws but the page has authored fallback content,
          this banner explains the divergence the user is seeing
          (masthead pills show 14 segments; trust strip shows 0).
          Locked palette amber. Hidden when snapshot loads cleanly
          or when there is no authored fallback to lean on. */}
      {snapshotLoadFailed && (
        <div
          data-testid="home-overview-v2-snapshot-load-failed"
          role="status"
          style={{
            background: C.amberSoft,
            borderBottom: `1px solid ${C.amberLine}`,
            padding: "12px 64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: F_BODY,
              fontSize: 13,
              color: C.amber,
              letterSpacing: "-0.005em",
            }}
          >
            <strong style={{ fontWeight: 600 }}>
              Live data temporarily unavailable.
            </strong>{" "}
            Showing authored baseline. Trust posture, action queue, and posture
            grid will refresh once the data plane responds.
          </div>
          <a
            href="/admin"
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.amber,
              textDecoration: "none",
              padding: "6px 12px",
              border: `1px solid ${C.amberLine}`,
              borderRadius: 4,
              background: C.surface,
            }}
          >
            Retry
          </a>
        </div>
      )}

      {/* ── TRUST STRIP (Zone B · 56px) ──────────────────────────────
          Verdict §5.6: four equal-width chips conveying the entire
          trust posture at a glance. Rendered between masthead and
          content; clicking jumps to the relevant group page.

          Wave 3 PR-7: if `trustStripSlot` is provided, wrap it in a
          Suspense boundary so the chip numbers stream in while the
          rest of the page renders. Otherwise fall back to the eager
          static-prop path so existing callers (tests, legacy
          renders) keep working. */}
      {trustStripSlot ? (
        <div
          data-testid="home-overview-v2-trust-strip"
          style={{
            background: C.surface,
            borderBottom: `1px solid ${C.borderLight}`,
            padding: "16px 64px 18px",
          }}
        >
          <Suspense fallback={<TrustStripSkeleton />}>
            {trustStripSlot}
          </Suspense>
        </div>
      ) : (
        trustChips &&
        trustChips.length > 0 && (
          <div
            data-testid="home-overview-v2-trust-strip"
            style={{
              background: C.surface,
              borderBottom: `1px solid ${C.borderLight}`,
              padding: "16px 64px 18px",
            }}
          >
            <TrustStrip chips={trustChips} />
          </div>
        )
      )}

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <main style={{ padding: "40px 64px 96px", maxWidth: 1280 }}>
        {/* Section 01 — Readiness across modules
            PRE-W4-PR-5 fix #7 (persona report §9 fix #7):
              For an empty tenant every module evaluates to ≤30%
              (red bucket). Rendering four red bars at the top of a
              brand-new tenant's first page punishes them on arrival.
              `composeHomeV2Extras` emits an empty `readiness` array in
              that case; we render a single editorial placeholder block
              naming what unblocks the readiness signal. */}
        <Section
          eyebrowNum="01"
          eyebrowLabel="OPERATIONAL POSTURE"
          title="Readiness across modules"
          lead="Each module shows live readiness derived from substrate, programs, source events, and initiative status — not aspiration."
        >
          {emptyTenant || extras.readiness.length === 0 ? (
            <div
              data-testid="home-overview-readiness-empty"
              style={{
                border: `1px solid ${C.borderLight}`,
                background: C.surface,
                borderRadius: 8,
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.navy,
                  marginBottom: 8,
                }}
              >
                No readiness signal yet
              </div>
              <p
                style={{
                  fontFamily: F_DISPLAY,
                  fontSize: 20,
                  fontWeight: 400,
                  color: C.ink,
                  lineHeight: 1.35,
                  letterSpacing: "-0.005em",
                  margin: 0,
                  maxWidth: "56ch",
                }}
              >
                Readiness will compute when your first dataset lands. Begin with
                org structure or KPI dictionary — those two unlock the Module 01
                (Tower) and Module 03 (Intelligence) signals first.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {extras.readiness.map((m) => (
                <ReadyCard key={m.name} mod={m} />
              ))}
            </div>
          )}
        </Section>

        <Rule />

        {/* Section 02 — Action queue
            Verdict §5.6 promotes the operator-first read: numbers
            and actions above prose. The Steward orientation block
            (previously Section 02) now lives below this queue.

            Wave 3 PR-7: when `actionQueueSlot` is provided, render
            it inside its own Suspense boundary so the queue can
            stream independently of the trust strip and posture grid.
            Wave 3 PR-6: when `emptyTenant` is true the queue is
            replaced with a single editorial primary card per §5.6.
            Slot wins over empty-state wins over static. */}
        {actionQueueSlot ? (
          <>
            <Section
              eyebrowNum="02"
              eyebrowLabel="WHAT NEEDS YOU TODAY"
              title="Action queue"
              lead="Listed in priority order — gate-blocking first, substrate-blocking next, advisory last."
            >
              <Suspense fallback={<ActionQueueSkeleton />}>
                {actionQueueSlot}
              </Suspense>
            </Section>
            <Rule />
          </>
        ) : emptyTenant ? (
          <>
            <Section
              eyebrowNum="02"
              eyebrowLabel="START HERE"
              title="No substrate yet"
              lead="A brand-new tenant has no segments loaded. Begin with one of the two highest-leverage uploads — Sentinel will start answering with provenance as soon as enterprise profile lands."
            >
              <EmptyTenantPrimaryCard />
            </Section>
            <Rule />
          </>
        ) : blocks.actionQueue.items.length > 0 ? (
          <>
            <Section
              eyebrowNum="02"
              eyebrowLabel="WHAT NEEDS YOU TODAY"
              title="Action queue"
              lead={`${blocks.actionQueue.items.length} item${blocks.actionQueue.items.length === 1 ? "" : "s"} pending. Listed in priority order — gate-blocking first, substrate-blocking next, advisory last.`}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {blocks.actionQueue.items.map((item, i) => {
                  const severityColor =
                    item.severity === "high"
                      ? C.red
                      : item.severity === "medium"
                        ? C.amber
                        : C.faint;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "32px 1fr auto",
                        alignItems: "center",
                        gap: 16,
                        padding: "14px 18px",
                        border: `1px solid ${C.borderLight}`,
                        background: C.surface,
                        borderRadius: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 11,
                          fontWeight: 700,
                          color: severityColor,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: C.ink,
                            marginBottom: 2,
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontFamily: F_MONO,
                            fontSize: 10.5,
                            color: C.faint,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.panelLabel.toUpperCase()} · {item.consequence}
                        </div>
                      </div>
                      <a
                        href={item.href}
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "6px 12px",
                          border: `1px solid ${C.ink}`,
                          color: i === 0 ? C.surface : C.ink,
                          background: i === 0 ? C.ink : C.surface,
                          borderRadius: 4,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Open
                      </a>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Rule />
          </>
        ) : null}

        {/* Section 02b — Posture grid · Wave 2 PR-4 · Zone D per the
            Trust Plane verdict §5.6. Inserted between the Action queue
            (02) and the Steward orientation (03) so the operator first
            sees what to do, then sees a 2×2 posture snapshot of the
            four trust dimensions, then reads the Steward voice. Card
            click jumps to the relevant group page.

            Wave 3 PR-7: when `postureGridSlot` is provided, wrap it
            in its own Suspense boundary so the four cards can stream
            independently.
            Wave 3 PR-6 · empty-tenant: 4-column upload affordance.
            Slot wins over empty wins over static. */}
        {postureGridSlot ? (
          <>
            <Section
              eyebrowNum="02b"
              eyebrowLabel="POSTURE AT A GLANCE"
              title="Trust posture"
              lead="Four cards — Substrate · Connector health · Auth & isolation · Approvals & policy. Each card pulls from the same TrustSpine that drives the strip above; click to jump into the group."
            >
              <Suspense fallback={<PostureGridSkeleton />}>
                {postureGridSlot}
              </Suspense>
            </Section>
            <Rule />
          </>
        ) : emptyTenant ? (
          <>
            <Section
              eyebrowNum="02b"
              eyebrowLabel="FIRST 4 DATASETS"
              title="Choose where to begin"
              lead="The first 4 datasets that unlock Sentinel's reasoning. Each upload pre-seeds the segment selector on Data Trust."
            >
              <EmptyTenantUploadAffordance />
            </Section>
            <Rule />
          </>
        ) : postureCards && postureCards.length > 0 ? (
          <>
            <Section
              eyebrowNum="02b"
              eyebrowLabel="POSTURE AT A GLANCE"
              title="Trust posture"
              lead="Four cards — Substrate · Connector health · Auth & isolation · Approvals & policy. Each card pulls from the same TrustSpine that drives the strip above; click to jump into the group."
            >
              <PostureGrid cards={postureCards} />
            </Section>
            <Rule />
          </>
        ) : null}

        {/* Section 03 — Steward orientation (moved below action queue
            in Wave 1 PR-5; verdict §5.6 Zone F — "Steward's read":
            retained as the editorial anchor below the operator
            actions, not as the opening block).

            Wave 3 PR-7: when `stewardOrientationSlot` is provided,
            wrap it in its own Suspense boundary. The skeleton holds
            the editorial shape so the page doesn't shift when the
            paragraph streams in. */}
        {stewardOrientationSlot ? (
          <Section
            eyebrowNum="03"
            eyebrowLabel="STEWARD VOICE"
            title="What's loaded, what's missing"
            lead="Steward watches what's been ingested, what depth it's reached, and what's still authored placeholder versus grounded fact. Read this before any module — it's the constraint on what the agents can say with confidence."
          >
            <Suspense fallback={<StewardOrientationSkeleton />}>
              {stewardOrientationSlot}
            </Suspense>
          </Section>
        ) : (
          <Section
            eyebrowNum="03"
            eyebrowLabel="STEWARD VOICE"
            title="What's loaded, what's missing"
            lead="Steward watches what's been ingested, what depth it's reached, and what's still authored placeholder versus grounded fact. Read this before any module — it's the constraint on what the agents can say with confidence."
          >
            <div
              style={{
                border: `1px solid ${C.borderLight}`,
                background: C.surface,
                borderRadius: 10,
                padding: "28px 28px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.navy,
                  marginBottom: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 9 }}>◆</span>
                Steward · Tenant orientation
              </div>
              {emptyTenant || blocks.orientation.isEmptyTenant ? (
                <p
                  data-testid="home-overview-steward-empty"
                  style={{
                    fontFamily: F_DISPLAY,
                    fontSize: 22,
                    fontWeight: 400,
                    color: C.ink,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                    margin: "0",
                    maxWidth: "60ch",
                  }}
                >
                  AbarVa has no substrate for this tenant. Once you load
                  enterprise profile, Sentinel can begin answering with
                  provenance.
                </p>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily: F_DISPLAY,
                      fontSize: 22,
                      fontWeight: 400,
                      color: C.ink,
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                      marginBottom: 18,
                      maxWidth: "60ch",
                      margin: "0 0 18px 0",
                    }}
                  >
                    {blocks.orientation.industryPhrase
                      ? `${blocks.orientation.industryPhrase}. `
                      : ""}
                    {blocks.orientation.loadedSummary.charAt(0).toUpperCase() +
                      blocks.orientation.loadedSummary.slice(1)}
                    {". "}
                    {blocks.orientation.missingSummary &&
                      `${blocks.orientation.missingSummary.charAt(0).toUpperCase() + blocks.orientation.missingSummary.slice(1)}.`}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                      paddingTop: 18,
                      borderTop: `1px dashed ${C.borderLight}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: C.teal,
                          marginBottom: 10,
                        }}
                      >
                        Loaded · grounded
                      </div>
                      <div
                        style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}
                      >
                        {blocks.orientation.loadedSummary}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: C.amber,
                          marginBottom: 10,
                        }}
                      >
                        Missing · authored only
                      </div>
                      <div
                        style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}
                      >
                        {blocks.orientation.missingSummary}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!emptyTenant &&
                !blocks.orientation.isEmptyTenant &&
                blocks.orientation.nextLoadName && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: "14px 16px",
                      background: C.navySoft,
                      borderLeft: `3px solid ${C.navy}`,
                      borderRadius: "0 6px 6px 0",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: F_MONO,
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: C.navy,
                        marginBottom: 4,
                      }}
                    >
                      Next load · highest leverage
                    </div>
                    <div
                      style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}
                    >
                      <strong style={{ fontWeight: 600 }}>
                        Strengthen &ldquo;{blocks.orientation.nextLoadName}
                        &rdquo;.
                      </strong>{" "}
                      {blocks.orientation.nextLoadConsequence}
                    </div>
                  </div>
                )}
            </div>
          </Section>
        )}

        <Rule />

        {/* Section 04 — Recent activity */}
        {blocks.recentActivity.items.length > 0 && (
          <>
            <Section
              eyebrowNum="04"
              eyebrowLabel="WHAT CHANGED"
              title="Recent activity"
              lead="Last events from the substrate audit log for this tenant."
            >
              <div
                style={{
                  borderLeft: `2px solid ${C.borderLight}`,
                  paddingLeft: 24,
                }}
              >
                {blocks.recentActivity.items.slice(0, 6).map((e, i) => {
                  const recent = i < 2;
                  return (
                    <div
                      key={e.id}
                      style={{
                        position: "relative",
                        padding: "10px 0",
                        display: "grid",
                        gridTemplateColumns: "110px 1fr",
                        gap: 18,
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: -29,
                          top: 18,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: recent ? C.tealSoft : C.surface,
                          border: `2px solid ${recent ? C.teal : C.navyLine}`,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.faint,
                        }}
                      >
                        {e.relativeTimestamp}
                      </span>
                      <span
                        style={{
                          fontSize: 13.5,
                          color: C.body,
                          lineHeight: 1.55,
                        }}
                      >
                        {e.summary}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Rule />
          </>
        )}

        {/* Section 05 — Admin action surfaces */}
        <Section
          eyebrowNum="05"
          eyebrowLabel="WHERE TO GO"
          title="Admin action surfaces"
          lead="Access, readiness, and audit controls for the active client."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {extras.panels.map((p) => (
              <PanelCard key={p.num} panel={p} />
            ))}
          </div>
        </Section>

        <Rule />

        {/* Section 06 — Audit ribbon · Wave 1 PR-6 · Zone E per the
            Trust Plane verdict. Renders even when empty so the page
            shape stays predictable for incident-response triage.

            Wave 3 PR-7: when `auditRibbonSlot` is provided, wrap it
            in its own Suspense boundary so it streams independently.
            Otherwise fall back to eager rendering with `auditEvents`. */}
        {auditRibbonSlot ? (
          <Suspense fallback={<AuditRibbonSkeleton />}>
            {auditRibbonSlot}
          </Suspense>
        ) : (
          <AuditRibbon events={auditEvents ?? []} />
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

/**
 * EmptyTenantPrimaryCard · Wave 3 PR-6 · §5.6 empty-state.
 *
 * Replaces the action queue for brand-new tenants. One primary
 * editorial card naming the first upload, plus two ghost suggestions
 * for the two highest-leverage starts (org structure · KPI dictionary)
 * per verdict §5.6.
 */
function EmptyTenantPrimaryCard() {
  return (
    <div
      data-testid="home-overview-empty-action-card"
      style={{ display: "grid", gap: 12 }}
    >
      <article
        style={{
          padding: "24px 26px 22px",
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderLeft: `3px solid ${C.ink}`,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.navy,
            marginBottom: 10,
          }}
        >
          Begin grounding
        </div>
        <h3
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 22,
            fontWeight: 400,
            color: C.ink,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            margin: "0 0 14px 0",
            maxWidth: "52ch",
          }}
        >
          Upload your first dataset to begin grounding.
        </h3>
        <a
          href="/admin/data-trust"
          data-testid="home-overview-empty-primary-cta"
          style={{
            display: "inline-block",
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${C.ink}`,
            color: C.surface,
            background: C.ink,
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          Open Data Trust
        </a>
      </article>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <a
          href="/admin/data-trust?segment=org_structure"
          data-testid="home-overview-empty-ghost-org"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "14px 16px",
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 6,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.faint,
            }}
          >
            Suggestion · highest leverage
          </span>
          <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>
            Start with org structure
          </span>
          <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
            Names the people Sentinel will cite — owners, approvers, reporting
            lines.
          </span>
        </a>
        <a
          href="/admin/data-trust?segment=kpi_dictionary"
          data-testid="home-overview-empty-ghost-kpi"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "14px 16px",
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 6,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.faint,
            }}
          >
            Suggestion · highest leverage
          </span>
          <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>
            Start with KPI dictionary
          </span>
          <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
            Defines the metrics Sentinel can reason about — formulas, owners,
            sources.
          </span>
        </a>
      </div>
    </div>
  );
}

function Section({
  eyebrowNum,
  eyebrowLabel,
  title,
  lead,
  children,
}: {
  eyebrowNum: string;
  eyebrowLabel: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.faint,
          marginBottom: 8,
        }}
      >
        {eyebrowNum} · <span style={{ color: C.navy }}>{eyebrowLabel}</span>
      </div>
      <h2
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 30,
          fontWeight: 400,
          color: C.ink,
          letterSpacing: "-0.012em",
          lineHeight: 1.15,
          marginBottom: 10,
          margin: "0 0 10px 0",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 15,
          color: C.muted,
          marginBottom: 22,
          maxWidth: "64ch",
          lineHeight: 1.6,
        }}
      >
        {lead}
      </p>
      {children}
    </section>
  );
}

function Rule() {
  return (
    <div style={{ height: 1, background: C.borderLight, margin: "36px 0" }} />
  );
}

function Pill({
  children,
  bg,
  fg,
  border,
  muted,
}: {
  children: React.ReactNode;
  bg?: string;
  fg?: string;
  border?: string;
  muted?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: F_MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "4px 9px",
        borderRadius: 3,
        border: `1px solid ${muted ? C.borderLight : (border ?? C.navyLine)}`,
        color: muted ? C.faint : (fg ?? C.navy),
        background: muted ? "transparent" : (bg ?? C.surface),
      }}
    >
      {children}
    </span>
  );
}

function ReadyCard({ mod }: { mod: ModuleReadinessV2 }) {
  const fillColor =
    mod.bucket === "teal" ? C.teal : mod.bucket === "amber" ? C.amber : C.red;
  return (
    <article
      style={{
        border: `1px solid ${C.borderLight}`,
        background: C.surface,
        borderRadius: 8,
        padding: 18,
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.faint,
          marginBottom: 6,
        }}
      >
        {mod.modulePrefix}
      </div>
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 17,
          fontWeight: 500,
          color: C.ink,
          letterSpacing: "-0.005em",
          marginBottom: 14,
        }}
      >
        {mod.name}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 26,
            fontWeight: 500,
            color: C.ink,
            letterSpacing: "-0.02em",
          }}
        >
          {mod.pct}
        </span>
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            color: C.faint,
            letterSpacing: "0.08em",
          }}
        >
          % READY
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: C.surface3,
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            background: fillColor,
            width: `${mod.pct}%`,
          }}
        />
      </div>
      <p
        style={{
          fontSize: 12,
          color: C.muted,
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        {mod.note}
      </p>
      <a
        href={mod.href}
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: C.navy,
          textDecoration: "none",
          textTransform: "uppercase",
          borderBottom: `1px solid ${C.navyLine}`,
          paddingBottom: 1,
        }}
      >
        Open {mod.name} →
      </a>
    </article>
  );
}

function PanelCard({ panel }: { panel: PanelStatusCard }) {
  const statusStyle =
    panel.status === "ready"
      ? { color: C.teal, borderColor: C.tealLine, background: C.tealSoft }
      : panel.status === "attn"
        ? { color: C.amber, borderColor: C.amberLine, background: C.amberSoft }
        : {
            color: C.faint,
            borderColor: C.borderLight,
            background: C.surface3,
          };
  return (
    <a
      href={panel.href}
      data-panel-num={panel.num}
      style={{
        border: `1px solid ${C.borderLight}`,
        background: C.surface,
        borderRadius: 8,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: C.faint,
          }}
        >
          {panel.num}
        </span>
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "2px 7px",
            borderRadius: 3,
            border: "1px solid",
            ...statusStyle,
          }}
        >
          {panel.status === "ready"
            ? "Ready"
            : panel.status === "attn"
              ? "Attn"
              : "Locked"}
        </span>
      </div>
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 18,
          fontWeight: 500,
          color: C.ink,
          letterSpacing: "-0.005em",
        }}
      >
        {panel.name}
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, flex: 1 }}>
        {panel.desc}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingTop: 8,
          borderTop: `1px solid ${C.borderLight}`,
        }}
      >
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            letterSpacing: "0.08em",
            color: C.faint,
          }}
        >
          {panel.foot}
        </span>
        {panel.cta ? (
          <PanelCardCta
            label={panel.cta.label}
            href={panel.cta.href}
            telemetryEvent={panel.cta.telemetryEvent}
          />
        ) : null}
      </div>
    </a>
  );
}
