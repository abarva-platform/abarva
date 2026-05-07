// SRC-S4 · SRC-DTL-ARTIFACT — Artifact drawer with tier indicator (rich/outline/stub).
// T09: Added section-tier border-left, seeded version history, sign-offs panel.
// No upload, parsing, workflow automation, or approval runtime.
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceArtifactDetail, SourceArtifactTier } from '@/lib/source/types';

interface ArtifactProvenance {
  createdFrom: string;
  storeKey: string;
  freshness: string;
  evidenceLedgerEntryId?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; borderLeft: string }> = {
  rich:    { label: 'Rich',    color: SHELL.MINT_TEXT,  bg: SHELL.MINT_BG,   borderLeft: SHELL.MINT_TEXT  },
  outline: { label: 'Outline', color: SHELL.INK_MID,   bg: SHELL.PAPER_SOFT, borderLeft: SHELL.INK_SOFT  },
  stub:    { label: 'Stub',    color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG,   borderLeft: SHELL.PEACH_TEXT },
};

function tierBorderColor(tier: SourceArtifactTier | undefined): string {
  const cfg = TIER_CONFIG[tier ?? 'stub'];
  return cfg?.borderLeft ?? SHELL.CARD_LINE;
}

// ─── Seeded sign-off data ─────────────────────────────────────────────────────

type SignOffStatus = 'complete' | 'pending' | 'not_required';

interface SignOff {
  role: string;
  status: SignOffStatus;
  note?: string;
}

const SEEDED_SIGN_OFFS: SignOff[] = [
  { role: 'Steward', status: 'pending', note: 'Governance review not yet initiated' },
  { role: 'Atlas', status: 'complete', note: 'Executive content verified' },
  { role: 'Procurement Lead', status: 'pending', note: 'Awaiting BAFO close' },
  { role: 'Sentinel', status: 'complete', note: 'Evidence chain attested' },
];

const SIGN_OFF_COLORS: Record<SignOffStatus, { dot: string; text: string }> = {
  complete:     { dot: SHELL.MINT_TEXT,  text: SHELL.MINT_TEXT  },
  pending:      { dot: SHELL.PEACH_TEXT, text: SHELL.PEACH_TEXT },
  not_required: { dot: SHELL.INK_MUTED,  text: SHELL.INK_MUTED  },
};

function SignOffPanel() {
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 700, color: SHELL.INK, marginBottom: 2 }}>Sign-offs needed</div>
      {SEEDED_SIGN_OFFS.map((s) => {
        const c = SIGN_OFF_COLORS[s.status];
        return (
          <div
            key={s.role}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: c.dot,
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <span style={{ fontWeight: 700, color: SHELL.INK, minWidth: 120 }}>{s.role}</span>
            <span style={{ color: c.text, fontWeight: 600 }}>
              {s.status === 'complete' ? 'Complete' : s.status === 'not_required' ? 'Not required' : 'Pending'}
            </span>
            {s.note && (
              <span style={{ color: SHELL.INK_MUTED, fontSize: 11.5 }}>· {s.note}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Seeded version history ───────────────────────────────────────────────────

interface VersionEntry {
  version: string;
  tier: SourceArtifactTier;
  label: string;
  date: string;
}

const SEEDED_VERSION_HISTORY: VersionEntry[] = [
  { version: 'v0.1', tier: 'stub',    label: 'Initial draft — scope placeholder', date: '2026-02-14' },
  { version: 'v0.2', tier: 'stub',    label: 'Scope refinement — stakeholders added', date: '2026-02-28' },
  { version: 'v0.3', tier: 'outline', label: 'Strategy review — sections structured', date: '2026-03-15' },
  { version: 'v0.4', tier: 'rich',    label: 'BAFO-ready — evidence chain complete', date: '2026-04-10' },
];

function VersionHistoryPanel() {
  return (
    <div
      id="artifact-version-history"
      style={{
        background: SHELL.PAPER_SOFT,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '9px 14px',
          fontWeight: 700,
          color: SHELL.INK,
          borderBottom: '1px solid ' + SHELL.CARD_LINE,
          fontFamily: SHELL.SANS,
          fontSize: 13,
        }}
      >
        Version history
      </div>
      <div style={{ display: 'grid' }}>
        {SEEDED_VERSION_HISTORY.map((entry, i) => {
          const cfg = TIER_CONFIG[entry.tier];
          const isLatest = i === SEEDED_VERSION_HISTORY.length - 1;
          return (
            <div
              key={entry.version}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 56px 1fr 90px',
                gap: 10,
                padding: '8px 14px',
                borderBottom: isLatest ? 'none' : '1px solid ' + SHELL.CARD_LINE,
                alignItems: 'center',
                background: isLatest ? SHELL.CARD_WHITE : 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: SHELL.INK_MID,
                }}
              >
                {entry.version}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}`,
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: cfg.color,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {cfg.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: isLatest ? SHELL.INK : SHELL.INK_SOFT,
                  fontWeight: isLatest ? 600 : 400,
                }}
              >
                {entry.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  textAlign: 'right',
                }}
              >
                {entry.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const isRegistryBacked = provenance?.createdFrom === 'source_artifacts registry';

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
          <span style={CHIP}>Sections: {sectionCount}</span>
          <span style={CHIP}>
            {isRegistryBacked ? 'Source: live persisted registry' : 'Confidence: seeded deterministic'}
          </span>
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
          <div
            key={section.label}
            style={{
              ...sourceInsetCard,
              marginBottom: 8,
              borderLeft: `3px solid ${tierBorderColor(artifact.tier)}`,
            }}
          >
            <div style={{ fontWeight: 700, color: SHELL.INK }}>{section.label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.55, color: SHELL.INK }}>
              {section.body}
            </div>
          </div>
        ))}
      </div>

      {/* T09 — Version history panel */}
      <VersionHistoryPanel />

      {/* T09 — Sign-offs needed */}
      <SignOffPanel />

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
                placeholder="Ask Nexus about this artifact, evidence chain, or source version..."
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
        {isRegistryBacked
          ? 'Registered Source artifact. Parser, vector, graph, evidence, and approval states are shown above; no completion is implied unless those states say complete.'
          : 'Deterministic seeded artifact shell only. This page does not include upload, parsing, workflow automation, or approval runtime.'}
      </div>
    </section>
  );
}
