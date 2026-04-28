// SRC-S4 · SRC-DTL-ARTIFACT — Artifact drawer with tier indicator (rich/outline/stub).
// No upload, parsing, workflow automation, or approval runtime.
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceArtifactDetail } from '@/lib/source/types';

interface ArtifactProvenance {
  createdFrom: string;
  storeKey: string;
  freshness: string;
  evidenceLedgerEntryId?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  rich: { label: 'Rich', color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
  outline: { label: 'Outline', color: SHELL.INK_MID, bg: SHELL.PAPER_SOFT },
  stub: { label: 'Stub', color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
};

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

function TierIndicator({ tier }: { tier: string | undefined }) {
  const tierKey = tier ?? 'stub';
  const cfg = TIER_CONFIG[tierKey] ?? TIER_CONFIG.stub;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${cfg.color}`,
        borderRadius: 8,
        padding: '6px 10px',
        background: cfg.bg,
      }}
      data-testid="tier-indicator"
      data-tier={tierKey}
    >
      <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.color, fontWeight: 700 }}>
        Tier
      </span>
      <span style={{ fontFamily: SHELL.MONO, fontSize: 13, fontWeight: 700, color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

export function SourceArtifactDrawer({
  artifact,
  provenance,
}: {
  artifact: SourceArtifactDetail;
  provenance?: ArtifactProvenance;
}) {
  const sectionCount = artifact.sections.length;

  return (
    <section style={sourceCard} data-testid="source-artifact-drawer">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={sourceSectionLabel}>Artifact detail</div>
          <div style={{ fontSize: 12, color: SHELL.INK_SOFT }}>{artifact.kind.replace('_', ' ')}</div>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 28, lineHeight: 1.1, color: SHELL.INK }}>
            {artifact.title}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end', alignContent: 'start' }}>
          <TierIndicator tier={artifact.tier} />
          <span style={{ ...CHIP, color: SHELL.INK_SOFT }}>
            Status: {artifact.status.replaceAll('_', ' ')}
          </span>
        </div>
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

      <div style={{ fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.6, color: SHELL.INK }}>
        {artifact.summary}
      </div>
      {provenance ? (
        <div style={sourceInsetCard} data-testid="provenance-panel">
          <div style={sourceSectionLabel}>Visible provenance</div>
          <div style={{ display: 'grid', gap: 8, fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.5, color: SHELL.INK }}>
            <div><strong>Created from:</strong> {provenance.createdFrom}</div>
            <div><strong>Store key:</strong> {provenance.storeKey}</div>
            <div><strong>Freshness:</strong> {provenance.freshness}</div>
            {provenance.evidenceLedgerEntryId ? (
              <div><strong>Evidence ledger entry:</strong> {provenance.evidenceLedgerEntryId}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div id="artifact-evidence">
        {artifact.sections.map((section) => (
          <div key={section.label} style={{ ...sourceInsetCard, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: SHELL.INK }}>{section.label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.55, color: SHELL.INK }}>
              {section.body}
            </div>
          </div>
        ))}
      </div>
      <div id="artifact-missing-inputs" style={sourceInsetCard}>
        <div style={{ fontWeight: 700, color: SHELL.INK }}>Governance notes</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.55, color: SHELL.INK }}>
          {artifact.governanceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
      {artifact.patternLinks.length > 0 ? (
        <div style={sourceInsetCard}>
          <div style={{ fontWeight: 700, color: SHELL.INK }}>Linked patterns</div>
          <div style={CHIP_ROW}>
            {artifact.patternLinks.map((pattern) => (
              <span key={pattern} style={CHIP}>
                {pattern}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: SHELL.INK }}>Artifact action layer</div>
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
                placeholder="Ask Sentinel about this artifact, evidence chain, or source version..."
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
