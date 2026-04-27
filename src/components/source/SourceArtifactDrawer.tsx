import type { CSSProperties, ReactNode } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceArtifactDetail, SourceArtifactStatus } from '@/lib/source/types';
import {
  sourceCard,
  sourceInsetCard,
  sourceSectionLabel,
} from './foundationStyles';

interface SourceArtifactDrawerProps {
  artifact: SourceArtifactDetail;
  eventName: string;
  currentStageLabel: string;
  relatedGate: {
    label: string;
    state: string;
    blocker: string | null;
  };
}

export function SourceArtifactDrawer({
  artifact,
  eventName,
  currentStageLabel,
  relatedGate,
}: SourceArtifactDrawerProps) {
  const metadata = buildArtifactMetadata(artifact);
  const nexusEditorial = buildNexusEditorial(artifact, eventName, currentStageLabel, relatedGate.state);

  return (
    <section style={SECTION} aria-label="Source artifact detail shell">
      <div style={sourceCard}>
        <div style={HEADER}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>
              Nexus artifact lead
            </div>
            <h2 style={TITLE}>{artifact.title}</h2>
            <p style={INTRO}>{nexusEditorial}</p>
          </div>
          <div style={STATUS_CARD}>
            <div style={sourceSectionLabel}>Artifact posture</div>
            <Pill tone={statusColor(artifact.status)}>{formatStatus(artifact.status)}</Pill>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 8 }}>
              Version {metadata.version}
            </div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Owner {metadata.ownerAgent}
            </div>
          </div>
        </div>

        <div style={META_STRIP}>
          <MetaPill label="Kind" value={artifact.kind.replaceAll('_', ' ')} />
          <MetaPill label="Evidence" value={metadata.evidenceState} />
          <MetaPill label="Review" value={metadata.reviewState} />
          <MetaPill label="Approval" value={metadata.approvalState} />
          <MetaPill label="Gate" value={relatedGate.label} />
        </div>

        <div style={ACTION_ROW} aria-label="Artifact detail actions">
          <ActionAnchor href="#artifact-evidence" label="Show evidence" description="Jump to evidence posture and governance notes." />
          <ActionAnchor href="#artifact-version" label="Show version history" description="Review the current deterministic version placeholder." />
          <ActionAnchor href="#artifact-missing" label="Explain missing inputs" description="See what still blocks review confidence." />
          <ActionAnchor href="#artifact-custom" label="Ask custom" description="Custom artifact follow-up is deferred in this slice." />
        </div>
      </div>

      <div style={GRID}>
        <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <section style={sourceCard} aria-labelledby="artifact-summary-heading">
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentBlue }}>Artifact summary</div>
            <h3 id="artifact-summary-heading" style={SUBTITLE}>Metadata and narrative shell</h3>
            <div style={{ ...TEXT.bodySecondary, color: EXPERIENCE_COLORS.textSecondary }}>
              {artifact.summary}
            </div>
            <div style={SUMMARY_GRID}>
              <InfoCard title="Metadata strip">
                <ContextLine label="Artifact" value={artifact.title} />
                <ContextLine label="Version" value={metadata.version} />
                <ContextLine label="Owner agent" value={metadata.ownerAgent} />
                <ContextLine label="Evidence state" value={metadata.evidenceState} />
                <ContextLine label="Missing inputs" value={metadata.missingInputs.length > 0 ? `${metadata.missingInputs.length} flagged` : 'None flagged'} />
              </InfoCard>
              <InfoCard title="Related stage gate">
                <ContextLine label="Current stage" value={currentStageLabel} />
                <ContextLine label="Gate" value={relatedGate.label} />
                <ContextLine label="Gate state" value={relatedGate.state} />
                <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 10 }}>
                  {relatedGate.blocker ?? 'No explicit blocker is currently attached to this gate.'}
                </div>
              </InfoCard>
            </div>
          </section>

          <section style={sourceCard} aria-labelledby="artifact-sections-heading">
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentBlue }}>Artifact sections</div>
            <h3 id="artifact-sections-heading" style={SUBTITLE}>Reviewable content regions</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {artifact.sections.map((section) => (
                <div key={section.label} style={sourceInsetCard}>
                  <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>{section.label}</div>
                  <div style={{ ...TEXT.bodySecondary, color: EXPERIENCE_COLORS.textSecondary }}>{section.body}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 14 }}>
          <InfoCard title="Context used">
            <div style={STACK}>
              <ContextLine label="Event" value={eventName} />
              <ContextLine label="Stage" value={currentStageLabel} />
              <ContextLine label="Artifact kind" value={artifact.kind.replaceAll('_', ' ')} />
              <ContextLine label="Source count" value={`${artifact.sourceCount}`} />
              <ContextLine label="Updated" value={artifact.updatedAt} />
            </div>
          </InfoCard>

          <InfoCard title="Evidence and review rail">
            <div id="artifact-evidence" style={STACK}>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Evidence state: {metadata.evidenceState}
              </div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Review state: {metadata.reviewState}
              </div>
              <ul style={LIST}>
                {artifact.governanceNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Missing inputs">
            <div id="artifact-missing" style={STACK}>
              <ul style={LIST}>
                {metadata.missingInputs.length > 0 ? metadata.missingInputs.map((item) => (
                  <li key={item}>{item}</li>
                )) : (
                  <li>No deterministic missing-input flags are currently attached.</li>
                )}
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Version history placeholder">
            <div id="artifact-version" style={STACK}>
              <ContextLine label="Current version" value={metadata.version} />
              <ContextLine label="Review posture" value={metadata.reviewState} />
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Stored version history, upload, and re-upload behavior remain deferred unless a future artifact runtime slice implements them.
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Approval placeholder">
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              {metadata.approvalState}. This is a shell-only placeholder and does not execute approval routing.
            </div>
          </InfoCard>

          <InfoCard title="Custom follow-up placeholder">
            <div id="artifact-custom" style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Ask custom is intentionally deferred here. No model call, live evidence lookup, or upload/re-upload workflow is attached to this route in Slice 2.
            </div>
          </InfoCard>
        </aside>
      </div>

      <div style={CAVEAT}>
        Deterministic artifact review shell only. Stored file lifecycle, parse state, evidence extraction, export/import, approval automation, and versioning workflow are deferred.
      </div>
    </section>
  );
}

function buildArtifactMetadata(artifact: SourceArtifactDetail): {
  version: string;
  ownerAgent: string;
  evidenceState: string;
  missingInputs: string[];
  reviewState: string;
  approvalState: string;
} {
  return {
    version: `v${artifact.updatedAt.replaceAll('-', '.')}`,
    ownerAgent: ownerAgentForKind(artifact.kind),
    evidenceState: evidenceStateForArtifact(artifact),
    missingInputs: deriveMissingInputs(artifact),
    reviewState: reviewStateForStatus(artifact.status),
    approvalState: approvalStatePlaceholder(artifact.status),
  };
}

function ownerAgentForKind(kind: SourceArtifactDetail['kind']): string {
  if (kind === 'scorecard') return 'Steward';
  if (kind === 'value_ledger') return 'Atlas';
  return 'Nexus';
}

function evidenceStateForArtifact(artifact: SourceArtifactDetail): string {
  if (artifact.sourceCount === 0) return 'Missing';
  if (artifact.sourceCount <= 2) return 'Low Confidence';
  return 'Usable Evidence';
}

function deriveMissingInputs(artifact: SourceArtifactDetail): string[] {
  const inputs: string[] = [];

  if (artifact.sourceCount === 0) {
    inputs.push('No supporting sources are attached yet.');
  }

  if (artifact.status === 'draft' || artifact.status === 'needs_inputs') {
    inputs.push('Artifact is not yet review-complete for a lock decision.');
  }

  if (artifact.kind === 'artifact_packet') {
    inputs.push('Upload and parse-backed packet completeness remains deferred.');
  }

  if (artifact.governanceNotes.some((note) => note.toLowerCase().includes('input'))) {
    inputs.push('Governance notes still call out input dependency.');
  }

  return Array.from(new Set(inputs));
}

function reviewStateForStatus(status: SourceArtifactStatus): string {
  if (status === 'approved' || status === 'locked') return 'Reviewed';
  if (status === 'needs_review') return 'In Review';
  if (status === 'superseded' || status === 'archived') return 'Closed';
  return 'Pending Review';
}

function approvalStatePlaceholder(status: SourceArtifactStatus): string {
  if (status === 'approved' || status === 'locked') return 'Approval placeholder: aligned';
  if (status === 'needs_review') return 'Approval placeholder: review in progress';
  return 'Approval placeholder: not started';
}

function buildNexusEditorial(
  artifact: SourceArtifactDetail,
  eventName: string,
  currentStageLabel: string,
  gateState: string,
): string {
  return `Nexus view: ${artifact.title} is the ${artifact.kind.replaceAll('_', ' ')} shell for ${eventName}. In ${currentStageLabel}, the related gate is ${gateState}, so missing evidence and review posture must stay explicit before this artifact is treated as decision-grade.`;
}

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

function statusColor(status: SourceArtifactStatus): string {
  if (status === 'approved' || status === 'locked') return EXPERIENCE_COLORS.journeyComplete;
  if (status === 'needs_review') return EXPERIENCE_COLORS.accentBlue;
  if (status === 'draft' || status === 'needs_inputs') return EXPERIENCE_COLORS.riskAmber;
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

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={META_PILL}>
      <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{label}</span>
      <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textPrimary }}>{value}</span>
    </div>
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
  minWidth: 240,
  maxWidth: 300,
};

const META_STRIP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const META_PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  background: EXPERIENCE_COLORS.surfaceWarm,
  borderRadius: 999,
  padding: '6px 10px',
};

const ACTION_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
  gap: 10,
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

const SUMMARY_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: 12,
};

const STACK: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  color: EXPERIENCE_COLORS.textSecondary,
};

const CAVEAT: CSSProperties = {
  ...TEXT.small,
  color: EXPERIENCE_COLORS.textSecondary,
  padding: '0 2px',
};
