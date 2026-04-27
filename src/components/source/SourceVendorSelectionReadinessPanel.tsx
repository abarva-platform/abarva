import type { CSSProperties, ReactNode } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceVendorSelectionReadiness } from '@/lib/source/vendor-selection-readiness-types';
import { sourceSectionLabel } from './foundationStyles';

function readinessColor(status: SourceVendorSelectionReadiness['readinessStatus']): string {
  if (status === 'ready_for_selection_review') {
    return EXPERIENCE_COLORS.journeyComplete;
  }

  if (status === 'proceed_to_bafo') {
    return EXPERIENCE_COLORS.accentBlue;
  }

  if (status === 'defer_pending_clarifications') {
    return EXPERIENCE_COLORS.riskAmber;
  }

  return EXPERIENCE_COLORS.riskRed;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={CARD}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

export function SourceVendorSelectionReadinessPanel({
  readiness,
}: {
  readiness: SourceVendorSelectionReadiness;
}) {
  return (
    <section style={PANEL} aria-label="Vendor selection readiness panel">
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>
            Vendor selection readiness
          </div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>
            Selection-readiness readiness signal
          </h4>
          <p style={{ margin: '7px 0 0', ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Deterministic synthesis for steering review. This panel does not finalize vendor selection.
          </p>
        </div>
        <div style={POSTURE_BADGE}>
          <div style={sourceSectionLabel}>Selection posture</div>
          <div style={{ ...TEXT.small, color: readinessColor(readiness.readinessStatus) }}>
            {readiness.selectionPosture}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Selection ready: {readiness.selectionReviewReady ? 'yes' : 'no'}
          </div>
        </div>
      </div>

      <div style={GRID_TWO}>
        <Section title="Readiness status">
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Event: {readiness.eventName}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Event ID: {readiness.eventId}
          </div>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Required approvals</div>
          <ul style={LIST}>
            {readiness.requiredApprovals.length > 0
              ? readiness.requiredApprovals.map((approval) => <li key={approval}>{approval}</li>)
              : <li>No required approvals are currently tracked.</li>}
          </ul>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Unresolved gate issues</div>
          <ul style={LIST}>
            {readiness.unresolvedGateIssues.length > 0
              ? readiness.unresolvedGateIssues.map((issue) => <li key={issue}>{issue}</li>)
              : <li>No unresolved gate issues are currently active.</li>}
          </ul>
        </Section>

        <Section title="Required artifacts / next action">
          <div style={sourceSectionLabel}>Unresolved commercial issues</div>
          <ul style={LIST}>
            {readiness.unresolvedCommercialIssues.length > 0
              ? readiness.unresolvedCommercialIssues.map((issue) => <li key={issue}>{issue}</li>)
              : <li>No commercial blockers recorded.</li>}
          </ul>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Unresolved evidence issues</div>
          <ul style={LIST}>
            {readiness.unresolvedEvidenceIssues.length > 0
              ? readiness.unresolvedEvidenceIssues.map((issue) => <li key={issue}>{issue}</li>)
              : <li>No evidence issues are currently open.</li>}
          </ul>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Required artifacts</div>
          <ul style={LIST}>
            {readiness.requiredArtifacts.length > 0
              ? readiness.requiredArtifacts.map((artifact) => <li key={artifact}>{artifact}</li>)
              : <li>No required artifacts are currently tracked.</li>}
          </ul>
          <div style={sourceSectionLabel}>Recommendation</div>
          <div style={{ color: EXPERIENCE_COLORS.textPrimary }}>
            {readiness.recommendedNextAction}
          </div>
        </Section>
      </div>

      <div style={GRID_THREE}>
        <Section title="Vendor outcomes">
          <div style={sourceSectionLabel}>Viable vendors</div>
          <ul style={LIST}>
            {readiness.viableVendors.length > 0
              ? readiness.viableVendors.map((vendor) => <li key={vendor}>{vendor}</li>)
              : <li>No vendors are currently in a ready state.</li>}
          </ul>
          <div style={sourceSectionLabel}>Blocked vendors</div>
          <ul style={LIST}>
            {readiness.blockedVendors.length > 0
              ? readiness.blockedVendors.map((vendor) => <li key={vendor}>{vendor}</li>)
              : <li>No blocked vendor entries are currently listed.</li>}
          </ul>
        </Section>

        <Section title="Guardrails">
          <div style={sourceSectionLabel}>Atlas executive implication</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            {readiness.atlasExecutiveImplication}
          </div>
          <div style={sourceSectionLabel}>Steward gate notes</div>
          <ul style={LIST}>
            {readiness.stewardGateNotes.length > 0
              ? readiness.stewardGateNotes.map((note) => <li key={note}>{note}</li>)
              : <li>No steward gate notes are currently required.</li>}
          </ul>
          <div style={sourceSectionLabel}>Sentinel cautions</div>
          <ul style={LIST}>
            {readiness.sentinelCautions.length > 0
              ? readiness.sentinelCautions.map((note) => <li key={note}>{note}</li>)
              : <li>No Sentinel cautions are currently flagged.</li>}
          </ul>
        </Section>

        <Section title="Nexus guidance">
          <div style={sourceSectionLabel}>Nexus recommendation</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            {readiness.nexusRecommendation}
          </div>
          <div style={sourceSectionLabel}>Modules used</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            {readiness.sourceModulesUsed.join(', ')}
          </div>
        </Section>
      </div>
    </section>
  );
}

const PANEL: CSSProperties = {
  display: 'grid',
  gap: 12,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surface,
  padding: 12,
};

const HEADER: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
};

const POSTURE_BADGE: CSSProperties = {
  minWidth: 220,
  ...sourceSectionLabel,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 10,
  textAlign: 'right',
};

const GRID_TWO: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: 10,
};

const GRID_THREE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
  gap: 10,
};

const CARD: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 12,
  minWidth: 0,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: EXPERIENCE_COLORS.textSecondary,
  display: 'grid',
  gap: 4,
};
