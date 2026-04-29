// /docs/reasoning/demo — guided 5-minute demo walkthrough for the
// AbarVa reasoning layer.
//
// This page is a hands-on tour. The architecture, quickstart, API and
// changelog docs answer "what is this and how do I extend it"; this
// page answers "show me Layer 3 actually working — click here, then
// here, then here." Each step deep-links into a real product surface
// and tells the reader exactly what to look for once they arrive.
//
// Server component, AbarVa palette only, no new tokens introduced.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

export const metadata = {
  title: 'Reasoning layer · 5-minute demo · AbarVa Docs',
};

const COLUMN_MAX_WIDTH = '720px';

const SECTION_STYLE: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  padding: SPACING.xl,
  maxWidth: COLUMN_MAX_WIDTH,
  width: '100%',
};

const H2_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 26,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
};

const H3_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.navy,
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const PROSE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 15,
  lineHeight: 1.65,
  color: `${COLORS.ink}cc`,
  margin: 0,
};

const MONO_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12.5,
  color: COLORS.ink,
  background: COLORS.cream,
  padding: '1px 6px',
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLORS.ink}10`,
};

const LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.sm,
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 14.5,
  lineHeight: 1.6,
  color: `${COLORS.ink}d0`,
};

const LINK_STYLE: CSSProperties = {
  color: COLORS.navy,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

const CTA_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: SPACING.sm,
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13.5,
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: COLORS.white,
  background: COLORS.ink,
  border: `1px solid ${COLORS.ink}`,
  borderRadius: RADIUS.pill,
  padding: '10px 16px',
  textDecoration: 'none',
  width: 'fit-content',
};

const URL_CHIP_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11.5,
  color: `${COLORS.ink}aa`,
  margin: 0,
  wordBreak: 'break-all',
};

const CONTINUE_LINK_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.navy,
  textDecoration: 'none',
  letterSpacing: '0.02em',
};

const FOOTER_NOTE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13.5,
  lineHeight: 1.6,
  color: `${COLORS.ink}aa`,
  margin: 0,
  background: COLORS.cream,
  border: `1px solid ${COLORS.ink}10`,
  borderRadius: RADIUS.md,
  padding: SPACING.lg,
};

function Section({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} style={SECTION_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        <h3 style={H3_STYLE}>{eyebrow}</h3>
        <h2 style={H2_STYLE}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {children}
        </div>
      </div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code style={MONO_STYLE}>{children}</code>;
}

interface DemoStep {
  /** Stable anchor id, e.g. "step-1" — also the target for the previous step's Continue link. */
  anchor: string;
  /** Eyebrow label, e.g. "Step 1 of 10". */
  eyebrow: string;
  /** Section title, e.g. "Step 1 · Open the AMS event". */
  title: string;
  /** 1–2 sentence framing of what this step is about. */
  intro: string;
  /** Visible button label. */
  ctaLabel: string;
  /** Deep-link URL into a real product surface. */
  ctaHref: string;
  /** "What you should see" — 2–3 specific elements to look for. */
  lookFor: ReadonlyArray<string>;
  /** Anchor of the next step (or null for the last step). */
  nextAnchor: string | null;
  /** Human label for the next step's Continue link. */
  nextLabel: string | null;
}

const STEPS: ReadonlyArray<DemoStep> = [
  {
    anchor: 'step-1',
    eyebrow: 'Step 1 of 10',
    title: 'Step 1 · Open the AMS event',
    intro:
      'Start at the canonical source-event surface. The AMS Vendor Consolidation 2026 event is bound to PAT-SRC-AMS-001 — a fully typed lifecycle pattern with seven stages, expected artifacts, and contradiction templates.',
    ctaLabel: 'Open AMS event detail →',
    ctaHref: '/source/events/apex-retail-ams-outsourcing-2026',
    lookFor: [
      'The Sentinel synthesis quote at the top — Layer 4 prose grounded in a typed Layer 3 context, not a flat blob.',
      'The provenance ribbon directly under the title — pinned pattern citation (PAT-SRC-AMS-001) and the gate roll-up.',
      'The right-hand agent rail — Sentinel is the synthesis voice for source events.',
    ],
    nextAnchor: 'step-2',
    nextLabel: 'Continue → Step 2 · Gate panel & lifecycle graph',
  },
  {
    anchor: 'step-2',
    eyebrow: 'Step 2 of 10',
    title: 'Step 2 · Gate criteria panel & lifecycle mini-graph',
    intro:
      'Scroll to the gate criteria panel and the lifecycle mini-graph. Both are pure-function renders of the typed StageEvaluationResult that the gate evaluator emits — no surface-side gate logic.',
    ctaLabel: 'Jump back to AMS event →',
    ctaHref: '/source/events/apex-retail-ams-outsourcing-2026#gates',
    lookFor: [
      'The gate criteria panel — each criterion shows passed / pending / blocked, sourced from GateCriterionResult.',
      'The lifecycle mini-graph — passed / current / upcoming / blocked stages laid out left-to-right.',
      'A "hard" vs "soft" gate distinction in the criterion chips — hard gates block stage advancement, soft gates surface as warnings.',
    ],
    nextAnchor: 'step-3',
    nextLabel: 'Continue → Step 3 · Hover a stage',
  },
  {
    anchor: 'step-3',
    eyebrow: 'Step 3 of 10',
    title: 'Step 3 · Hover a stage in the mini-graph',
    intro:
      'Hover any stage in the lifecycle mini-graph. The micro-synthesis tooltip is built from the same typed context the page-level synthesis uses, so the per-stage prose is consistent with the headline quote.',
    ctaLabel: 'Open AMS event (mini-graph) →',
    ctaHref: '/source/events/apex-retail-ams-outsourcing-2026#lifecycle',
    lookFor: [
      'A tooltip with a stage-scoped sentence — the micro-synthesis is keyed by stageId.',
      'The expected artifacts for that stage — sourced from the StageArtifactTracking roll-up.',
      'A passed / current / upcoming / blocked status chip matching the StageEvaluationResult.',
    ],
    nextAnchor: 'step-4',
    nextLabel: 'Continue → Step 4 · Explain-this-quote drawer',
  },
  {
    anchor: 'step-4',
    eyebrow: 'Step 4 of 10',
    title: 'Step 4 · Open the explain-this-quote drawer',
    intro:
      'Click the explain control on the synthesis quote. The drawer enumerates every rule that fired to produce that sentence — gate criteria, contradictions, failure modes, and citations.',
    ctaLabel: 'Open AMS event (synthesis) →',
    ctaHref: '/source/events/apex-retail-ams-outsourcing-2026#synthesis',
    lookFor: [
      'A list of citation chips, each pointing to a specific evidence pointer or pattern stage.',
      'The grounding score / unmet-gate count — the same gatesSummary the SynthesisContext exposes.',
      'A "rules fired" list — typed contradictions and failure-mode detections rendered with severity.',
    ],
    nextAnchor: 'step-5',
    nextLabel: 'Continue → Step 5 · Submit evidence & flip a gate',
  },
  {
    anchor: 'step-5',
    eyebrow: 'Step 5 of 10',
    title: 'Step 5 · Submit evidence and watch a gate flip',
    intro:
      'Use the evidence ingestion form to submit a new EvidenceItem. The gate evaluator re-runs against the updated evidence map and the gate criterion that depends on it should flip from pending to passed in front of you.',
    ctaLabel: 'Open AMS event (ingest) →',
    ctaHref: '/source/events/apex-retail-ams-outsourcing-2026#evidence',
    lookFor: [
      'The evidence form accepting a typed EvidenceItem (kind, label, payload).',
      'A gate chip in the criteria panel changing state — the runtime is pure, so the flip is deterministic.',
      'A new entry in the InstanceEventTimeline at the bottom of the page recording the ingestion.',
    ],
    nextAnchor: 'step-6',
    nextLabel: 'Continue → Step 6 · Citation chips → pattern doctrine',
  },
  {
    anchor: 'step-6',
    eyebrow: 'Step 6 of 10',
    title: 'Step 6 · Click a citation chip',
    intro:
      'Every reasoning artifact carries a pattern citation. Clicking one takes you to the full doctrine for that pattern — the source-of-truth Layer 1 entry the runtime applied.',
    ctaLabel: 'Open PAT-SRC-AMS-001 →',
    ctaHref: '/source/patterns/PAT-SRC-AMS-001',
    lookFor: [
      'The full pattern body — stages, expected artifacts, contradiction templates, failure modes, evidence shape.',
      'A backlink / cross-reference to the catalogue index at /source/patterns.',
      'The same patternId / version that appeared in the AMS event provenance ribbon.',
    ],
    nextAnchor: 'step-7',
    nextLabel: 'Continue → Step 7 · Linked instance cascade',
  },
  {
    anchor: 'step-7',
    eyebrow: 'Step 7 of 10',
    title: 'Step 7 · Click the linked program tile',
    intro:
      'The AMS event is wired to a downstream program (APX-CDP-2026 — CDP Implementation). Click through to the program; the cascade view shows how a delay or contradiction on AMS propagates into the linked program’s plan.',
    ctaLabel: 'Open APX-CDP-2026 →',
    ctaHref: '/programs/APX-CDP-2026',
    lookFor: [
      'A cascade card pointing back at the AMS source event with a directional severity (impactSeverity).',
      'The program’s own provenance ribbon — Nexus is the synthesis voice for programs.',
      'Mission entries derived from pending program gates (deriveMissionsFromInstance).',
    ],
    nextAnchor: 'step-8',
    nextLabel: 'Continue → Step 8 · Compare two instances',
  },
  {
    anchor: 'step-8',
    eyebrow: 'Step 8 of 10',
    title: 'Step 8 · Compare with…',
    intro:
      'Open the comparison view with the AMS event on one side and APX-CDP-2026 on the other. Both sides are rendered from typed SynthesisContext objects, so the side-by-side is a real apples-to-apples reasoning diff.',
    ctaLabel: 'Open Compare (AMS vs APX-CDP-2026) →',
    ctaHref: '/source/compare?a=apex-retail-ams-outsourcing-2026&b=APX-CDP-2026',
    lookFor: [
      'Two parallel synthesis quotes — Sentinel on the left, Nexus on the right.',
      'A row-aligned diff of unmet gates, contradictions, and failure-mode counts.',
      'A shared cascade strip showing the link between the two instances.',
    ],
    nextAnchor: 'step-9',
    nextLabel: 'Continue → Step 9 · Tower portfolio view',
  },
  {
    anchor: 'step-9',
    eyebrow: 'Step 9 of 10',
    title: 'Step 9 · Tower portfolio view',
    intro:
      'Zoom out. /tower is the Atlas surface — a portfolio synthesis built from buildTowerSynthesisContext, with a top-patterns tile sourced from the synthesis telemetry ring buffer.',
    ctaLabel: 'Open Tower →',
    ctaHref: '/tower',
    lookFor: [
      'The Atlas portfolio synthesis quote at the top of the page.',
      'A cascade graph node cluster showing the AMS → APX-CDP-2026 link you traversed in steps 7–8.',
      'The top-patterns tile — driven by the synthesis telemetry counter, not a static fixture.',
    ],
    nextAnchor: 'step-10',
    nextLabel: 'Continue → Step 10 · Telemetry hub',
  },
  {
    anchor: 'step-10',
    eyebrow: 'Step 10 of 10',
    title: 'Step 10 · Telemetry hub',
    intro:
      'Finish at /admin/reasoning. Every synthesis call you triggered in steps 1–9 was logged to the in-memory ring buffer; this hub renders the cache hit rate, latency distribution, citation grounding, and feedback signal computed from those events.',
    ctaLabel: 'Open /admin/reasoning →',
    ctaHref: '/admin/reasoning',
    lookFor: [
      'Cache hit rate and median latency for synthesis events.',
      'Citation grounding — what fraction of generated sentences carry a citation pointer.',
      'Contradiction and failure-mode counts, plus the feedback signal channel.',
    ],
    nextAnchor: null,
    nextLabel: null,
  },
];

function Step({ step }: { step: DemoStep }) {
  return (
    <Section id={step.anchor} eyebrow={step.eyebrow} title={step.title}>
      <p style={PROSE_STYLE}>{step.intro}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        <Link href={step.ctaHref} style={CTA_BUTTON_STYLE}>
          {step.ctaLabel}
        </Link>
        <p style={URL_CHIP_STYLE}>{step.ctaHref}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        <h4 style={{ ...H3_STYLE, fontSize: 12 }}>What you should see</h4>
        <ul style={LIST_STYLE}>
          {step.lookFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {step.nextAnchor && step.nextLabel ? (
        <a href={`#${step.nextAnchor}`} style={CONTINUE_LINK_STYLE}>
          {step.nextLabel}
        </a>
      ) : null}
    </Section>
  );
}

export default function ReasoningDemoDocPage() {
  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open architecture doc"
          primaryActionHref="/docs/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Docs · Reasoning"
        title="Reasoning layer · 5-minute demo"
        subtitle="A guided, click-through tour of the AbarVa reasoning layer. Ten deep links into the live product, in order — open each, look for the elements called out, then continue to the next step."
      >
        <Section eyebrow="Before you start" title="How to read this page">
          <p style={PROSE_STYLE}>
            The{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>
              architecture doc
            </Link>
            {' '}explains the four-layer model; the{' '}
            <Link href="/docs/reasoning/quickstart" style={LINK_STYLE}>
              quickstart
            </Link>
            {' '}shows how to wire it into a new surface; the{' '}
            <Link href="/docs/reasoning/api" style={LINK_STYLE}>
              API reference
            </Link>
            {' '}lists every public symbol. This page is different — it is a
            hands-on tour. Each step opens a real product surface and tells
            you exactly what to look for once you arrive.
          </p>
          <p style={PROSE_STYLE}>
            Open each link in a new tab so you can keep this page as a
            scoreboard. The whole tour takes about five minutes end-to-end.
            Every URL below resolves to a fixture-backed surface — no
            credentials required, no external data calls.
          </p>
          <p style={PROSE_STYLE}>
            Anchor convention: each step has a stable id like{' '}
            <Code>#step-1</Code>, so you can deep-link an individual step from
            another doc, a Slack thread, or a meeting agenda.
          </p>
        </Section>

        {STEPS.map((step) => (
          <Step key={step.anchor} step={step} />
        ))}

        <Section eyebrow="Reset" title="Demo state notes">
          <p style={FOOTER_NOTE_STYLE}>
            All data on this tour is in-memory demo state — refresh the page
            to reset evidence ingestion / mission completions / contradiction
            resolutions. None of this is persisted. The synthesis telemetry
            ring buffer (visible at <Code>/admin/reasoning</Code>) is also
            in-memory and bounded by{' '}
            <Code>SYNTHESIS_TELEMETRY_CAPACITY</Code>; older events are evicted
            FIFO when the buffer is full.
          </p>
        </Section>

        <Section eyebrow="Next" title="Where to go from here">
          <p style={PROSE_STYLE}>
            Want the WHY? Read the{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>
              architecture doc
            </Link>
            . Want to wire Layer 3 into a new surface? Read the{' '}
            <Link href="/docs/reasoning/quickstart" style={LINK_STYLE}>
              quickstart
            </Link>
            . Need a per-symbol TypeScript reference? Read the{' '}
            <Link href="/docs/reasoning/api" style={LINK_STYLE}>
              API reference
            </Link>
            . Want a flat, git-derived view of every reasoning-layer commit?
            Read the{' '}
            <Link href="/docs/reasoning/changelog" style={LINK_STYLE}>
              changelog
            </Link>
            . Want to browse and search every pattern doctrine entry in the
            corpus?{' '}
            <Link href="/docs/reasoning/patterns" style={LINK_STYLE}>
              Pattern doctrine library
            </Link>
            . Want an investor-ready overview with live metrics from the
            corpus?{' '}
            <Link href="/docs/reasoning/about" style={LINK_STYLE}>
              About the reasoning layer
            </Link>
            .
          </p>
        </Section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
