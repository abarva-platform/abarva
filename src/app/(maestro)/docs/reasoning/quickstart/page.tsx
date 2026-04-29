// /docs/reasoning/quickstart — SDK-style quickstart for the AbarVa
// reasoning layer.
//
// Aimed at the developer who has already read the architecture doc
// (/docs/reasoning) and wants to USE Layer 3 in a new surface. Each
// example is intentionally minimal and references only the public
// exports of `@/lib/reasoning` plus the instance/pattern fixtures
// already in the codebase, so the snippets compile in isolation.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

export const metadata = {
  title: 'Reasoning quickstart · AbarVa Docs',
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

const PRE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12.5,
  color: COLORS.ink,
  background: COLORS.cream,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  padding: SPACING.lg,
  margin: 0,
  lineHeight: 1.6,
  whiteSpace: 'pre',
  overflowX: 'auto',
};

const LINK_STYLE: CSSProperties = {
  color: COLORS.navy,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={SECTION_STYLE}>
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

// ─── Code block fixtures — kept verbatim so the docs page is the source of
// truth for what the example *says*. Each block is also a real, compilable
// program against the current public exports of @/lib/reasoning plus the
// instance/pattern fixtures already in the codebase.

const HELLO_GATES = `import { createGateEvaluator } from '@/lib/reasoning';
import {
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  buildEvidenceMap,
} from '@/lib/source/source-event-instance';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';

const instance = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;
const evaluator = createGateEvaluator(PAT_SRC_AMS_001);
const stages = evaluator.evaluateAllStages(instance.currentStage, buildEvidenceMap(instance));
console.log(\`stages=\${stages.length} gates=\${stages.reduce((n, s) => n + s.gatesTotal, 0)}\`);`;

const HELLO_CONTRADICTIONS = `import { detectContradictions } from '@/lib/reasoning';
import {
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  buildEvidenceMap,
} from '@/lib/source/source-event-instance';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';

const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
const contradictions = detectContradictions(PAT_SRC_AMS_001, evidenceMap);
for (const c of contradictions) {
  console.log(\`[\${c.severity}] \${c.label} — \${c.partyA} vs \${c.partyB}\`);
}`;

const HELLO_SYNTHESIS = `import { buildSourceSynthesisContext } from '@/lib/reasoning';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instance';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';

// Pure, deterministic Layer 3 output — no LLM, no I/O.
const context = buildSourceSynthesisContext(
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  PAT_SRC_AMS_001,
);

// In a real surface this typed context is the body posted to the
// streaming synthesis route (e.g. POST /api/agents/sentinel/synthesize),
// which forwards it verbatim to Anthropic. Layer 4 never sees the raw
// instance — only this typed envelope.
console.log(context.gatesSummary.unmet, context.activeContradictions.length);`;

// ─── Bullet-list fixtures ─────────────────────────────────────────────────────

const ADDING_PATTERN_BULLETS: ReadonlyArray<string> = [
  'Declare a new LifecyclePatternSeed object — give it a stable patternId, semver, label, and family.',
  'Add it to the appropriate fixture array (SOURCE_LIFECYCLE_PATTERNS or PROGRAM_LIFECYCLE_PATTERNS) so the resolver can find it.',
  'Make sure pattern.stages matches the workflow the surface actually drives — the gate evaluator sorts by stage.order and uses currentStage to compute passed/current/upcoming/blocked.',
  'Author each GateCriterion with the stageId of its destination stage; gateType "hard" blocks advancement, "soft" surfaces a warning.',
  'For ContradictionTemplate detectionHint and FailureMode description, use keyword phrases that actually occur in evidence-map keys or string values — Layer 3 detection is keyword-substring against the map.',
];

const ADDING_INSTANCE_BULLETS: ReadonlyArray<string> = [
  'Type the instance against SourceEventInstance or ProgramInstance — typed instanceId is required.',
  'Set patternId to a stable patternId from the matching pattern catalogue (and a real patternVersion semver).',
  'Set currentStage to a stageId that exists in the bound pattern.stages array — out-of-range values produce no current stage.',
  'Populate the evidence array with EvidenceItem records — these feed buildEvidenceMap and therefore every gate / contradiction / failure-mode signal.',
  'Populate the deliverables / artifacts array — items with expectedArtifactId hook into the artifact tracker; items without it are extra-pattern.',
  'Populate the blockers / governance flags array — open blockers raise cascade impactSeverity and surface in the mission queue.',
];

const SURFACE_RECIPE_BULLETS: ReadonlyArray<string> = [
  'Server-build the synthesis context once per request: const context = buildSourceSynthesisContext(instance, pattern). For Programs use buildProgramSynthesisContext, for Tower use buildTowerSynthesisContext.',
  'Render <SourceProvenanceRibbon context={context} /> (or the Program / Tower variant) at the top of the surface — it pins the pattern citation and the gate roll-up.',
  'Optional: render <MissionList missions={deriveMissionsFromInstance(instance, pattern)} /> when the surface needs the actionable to-do queue.',
  'For each entry in context.activeContradictions, render a <ContradictionDetailCard contradiction={c} /> — the card consumes the typed ContradictionDetection directly.',
  'For each entry in context.cascadeContext, render a <CascadeImpactCard impact={c} /> — the card respects impactSeverity and shows the directional severity.',
  'Render <InstanceEventTimeline events={...} /> at the bottom of the surface so users can see the chronology of stage transitions and ingestions backing the synthesis.',
];

export default function ReasoningQuickstartDocPage() {
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
        title="Reasoning layer · quickstart"
        subtitle="An SDK-style walkthrough for the developer who wants to wire Layer 3 into a new surface. Pairs with the architecture doc — read that first if you need the WHY."
      >
        <Section eyebrow="Section 0" title="Before you start">
          <p style={PROSE_STYLE}>
            This page assumes you have read the{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>
              reasoning architecture doc
            </Link>
            {' '}and understand the four-layer model. If a symbol on this page is
            unfamiliar, look it up in the module map there.
          </p>
        </Section>

        <Section eyebrow="Section 1" title="Install">
          <p style={PROSE_STYLE}>
            Nothing to install. The reasoning layer is a first-class module of
            this app — every public export ships from a single barrel:
          </p>
          <pre style={PRE_STYLE}>{`import { /* ... */ } from '@/lib/reasoning';`}</pre>
          <p style={PROSE_STYLE}>
            Pattern fixtures live under{' '}
            <Code>@/lib/intelligence/source-lifecycle-patterns</Code> and
            {' '}<Code>@/lib/intelligence/program-lifecycle-patterns</Code>;
            instance fixtures live under <Code>@/lib/source/source-event-instance</Code>
            {' '}and <Code>@/lib/programs/program-instances</Code>.
          </p>
        </Section>

        <Section eyebrow="Section 2" title="Hello, gates">
          <p style={PROSE_STYLE}>
            Evaluate every stage of a pattern against an instance and log the
            total gate count. <Code>evaluateAllStages</Code> is a method on the
            evaluator returned by <Code>createGateEvaluator</Code>; it returns
            one <Code>StageEvaluationResult</Code> per stage with all hard and
            soft gates pre-computed.
          </p>
          <pre style={PRE_STYLE}>{HELLO_GATES}</pre>
        </Section>

        <Section eyebrow="Section 3" title="Hello, contradictions">
          <p style={PROSE_STYLE}>
            <Code>detectContradictions</Code> takes a pattern plus an evidence
            map and returns one <Code>ContradictionDetection</Code> per template
            that fires. Each detection carries severity, confidence, the two
            parties involved, and a resolution path authored by the pattern
            writer.
          </p>
          <pre style={PRE_STYLE}>{HELLO_CONTRADICTIONS}</pre>
        </Section>

        <Section eyebrow="Section 4" title="Hello, synthesis">
          <p style={PROSE_STYLE}>
            <Code>buildSourceSynthesisContext</Code> is the canonical Layer 3
            entry point for source-event surfaces. It composes the gate
            evaluator, contradiction detector, failure-mode detector, artifact
            tracker, and cross-instance reasoner into a single typed
            <Code>SynthesisContext</Code>. The same shape is what the streaming
            synthesis API route forwards to Anthropic.
          </p>
          <pre style={PRE_STYLE}>{HELLO_SYNTHESIS}</pre>
        </Section>

        <Section eyebrow="Section 5" title="Adding a new pattern">
          <ul style={LIST_STYLE}>
            {ADDING_PATTERN_BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Section 6" title="Adding a new instance">
          <ul style={LIST_STYLE}>
            {ADDING_INSTANCE_BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Section 7" title="Surface integration recipe">
          <p style={PROSE_STYLE}>
            How a typical detail surface composes the reasoning layer. Each
            bullet maps to a single typed input or render call — no surface
            should ever reproduce gate, contradiction, or cascade logic
            locally.
          </p>
          <ul style={LIST_STYLE}>
            {SURFACE_RECIPE_BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Next" title="Where to go from here">
          <p style={PROSE_STYLE}>
            The{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>
              reasoning architecture doc
            </Link>
            {' '}enumerates every public export, the four-layer model, and the
            user-facing surfaces already wired through Layer 3. The
            {' '}<Code>/admin/reasoning</Code> telemetry dashboard is the
            operational view of Layer 4 once your surface is shipping prose.
            For a flat, git-derived view of every reasoning-layer commit
            shipped, read the{' '}
            <Link href="/docs/reasoning/changelog" style={LINK_STYLE}>
              reasoning changelog
            </Link>
            .
          </p>
        </Section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
