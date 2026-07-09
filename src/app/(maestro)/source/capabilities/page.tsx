import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { CSSProperties } from 'react';

export const metadata = { title: 'Source · Capabilities · AbarVa' };
export const dynamic = 'force-dynamic';

type CapabilityState = 'available' | 'active-workflow' | 'next';

const CAPABILITIES: Array<{
  name: string;
  state: CapabilityState;
  summary: string;
  proof: string;
}> = [
  {
    name: 'Intake',
    state: 'available',
    summary: 'Capture the sourcing trigger, owner, scope boundary, value basis, and baseline owner with aVa guiding the brief.',
    proof: 'Live intake creates a governed Source event and opens the event canvas.',
  },
  {
    name: 'Sourcing Strategy',
    state: 'available',
    summary: 'Frame why this sourcing event exists, what is being sourced, the value target, rigor level, and decision posture.',
    proof: 'Strategy artifacts, stage gates, and aVa event guidance are scaffolded per event.',
  },
  {
    name: 'RFP Workbench',
    state: 'active-workflow',
    summary: 'Build scope, RFP package, response checklist, vendor shortlist, and vendor-facing artifacts from approved upstream context.',
    proof: 'Generation is live for the strategy memo, scope memo, and RFP package; other artifacts are scaffolded, editable, uploadable, or renderable depending on type.',
  },
  {
    name: 'Evaluation',
    state: 'active-workflow',
    summary: 'Normalize vendor response completeness, score criteria, preserve weight governance, and identify decision gaps.',
    proof: 'Evaluation scorecard and governance artifacts exist in the canonical event scaffold.',
  },
  {
    name: 'Pricing',
    state: 'active-workflow',
    summary: 'Normalize pricing, expose TCO assumptions, track commercial traps, and prepare negotiation pressure points.',
    proof: 'Pricing workbook and trap-log artifacts are scaffolded with render/download support where wired.',
  },
  {
    name: 'BAFO',
    state: 'active-workflow',
    summary: 'Convert open traps, clarifications, and value opportunities into final negotiation questions and concessions.',
    proof: 'BAFO question pack and round log are part of the governed lifecycle.',
  },
  {
    name: 'Executive Decision',
    state: 'active-workflow',
    summary: 'Produce the executive recommendation, risk attestation, and sign-off record needed before award.',
    proof: 'Decision brief, risk attestation, and sign-off artifacts are scaffolded in the event canvas.',
  },
  {
    name: 'Transition',
    state: 'active-workflow',
    summary: 'Track mobilization, checkpoints, knowledge transfer, and readiness to move from award to execution.',
    proof: 'Transition plan, checkpoint log, and knowledge-transfer evidence are part of the 11-stage model.',
  },
  {
    name: 'Value Proof',
    state: 'active-workflow',
    summary: 'Carry the event beyond award into committed value, measurement ownership, and realization evidence.',
    proof: 'Value Ledger and Governance Review are part of the canonical artifact set.',
  },
  {
    name: 'Contract Intelligence',
    state: 'next',
    summary: 'Extract contract terms, rate cards, SLAs, renewal windows, clauses, and commercial risk from uploaded agreements.',
    proof: 'Next capability layer. Do not treat as fully live until contract extraction and clause evidence are wired.',
  },
  {
    name: 'Spend Intelligence',
    state: 'next',
    summary: 'Create vendor, tower, renewal, rate-card, SaaS, and duplicate-spend views from governed commercial evidence.',
    proof: 'Next capability layer. Current Source workflow can use value-at-stake and event evidence, but the full spend cockpit is not the P0 claim.',
  },
  {
    name: 'Opportunity Finder',
    state: 'next',
    summary: 'Rank renegotiation, consolidation, rebid, right-size, renewal, and transformation opportunities by value and evidence confidence.',
    proof: 'Next capability layer after contract and spend intelligence are loaded.',
  },
];

const STATE_LABEL: Record<CapabilityState, string> = {
  available: 'Available now',
  'active-workflow': 'Workflow-ready',
  next: 'Coming next',
};

const STATE_TONE: Record<CapabilityState, { bg: string; line: string; text: string }> = {
  available: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  'active-workflow': { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  next: { bg: SHELL.PAPER_DEEP, line: SHELL.CARD_LINE, text: SHELL.INK_MUTED },
};

export default async function SourceCapabilitiesPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Source · Capabilities',
      }}
      subNav={<SourceSubNav />}
    >
      <main style={MAIN_STYLE}>
        <section style={HERO_STYLE}>
          <div style={EYEBROW_STYLE}>Source · Capabilities</div>
          <h1 style={TITLE_STYLE}>Technology sourcing intelligence, governed execution, and value proof.</h1>
          <p style={LEDE_STYLE}>
            Source is more than an RFP workbench. It helps teams understand the sourcing trigger, bind the right evidence,
            generate decision artifacts, govern gates, and carry the award into transition and realized value.
          </p>
        </section>

        <section style={GRID_STYLE} aria-label="Source capability map">
          {CAPABILITIES.map((capability) => {
            const tone = STATE_TONE[capability.state];
            return (
              <article key={capability.name} style={CARD_STYLE}>
                <div style={CARD_HEADER_STYLE}>
                  <h2 style={CARD_TITLE_STYLE}>{capability.name}</h2>
                  <span style={{ ...PILL_STYLE, background: tone.bg, borderColor: tone.line, color: tone.text }}>
                    {STATE_LABEL[capability.state]}
                  </span>
                </div>
                <p style={CARD_SUMMARY_STYLE}>{capability.summary}</p>
                <div style={PROOF_STYLE}>{capability.proof}</div>
              </article>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
}

const MAIN_STYLE: CSSProperties = {
  minHeight: '100%',
  background: SHELL.PAPER,
  padding: '28px 32px 44px',
  display: 'grid',
  gap: 24,
};

const HERO_STYLE: CSSProperties = {
  display: 'grid',
  gap: 10,
  maxWidth: 980,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 34,
  lineHeight: 1.08,
  color: SHELL.INK,
  maxWidth: 860,
};

const LEDE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: SHELL.INK_SOFT,
  maxWidth: 920,
};

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

const CARD_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: '15px 16px',
  display: 'grid',
  gap: 10,
  alignContent: 'start',
};

const CARD_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 10,
};

const CARD_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 15,
  lineHeight: 1.25,
  color: SHELL.INK,
  fontWeight: 800,
};

const PILL_STYLE: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 999,
  padding: '3px 7px',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const CARD_SUMMARY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
};

const PROOF_STYLE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  paddingTop: 8,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
};
