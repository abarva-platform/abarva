import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceDataReadinessProgressSummary } from '@/lib/source/admin-setup-readiness-contract';
import type {
  SourceDataReadinessItem,
  SourceDataReadinessState,
  SourceEvidenceUsability,
  ValueConfidence,
} from '@/lib/source/types';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const sourceMuted = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

export function SourceDataReadinessPanel({
  items,
  progressSummary,
}: {
  items: SourceDataReadinessItem[];
  progressSummary?: SourceDataReadinessProgressSummary;
}) {
  const requiredItems = items.filter((item) => item.requirementLevel === 'required');
  const missingRequiredItems = requiredItems.filter((item) => item.evidenceUsability === 'not_available');
  const usableItems = items.filter((item) => item.evidenceUsability === 'usable');
  const cautionItems = items.filter((item) =>
    item.evidenceUsability === 'loaded_not_usable'
    || item.evidenceUsability === 'available_not_validated'
    || item.evidenceUsability === 'low_confidence',
  );

  return (
    <section style={PANEL} aria-label="Source data readiness panel" data-legacy-label="Data readiness placeholder">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 5 }}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Data readiness</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: SHELL.INK }}>
            Evidence posture for this stage
          </div>
        </div>
        <div style={SUMMARY_STRIP} aria-label="Data readiness summary">
          {progressSummary ? (
            <SummaryMetric
              label="progress"
              value={`${progressSummary.readinessPercent}%`}
              tone={progressSummary.missingRequiredItems > 0 ? 'watch' : 'default'}
            />
          ) : null}
          <SummaryMetric label="usable" value={usableItems.length} />
          <SummaryMetric label="required gaps" value={missingRequiredItems.length} tone="risk" />
          <SummaryMetric label="cautions" value={cautionItems.length} tone="watch" />
        </div>
      </div>

      {progressSummary ? (
        <div style={PROGRESS_PANEL} aria-label="Event data readiness progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
            <div style={{ display: 'grid', gap: 3 }}>
              <div style={{ fontWeight: 800, color: SHELL.INK }}>
                {progressSummary.progressLabel}
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                Admin/Setup readiness contract projection. {progressSummary.progressBasis}
              </div>
            </div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED, fontWeight: 800 }}>
              {progressSummary.requiredItems - progressSummary.missingRequiredItems}/{progressSummary.requiredItems} required present
            </div>
          </div>
          <div style={PROGRESS_TRACK} aria-hidden="true">
            <div
              style={{
                ...PROGRESS_FILL,
                width: `${Math.max(0, Math.min(100, progressSummary.readinessPercent))}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <p style={{ ...sourceMuted, color: SHELL.INK_MUTED, margin: 0 }}>
        Source consumes Admin/Setup readiness and turns data gaps into sourcing impact. Loaded and Available
        records stay separate from Usable Evidence.
      </p>

      {items.length === 0 ? (
        <div style={EMPTY_STATE}>
          No deterministic readiness items are available for this event yet. Steward should route setup readiness
          back to Admin/Setup before Nexus treats evidence as usable.
        </div>
      ) : (
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table style={TABLE}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={HEADER_CELL}>Data</th>
                <th style={HEADER_CELL}>State</th>
                <th style={HEADER_CELL}>Owner / Source</th>
                <th style={HEADER_CELL}>Workflow Impact</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontWeight: 800, color: SHELL.INK }}>{item.category}</div>
                      <div style={META_ROW}>
                        <span style={CHIP}>{item.requirementLevel}</span>
                        <span style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: confidenceColor(item.confidence), fontWeight: 800 }}>
                          {item.confidence} confidence
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span style={stateChip(item.readinessState)}>{item.readinessState}</span>
                      <span style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: usabilityColor(item.evidenceUsability), fontWeight: 800 }}>
                        {usabilityLabel(item.evidenceUsability)}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 5 }}>
                      <div style={{ color: SHELL.INK, fontWeight: 700 }}>{item.owner}</div>
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                        {item.sourceSystemOrFile}
                      </div>
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                        Updated: {item.lastUpdated ?? 'not received'}
                      </div>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 7 }}>
                      <div style={{ color: SHELL.INK, fontWeight: 700 }}>
                        {item.workflowImpact}
                      </div>
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                        {item.agentRecommendation}
                      </div>
                      <div style={HANDOFF_LABEL}>{item.stewardAdminHandoffLabel}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'risk' | 'watch';
}) {
  return (
    <div style={SUMMARY_METRIC}>
      <div
        style={{
          color: tone === 'risk'
            ? SHELL.RUST_TEXT
            : tone === 'watch'
              ? SHELL.PEACH_TEXT
              : SHELL.INK_SOFT,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{label}</div>
    </div>
  );
}

function stateChip(state: SourceDataReadinessState): CSSProperties {
  return {
    ...CHIP,
    borderColor: stateColor(state),
    color: stateColor(state),
    background: stateBackground(state),
  };
}

function stateColor(state: SourceDataReadinessState): string {
  if (state === 'Missing' || state === 'Access Restricted') return SHELL.RUST_TEXT;
  if (state === 'Requested' || state === 'Loaded' || state === 'Low Confidence' || state === 'Stale') {
    return SHELL.PEACH_TEXT;
  }
  if (state === 'Usable Evidence') return SHELL.MINT_TEXT;
  return SHELL.INK_MID;
}

function stateBackground(state: SourceDataReadinessState): string {
  if (state === 'Missing' || state === 'Access Restricted') return SHELL.RUST_BG;
  if (state === 'Requested' || state === 'Loaded' || state === 'Low Confidence' || state === 'Stale') {
    return SHELL.PEACH_BG;
  }
  if (state === 'Usable Evidence') return SHELL.MINT_BG;
  return SHELL.BLUE_BG;
}

function usabilityLabel(usability: SourceEvidenceUsability): string {
  if (usability === 'not_available') return 'not available';
  if (usability === 'loaded_not_usable') return 'loaded, not usable';
  if (usability === 'available_not_validated') return 'available, not validated';
  if (usability === 'usable') return 'usable evidence';
  if (usability === 'low_confidence') return 'low confidence';
  if (usability === 'restricted') return 'restricted';
  return 'waived';
}

function usabilityColor(usability: SourceEvidenceUsability): string {
  if (usability === 'usable') return SHELL.MINT_TEXT;
  if (usability === 'not_available' || usability === 'restricted') return SHELL.RUST_TEXT;
  if (usability === 'waived') return SHELL.INK_MUTED;
  return SHELL.PEACH_TEXT;
}

function confidenceColor(confidence: ValueConfidence): string {
  if (confidence === 'high') return SHELL.MINT_TEXT;
  if (confidence === 'medium') return SHELL.INK_MID;
  return SHELL.PEACH_TEXT;
}

const PANEL: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 12,
  minWidth: 0,
};

const SUMMARY_STRIP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'flex-end',
};

const PROGRESS_PANEL: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '10px 12px',
};

const PROGRESS_TRACK: CSSProperties = {
  height: 7,
  borderRadius: 999,
  overflow: 'hidden',
  background: SHELL.GRAY_BG,
};

const PROGRESS_FILL: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: SHELL.INK_MID,
};

const SUMMARY_METRIC: CSSProperties = {
  display: 'grid',
  gap: 1,
  minWidth: 68,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '7px 9px',
};

const TABLE: CSSProperties = {
  width: '100%',
  minWidth: 700,
  borderCollapse: 'collapse',
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
};

const HEADER_CELL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: SHELL.INK_MUTED,
  padding: '9px 10px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
};

const BODY_CELL: CSSProperties = {
  padding: '10px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  verticalAlign: 'top',
  overflowWrap: 'anywhere',
};

const META_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
};

const CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 999,
  padding: '3px 7px',
  fontFamily: SHELL.MONO,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: SHELL.INK_MUTED,
  background: SHELL.PAPER_SOFT,
};

const HANDOFF_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  width: 'fit-content',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 999,
  background: SHELL.PAPER_SOFT,
  color: SHELL.INK_MUTED,
  fontWeight: 800,
  padding: '4px 8px',
};

const EMPTY_STATE: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK_MUTED,
  padding: 12,
};
