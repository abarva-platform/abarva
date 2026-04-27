import type { CSSProperties, ReactNode } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import { summarizeApprovalState } from '@/lib/source/scorecard';
import type {
  ScorecardCriterion,
  ScorecardGovernance,
  ScorecardCriterionStatus,
} from '@/lib/source/types';
import {
  sourceCard,
  sourceInsetCard,
  sourceSectionLabel,
  sourceTableCell,
  sourceTableHeaderCell,
} from './foundationStyles';

type GovernanceShellStatus = 'draft' | 'in review' | 'locked' | 'blocked';
type EvidenceConfidence = 'high' | 'medium' | 'low' | 'missing';

interface ScorecardGovernancePanelProps {
  scorecard: ScorecardGovernance;
  eventName: string;
  currentStageLabel: string;
  currentBlocker: string | null;
  gateImpact: {
    label: string;
    state: string;
    blocker: string | null;
    requiredArtifacts: string[];
    requiredApprovals: string[];
  };
}

interface CanonicalCriterionRow {
  key: string;
  label: string;
  matchedLabel: string;
  ownerRole: string;
  status: ScorecardCriterionStatus;
  evidenceConfidence: EvidenceConfidence;
  rationale: string;
  rationaleMissing: boolean;
  sourceType: 'criteria' | 'placeholder';
}

const CANONICAL_DIMENSIONS: Array<{
  key: string;
  label: string;
  keywords: string[];
  fallbackOwner: string;
}> = [
  {
    key: 'commercial',
    label: 'Commercial',
    keywords: ['pricing', 'commercial', 'vendor', 'bafo', 'award', 'cost'],
    fallbackOwner: 'Nexus',
  },
  {
    key: 'transition',
    label: 'Transition',
    keywords: ['transition', 'mobil', 'handoff', 'runbook', 'support'],
    fallbackOwner: 'Steward',
  },
  {
    key: 'evidence',
    label: 'Evidence',
    keywords: ['evidence', 'baseline', 'data', 'response', 'source', 'rationale'],
    fallbackOwner: 'Sentinel',
  },
  {
    key: 'automation',
    label: 'Automation',
    keywords: ['automation', 'tool', 'platform', 'workflow', 'service', 'ai'],
    fallbackOwner: 'Nexus',
  },
  {
    key: 'risk',
    label: 'Risk',
    keywords: ['risk', 'security', 'compliance', 'control', 'exception'],
    fallbackOwner: 'Sentinel',
  },
  {
    key: 'governance',
    label: 'Governance',
    keywords: ['governance', 'approval', 'owner', 'steer', 'decision', 'review'],
    fallbackOwner: 'Steward',
  },
];

export function ScorecardGovernancePanel({
  scorecard,
  eventName,
  currentStageLabel,
  currentBlocker,
  gateImpact,
}: ScorecardGovernancePanelProps) {
  const summary = summarizeApprovalState(scorecard);
  const rows = buildCanonicalRows(scorecard.criteria);
  const blockedRows = rows.filter((row) => row.status === 'blocked');
  const missingRationaleRows = rows.filter((row) => row.rationaleMissing);
  const shellStatus = deriveShellStatus(scorecard.approvalState, rows);
  const readinessPercent = deriveReadinessPercent(rows, scorecard.approvalState);
  const stewardEditorial = buildStewardEditorial(
    eventName,
    currentStageLabel,
    shellStatus,
    blockedRows,
    gateImpact,
  );

  return (
    <section style={SECTION} aria-label="Source scorecard governance shell">
      <div style={sourceCard}>
        <div style={HEADER}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>
              Steward governance lead
            </div>
            <h2 style={TITLE}>Scorecard governance shell</h2>
            <p style={INTRO}>{stewardEditorial}</p>
          </div>
          <div style={STATUS_CARD}>
            <div style={sourceSectionLabel}>Scorecard status</div>
            <div style={{ ...TEXT.body, fontWeight: 700, color: statusColor(shellStatus), textTransform: 'uppercase' }}>
              {shellStatus}
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              {summary.label} · {summary.approved}/{summary.required} required criteria approved
            </div>
            <div style={METER_TRACK} aria-hidden="true">
              <div style={{ ...METER_FILL, width: `${readinessPercent}%`, backgroundColor: statusColor(shellStatus) }} />
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Readiness meter: {readinessPercent}% deterministic completion
            </div>
          </div>
        </div>

        <div style={ACTION_ROW} aria-label="Scorecard governance actions">
          <ActionAnchor href="#scorecard-blockers" label="Review blockers" description="Jump to blocking criteria and current governance risks." />
          <ActionAnchor href="#scorecard-evidence-gaps" label="Show evidence gaps" description="See low-confidence or missing evidence support." />
          <ActionAnchor href="#scorecard-gate-impact" label="Explain gate impact" description="Review whether Evaluation to BAFO can proceed." />
          <ActionAnchor href="#scorecard-custom" label="Ask custom" description="Custom follow-up is deferred to future agent interaction." />
        </div>
      </div>

      <div style={GRID}>
        <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <section style={sourceCard} aria-labelledby="scorecard-criteria-heading">
            <div style={TABLE_HEADER}>
              <div>
                <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentBlue }}>Criteria table</div>
                <h3 id="scorecard-criteria-heading" style={SUBTITLE}>Evaluation governance criteria</h3>
              </div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Deterministic governance shell. No live score submission or approval workflow execution.
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={TABLE}>
                <thead>
                  <tr>
                    <th style={sourceTableHeaderCell}>Criterion</th>
                    <th style={sourceTableHeaderCell}>Status</th>
                    <th style={sourceTableHeaderCell}>Evidence confidence</th>
                    <th style={sourceTableHeaderCell}>Owner</th>
                    <th style={sourceTableHeaderCell}>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td style={sourceTableCell}>
                        <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>{row.label}</div>
                        <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                          Source: {row.matchedLabel}
                        </div>
                      </td>
                      <td style={sourceTableCell}>
                        <Pill tone={statusColor(row.status)}>{formatStatus(row.status)}</Pill>
                      </td>
                      <td style={sourceTableCell}>
                        <Pill tone={confidenceColor(row.evidenceConfidence)}>{row.evidenceConfidence}</Pill>
                      </td>
                      <td style={sourceTableCell}>{row.ownerRole}</td>
                      <td style={sourceTableCell}>
                        <div style={{ color: EXPERIENCE_COLORS.textPrimary }}>{row.rationale}</div>
                        {row.rationaleMissing ? (
                          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.riskAmber, marginTop: 6 }}>
                            Missing rationale state is explicit and should be cleared before lock.
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="scorecard-blockers" style={sourceCard} aria-labelledby="scorecard-blockers-heading">
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.riskAmber }}>Blockers and rationale</div>
            <h3 id="scorecard-blockers-heading" style={SUBTITLE}>What is blocking scorecard confidence</h3>
            <div style={LIST_GRID}>
              <InfoCard title="Blocking criteria">
                <ul style={LIST}>
                  {blockedRows.length > 0 ? blockedRows.map((row) => (
                    <li key={row.key}>
                      <strong>{row.label}:</strong> {row.rationale}
                    </li>
                  )) : (
                    <li>No blocked criteria are currently seeded.</li>
                  )}
                </ul>
              </InfoCard>
              <InfoCard title="Rationale posture">
                <ul style={LIST}>
                  {missingRationaleRows.length > 0 ? missingRationaleRows.map((row) => (
                    <li key={row.key}>
                      <strong>{row.label}:</strong> deterministic rationale is still missing.
                    </li>
                  )) : (
                    <li>All seeded criteria currently include rationale text.</li>
                  )}
                  {currentBlocker ? (
                    <li>
                      <strong>Current event blocker:</strong> {currentBlocker}
                    </li>
                  ) : null}
                </ul>
              </InfoCard>
            </div>
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 14 }}>
          <InfoCard title="Context used">
            <div id="scorecard-evidence-gaps" style={CARD_STACK}>
              <ContextLine label="Event" value={eventName} />
              <ContextLine label="Stage" value={currentStageLabel} />
              <ContextLine label="Decision owner" value={scorecard.decisionOwner} />
              <ContextLine label="Review cadence" value={scorecard.reviewCadence} />
              <ContextLine label="Approval state" value={summary.label} />
              <ContextLine label="Evidence posture" value={missingRationaleRows.length > 0 ? 'Partial deterministic context' : 'Deterministic seeded context'} />
            </div>
          </InfoCard>

          <InfoCard title="Evidence gaps">
            <ul style={LIST}>
              {rows
                .filter((row) => row.evidenceConfidence === 'low' || row.evidenceConfidence === 'missing')
                .map((row) => (
                  <li key={row.key}>
                    <strong>{row.label}:</strong> {row.evidenceConfidence} confidence
                    {row.sourceType === 'placeholder' ? ' due to missing seeded criterion coverage.' : '.'}
                  </li>
                ))}
            </ul>
          </InfoCard>

          <InfoCard title="Audit trail placeholder">
            <ul style={LIST}>
              <li>Decision owner: {scorecard.decisionOwner}</li>
              <li>Current route posture: {summary.label}</li>
              <li>Review cadence: {scorecard.reviewCadence}</li>
              <li>Automation note: no live score submission, lock action, or approval route is executing here.</li>
            </ul>
          </InfoCard>

          <InfoCard title="Gate impact">
            <div id="scorecard-gate-impact" style={CARD_STACK}>
              <ContextLine label="Transition" value={gateImpact.label} />
              <ContextLine label="State" value={gateImpact.state} />
              <ContextLine label="Proceed to BAFO" value={gateImpact.state === 'ready' ? 'Yes, if the rest of the deterministic gate pack stays green.' : 'No, the governance route still carries blockers or approvals.'} />
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 10 }}>
              {gateImpact.blocker ?? 'No explicit gate blocker is currently recorded for this transition.'}
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 10 }}>
              Required artifacts: {gateImpact.requiredArtifacts.join(', ')}
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 4 }}>
              Required approvals: {gateImpact.requiredApprovals.join(', ')}
            </div>
          </InfoCard>

          <InfoCard title="Custom follow-up placeholder">
            <div id="scorecard-custom" style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Ask custom is intentionally a placeholder explanation in this slice. Future agent interaction can attach here, but no model call or approval automation is running now.
            </div>
          </InfoCard>
        </aside>
      </div>

      <div style={CAVEAT}>
        Deterministic governance shell only. This route does not execute live approvals, workflow automation, score submission, upload/parsing, or final vendor selection.
      </div>
    </section>
  );
}

function buildCanonicalRows(criteria: ScorecardCriterion[]): CanonicalCriterionRow[] {
  return CANONICAL_DIMENSIONS.map((dimension) => {
    const matched = criteria.find((criterion) => {
      const haystack = `${criterion.label} ${criterion.note}`.toLowerCase();
      return dimension.keywords.some((keyword) => haystack.includes(keyword));
    });

    if (!matched) {
      return {
        key: dimension.key,
        label: dimension.label,
        matchedLabel: 'No seeded criterion yet',
        ownerRole: dimension.fallbackOwner,
        status: 'blocked',
        evidenceConfidence: 'missing',
        rationale: 'No deterministic criterion has been seeded for this governance dimension yet.',
        rationaleMissing: true,
        sourceType: 'placeholder',
      };
    }

    return {
      key: dimension.key,
      label: dimension.label,
      matchedLabel: matched.label,
      ownerRole: matched.ownerRole,
      status: matched.status,
      evidenceConfidence: deriveEvidenceConfidence(matched),
      rationale: matched.note.trim() || 'Rationale missing from deterministic criterion seed.',
      rationaleMissing: matched.note.trim().length === 0,
      sourceType: 'criteria',
    };
  });
}

function deriveEvidenceConfidence(criterion: ScorecardCriterion): EvidenceConfidence {
  if (criterion.status === 'approved') return 'high';
  if (criterion.status === 'ready') return 'medium';
  if (criterion.status === 'draft') return 'low';
  return 'missing';
}

function deriveShellStatus(
  approvalState: ScorecardGovernance['approvalState'],
  rows: CanonicalCriterionRow[],
): GovernanceShellStatus {
  if (approvalState === 'approved' && rows.every((row) => row.status === 'approved')) {
    return 'locked';
  }

  if (approvalState === 'in_review') {
    return 'in review';
  }

  if (rows.some((row) => row.status === 'blocked')) {
    return 'blocked';
  }

  return 'draft';
}

function deriveReadinessPercent(
  rows: CanonicalCriterionRow[],
  approvalState: ScorecardGovernance['approvalState'],
): number {
  const score = rows.reduce((sum, row) => (
    sum + (
      row.status === 'approved' ? 1 :
      row.status === 'ready' ? 0.7 :
      row.status === 'draft' ? 0.4 :
      0.15
    )
  ), 0);
  const approvalBonus = approvalState === 'approved' ? 0.12 : approvalState === 'in_review' ? 0.06 : 0;
  return Math.max(8, Math.min(100, Math.round(((score / rows.length) + approvalBonus) * 100)));
}

function buildStewardEditorial(
  eventName: string,
  currentStageLabel: string,
  status: GovernanceShellStatus,
  blockedRows: CanonicalCriterionRow[],
  gateImpact: ScorecardGovernancePanelProps['gateImpact'],
): string {
  if (status === 'locked') {
    return `Steward view: ${eventName} carries a locked scorecard posture for ${currentStageLabel}, and the Evaluation to BAFO governance path is currently ${gateImpact.state}.`;
  }

  if (blockedRows.length > 0) {
    return `Steward view: ${eventName} cannot be treated as a clean ${currentStageLabel} governance route yet because ${blockedRows[0].label.toLowerCase()} is still blocked and the ${gateImpact.label} transition remains ${gateImpact.state}.`;
  }

  return `Steward view: ${eventName} has a partial scorecard posture for ${currentStageLabel}. The route is in ${status}, and governance rationale still needs review before BAFO progression is trusted.`;
}

function formatStatus(status: ScorecardCriterionStatus): string {
  return status.replace('_', ' ');
}

function statusColor(status: GovernanceShellStatus | ScorecardCriterionStatus): string {
  if (status === 'approved' || status === 'locked') return EXPERIENCE_COLORS.journeyComplete;
  if (status === 'ready' || status === 'in review') return EXPERIENCE_COLORS.accentBlue;
  if (status === 'draft') return EXPERIENCE_COLORS.riskAmber;
  return EXPERIENCE_COLORS.riskRed;
}

function confidenceColor(confidence: EvidenceConfidence): string {
  if (confidence === 'high') return EXPERIENCE_COLORS.journeyComplete;
  if (confidence === 'medium') return EXPERIENCE_COLORS.accentBlue;
  if (confidence === 'low') return EXPERIENCE_COLORS.riskAmber;
  return EXPERIENCE_COLORS.riskRed;
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sourceInsetCard}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </section>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{label}</span>
      <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textPrimary, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ActionAnchor({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a href={href} style={ACTION_LINK}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{description}</span>
    </a>
  );
}

function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      border: `1px solid ${tone}`,
      color: tone,
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}
    >
      {children}
    </span>
  );
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 16,
};

const HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
};

const TITLE: CSSProperties = {
  margin: '4px 0 0',
  color: EXPERIENCE_COLORS.textPrimary,
  fontSize: 30,
  lineHeight: 1.1,
};

const SUBTITLE: CSSProperties = {
  margin: '4px 0 0',
  color: EXPERIENCE_COLORS.textPrimary,
  fontSize: 20,
  lineHeight: 1.2,
};

const INTRO: CSSProperties = {
  ...TEXT.bodySecondary,
  margin: '10px 0 0',
  maxWidth: 860,
};

const STATUS_CARD: CSSProperties = {
  ...sourceInsetCard,
  minWidth: 260,
  maxWidth: 320,
};

const METER_TRACK: CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 999,
  background: EXPERIENCE_COLORS.borderSoft,
  overflow: 'hidden',
  marginTop: 8,
};

const METER_FILL: CSSProperties = {
  height: '100%',
  borderRadius: 999,
};

const ACTION_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
  gap: 10,
  marginTop: 2,
};

const ACTION_LINK: CSSProperties = {
  ...sourceInsetCard,
  textDecoration: 'none',
  color: EXPERIENCE_COLORS.textPrimary,
};

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 0.9fr)',
  gap: 16,
  alignItems: 'start',
};

const TABLE_HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'baseline',
  flexWrap: 'wrap',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 860,
};

const LIST_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: 12,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  color: EXPERIENCE_COLORS.textSecondary,
};

const CARD_STACK: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const CAVEAT: CSSProperties = {
  ...TEXT.small,
  color: EXPERIENCE_COLORS.textSecondary,
  padding: '0 2px',
};
