import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import type {
  SourceDataReadinessItem,
  SourceDataReadinessState,
  SourceEvidenceUsability,
  ValueConfidence,
} from '@/lib/source/types';
import { sourceMuted, sourceSectionLabel } from './foundationStyles';

export function SourceDataReadinessPanel({ items }: { items: SourceDataReadinessItem[] }) {
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
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Data readiness</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
            Evidence posture for this stage
          </div>
        </div>
        <div style={SUMMARY_STRIP} aria-label="Data readiness summary">
          <SummaryMetric label="usable" value={usableItems.length} />
          <SummaryMetric label="required gaps" value={missingRequiredItems.length} tone="risk" />
          <SummaryMetric label="cautions" value={cautionItems.length} tone="watch" />
        </div>
      </div>

      <p style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary, margin: 0 }}>
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
                      <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{item.category}</div>
                      <div style={META_ROW}>
                        <span style={CHIP}>{item.requirementLevel}</span>
                        <span style={{ ...TEXT.small, color: confidenceColor(item.confidence), fontWeight: 800 }}>
                          {item.confidence} confidence
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span style={stateChip(item.readinessState)}>{item.readinessState}</span>
                      <span style={{ ...TEXT.small, color: usabilityColor(item.evidenceUsability), fontWeight: 800 }}>
                        {usabilityLabel(item.evidenceUsability)}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 5 }}>
                      <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>{item.owner}</div>
                      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                        {item.sourceSystemOrFile}
                      </div>
                      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                        Updated: {item.lastUpdated ?? 'not received'}
                      </div>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'grid', gap: 7 }}>
                      <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>
                        {item.workflowImpact}
                      </div>
                      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
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
  value: number;
  tone?: 'default' | 'risk' | 'watch';
}) {
  return (
    <div style={SUMMARY_METRIC}>
      <div
        style={{
          color: tone === 'risk'
            ? EXPERIENCE_COLORS.riskRed
            : tone === 'watch'
              ? EXPERIENCE_COLORS.riskAmber
              : EXPERIENCE_COLORS.accentTeal,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{label}</div>
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
  if (state === 'Missing' || state === 'Access Restricted') return EXPERIENCE_COLORS.riskRed;
  if (state === 'Requested' || state === 'Loaded' || state === 'Low Confidence' || state === 'Stale') {
    return EXPERIENCE_COLORS.riskAmber;
  }
  if (state === 'Usable Evidence') return EXPERIENCE_COLORS.journeyComplete;
  return EXPERIENCE_COLORS.accentBlue;
}

function stateBackground(state: SourceDataReadinessState): string {
  if (state === 'Missing' || state === 'Access Restricted') return 'rgba(181,69,47,0.08)';
  if (state === 'Requested' || state === 'Loaded' || state === 'Low Confidence' || state === 'Stale') {
    return 'rgba(184,107,18,0.08)';
  }
  if (state === 'Usable Evidence') return 'rgba(47,138,94,0.08)';
  return 'rgba(46,111,216,0.08)';
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
  if (usability === 'usable') return EXPERIENCE_COLORS.journeyComplete;
  if (usability === 'not_available' || usability === 'restricted') return EXPERIENCE_COLORS.riskRed;
  if (usability === 'waived') return EXPERIENCE_COLORS.textSecondary;
  return EXPERIENCE_COLORS.riskAmber;
}

function confidenceColor(confidence: ValueConfidence): string {
  if (confidence === 'high') return EXPERIENCE_COLORS.journeyComplete;
  if (confidence === 'medium') return EXPERIENCE_COLORS.accentBlue;
  return EXPERIENCE_COLORS.riskAmber;
}

const PANEL: CSSProperties = {
  display: 'grid',
  gap: 12,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 13,
  minWidth: 0,
};

const SUMMARY_STRIP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'flex-end',
};

const SUMMARY_METRIC: CSSProperties = {
  display: 'grid',
  gap: 1,
  minWidth: 76,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  padding: '7px 9px',
};

const TABLE: CSSProperties = {
  width: '100%',
  minWidth: 760,
  borderCollapse: 'collapse',
  background: EXPERIENCE_COLORS.surface,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
};

const HEADER_CELL: CSSProperties = {
  ...TEXT.small,
  fontFamily: FONTS.mono,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: EXPERIENCE_COLORS.textSecondary,
  padding: '9px 10px',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
};

const BODY_CELL: CSSProperties = {
  padding: '10px',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
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
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 999,
  padding: '3px 7px',
  fontFamily: FONTS.mono,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: EXPERIENCE_COLORS.textSecondary,
  background: EXPERIENCE_COLORS.surfaceWarm,
};

const HANDOFF_LABEL: CSSProperties = {
  ...TEXT.small,
  width: 'fit-content',
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 999,
  background: EXPERIENCE_COLORS.surfaceWarm,
  color: EXPERIENCE_COLORS.textSecondary,
  fontWeight: 800,
  padding: '4px 8px',
};

const EMPTY_STATE: CSSProperties = {
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  color: EXPERIENCE_COLORS.textSecondary,
  padding: 12,
};
