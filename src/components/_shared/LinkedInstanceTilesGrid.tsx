/**
 * LinkedInstanceTilesGrid — cross-instance linked-tile row.
 *
 * Renders a horizontal row of compact `InstanceSummaryTile`s for every
 * instance that the current instance cascades to (downstream impacts) or
 * cascades from (upstream dependencies). Both directions are unioned and
 * deduplicated by canonical instance id, so the user sees one tile per
 * linked instance regardless of how many edges connect them.
 *
 * The tiles already navigate to the correct detail page on click, so this
 * grid is purely a layout shell + section header. Pure server-friendly:
 * no hooks, no IO, no randomness — same inputs always produce the same
 * markup.
 */
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { resolveAnyInstance } from '@/lib/reasoning/instance-resolver';
import {
  computeCascadeImpacts,
  computeReverseCascade,
  resolveLinkedInstance,
} from '@/lib/reasoning/cross-instance-reasoner';
import { InstanceSummaryTile } from './InstanceSummaryTile';

export interface LinkedInstanceTilesGridProps {
  /** Canonical id of the current instance (matches `instance.id`). */
  readonly currentInstanceId: string;
}

/**
 * Map a cascade-edge id (which may be a `displayId` such as `SRC-AMS-2026`
 * or a full instance id) to the canonical `instance.id` understood by
 * `InstanceSummaryTile` / `resolveAnyInstance`. Returns null if neither
 * the source-event nor program catalogue contains the id.
 */
function toCanonicalInstanceId(rawId: string): string | null {
  const linked = resolveLinkedInstance(rawId);
  if (linked === null) return null;
  return linked.instance.id;
}

const SECTION: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 16,
  marginBottom: 16,
};

const HEADER: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
};

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 10,
};

const EMPTY: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
  background: SHELL.CARD_WHITE,
  border: `1px dashed ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: '12px 14px',
  lineHeight: 1.5,
};

export function LinkedInstanceTilesGrid({
  currentInstanceId,
}: LinkedInstanceTilesGridProps) {
  const resolved = resolveAnyInstance(currentInstanceId);
  if (resolved === null) {
    return (
      <section
        data-testid="linked-instance-tiles-grid-missing"
        style={SECTION}
      >
        <div style={HEADER}>Linked instances · 0</div>
        <div style={EMPTY}>No linked instances</div>
      </section>
    );
  }

  const downstream = computeCascadeImpacts(resolved.instance);
  const upstream = computeReverseCascade(resolved.instance);

  // Union both directions. For downstream impacts the *other* end of the
  // edge is whichever endpoint isn't this instance — the reasoner emits
  // reverse-source impacts where the program is the target, so we have to
  // pick the non-self side rather than blindly taking targetInstanceId.
  const linkedRawIds = new Set<string>();
  for (const imp of downstream) {
    const sourceCanon = toCanonicalInstanceId(imp.sourceInstanceId);
    const targetCanon = toCanonicalInstanceId(imp.targetInstanceId);
    if (sourceCanon !== null && sourceCanon !== currentInstanceId) {
      linkedRawIds.add(sourceCanon);
    }
    if (targetCanon !== null && targetCanon !== currentInstanceId) {
      linkedRawIds.add(targetCanon);
    }
  }
  for (const link of upstream) {
    const canon = toCanonicalInstanceId(link.instanceId);
    if (canon !== null && canon !== currentInstanceId) {
      linkedRawIds.add(canon);
    }
  }

  const linkedIds = Array.from(linkedRawIds).sort();
  const count = linkedIds.length;

  if (count === 0) {
    return (
      <section data-testid="linked-instance-tiles-grid-empty" style={SECTION}>
        <div style={HEADER}>Linked instances · 0</div>
        <div style={EMPTY}>No linked instances</div>
      </section>
    );
  }

  return (
    <section data-testid="linked-instance-tiles-grid" style={SECTION}>
      <div style={HEADER}>Linked instances · {count}</div>
      <div style={GRID}>
        {linkedIds.map((id) => (
          <InstanceSummaryTile key={id} instanceId={id} size="compact" />
        ))}
      </div>
    </section>
  );
}

export default LinkedInstanceTilesGrid;
