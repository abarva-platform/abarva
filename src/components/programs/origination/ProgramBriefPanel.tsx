'use client';

// ProgramBriefPanel · Surface 1 of Programs Strict Completion v1.2
//
// Right-pane companion to StewardChat. PR2 wires the reactive artifact
// channel: Steward emits structured artifacts (brief-field, pattern-match,
// cross-program-dependency, classification) which the workspace
// dispatches into the brief state below. The chat narrative stays
// conversational ("see the pattern card on your right"); the rich
// pattern card and field rows live here.
//
// OV2-1b · Two meta-artifact cards added at the top of the panel:
//   1. BriefProgressCard — single, summarises "X of N fields filled"
//      with a per-field checklist. Anchors the user's "where am I?"
//      view of the brief during origination.
//   2. OverlapAlertCard — one per active overlap alert. Surfaces
//      programs in the tenant portfolio that overlap the brief
//      (archetype / sponsor / system / multiple) so the user can
//      reconcile before committing.

import Link from 'next/link';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import type {
  BriefProgressArtifact,
  OverlapAlertArtifact,
} from '@/lib/agent/artifacts';

export interface ProgramBriefDraft {
  programName: string | null;
  problemStatement: string | null;
  targetOutcome: string | null;
  timeline: string | null;
  classification: string | null;
  matchedPatternId: string | null;
  sponsor: string | null;
  lead: string | null;
  crossProgramDependencies: string[];
}

export const EMPTY_BRIEF: ProgramBriefDraft = {
  programName: null,
  problemStatement: null,
  targetOutcome: null,
  timeline: null,
  classification: null,
  matchedPatternId: null,
  sponsor: null,
  lead: null,
  crossProgramDependencies: [],
};

/**
 * Pattern-match card data dispatched by the `pattern-match` artifact.
 * Renders as a prominent card inside the brief panel — the canonical
 * "see the pattern card on your right" reference target.
 */
export interface PatternMatchCard {
  patternId: string;
  name: string;
  summary: string;
  successRatePct?: number;
  deploymentCount?: number;
  typicalDurationMonths?: number;
}

export type ProgramSetupReadinessStatus = 'collecting' | 'review' | 'ready';

export interface ProgramSetupReadinessItem {
  id: keyof ProgramBriefDraft | 'overlapReview';
  label: string;
  status: 'complete' | 'missing' | 'review';
  detail: string;
}

export interface ProgramSetupReadiness {
  status: ProgramSetupReadinessStatus;
  completedRequired: number;
  totalRequired: number;
  headline: string;
  detail: string;
  items: ProgramSetupReadinessItem[];
}

const REQUIRED_SETUP_FIELDS: Array<{
  id: keyof ProgramBriefDraft;
  label: string;
  missingDetail: string;
}> = [
  {
    id: 'programName',
    label: 'Program name',
    missingDetail: 'Name the initiative Steward should submit.',
  },
  {
    id: 'problemStatement',
    label: 'Problem statement',
    missingDetail: 'Capture the business problem in plain language.',
  },
  {
    id: 'targetOutcome',
    label: 'Target outcome',
    missingDetail: 'Define the measurable outcome or direction of travel.',
  },
  {
    id: 'sponsor',
    label: 'Executive sponsor',
    missingDetail: 'Identify the accountable executive sponsor.',
  },
  {
    id: 'lead',
    label: 'Program lead',
    missingDetail: 'Identify the day-to-day owner, or confirm sponsor = lead.',
  },
  {
    id: 'classification',
    label: 'Classification',
    missingDetail: 'Classify the program so the right phase pack can attach.',
  },
];

function hasValue(value: ProgramBriefDraft[keyof ProgramBriefDraft]): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildProgramSetupReadiness(
  brief: ProgramBriefDraft,
  overlapAlerts: OverlapAlertArtifact[] = [],
): ProgramSetupReadiness {
  const requiredItems: ProgramSetupReadinessItem[] = REQUIRED_SETUP_FIELDS.map((field) => {
    const complete = hasValue(brief[field.id]);
    return {
      id: field.id,
      label: field.label,
      status: complete ? 'complete' : 'missing',
      detail: complete ? 'Captured in the brief.' : field.missingDetail,
    };
  });

  const completedRequired = requiredItems.filter((item) => item.status === 'complete').length;
  const items = [...requiredItems];
  if (overlapAlerts.length > 0) {
    items.push({
      id: 'overlapReview',
      label: 'Portfolio overlap review',
      status: 'review',
      detail:
        overlapAlerts.length === 1
          ? 'Review the active overlap before submit.'
          : `Review ${overlapAlerts.length} active overlaps before submit.`,
    });
  }

  if (completedRequired < REQUIRED_SETUP_FIELDS.length) {
    const remaining = REQUIRED_SETUP_FIELDS.length - completedRequired;
    return {
      status: 'collecting',
      completedRequired,
      totalRequired: REQUIRED_SETUP_FIELDS.length,
      headline: 'Collecting setup inputs',
      detail:
        remaining === 1
          ? 'One required item is still missing before Steward should submit.'
          : `${remaining} required items are still missing before Steward should submit.`,
      items,
    };
  }

  if (overlapAlerts.length > 0) {
    return {
      status: 'review',
      completedRequired,
      totalRequired: REQUIRED_SETUP_FIELDS.length,
      headline: 'Ready after overlap review',
      detail:
        'The brief has the required setup inputs. Reconcile overlap alerts before approving submission.',
      items,
    };
  }

  return {
    status: 'ready',
    completedRequired,
    totalRequired: REQUIRED_SETUP_FIELDS.length,
    headline: 'Ready to submit for approval',
    detail:
      'The brief has the minimum setup inputs for Steward to resolve people and submit the program.',
    items,
  };
}

interface BriefRowProps {
  label: string;
  value: string | null;
}

function BriefRow({ label, value }: BriefRowProps) {
  const filled = value !== null && value !== '';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 12,
        padding: '8px 0',
        borderBottom: `1px solid rgba(12,26,58,0.06)`,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: BrandColors.stone,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: filled ? BrandColors.inkBlack : BrandColors.stone,
          fontStyle: filled ? 'normal' : 'italic',
          lineHeight: 1.5,
        }}
      >
        {filled ? value : 'awaiting from Steward'}
      </span>
    </div>
  );
}

export interface ProgramBriefPanelProps {
  brief: ProgramBriefDraft;
  /** Optional rich pattern card; rendered above the field rows when present. */
  patternMatch?: PatternMatchCard | null;
  /**
   * OV2-1b · Latest brief-progress emission from Steward (one per turn).
   * Renders the "X of N fields filled" summary card above the field rows.
   */
  briefProgress?: BriefProgressArtifact | null;
  /**
   * OV2-1b · Active overlap alerts, deduped by overlapping program id.
   * Each entry renders as its own amber-tone alert card.
   */
  overlapAlerts?: OverlapAlertArtifact[];
  /** True once the user has confirmed and the registration tool is in flight. */
  registering?: boolean;
}

// ── OV2-1b · BriefProgressCard ───────────────────────────────────────────────
//
// Anchored at the top of the panel: tells the user "where am I?" in
// brief-builder terms. Renders the field checklist with status icons
// (filled / partial / empty) and, if present, a single short value
// preview line under each label.
//
// Glyph language reuses the existing panel's vocabulary: monospace
// uppercase eyebrow labels, a small status pill on the right, and
// one row per field separated by the same hairline border the BriefRow
// component uses. No new color tokens.

const VALUE_PREVIEW_MAX = 60;

function truncatePreview(value: string): string {
  if (value.length <= VALUE_PREVIEW_MAX) return value;
  return `${value.slice(0, VALUE_PREVIEW_MAX - 1).trimEnd()}…`;
}

function statusGlyph(status: 'empty' | 'partial' | 'filled'): string {
  switch (status) {
    case 'filled':
      return '✓';
    case 'partial':
      return '–';
    case 'empty':
      return '○';
  }
}

function statusColor(status: 'empty' | 'partial' | 'filled'): string {
  switch (status) {
    case 'filled':
      return BrandColors.signalBlue;
    case 'partial':
      return BrandColors.slate;
    case 'empty':
      return BrandColors.stone;
  }
}

function BriefProgressCard({ progress }: { progress: BriefProgressArtifact }) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.16)`,
        borderRadius: 8,
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(12,26,58,0.04)',
      }}
      aria-label="Brief progress"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: BrandColors.signalBlue,
            fontWeight: 700,
          }}
        >
          Brief progress
        </span>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.slate,
            fontWeight: 600,
          }}
        >
          {progress.fieldsFilled} of {progress.fieldsTotal} fields filled
        </span>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {progress.fields.map((field) => (
          <li
            key={field.id}
            style={{
              padding: '6px 0',
              borderTop: `1px solid rgba(12,26,58,0.06)`,
              display: 'grid',
              gridTemplateColumns: '18px 1fr',
              gap: 10,
              alignItems: 'baseline',
            }}
          >
            <span
              role="img"
              aria-label={`${field.status}`}
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 12,
                color: statusColor(field.status),
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {statusGlyph(field.status)}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 12,
                  color:
                    field.status === 'empty' ? BrandColors.stone : BrandColors.inkBlack,
                  fontWeight: field.status === 'empty' ? 400 : 500,
                  lineHeight: 1.4,
                }}
              >
                {field.label}
              </span>
              {field.value ? (
                <span
                  style={{
                    fontFamily: BrandTypography.sans,
                    fontSize: 12,
                    color: BrandColors.slate,
                    lineHeight: 1.45,
                  }}
                >
                  {truncatePreview(field.value)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const OVERLAP_AMBER = '#B45309';
const OVERLAP_AMBER_SOFT = 'rgba(180, 83, 9, 0.08)';
const OVERLAP_AMBER_BORDER = 'rgba(180, 83, 9, 0.32)';

function readinessColor(status: ProgramSetupReadinessStatus): string {
  switch (status) {
    case 'ready':
      return BrandColors.signalBlue;
    case 'review':
      return OVERLAP_AMBER;
    case 'collecting':
      return BrandColors.stone;
  }
}

function readinessSoftBackground(status: ProgramSetupReadinessStatus): string {
  switch (status) {
    case 'ready':
      return `${BrandColors.signalBlue}0D`;
    case 'review':
      return OVERLAP_AMBER_SOFT;
    case 'collecting':
      return '#FFFFFF';
  }
}

function readinessItemGlyph(status: ProgramSetupReadinessItem['status']): string {
  switch (status) {
    case 'complete':
      return '✓';
    case 'review':
      return '!';
    case 'missing':
      return '○';
  }
}

function SetupReadinessCard({ readiness }: { readiness: ProgramSetupReadiness }) {
  const accent = readinessColor(readiness.status);
  return (
    <section
      aria-label="Setup readiness"
      style={{
        background: readinessSoftBackground(readiness.status),
        border: `1px solid ${
          readiness.status === 'collecting' ? 'rgba(12,26,58,0.16)' : `${accent}55`
        }`,
        borderRadius: 8,
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(12,26,58,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: accent,
            fontWeight: 700,
          }}
        >
          Setup readiness
        </span>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.slate,
            fontWeight: 600,
          }}
        >
          {readiness.completedRequired} of {readiness.totalRequired} required
        </span>
      </div>
      <h3
        style={{
          margin: '0 0 4px',
          fontFamily: BrandTypography.serif,
          fontSize: 17,
          fontWeight: 500,
          color: BrandColors.inkBlack,
          lineHeight: 1.3,
        }}
      >
        {readiness.headline}
      </h3>
      <p
        style={{
          margin: '0 0 10px',
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: BrandColors.slate,
          lineHeight: 1.55,
        }}
      >
        {readiness.detail}
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {readiness.items.map((item) => (
          <li
            key={item.id}
            style={{
              padding: '6px 0',
              borderTop: `1px solid rgba(12,26,58,0.06)`,
              display: 'grid',
              gridTemplateColumns: '18px 1fr',
              gap: 10,
              alignItems: 'baseline',
            }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 12,
                color:
                  item.status === 'complete'
                    ? BrandColors.signalBlue
                    : item.status === 'review'
                      ? OVERLAP_AMBER
                      : BrandColors.stone,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {readinessItemGlyph(item.status)}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 12,
                  color: item.status === 'missing' ? BrandColors.stone : BrandColors.inkBlack,
                  fontWeight: item.status === 'missing' ? 400 : 500,
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 12,
                  color: BrandColors.slate,
                  lineHeight: 1.45,
                }}
              >
                {item.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── OV2-1b · OverlapAlertCard ────────────────────────────────────────────────
//
// Amber alert-tone card. Re-uses the AbarVa amber tokens from the
// abarva-theme palette (already in use by DeliverableEvidenceTracePanel
// and ProgramSurface chips for the same warning semantic). The card is
// a clickable Link to the existing program so the user can reconcile.

function overlapKindLabel(kind: OverlapAlertArtifact['overlapKind']): string {
  switch (kind) {
    case 'archetype':
      return 'archetype';
    case 'sponsor':
      return 'sponsor';
    case 'system':
      return 'system';
    case 'multiple':
      return 'multiple — archetype + sponsor';
  }
}

function OverlapAlertCard({ alert }: { alert: OverlapAlertArtifact }) {
  return (
    <Link
      href={`/programs/${alert.overlappingProgramId}`}
      style={{
        display: 'block',
        background: OVERLAP_AMBER_SOFT,
        border: `1px solid ${OVERLAP_AMBER_BORDER}`,
        borderRadius: 8,
        padding: '14px 16px',
        textDecoration: 'none',
        color: BrandColors.inkBlack,
      }}
      aria-label={`Overlap with existing program ${alert.overlappingProgramName}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: OVERLAP_AMBER,
            fontWeight: 700,
          }}
        >
          Overlap with existing program
        </span>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.stone,
          }}
        >
          {alert.overlappingProgramId}
        </span>
      </div>
      <div
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: 15,
          fontWeight: 500,
          color: BrandColors.inkBlack,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {alert.overlappingProgramName}
        {alert.overlappingProgramPhase ? (
          <span
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 11,
              color: BrandColors.slate,
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            · {alert.overlappingProgramPhase}
          </span>
        ) : null}
      </div>
      <p
        style={{
          margin: '0 0 8px',
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: BrandColors.slate,
          lineHeight: 1.55,
        }}
      >
        {alert.overlapDetail}
      </p>
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: OVERLAP_AMBER,
          fontWeight: 600,
        }}
      >
        Overlap kind · {overlapKindLabel(alert.overlapKind)}
      </span>
    </Link>
  );
}

function PatternMatchCardView({ card }: { card: PatternMatchCard }) {
  const stats: Array<{ label: string; value: string }> = [];
  if (typeof card.successRatePct === 'number') {
    stats.push({ label: 'success rate', value: `${card.successRatePct}%` });
  }
  if (typeof card.deploymentCount === 'number') {
    stats.push({ label: 'deployments', value: `${card.deploymentCount}` });
  }
  if (typeof card.typicalDurationMonths === 'number') {
    stats.push({ label: 'typical duration', value: `${card.typicalDurationMonths} mo` });
  }
  return (
    <a
      href={`/source/patterns/${card.patternId}`}
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.16)`,
        borderRadius: 8,
        padding: '14px 16px',
        textDecoration: 'none',
        color: BrandColors.inkBlack,
        boxShadow: '0 1px 3px rgba(12,26,58,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: BrandColors.signalBlue,
            fontWeight: 700,
          }}
        >
          Matched pattern
        </span>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.stone,
          }}
        >
          {card.patternId}
        </span>
      </div>
      <div
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: 17,
          fontWeight: 500,
          color: BrandColors.inkBlack,
          lineHeight: 1.3,
          marginBottom: 6,
        }}
      >
        {card.name}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: BrandColors.slate,
          lineHeight: 1.55,
        }}
      >
        {card.summary}
      </p>
      {stats.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          {stats.map((s) => (
            <span
              key={s.label}
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 11,
                color: BrandColors.stone,
              }}
            >
              <span style={{ color: BrandColors.inkBlack, fontWeight: 600 }}>{s.value}</span>
              {' '}
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </a>
  );
}

export function ProgramBriefPanel({
  brief,
  patternMatch,
  briefProgress = null,
  overlapAlerts = [],
  registering = false,
}: ProgramBriefPanelProps) {
  const setupReadiness = buildProgramSetupReadiness(brief, overlapAlerts);
  return (
    <aside
      style={{
        background: BrandColors.paper,
        border: `1px solid rgba(12,26,58,0.12)`,
        borderRadius: 10,
        padding: '20px 22px',
        fontFamily: BrandTypography.sans,
        color: BrandColors.inkBlack,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        minHeight: 0,
      }}
      aria-label="Program brief"
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BrandColors.stone,
            fontWeight: 700,
          }}
        >
          Program brief
        </span>
        <h2
          style={{
            fontFamily: BrandTypography.serif,
            fontSize: 22,
            fontWeight: 400,
            color: BrandColors.inkBlack,
            margin: 0,
          }}
        >
          {brief.programName ?? 'Untitled program'}
        </h2>
      </header>

      <SetupReadinessCard readiness={setupReadiness} />

      {/* OV2-1b · Brief Progress sits at the top — user's "where am I?" anchor. */}
      {briefProgress ? <BriefProgressCard progress={briefProgress} /> : null}

      {/* OV2-1b · Overlap alerts surface above the field rows so portfolio
          collisions are visible before the user finishes the brief. */}
      {overlapAlerts.length > 0
        ? overlapAlerts.map((alert) => (
            <OverlapAlertCard key={alert.overlappingProgramId} alert={alert} />
          ))
        : null}

      {patternMatch ? <PatternMatchCardView card={patternMatch} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <BriefRow label="Problem" value={brief.problemStatement} />
        <BriefRow label="Outcome" value={brief.targetOutcome} />
        <BriefRow label="Timeline" value={brief.timeline} />
        <BriefRow label="Classification" value={brief.classification} />
        {patternMatch ? null : <BriefRow label="Matched pattern" value={brief.matchedPatternId} />}
        <BriefRow label="Sponsor" value={brief.sponsor} />
        <BriefRow label="Lead" value={brief.lead} />
      </div>

      {brief.crossProgramDependencies.length > 0 ? (
        <section>
          <span
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: BrandColors.stone,
              fontWeight: 600,
            }}
          >
            Cross-program dependencies
          </span>
          <ul style={{ margin: '6px 0 0', paddingLeft: '1.1em', fontSize: 13, lineHeight: 1.6 }}>
            {brief.crossProgramDependencies.map((dep) => (
              <li key={dep}>{dep}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: `1px dashed rgba(12,26,58,0.16)`,
          fontFamily: BrandTypography.mono,
          fontSize: 11,
          color: BrandColors.stone,
        }}
      >
        {registering
          ? 'Registering program… Steward will confirm once the API succeeds.'
          : 'Brief assembles as Steward extracts each piece from your conversation.'}
      </footer>
    </aside>
  );
}
