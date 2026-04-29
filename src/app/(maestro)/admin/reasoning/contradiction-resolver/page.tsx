// /admin/reasoning/contradiction-resolver — Guided contradiction resolution workflow.
//
// Pure server component, force-dynamic. For each active, unresolved contradiction
// across all instances, enumerates all derived resolution paths with descriptions
// and recommended actions. Sorted by instances affected descending, then severity.
//
// Architecture:
//   1. Run contradiction detector against all source + program instances
//   2. Exclude already-resolved contradictions via getResolvedEntries()
//   3. Group unresolved detections by templateId, collecting affected instances
//   4. Derive resolution paths from the template's resolutionPath prose
//   5. Sort by instance count desc, then severity
//   6. Render SummaryStrip + ResolverCard per template + QuickActionsBar

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction resolver · AbarVa Admin',
};

// ─── Domain types ─────────────────────────────────────────────────────────────

interface DerivedResolutionPath {
  /** 1-based index */
  index: number;
  /** Short title extracted from the resolution prose */
  name: string;
  /** Full description sentence(s) for this path */
  description: string;
  /** When to use this path — a heuristic trigger condition */
  useWhen: string;
}

interface ResolverEntry {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  partyA: string;
  partyB: string;
  detectionHint: string;
  resolutionPathRaw: string;
  resolutionPaths: DerivedResolutionPath[];
  affectedInstances: string[];
  /** Only 1 path → eligible for QuickActions button */
  isSinglePath: boolean;
}

interface PageData {
  entries: ResolverEntry[];
  totalContradictions: number;
  totalResolutionPaths: number;
  instancesNeedingAction: number;
}

// ─── Resolution path derivation ───────────────────────────────────────────────

/**
 * Given the raw `resolutionPath` prose for a template, derive a list of
 * structured resolution paths. We parse sentence boundaries, treat each
 * major action sentence as one path, and extract a short name + use-when
 * heuristic for each.
 *
 * This is a deterministic text-analysis pass — no LLM, no network.
 */
function deriveResolutionPaths(
  raw: string,
  templateId: string,
  severity: 'low' | 'medium' | 'high',
): DerivedResolutionPath[] {
  if (!raw || raw.trim().length === 0) {
    return [
      {
        index: 1,
        name: 'Manual review',
        description: 'No structured resolution path defined. Conduct a manual review with the relevant stakeholders.',
        useWhen: 'Always — no automated path available for this template.',
      },
    ];
  }

  // Split on sentence boundaries while keeping sentences together
  const sentences = raw
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length === 0) {
    return [
      {
        index: 1,
        name: 'Follow resolution guidance',
        description: raw.trim(),
        useWhen: 'Whenever this contradiction is detected as active.',
      },
    ];
  }

  // Group into up to 3 meaningful paths:
  // Path 1: Primary action (first sentence or first + second if second is short)
  // Path 2: Escalation / secondary action (remaining sentences, if any)
  // Path 3: Fallback / acceptance (derived from severity)
  const paths: DerivedResolutionPath[] = [];

  // Derive a short name from the first imperative verb + object
  function extractName(text: string): string {
    // Strip leading "Request", "Conduct", "Apply", "Compare", etc.
    const verbMatch = text.match(
      /^(Request|Conduct|Perform|Apply|Compare|Escalate|Flag|Document|Verify|Obtain|Collect|Review|Assess|Issue|Require|Schedule|Validate|Reject|Accept)\s+([^.]{4,40})/i,
    );
    if (verbMatch) {
      const verb = verbMatch[1];
      let obj = verbMatch[2].trim();
      // Truncate at first comma or conjunction
      obj = obj.split(/,|\bor\b|\band\b/)[0].trim();
      if (obj.length > 36) obj = obj.slice(0, 34) + '…';
      return `${verb} ${obj}`;
    }
    // Fallback: first 40 chars
    const fallback = text.slice(0, 40).trim();
    return fallback.endsWith('.') ? fallback.slice(0, -1) : fallback;
  }

  // Build use-when based on severity and position
  function buildUseWhen(index: number, total: number, sev: 'low' | 'medium' | 'high'): string {
    if (index === 1) {
      return sev === 'high'
        ? 'First response — execute immediately when the contradiction is detected.'
        : sev === 'medium'
          ? 'First response — execute within the current review cycle.'
          : 'Initial path — apply at the next scheduled review.';
    }
    if (index === 2) {
      return total >= 2
        ? 'If the primary path does not resolve the contradiction within one review cycle.'
        : 'Use when primary resolution is inconclusive or contested.';
    }
    return 'Use when both primary and secondary paths have been exhausted without resolution.';
  }

  if (sentences.length === 1) {
    paths.push({
      index: 1,
      name: extractName(sentences[0]),
      description: sentences[0],
      useWhen: buildUseWhen(1, 1, severity),
    });
    // Add a standard fallback for single-sentence paths
    if (severity !== 'low') {
      paths.push({
        index: 2,
        name: 'Escalate to selection committee',
        description: `Escalate ${templateId} as an unresolved contradiction to the selection committee for a binding decision if the primary path produces no resolution.`,
        useWhen: buildUseWhen(2, 2, severity),
      });
    }
  } else {
    // Group remaining sentences into at most 2 paths (primary + secondary)
    const primarySentences = sentences.slice(0, Math.ceil(sentences.length / 2));
    const secondarySentences = sentences.slice(Math.ceil(sentences.length / 2));

    paths.push({
      index: 1,
      name: extractName(primarySentences[0]),
      description: primarySentences.join(' '),
      useWhen: buildUseWhen(1, 2, severity),
    });

    if (secondarySentences.length > 0) {
      paths.push({
        index: 2,
        name: extractName(secondarySentences[0]),
        description: secondarySentences.join(' '),
        useWhen: buildUseWhen(2, 2, severity),
      });
    }

    // Add acceptance/escalation path for high severity
    if (severity === 'high') {
      paths.push({
        index: paths.length + 1,
        name: 'Accept as unresolvable tension',
        description: `If neither primary nor secondary path resolves ${templateId}, document the tension as accepted and apply a risk surcharge to the composite score. Flag to governance for ongoing monitoring.`,
        useWhen: buildUseWhen(3, 3, severity),
      });
    }
  }

  return paths;
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildPageData(): PageData {
  const allPatterns = getAllLifecyclePatterns();
  const resolvedEntries = getResolvedEntries();
  const resolvedIds = new Set(resolvedEntries.map((e) => e.id));

  // Build template metadata index: templateId → ContradictionTemplate
  const templateMeta = new Map<string, ContradictionTemplate & { patternTitle: string }>();
  for (const pattern of allPatterns) {
    for (const tmpl of pattern.contradictionTemplates as ContradictionTemplate[]) {
      if (!templateMeta.has(tmpl.id)) {
        templateMeta.set(tmpl.id, { ...tmpl, patternTitle: pattern.title });
      }
    }
  }

  // Collect all instances
  const allInstances: Array<{
    id: string;
    name: string;
    patternId: string;
    evidenceMap: Record<string, unknown>;
  }> = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    allInstances.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      evidenceMap: buildEvidenceMap(inst),
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    allInstances.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      evidenceMap: buildProgramEvidenceMap(inst),
    });
  }

  // Accumulator: templateId → set of affected instance names
  const acc = new Map<string, Set<string>>();

  for (const inst of allInstances) {
    const pattern = allPatterns.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;

    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(inst.evidenceMap);

    for (const detection of detections) {
      // Exclude already-resolved compound ids
      const compoundId = `${inst.id}::${detection.templateId}`;
      if (resolvedIds.has(compoundId)) continue;
      // Also exclude if just the templateId is resolved (legacy format)
      if (resolvedIds.has(detection.templateId)) continue;

      const existing = acc.get(detection.templateId) ?? new Set<string>();
      existing.add(inst.name);
      acc.set(detection.templateId, existing);
    }
  }

  // Build resolver entries
  const severityOrder: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const entries: ResolverEntry[] = Array.from(acc.entries())
    .map(([templateId, instanceSet]) => {
      const meta = templateMeta.get(templateId);
      const severity = meta?.severity ?? 'low';
      const resolutionPathRaw = meta?.resolutionPath ?? '';
      const resolutionPaths = deriveResolutionPaths(resolutionPathRaw, templateId, severity);

      return {
        templateId,
        label: meta?.label ?? templateId,
        severity,
        partyA: meta?.partyA ?? '',
        partyB: meta?.partyB ?? '',
        detectionHint: meta?.detectionHint ?? '',
        resolutionPathRaw,
        resolutionPaths,
        affectedInstances: Array.from(instanceSet).sort(),
        isSinglePath: resolutionPaths.length === 1,
      };
    })
    .sort((a, b) => {
      // Sort by instances affected descending, then severity
      if (b.affectedInstances.length !== a.affectedInstances.length) {
        return b.affectedInstances.length - a.affectedInstances.length;
      }
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const totalResolutionPaths = entries.reduce((sum, e) => sum + e.resolutionPaths.length, 0);
  // Instances needing action = unique instance names across all unresolved entries
  const allAffectedInstances = new Set<string>();
  for (const entry of entries) {
    for (const name of entry.affectedInstances) {
      allAffectedInstances.add(name);
    }
  }

  return {
    entries,
    totalContradictions: entries.length,
    totalResolutionPaths,
    instancesNeedingAction: allAffectedInstances.size,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: SHELL.CARD_WHITE,
  borderLeft: `4px solid ${COLORS.navy}`,
  borderTop: `1px solid ${COLORS.ink}10`,
  borderRight: `1px solid ${COLORS.ink}10`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}77`,
};

const MONO_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  letterSpacing: '0.02em',
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: PageData }) {
  const items = [
    { label: 'Unresolved contradictions', value: String(data.totalContradictions) },
    { label: 'Resolution paths available', value: String(data.totalResolutionPaths) },
    { label: 'Instances need action', value: String(data.instancesNeedingAction) },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: `${SPACING.md} ${SPACING.xl}`,
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={LABEL_STYLE}>{label}</span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 26,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const configs = {
    high: { bg: '#fde8e2', color: SHELL.RUST_TEXT, label: 'High' },
    medium: { bg: '#fdf3dc', color: '#8a6020', label: 'Medium' },
    low: { bg: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT, label: 'Low' },
  };
  const { bg, color, label } = configs[severity];

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function InstancePill({ name }: { name: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${COLORS.ink}08`,
        color: SHELL.INK_SOFT,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  );
}

function PathCard({
  path,
  templateId,
  isSingle,
}: {
  path: DerivedResolutionPath;
  templateId: string;
  isSingle: boolean;
}) {
  // Build a representative POST body snippet
  const sampleBody = JSON.stringify(
    {
      contradictionId: templateId,
      resolutionPath: path.name,
      resolvedBy: 'admin',
    },
    null,
    2,
  );

  return (
    <div
      style={{
        border: `1px solid ${COLORS.ink}0e`,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        background: COLORS.white,
      }}
    >
      {/* Path header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr',
          gap: SPACING.md,
          padding: `${SPACING.sm} ${SPACING.md}`,
          background: isSingle ? `${COLORS.navy}08` : `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}0e`,
          alignItems: 'center',
        }}
      >
        {/* Index badge */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: COLORS.navy,
            color: COLORS.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {path.index}
        </div>

        {/* Path name */}
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.005em',
          }}
        >
          {path.name}
        </span>
      </div>

      {/* Path detail grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* Description */}
        <div
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            borderRight: `1px solid ${COLORS.ink}0e`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={LABEL_STYLE}>Description</span>
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.ink,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {path.description}
          </p>
        </div>

        {/* Use when */}
        <div
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={LABEL_STYLE}>Use when…</span>
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {path.useWhen}
          </p>
        </div>
      </div>

      {/* API example */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.ink}0e`,
          padding: `${SPACING.sm} ${SPACING.md}`,
          background: `${COLORS.ink}03`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm, marginBottom: 6 }}>
          <span style={LABEL_STYLE}>API example</span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              background: `${COLORS.ink}08`,
              borderRadius: 3,
              padding: '1px 6px',
            }}
          >
            POST /api/reasoning/resolution
          </span>
        </div>
        <pre
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MID,
            background: `${COLORS.ink}07`,
            borderRadius: RADIUS.sm,
            padding: `${SPACING.sm} ${SPACING.md}`,
            margin: 0,
            overflowX: 'auto',
            lineHeight: 1.6,
          }}
        >
          {sampleBody}
        </pre>
      </div>
    </div>
  );
}

function ResolverCard({ entry }: { entry: ResolverEntry }) {
  return (
    <section style={CARD_STYLE}>
      {/* Card header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <SeverityBadge severity={entry.severity} />
            <span style={MONO_STYLE}>{entry.templateId}</span>
          </div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {entry.label}
          </h2>

          {/* Party claims */}
          {(entry.partyA || entry.partyB) && (
            <div
              style={{
                display: 'flex',
                gap: SPACING.md,
                flexWrap: 'wrap',
                marginTop: 2,
              }}
            >
              {entry.partyA && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: SHELL.RUST_TEXT,
                      paddingTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    A
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.4,
                    }}
                  >
                    {entry.partyA}
                  </span>
                </div>
              )}
              {entry.partyB && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: SHELL.INK_SOFT,
                      paddingTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    B
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.4,
                    }}
                  >
                    {entry.partyB}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instance count badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.navy,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {entry.affectedInstances.length}
          </span>
          <span style={{ ...LABEL_STYLE, marginTop: 2 }}>
            {entry.affectedInstances.length === 1 ? 'instance' : 'instances'}
          </span>
        </div>
      </header>

      {/* Affected instances */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0a`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ ...LABEL_STYLE, flexShrink: 0 }}>Affected instances</span>
        {entry.affectedInstances.map((name) => {
          const pillStyle: React.CSSProperties = {
            display: 'inline-block',
            background: `${COLORS.ink}08`,
            color: SHELL.INK_SOFT,
            borderRadius: RADIUS.pill,
            padding: '2px 9px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            whiteSpace: 'nowrap',
          };
          return <span key={name} style={pillStyle}>{name}</span>;
        })}
      </div>

      {/* Resolution paths */}
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.005em',
            }}
          >
            Resolution paths ({entry.resolutionPaths.length})
          </span>
          {entry.isSinglePath && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                fontStyle: 'italic',
              }}
            >
              Single-path — eligible for quick action
            </span>
          )}
        </div>

        {entry.resolutionPaths.map((path) => (
          <div key={path.index}>
            <PathCard
              path={path}
              templateId={entry.templateId}
              isSingle={entry.isSinglePath}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActionsBar({ entries }: { entries: ResolverEntry[] }) {
  const singlePathEntries = entries.filter((e) => e.isSinglePath);
  if (singlePathEntries.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0e`,
          background: `${COLORS.navy}06`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Quick actions
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Contradictions with a single clear resolution path — ready to act on directly
        </div>
      </header>

      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {singlePathEntries.map((entry) => (
          <div
            key={entry.templateId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${COLORS.ink}0e`,
              borderRadius: RADIUS.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <SeverityBadge severity={entry.severity} />
                <span style={MONO_STYLE}>{entry.templateId}</span>
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                  letterSpacing: '-0.005em',
                }}
              >
                {entry.label}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: SHELL.INK_SOFT,
                }}
              >
                Path: {entry.resolutionPaths[0]?.name ?? '—'}
              </span>
            </div>

            {/* Non-functional demo button */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                background: COLORS.navy,
                color: COLORS.white,
                borderRadius: RADIUS.pill,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'default',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              Resolve now
              <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.5,
      }}
    >
      No active unresolved contradictions found — all detected contradictions have been resolved
      or no templates fired against current instance evidence.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionResolverPage() {
  const data = buildPageData();
  const hasEntries = data.entries.length > 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Active contradictions"
          primaryActionHref="/admin/reasoning/contradictions"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction resolver"
        subtitle="Guided resolution workflow — all available resolution paths per active contradiction with recommended actions and API examples."
      >
        <SummaryStrip data={data} />

        {hasEntries ? (
          <>
            {data.entries.map((entry) => (
              <div key={entry.templateId}>
                <ResolverCard entry={entry} />
              </div>
            ))}
            <QuickActionsBar entries={data.entries} />
          </>
        ) : (
          <EmptyState />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
