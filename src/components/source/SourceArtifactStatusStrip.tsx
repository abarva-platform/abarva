// SRC-S4 · SRC-DTL-ARTIFACT — Artifact status strip (paper aesthetic refresh).
// Metadata-only. No artifact drawer, generation, export/import, or approval workflow execution.
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceArtifactStatusStripSeedItem } from '@/lib/source/mock-seed';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

export function SourceArtifactStatusStrip({
  artifacts,
}: {
  artifacts: SourceArtifactStatusStripSeedItem[];
}) {
  const approvedCount = artifacts.filter((artifact) => artifact.status === 'approved' || artifact.status === 'locked').length;
  const needsAttentionCount = artifacts.filter((artifact) => artifact.status === 'changes_requested' || artifact.status === 'needs_inputs').length;

  return (
    <section style={SECTION} aria-label="Source artifact status strip" data-testid="artifact-status-strip">
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Artifacts and deliverables</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>Deterministic artifact status strip</h4>
          <p style={{ margin: '7px 0 0', fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Metadata-only strip. No artifact drawer, generation, export/import, or approval workflow execution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <span style={{ ...PILL, color: SHELL.MINT_TEXT, borderColor: SHELL.MINT_TEXT }}>
            {approvedCount} approved
          </span>
          <span style={{ ...PILL, color: SHELL.PEACH_TEXT, borderColor: SHELL.PEACH_TEXT }}>
            {needsAttentionCount} need inputs
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={TABLE_HEAD}>Artifact</th>
              <th style={TABLE_HEAD}>Status</th>
              <th style={TABLE_HEAD}>Owner agent</th>
              <th style={TABLE_HEAD}>Version</th>
              <th style={TABLE_HEAD}>Evidence state</th>
              <th style={TABLE_HEAD}>Approval state</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((artifact) => (
              <tr key={artifact.artifactName}>
                <td style={{ ...TABLE_CELL, fontWeight: 700 }}>{artifact.artifactName}</td>
                <td style={TABLE_CELL}>
                  <span style={{ ...PILL, color: statusColor(artifact.status), borderColor: statusColor(artifact.status) }}>
                    {artifact.status}
                  </span>
                </td>
                <td style={TABLE_CELL}>{artifact.ownerAgent}</td>
                <td style={TABLE_CELL}>{artifact.version}</td>
                <td style={TABLE_CELL}>{artifact.evidenceState}</td>
                <td style={TABLE_CELL}>{artifact.approvalState}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusColor(status: SourceArtifactStatusStripSeedItem['status']): string {
  if (status === 'approved' || status === 'locked') return SHELL.MINT_TEXT;
  if (status === 'changes_requested' || status === 'needs_inputs') return SHELL.PEACH_TEXT;
  if (status === 'not_started') return SHELL.INK_MUTED;
  return SHELL.INK_MID;
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 12,
};

const HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 920,
};

const TABLE_HEAD: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textAlign: 'left',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  color: SHELL.INK_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
};

const TABLE_CELL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: SHELL.INK,
};

const PILL: CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: '11px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
};
