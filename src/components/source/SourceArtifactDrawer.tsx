import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceArtifactDetail } from '@/lib/source/types';

const sourceCard = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
};

const sourceInsetCard = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
};

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 600,
  color: SHELL.INK_MUTED,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  marginBottom: 0,
};

const CHIP_ROW = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
  marginTop: 10,
};

const CHIP = {
  fontSize: 11,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 999,
  padding: '4px 8px',
  background: SHELL.PAPER_SOFT,
  color: SHELL.INK,
  fontWeight: 600,
};

const ACTION_LINK = {
  ...sourceSectionLabel,
  textDecoration: 'none',
  border: '1px solid ' + SHELL.INK_MID,
  borderRadius: 999,
  background: SHELL.BLUE_BG,
  padding: '8px 12px',
  color: SHELL.INK,
  fontWeight: 600,
  marginBottom: 8,
};

export function SourceArtifactDrawer({ artifact }: { artifact: SourceArtifactDetail }) {
  const sectionCount = artifact.sections.length;

  return (
    <section style={sourceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>{artifact.kind.replace('_', ' ')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{artifact.title}</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>{artifact.status.replace('_', ' ')}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={sourceSectionLabel}>Context used</div>
        <div style={CHIP_ROW} aria-label="Source artifact context chips">
          <span style={CHIP}>Artifact type: {artifact.kind}</span>
          <span style={CHIP}>Evidence entries: {artifact.sections.length}</span>
          <span style={CHIP}>Seeded sections: {sectionCount}</span>
          <span style={CHIP}>Confidence: seeded deterministic</span>
        </div>
      </div>

      <div>{artifact.summary}</div>
      <div id="artifact-evidence">
        {artifact.sections.map((section) => (
          <div key={section.label} style={sourceInsetCard}>
            <div style={{ fontWeight: 700 }}>{section.label}</div>
            <div>{section.body}</div>
          </div>
        ))}
      </div>
      <div id="artifact-missing-inputs" style={sourceInsetCard}>
        <div style={{ fontWeight: 700 }}>Governance notes</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {artifact.governanceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Artifact action layer</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <a href="#artifact-evidence" style={ACTION_LINK}>
            Show evidence
          </a>
          <a id="artifact-version-history" href="#artifact-version-history" style={ACTION_LINK}>
            Show version history
          </a>
          <a href="#artifact-missing-inputs" style={ACTION_LINK}>
            Explain missing inputs
          </a>
          <label htmlFor="artifact-custom-input" style={{ display: 'grid', gap: 6 }}>
            <span style={sourceSectionLabel}>Ask custom</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="artifact-custom-input"
                type="text"
                readOnly
                placeholder="Ask Nexus about this artifact, source version, or evidence..."
                style={{
                  border: '1px solid ' + SHELL.BLUE_LINE,
                  borderRadius: 8,
                  background: SHELL.PAPER_SOFT,
                  color: SHELL.INK_SOFT,
                  padding: '8px 10px',
                  minWidth: 280,
                }}
              />
              <span style={ACTION_LINK}>Submit (disabled until runtime)</span>
            </div>
          </label>
        </div>
      </div>
      <div style={{ ...CHIP, marginTop: 10, background: SHELL.CARD_WHITE, borderColor: SHELL.INK_MUTED }}>
        Deterministic seeded artifact shell only. This page does not include upload, parsing, workflow automation, or approval runtime.
      </div>
    </section>
  );
}
