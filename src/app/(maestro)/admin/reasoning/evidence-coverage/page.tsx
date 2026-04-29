// /admin/reasoning/evidence-coverage — Evidence map contents per instance.
//
// Server component. For each source event instance calls buildEvidenceMap()
// and classifies every key by category:
//   - Gate-mapped:    key matches a GateCriterion.id in the instance's pattern
//   - Derived:        computed fields (vendor-response-count, artifacts-count, etc.)
//   - Artifact flag:  key starts with "artifact-"
//   - Other:          instance evidence items not matching above
//
// Shows what data the gate evaluator sees when scoring each instance.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence coverage · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Keys that are computed/derived — not from instance.evidence items. */
const DERIVED_KEYS = new Set([
  'vendor-response-count',
  'bafo-vendor-responses',
  'vendors-shortlisted',
  'vendor-selected',
  'artifacts-count',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceCategory = 'gate-mapped' | 'derived' | 'artifact-flag' | 'other';

interface ClassifiedKey {
  key: string;
  value: unknown;
  category: EvidenceCategory;
  /** For gate-mapped keys: the matching criterion description. */
  criterionDescription?: string;
  /** For gate-mapped keys: the criterion gateType. */
  gateType?: string;
  /** For gate-mapped keys: whether the value is truthy. */
  gateMet?: boolean;
}

interface InstanceCoverage {
  instanceId: string;
  instanceName: string;
  patternId: string;
  patternTitle: string;
  keys: ClassifiedKey[];
  gateMappedCount: number;
  derivedCount: number;
  artifactFlagCount: number;
  otherCount: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function classifyKey(
  key: string,
  value: unknown,
  criteriaMap: Map<string, GateCriterion>,
): ClassifiedKey {
  // Gate-mapped?
  if (criteriaMap.has(key)) {
    const criterion = criteriaMap.get(key)!;
    return {
      key,
      value,
      category: 'gate-mapped',
      criterionDescription: criterion.description,
      gateType: criterion.gateType,
      gateMet: Boolean(value),
    };
  }

  // Derived computed fields
  if (DERIVED_KEYS.has(key)) {
    return { key, value, category: 'derived' };
  }

  // Artifact flags
  if (key.startsWith('artifact-')) {
    return { key, value, category: 'artifact-flag' };
  }

  // Everything else: instance evidence items
  return { key, value, category: 'other' };
}

function buildCriteriaMap(patternId: string): Map<string, GateCriterion> {
  const pattern = findLifecyclePattern(patternId);
  if (!pattern) return new Map();
  const map = new Map<string, GateCriterion>();
  for (const criterion of pattern.gateCriteria) {
    map.set(criterion.id, criterion);
  }
  return map;
}

/** Sort order: gate-mapped (truthy first) → derived → artifact-flag → other */
function sortKeys(keys: ClassifiedKey[]): ClassifiedKey[] {
  const ORDER: Record<EvidenceCategory, number> = {
    'gate-mapped': 0,
    derived: 1,
    'artifact-flag': 2,
    other: 3,
  };
  return [...keys].sort((a, b) => {
    const catDiff = ORDER[a.category] - ORDER[b.category];
    if (catDiff !== 0) return catDiff;
    // Within gate-mapped: truthy values first
    if (a.category === 'gate-mapped' && b.category === 'gate-mapped') {
      if (a.gateMet && !b.gateMet) return -1;
      if (!a.gateMet && b.gateMet) return 1;
    }
    return a.key.localeCompare(b.key);
  });
}

function computeCoverage(): InstanceCoverage[] {
  return SOURCE_EVENT_INSTANCES.map((instance) => {
    const evidenceMap = buildEvidenceMap(instance);
    const criteriaMap = buildCriteriaMap(instance.patternId);
    const pattern = findLifecyclePattern(instance.patternId);

    const classified = Object.entries(evidenceMap).map(([key, value]) =>
      classifyKey(key, value, criteriaMap),
    );
    const sorted = sortKeys(classified);

    return {
      instanceId: instance.id,
      instanceName: instance.name,
      patternId: instance.patternId,
      patternTitle: pattern?.title ?? instance.patternId,
      keys: sorted,
      gateMappedCount: sorted.filter((k) => k.category === 'gate-mapped').length,
      derivedCount: sorted.filter((k) => k.category === 'derived').length,
      artifactFlagCount: sorted.filter((k) => k.category === 'artifact-flag').length,
      otherCount: sorted.filter((k) => k.category === 'other').length,
    };
  });
}

// ─── Value display ────────────────────────────────────────────────────────────

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const truncated = value.length > 30 ? value.slice(0, 30) + '…' : value;
    return `"${truncated}"`;
  }
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return JSON.stringify(value).slice(0, 30);
}

function valueColor(key: ClassifiedKey): string {
  if (key.category === 'gate-mapped') {
    return key.gateMet ? COLORS.mintInk : COLORS.coralInk;
  }
  if (typeof key.value === 'boolean') {
    return key.value ? COLORS.mintInk : `${COLORS.ink}66`;
  }
  return `${COLORS.ink}cc`;
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}1a`,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `10px ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top',
};

// ─── Category chip ────────────────────────────────────────────────────────────

function CategoryChip({ category }: { category: EvidenceCategory }) {
  const palette: Record<EvidenceCategory, { bg: string; fg: string; label: string }> = {
    'gate-mapped': { bg: COLORS.skyPale, fg: COLORS.navy, label: 'Gate' },
    derived: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Derived' },
    'artifact-flag': { bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}bb`, label: 'Artifact' },
    other: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Other' },
  };
  const p = palette[category];
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      {p.label}
    </span>
  );
}

// ─── Count badge ──────────────────────────────────────────────────────────────

function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        color: `${COLORS.ink}88`,
        background: `${COLORS.ink}08`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
      }}
    >
      {count} {label}
    </span>
  );
}

// ─── Gate-type pill ───────────────────────────────────────────────────────────

function GateTypePill({ gateType }: { gateType: string }) {
  const isHard = gateType === 'hard';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isHard ? COLORS.coralSoft : COLORS.amberSoft,
        color: isHard ? COLORS.coralInk : COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '1px 6px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {gateType}
    </span>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ coverage }: { coverage: InstanceCoverage[] }) {
  const totalKeys = coverage.reduce((sum, c) => sum + c.keys.length, 0);
  const avg = coverage.length > 0 ? Math.round(totalKeys / coverage.length) : 0;
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}cc`,
        flexWrap: 'wrap',
      }}
    >
      <span>
        <strong style={{ color: COLORS.ink, fontFamily: TYPOGRAPHY.mono }}>
          {coverage.length}
        </strong>{' '}
        instance{coverage.length === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}33` }}>·</span>
      <span>
        avg{' '}
        <strong style={{ color: COLORS.ink, fontFamily: TYPOGRAPHY.mono }}>{avg}</strong>{' '}
        evidence keys per instance
      </span>
      <span style={{ color: `${COLORS.ink}33` }}>·</span>
      <span>
        <strong style={{ color: COLORS.ink, fontFamily: TYPOGRAPHY.mono }}>{totalKeys}</strong>{' '}
        total keys
      </span>
    </div>
  );
}

// ─── Instance section ─────────────────────────────────────────────────────────

function InstanceSection({ coverage }: { coverage: InstanceCoverage }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0d`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          {coverage.instanceName}
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {coverage.instanceId}
        </span>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <CountBadge count={coverage.keys.length} label="keys" />
        </div>
      </header>

      {/* Category summary row */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0d`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexWrap: 'wrap',
          background: `${COLORS.ink}03`,
        }}
      >
        <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}88`, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
          {coverage.patternTitle}
        </span>
        <span style={{ color: `${COLORS.ink}22` }}>|</span>
        {coverage.gateMappedCount > 0 && (
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.navy }}>
            <strong>{coverage.gateMappedCount}</strong> gate-mapped
          </span>
        )}
        {coverage.derivedCount > 0 && (
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.amberInk }}>
            <strong>{coverage.derivedCount}</strong> derived
          </span>
        )}
        {coverage.artifactFlagCount > 0 && (
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}99` }}>
            <strong>{coverage.artifactFlagCount}</strong> artifact flags
          </span>
        )}
        {coverage.otherCount > 0 && (
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.mintInk }}>
            <strong>{coverage.otherCount}</strong> other
          </span>
        )}
      </div>

      {/* Evidence table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: '40%' }}>Key</th>
              <th style={{ ...HEADER_CELL, width: '25%' }}>Value</th>
              <th style={{ ...HEADER_CELL, width: '15%' }}>Category</th>
              <th style={{ ...HEADER_CELL, width: '20%' }}>Gate type</th>
            </tr>
          </thead>
          <tbody>
            {coverage.keys.map((ek) => (
              <tr
                key={ek.key}
                style={{
                  background:
                    ek.category === 'gate-mapped' && ek.gateMet
                      ? `${COLORS.mintSoft}66`
                      : undefined,
                }}
              >
                {/* Key cell */}
                <td style={BODY_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ek.category === 'gate-mapped' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          background: COLORS.amberSoft,
                          color: COLORS.amberInk,
                          borderRadius: RADIUS.sm,
                          padding: '2px 8px',
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {ek.key}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 12,
                          color: `${COLORS.ink}cc`,
                        }}
                      >
                        {ek.key}
                      </span>
                    )}
                    {ek.criterionDescription && (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: `${COLORS.ink}66`,
                          lineHeight: 1.4,
                        }}
                      >
                        {ek.criterionDescription}
                      </span>
                    )}
                  </div>
                </td>

                {/* Value cell */}
                <td style={{ ...BODY_CELL, fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: valueColor(ek) }}>
                  {formatValue(ek.value)}
                </td>

                {/* Category chip */}
                <td style={BODY_CELL}>
                  <CategoryChip category={ek.category} />
                </td>

                {/* Gate type cell */}
                <td style={BODY_CELL}>
                  {ek.gateType ? (
                    <GateTypePill gateType={ek.gateType} />
                  ) : (
                    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}33` }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceCoveragePage() {
  const coverage = computeCoverage();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Evidence coverage"
        subtitle="Evidence map contents per instance — shows what data the gate evaluator sees when scoring each instance."
      >
        <SummaryStrip coverage={coverage} />
        {coverage.map((c) => {
          // React 19: key must live on a host element or fragment, not a
          // custom component whose props do not include `key`.
          return (
            <div key={c.instanceId}>
              <InstanceSection coverage={c} />
            </div>
          );
        })}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
