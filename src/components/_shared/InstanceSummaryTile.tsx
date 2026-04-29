/**
 * InstanceSummaryTile — reusable, server-friendly summary card for any
 * reasoning-layer instance (source event or program).
 *
 * The reasoning layer surfaces a recurring at-a-glance need across Tower,
 * Programs, and Source: "what's the current stage, how many gates have we
 * cleared, how many risks are open, what's the top mission?" Hand-coded
 * variants of this summary have proliferated. This component normalises that
 * summary by:
 *
 *   1. Resolving any instance via `resolveAnyInstance`.
 *   2. Building a synthesis context with the kind-appropriate builder
 *      (source → `buildSourceSynthesisContext`,
 *       program → `buildProgramSynthesisContext`).
 *   3. Deriving the verb-first mission queue via
 *      `deriveMissionsFromInstance` and picking the top mission.
 *   4. Rendering a normalised tile in `compact` (single row) or `full`
 *      (card) form, wrapped in an anchor that navigates to the instance
 *      detail page.
 *
 * Pure presentation: no IO, no Date.now(), no randomness. AbarVa palette only.
 */

import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { resolveAnyInstance } from '@/lib/reasoning/instance-resolver';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import {
  deriveMissionsFromInstance,
  type DerivedMission,
} from '@/lib/reasoning/mission-derivation';
import type { SynthesisContext } from '@/lib/reasoning/types';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { InstanceHealthBadge } from '@/components/_shared/InstanceHealthBadge';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Pick the single highest-priority mission from a derived mission list.
 * `deriveMissionsFromInstance` already returns missions sorted by
 * (priority → instanceId → stageId → criterionId), so the head is the
 * canonical "top" mission.
 *
 * Exported so callers (and tests) can compose the same selection logic
 * outside of the tile.
 */
export function pickTopMission(
  missions: readonly DerivedMission[],
): DerivedMission | null {
  if (missions.length === 0) return null;
  return missions[0] ?? null;
}

/**
 * Derive the appropriate detail-page href for a resolved instance kind.
 * Source events live under `/source/events/{id}`. Programs live under
 * `/tower/programs/{id}` (Tower's program scope route).
 */
function detailHrefFor(kind: 'source' | 'program', id: string): string {
  if (kind === 'source') return `/source/events/${id}`;
  return `/tower/programs/${id}`;
}

type StageStatus = 'ready' | 'in-progress' | 'blocked';

function deriveStageStatus(context: SynthesisContext): StageStatus {
  if (context.gatesSummary.blocked.length > 0) return 'blocked';
  const snapshot = context.instanceSnapshot as { canAdvance?: boolean } | undefined;
  if (snapshot?.canAdvance) return 'ready';
  return 'in-progress';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface InstanceSummaryTileProps {
  /** Id of the source event or program instance to summarise. */
  readonly instanceId: string;
  /**
   * Visual density. `compact` is a single horizontal row (~80px tall) for
   * portfolio strips; `full` renders an expanded card with all sections.
   * Defaults to `compact`.
   */
  readonly size?: 'compact' | 'full';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ANCHOR_RESET: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
};

const TILE_BASE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 14,
  fontFamily: SHELL.SANS,
  color: SHELL.INK,
};

const COMPACT_TILE: CSSProperties = {
  ...TILE_BASE,
  padding: '12px 14px',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 12,
  minHeight: 80,
};

const FULL_TILE: CSSProperties = {
  ...TILE_BASE,
  display: 'grid',
  gap: 10,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: SHELL.INK,
};

const DISPLAY_ID: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const PATTERN_BADGE: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const STAGE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MID,
};

const STATUS_PILL_BASE: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const META_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_SOFT,
};

const RIGHT_COL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 6,
};

const TOP_MISSION_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK,
  lineHeight: 1.4,
};

const TOP_MISSION_PREFIX: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  flexShrink: 0,
};

function statusPillStyle(status: StageStatus): CSSProperties {
  if (status === 'blocked') {
    return {
      ...STATUS_PILL_BASE,
      background: SHELL.RUST_BG,
      color: SHELL.RUST_TEXT,
    };
  }
  if (status === 'ready') {
    return {
      ...STATUS_PILL_BASE,
      background: SHELL.MINT_BG,
      color: SHELL.MINT_TEXT,
    };
  }
  return {
    ...STATUS_PILL_BASE,
    background: SHELL.PEACH_BG,
    color: SHELL.PEACH_TEXT,
  };
}

function statusLabel(status: StageStatus): string {
  if (status === 'blocked') return 'Blocked';
  if (status === 'ready') return 'Ready';
  return 'In progress';
}

// ─── Subviews ─────────────────────────────────────────────────────────────────

function MissingPlaceholder({ instanceId }: { instanceId: string }) {
  return (
    <div
      data-testid="instance-summary-tile-missing"
      style={{
        ...TILE_BASE,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_MUTED,
        fontStyle: 'italic',
      }}
    >
      Instance not found · {instanceId}
    </div>
  );
}

interface RenderedTileProps {
  readonly href: string;
  readonly title: string;
  readonly displayId: string;
  readonly patternTitle: string | null;
  readonly currentStage: string;
  readonly status: StageStatus;
  readonly gatesPassed: number;
  readonly gatesTotal: number;
  readonly gatesPending: number;
  readonly riskCount: number;
  readonly topMissionLabel: string | null;
  readonly health: ReturnType<typeof computeInstanceHealth>;
  readonly size: 'compact' | 'full';
}

function GatesAndRisks({
  gatesPassed,
  gatesTotal,
  gatesPending,
  riskCount,
}: {
  gatesPassed: number;
  gatesTotal: number;
  gatesPending: number;
  riskCount: number;
}) {
  return (
    <div style={META_ROW}>
      <span data-testid="instance-summary-tile-gates">
        {gatesPassed}/{gatesTotal} cleared, {gatesPending} pending
      </span>
      <span aria-hidden style={{ color: SHELL.INK_MUTED }}>·</span>
      <span
        data-testid="instance-summary-tile-risks"
        style={{
          color: riskCount > 0 ? SHELL.RUST_TEXT : SHELL.INK_SOFT,
          fontWeight: riskCount > 0 ? 600 : 400,
        }}
      >
        {riskCount} risk{riskCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function CompactTile(props: RenderedTileProps) {
  const { href, title, displayId, patternTitle, currentStage, status,
    gatesPassed, gatesTotal, gatesPending, riskCount, topMissionLabel } = props;
  return (
    <a
      href={href}
      data-testid="instance-summary-tile"
      data-size="compact"
      style={ANCHOR_RESET}
    >
      <article style={COMPACT_TILE}>
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={DISPLAY_ID}>{displayId}</span>
            <h3
              style={{
                ...TITLE_STYLE,
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
              title={title}
            >
              {title}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={STAGE_LABEL}>{currentStage}</span>
            <span style={statusPillStyle(status)} data-testid="instance-summary-tile-status">
              {statusLabel(status)}
            </span>
          </div>
          {topMissionLabel && (
            <div style={TOP_MISSION_ROW}>
              <span style={TOP_MISSION_PREFIX}>Top</span>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                data-testid="instance-summary-tile-top-mission"
                title={topMissionLabel}
              >
                {topMissionLabel}
              </span>
            </div>
          )}
        </div>
        <div style={RIGHT_COL}>
          {patternTitle && (
            <span style={PATTERN_BADGE} title={patternTitle}>
              {patternTitle}
            </span>
          )}
          <GatesAndRisks
            gatesPassed={gatesPassed}
            gatesTotal={gatesTotal}
            gatesPending={gatesPending}
            riskCount={riskCount}
          />
        </div>
      </article>
    </a>
  );
}

function FullTile(props: RenderedTileProps): ReactNode {
  const { href, title, displayId, patternTitle, currentStage, status,
    gatesPassed, gatesTotal, gatesPending, riskCount, topMissionLabel, health } = props;
  return (
    <a
      href={href}
      data-testid="instance-summary-tile"
      data-size="full"
      style={ANCHOR_RESET}
    >
      <article style={FULL_TILE}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'grid', gap: 2 }}>
            <span style={DISPLAY_ID}>{displayId}</span>
            <h3 style={{ ...TITLE_STYLE, fontSize: 18 }}>{title}</h3>
          </div>
          {patternTitle && (
            <span style={PATTERN_BADGE} title={patternTitle}>
              {patternTitle}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={STAGE_LABEL}>{currentStage}</span>
          <span style={statusPillStyle(status)} data-testid="instance-summary-tile-status">
            {statusLabel(status)}
          </span>
          <InstanceHealthBadge health={health} />
        </div>
        <GatesAndRisks
          gatesPassed={gatesPassed}
          gatesTotal={gatesTotal}
          gatesPending={gatesPending}
          riskCount={riskCount}
        />
        {topMissionLabel && (
          <div style={TOP_MISSION_ROW}>
            <span style={TOP_MISSION_PREFIX}>Top mission</span>
            <span data-testid="instance-summary-tile-top-mission" title={topMissionLabel}>
              {topMissionLabel}
            </span>
          </div>
        )}
      </article>
    </a>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Render a normalised summary tile for any reasoning instance.
 *
 * The tile is wrapped in an anchor so it functions as a click target for
 * triage. When the instance id resolves to nothing (e.g. stale link), a
 * muted placeholder is rendered in place of the tile so consumers can
 * still see _which_ instance was missing.
 */
export function InstanceSummaryTile({
  instanceId,
  size = 'compact',
}: InstanceSummaryTileProps) {
  const resolved = resolveAnyInstance(instanceId);
  if (resolved === null) {
    return <MissingPlaceholder instanceId={instanceId} />;
  }

  const { kind, instance } = resolved;
  const pattern = findLifecyclePattern(instance.patternId);

  let context: SynthesisContext;
  if (kind === 'source') {
    // Source events require a typed pattern; if missing we cannot evaluate
    // gates, so fall through to a minimal placeholder.
    if (pattern === undefined) {
      return <MissingPlaceholder instanceId={instanceId} />;
    }
    context = buildSourceSynthesisContext(instance, pattern);
  } else {
    // Program builder tolerates a missing pattern (shape-only fallback).
    context = buildProgramSynthesisContext(instance, pattern);
  }

  const missions = pattern
    ? deriveMissionsFromInstance(instance, pattern)
    : [];
  const topMission = pickTopMission(missions);

  const gatesPassed = context.gatesSummary.met;
  const gatesTotal = context.gatesSummary.total;
  const gatesPending = context.gatesSummary.unmet;
  const riskCount =
    context.activeContradictions.length + context.failureModes.length;
  const status = deriveStageStatus(context);
  const health = computeInstanceHealth(context);

  const tileProps: RenderedTileProps = {
    href: detailHrefFor(kind, instance.id),
    title: instance.name,
    displayId: instance.displayId ?? instance.id,
    patternTitle: pattern?.title ?? null,
    currentStage: context.currentStage,
    status,
    gatesPassed,
    gatesTotal,
    gatesPending,
    riskCount,
    topMissionLabel: topMission?.label ?? null,
    health,
    size,
  };

  return size === 'full' ? <FullTile {...tileProps} /> : <CompactTile {...tileProps} />;
}

export default InstanceSummaryTile;
