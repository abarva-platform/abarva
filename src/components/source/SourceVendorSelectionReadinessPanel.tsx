import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceVendorSelectionReadiness } from '@/lib/source/vendor-selection-readiness-types';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

function readinessColor(status: SourceVendorSelectionReadiness['readinessStatus']): string {
  if (status === 'ready_for_selection_review') {
    return SHELL.MINT_TEXT;
  }

  if (status === 'proceed_to_bafo') {
    return SHELL.INK_MID;
  }

  if (status === 'defer_pending_clarifications') {
    return SHELL.PEACH_TEXT;
  }

  return SHELL.RUST_TEXT;
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
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>
            Vendor selection readiness
          </div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>
            Selection-readiness readiness signal
          </h4>
          <p style={{ margin: '7px 0 0', fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Deterministic synthesis for steering review. This panel does not finalize vendor selection.
          </p>
        </div>
        <div style={POSTURE_BADGE}>
          <div style={sourceSectionLabel}>Selection posture</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: readinessColor(readiness.readinessStatus) }}>
            {readiness.selectionPosture}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Selection ready: {readiness.selectionReviewReady ? 'yes' : 'no'}
          </div>
        </div>
      </div>

      <div style={GRID_TWO}>
        <Section title="Readiness status">
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Event: {readiness.eventName}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
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
          <div style={{ color: SHELL.INK }}>
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
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
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
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            {readiness.nexusRecommendation}
          </div>
          <div style={sourceSectionLabel}>Modules used</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 12,
  minWidth: 0,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: SHELL.INK_MUTED,
  display: 'grid',
  gap: 4,
};
