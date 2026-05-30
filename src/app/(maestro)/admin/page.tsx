/**
 * /admin · Setup Overview · Setup Redesign Package PR A.
 *
 * Compressed from 7 sections to 4 small blocks per
 * `WIREFRAME_REFERENCE.html` Panel 1:
 *   - Block 1.1 StatusHeader
 *   - Block 1.2 StewardOrientation
 *   - Block 1.3 ActionQueue (hidden when empty)
 *   - Block 1.4 RecentActivity (hidden when empty)
 *
 * Substrate-related content (Act 1 fact cards, Capability
 * Constellation matrix, Client Data Landscape table, Act 3 upload
 * templates) migrated out — absorbed by Data Trust (PR B) and Agent
 * Readiness (PR C). Components remain in the codebase pending those
 * PRs.
 *
 * Wave 1 PR-3 (2026-05-30): introduces the AdminOverviewTabs strip
 * (Overview · Tenant) below the page header. `/admin/tenant` is
 * demoted to `?tab=tenant` here and the standalone route is removed
 * (301 redirect lives in src/proxy.ts).
 *
 * Wave 3 PR-7 (2026-05-30): the single `Promise.all` that previously
 * blocked the entire page on the slowest broker call has been broken
 * apart into per-zone async server components, each wrapped in its
 * own `<Suspense>` boundary inside `HomeOverviewV2`. The masthead
 * (Zone A) and the AdminOverviewTabs strip render immediately; the
 * trust strip, action queue, posture grid, steward orientation, and
 * audit ribbon each stream as their broker resolves. Skeletons live
 * in `src/components/admin/skeletons.tsx`. No spinners — per founder
 * principle in verdict §5.6 Loading state.
 *
 * The five zone components share broker calls via `React.cache`
 * helpers below so e.g. `getTrustSpine` runs once per request even
 * though four zones consume it.
 */

import { getActiveClientRow } from '@/lib/active-client';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import { getCapabilityGrounding } from '@/lib/admin/broker/capability-grounding-broker';
import {
  cachedApprovalQueue,
  cachedCrossProgramSignals,
  cachedInventorySnapshot,
  cachedTrustSpine,
} from '@/app/(maestro)/admin/_cached-helpers';
import { spineToChips, TrustStrip } from '@/components/admin/TrustStrip';
import {
  emptyPostureCards,
  PostureGrid,
  spineToPostureCards,
} from '@/components/admin/PostureGrid';
import { AuditRibbon } from '@/components/admin/AuditRibbon';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AdminOverviewTabs, resolveAdminOverviewTab } from '@/components/admin/AdminOverviewTabs';
import { AdminTenantTab } from '@/components/admin/AdminTenantTab';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { SetupLandingTelemetryBridge } from '@/components/admin/setup/SetupLandingTelemetryBridge';
import { HomeOverviewV2 } from '@/components/home/HomeOverviewV2';
import { StewardOrientationBlock } from '@/components/home/StewardOrientationBlock';
import { composeOverviewBlocks } from '@/lib/admin/overview-composer';
import { composeHomeV2Extras } from '@/lib/admin/home-overview-v2';
import { isClientKey } from '@/lib/client-config';
import { getOverviewSupplementalData } from '@/lib/admin/overview-data';
import {
  canSwitchActiveTenant,
  getCanonicalTenantSwitchOptions,
} from '@/lib/admin/tenant-switch-authority';
import { tenantProfileForClientKey } from '@/lib/tenant/aliases';

export const metadata = { title: 'Setup · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminOverviewSearchParams {
  tab?: string;
}

// ── Per-request broker caches (Wave 3 PR-7) ─────────────────────────
//
// The five zone components below each call the brokers they need.
// `React.cache` dedupes the call within a single request so the trust
// spine isn't refetched four times. Cached helpers were extracted to
// `./admin/_cached-helpers.ts` in PR-2613 (P0 follow-up to PR-2606)
// so the bare `catch { return null }` swallows that hid real broker
// failures behind "0 / no data yet" UI states could be replaced with
// structured JSON `console.warn` calls and exercised by Jest tests.

interface ZoneContext {
  brokerTenantKey: string | null;
  clientKey: string;
  clientId: string | null;
  activeClientDisplayName: string;
  industryCode: string | null;
  baseContentClientKey: string;
}

// ── Zone B · Trust strip (async server component) ───────────────────

async function TrustStripZone({ ctx }: { ctx: ZoneContext }) {
  const spine = await cachedTrustSpine(ctx.brokerTenantKey);
  const chips = spine ? spineToChips(spine) : null;
  if (!chips || chips.length === 0) return null;
  return <TrustStrip chips={chips} />;
}

// ── Zone C · Action queue (async server component) ──────────────────

async function ActionQueueZone({ ctx }: { ctx: ZoneContext }) {
  const [snapshot, signals, approvalQueue] = await Promise.all([
    cachedInventorySnapshot(ctx.brokerTenantKey),
    cachedCrossProgramSignals(ctx.brokerTenantKey),
    cachedApprovalQueue(ctx.clientKey),
  ]);
  const baseContent = getSetupActsContent(ctx.baseContentClientKey);
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const segments = snapshot
    ? snapshot.segments
    : buildAuthoredInventoryFallback(content).segments;
  const recentSnapshotActivity =
    snapshot?.recentActivity?.map((e) => ({
      actor: e.actor,
      what: e.what,
      timestamp: e.timestampIso,
    })) ?? [];
  const atlasHighSeverityCount = signals.filter((s) => s.severityBucket === 'high').length;
  const blocks = composeOverviewBlocks({
    tenantName: ctx.activeClientDisplayName,
    industryCode: ctx.industryCode,
    clientKey: ctx.clientKey,
    segments,
    content,
    programApprovalPendingCount: approvalQueue.length,
    atlasSignalCount: signals.length,
    atlasHighSeverityCount,
    ssoConfigured: false,
    recentSnapshotActivity,
  });
  if (blocks.actionQueue.items.length === 0) return null;
  return <ActionQueueRows items={blocks.actionQueue.items} />;
}

// ── Zone D · Posture grid (async server component) ──────────────────

async function PostureGridZone({ ctx }: { ctx: ZoneContext }) {
  const spine = await cachedTrustSpine(ctx.brokerTenantKey);
  const cards = spine ? spineToPostureCards(spine) : emptyPostureCards();
  return <PostureGrid cards={cards} />;
}

// ── Zone E · Audit ribbon (async server component) ──────────────────

async function AuditRibbonZone({ ctx }: { ctx: ZoneContext }) {
  const spine = await cachedTrustSpine(ctx.brokerTenantKey);
  const events = (spine?.audit.last24hEvents ?? []).slice(0, 6);
  return <AuditRibbon events={events} />;
}

// ── Zone F · Steward orientation (async server component) ───────────

async function StewardOrientationZone({ ctx }: { ctx: ZoneContext }) {
  const [snapshot, signals, approvalQueue] = await Promise.all([
    cachedInventorySnapshot(ctx.brokerTenantKey),
    cachedCrossProgramSignals(ctx.brokerTenantKey),
    cachedApprovalQueue(ctx.clientKey),
  ]);
  const baseContent = getSetupActsContent(ctx.baseContentClientKey);
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const segments = snapshot
    ? snapshot.segments
    : buildAuthoredInventoryFallback(content).segments;
  const recentSnapshotActivity =
    snapshot?.recentActivity?.map((e) => ({
      actor: e.actor,
      what: e.what,
      timestamp: e.timestampIso,
    })) ?? [];
  const atlasHighSeverityCount = signals.filter((s) => s.severityBucket === 'high').length;
  const blocks = composeOverviewBlocks({
    tenantName: ctx.activeClientDisplayName,
    industryCode: ctx.industryCode,
    clientKey: ctx.clientKey,
    segments,
    content,
    programApprovalPendingCount: approvalQueue.length,
    atlasSignalCount: signals.length,
    atlasHighSeverityCount,
    ssoConfigured: false,
    recentSnapshotActivity,
  });
  return <StewardOrientationBlock orientation={blocks.orientation} />;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<AdminOverviewSearchParams>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const activeTab = resolveAdminOverviewTab(params?.tab);

  // Synchronous, fast prelude — needed for the masthead and the shell.
  // PR-G (2026-05-30 · Apex-leak F8):
  //   Tenant identity flows through resolveAdminTenant — which throws into
  //   /admin/error.tsx when the active tenant cannot be resolved — instead
  //   of the prior `?? 'Apex Retail Group' / ?? 'apexretail'` fallbacks
  //   that were the single largest source of cross-tenant chrome leakage.
  //   getActiveClientRow() is still called to access industry_code / id /
  //   raw row metadata that resolveAdminTenant does not surface.
  const tenant = await resolveAdminTenant();
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName = tenant.tenantName;
  const clientKey = tenant.clientKey;
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  // Wave 3 PR-7 · per-zone streaming. Trust strip, action queue,
  // posture grid, Steward orientation, and audit ribbon each fetch
  // their own data inside their Suspense boundary. The big
  // Promise.all from earlier waves is gone — zones share broker
  // calls via React.cache helpers so getTrustSpine() etc. still run
  // once per request.

  // Wave 2 PR-5 · TenantSwitcher inputs. Resolved up-front because the
  // masthead chip is part of the synchronous editorial header.
  const canSwitchTenant = await canSwitchActiveTenant();
  const tenantSwitchOptions = getCanonicalTenantSwitchOptions();
  const currentCanonicalTenantKey = isClientKey(clientKey)
    ? tenantProfileForClientKey(clientKey).canonicalKey
    : null;

  // The page-level masthead pills require segment + record counts. We
  // resolve a single snapshot up-front for them; the per-zone async
  // components below re-use it via `cachedInventorySnapshot`. The
  // overview-supplemental load (programs/source/initiatives counts)
  // also flows into the masthead pills.
  const snapshot = await cachedInventorySnapshot(brokerTenantKey);
  const baseContent = getSetupActsContent(clientKey);
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const authoredFallbackSegments =
    buildAuthoredInventoryFallback(content).segments;
  const segments = snapshot ? snapshot.segments : authoredFallbackSegments;
  // PRE-W4-PR-5 fix #1 (persona report §9):
  //   `emptyTenant` was never set, leaving the W3-PR-6 empty-state
  //   code unreachable for brand-new tenants. Compute the flag here
  //   and pass it to HomeOverviewV2 so EmptyTenantPrimaryCard +
  //   EmptyTenantUploadAffordance unlock for tenants with no
  //   substrate loaded yet.
  //
  // PR-2613 (P0 follow-up to PR-2606): split "truly empty tenant" from
  // "snapshot load failed but we have authored content to show". When
  // the broker throws (logged via `logBrokerFailure` above), `snapshot`
  // is null but the authored fallback may still expose 14 segments —
  // historically that left the masthead pills truthfully reading "14
  // SEGMENTS LOADED" while the Trust strip lied with "0 / no data
  // yet". Now we surface a "Live data temporarily unavailable" banner
  // and a structured warn so we can correlate UI + Vercel logs.
  const snapshotLoadFailed =
    brokerTenantKey !== null &&
    snapshot === null &&
    authoredFallbackSegments.length > 0;
  if (snapshotLoadFailed) {
    console.warn(
      JSON.stringify({
        event: 'admin_page.snapshot_load_failed_authored_fallback_active',
        clientKey,
        brokerTenantKey,
        authoredSegmentsCount: authoredFallbackSegments.length,
      }),
    );
  }
  const emptyTenant =
    (!snapshot || snapshot.segments.length === 0) &&
    authoredFallbackSegments.length === 0;
  const clientId = activeClient?.id ?? null;
  // Wave 3 PR-1 · capability grounding still feeds the static
  // Section 05 (Setup panels) footer copy via composeHomeV2Extras.
  // PR-7 left this synchronous so the panel matrix renders eagerly.
  const capabilityGrounding = brokerTenantKey
    ? await getCapabilityGrounding(brokerTenantKey, {
        snapshotOverride: snapshot,
      }).catch(() => null)
    : null;
  const {
    programsCount,
    programsP6Count,
    sourceEventsCount,
    sourceEventsAtRiskCount,
    initiativesList,
  } = await getOverviewSupplementalData(clientKey, clientId);
  const initiativesAtRiskCount = initiativesList.filter((i) =>
    /risk|blocked|attention/i.test(i.statusFlag ?? ''),
  ).length;
  const extras = composeHomeV2Extras({
    segments,
    programsCount,
    programsP6Count,
    sourceEventsCount,
    sourceEventsAtRiskCount,
    initiativesCount: initiativesList.length,
    initiativesAtRiskCount,
    lastIngestedAt: snapshot?.lastIngestedAt ?? null,
    capabilityGrounding,
    // PRE-W4-PR-5 fix #7 (persona report §9):
    //   Suppress the all-red Section 01 readiness for empty tenants.
    //   When the substrate is empty, every module evaluates to ≤30%
    //   and renders four red bars — punishing a brand-new tenant.
    //   composeHomeV2Extras emits an empty `readiness` array in this
    //   case; HomeOverviewV2 renders the placeholder block instead.
    emptyTenant,
  });

  // For the section-01 (Readiness across modules) and section-05
  // (Setup panels) blocks the eager static composer still owns the
  // data path. They are part of the same `extras` payload. The
  // `blocks` static prop is left empty-shaped so the Suspense-driven
  // zones own the live content path.
  const emptyBlocks = composeOverviewBlocks({
    tenantName: activeClientDisplayName,
    industryCode: activeClient?.industry_code,
    clientKey,
    segments,
    content,
    programApprovalPendingCount: 0,
    atlasSignalCount: 0,
    atlasHighSeverityCount: 0,
    ssoConfigured: false,
    recentSnapshotActivity: [],
  });

  const ctx: ZoneContext = {
    brokerTenantKey,
    clientKey,
    clientId,
    activeClientDisplayName,
    industryCode: activeClient?.industry_code ?? null,
    baseContentClientKey: clientKey,
  };

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={activeClientDisplayName}>
      <AdminOverviewTabs activeTab={activeTab} />
      {activeTab === 'overview' ? (
        <HomeOverviewV2
          tenantName={activeClientDisplayName}
          clientKey={isClientKey(clientKey) ? clientKey : null}
          blocks={emptyBlocks}
          extras={extras}
          emptyTenant={emptyTenant}
          liveSnapshotPresent={snapshot !== null}
          snapshotLoadFailed={snapshotLoadFailed}
          canSwitchTenant={canSwitchTenant}
          currentCanonicalTenantKey={currentCanonicalTenantKey}
          tenantSwitchOptions={tenantSwitchOptions}
          trustStripSlot={<TrustStripZone ctx={ctx} />}
          actionQueueSlot={emptyTenant ? undefined : <ActionQueueZone ctx={ctx} />}
          postureGridSlot={emptyTenant ? undefined : <PostureGridZone ctx={ctx} />}
          stewardOrientationSlot={emptyTenant ? undefined : <StewardOrientationZone ctx={ctx} />}
          auditRibbonSlot={<AuditRibbonZone ctx={ctx} />}
        />
      ) : (
        <AdminTenantTab />
      )}
      <SetupLandingTelemetryBridge
        tenantKey={brokerTenantKey}
        tenantDataRichness={content.tenantDataRichness}
        totalRecords={segments.reduce((n, s) => n + s.recordCount, 0)}
        segmentsTracked={segments.length}
        capabilitiesGrounded={
          content.actTwoCapabilityNodes.filter((n) => n.depthState === 'grounded').length
        }
        liveSnapshotPresent={snapshot !== null}
      />
    </AdminCanonShellV2>
  );
}

// ── Inline presenter primitives ─────────────────────────────────────
//
// Two tiny presenter components extracted from `HomeOverviewV2` so the
// async server components above can hand back JSX without re-importing
// the locked design tokens. They mirror the styles in HomeOverviewV2
// for ActionQueue row + the (extracted) Steward block.

import type { ActionQueueItem } from '@/components/admin/overview/ActionQueue';

const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const Z_COLORS = {
  ink: '#0A0C12',
  faint: '#6B7280',
  amber: '#92400E',
  red: '#991B1B',
  surface: '#FFFFFF',
  borderLight: '#E5E7EB',
} as const;

function ActionQueueRows({ items }: { items: ActionQueueItem[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item, i) => {
        const severityColor =
          item.severity === 'high'
            ? Z_COLORS.red
            : item.severity === 'medium'
              ? Z_COLORS.amber
              : Z_COLORS.faint;
        return (
          <div
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              border: `1px solid ${Z_COLORS.borderLight}`,
              background: Z_COLORS.surface,
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 11,
                fontWeight: 700,
                color: severityColor,
                letterSpacing: '0.06em',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: Z_COLORS.ink,
                  marginBottom: 2,
                  letterSpacing: '-0.005em',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10.5,
                  color: Z_COLORS.faint,
                  letterSpacing: '0.04em',
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
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                border: `1px solid ${Z_COLORS.ink}`,
                color: i === 0 ? Z_COLORS.surface : Z_COLORS.ink,
                background: i === 0 ? Z_COLORS.ink : Z_COLORS.surface,
                borderRadius: 4,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Open
            </a>
          </div>
        );
      })}
    </div>
  );
}
