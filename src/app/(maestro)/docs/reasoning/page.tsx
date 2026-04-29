// /docs/reasoning — AbarVa reasoning layer architecture doc.
//
// Static, server-rendered architecture page enumerating the 4-layer
// reasoning model. No LLM at runtime — this is a hand-authored doc
// intended for future maintainers and demo viewers. Content is
// derived from the actual public surface of `@/lib/reasoning` and
// the lifecycle pattern catalogues.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

export const metadata = {
  title: 'Reasoning architecture · AbarVa Docs',
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

interface ModuleRow {
  symbol: string;
  description: string;
}

const TYPE_ROWS: ReadonlyArray<ModuleRow> = [
  { symbol: 'PatternRef, EvidencePointer', description: 'Provenance pointers — every reasoning artifact carries a pattern ref and evidence pointer.' },
  { symbol: 'GateStatus, GateEvaluation, GateCriterionResult', description: 'Stage-gate evaluation result types (pending / passed / blocked, per criterion).' },
  { symbol: 'ContradictionDetection', description: 'Typed contradiction record between an instance and a pattern expectation.' },
  { symbol: 'FailureModeDetection, FailureModeDetector', description: 'Failure-mode signal — known anti-patterns flagged on a tenant instance.' },
  { symbol: 'ArtifactExpectation, ArtifactTracker, StageArtifactTracking', description: 'Per-stage artifact expectations and the running attached/missing roll-up.' },
  { symbol: 'LinkType, LinkedInstance, CascadeImpact', description: 'Cross-instance graph — typed edges between source events and programs.' },
  { symbol: 'CitationPointer, SynthesisContext', description: 'Inputs handed to Layer-4 synthesis: citations and the typed context envelope.' },
  { symbol: 'StageEvaluationResult', description: 'Aggregated per-stage view: gate + artifacts + contradictions + failure modes.' },
  { symbol: 'SynthesisCacheKey', description: 'Cache key shape used by the synthesis ring buffer and prose cache.' },
  { symbol: 'GateEvaluator, ContradictionDetector, PatternResolver, SynthesisContextBuilder', description: 'Runtime interface contracts implemented by the Lifecycle* classes.' },
  { symbol: 'PatternApplication', description: 'Central runtime contract — the orchestration shape Layer 3 fulfils.' },
  { symbol: 'PatternSeed', description: 'Re-exported from the intelligence layer — the seed type for typed lifecycle patterns.' },
];

const RUNTIME_ROWS: ReadonlyArray<ModuleRow> = [
  { symbol: 'LifecycleGateEvaluator, createGateEvaluator, evaluateStageGates', description: 'REASON-6 — evaluates pattern stage gates against an instance and emits per-criterion results.' },
  { symbol: 'LifecycleContradictionDetector, createContradictionDetector, detectContradictions', description: 'REASON-7 — detects pattern-expectation contradictions on a typed instance.' },
  { symbol: 'LifecycleFailureModeDetector, createFailureModeDetector, detectFailureModes', description: 'REASON-19 — flags known anti-patterns / failure modes from the seed catalogue.' },
  { symbol: 'LifecycleArtifactTracker, createArtifactTracker, trackArtifacts', description: 'REASON-8 — reconciles attached artifacts against per-stage expectations.' },
  { symbol: 'ArtifactMatchResolver, ArtifactMatchStatus', description: 'Pluggable resolver contract for matching attached artifacts to expectations.' },
  { symbol: 'buildSourceSynthesisContext, instanceStateHash', description: 'REASON-14 — assembles the Sentinel synthesis context for a SourceEventInstance.' },
  { symbol: 'buildProgramSynthesisContext, programInstanceStateHash', description: 'REASON-15 — assembles the Nexus synthesis context for a ProgramInstance.' },
  { symbol: 'buildTowerSynthesisContext, towerStateHash', description: 'REASON-17 — assembles the Atlas portfolio synthesis context for the Tower view.' },
  { symbol: 'recordSynthesisEvent, getRecentSynthesisEvents, recordFeedback, SYNTHESIS_TELEMETRY_CAPACITY', description: 'In-memory ring buffer + feedback channel for synthesis telemetry.' },
  { symbol: 'SynthesisTelemetryEvent, SynthesisTelemetryInput, SynthesisSurface, SynthesisFeedback', description: 'Telemetry record shapes feeding /admin/reasoning.' },
  { symbol: 'TelemetryBackend, setTelemetryBackend, NoOpTelemetryBackend, InMemoryExtendedTelemetryBackend, PostgresTelemetryBackend', description: 'Pluggable persistence backends. Default is in-memory-extended; setting DATABASE_URL + REASONING_TELEMETRY_BACKEND=postgres swaps in the Postgres backend (writes to reasoning_telemetry_events).' },
  { symbol: 'resolveLinkedProgram, resolveLinkedSourceEvent, resolveLinkedInstance', description: 'REASON-18 / REASON-9 — link resolution between source events and programs.' },
  { symbol: 'buildLinkedProgramChip', description: 'UI helper that produces the linked-program chip from a resolved instance.' },
  { symbol: 'computeCascadeImpacts, computeReverseCascade, scoreImpactSeverity, traceMultiHop', description: 'Cross-instance reasoner — forward and reverse cascade computation across linked instances.' },
  { symbol: 'LinkedProgramChipData, LinkedProgramChipStatus, CascadeGraph, CascadeGraphNode, CascadeGraphEdge', description: 'Cross-instance graph types consumed by cascade cards and chips.' },
  { symbol: 'deriveMissionsFromInstance, deriveAllMissions', description: 'Mission derivation — converts pending gates into a typed mission queue.' },
  { symbol: 'DerivedMission, DerivedMissionPriority', description: 'Mission queue entry shape and priority enum.' },
];

const SURFACE_ROWS: ReadonlyArray<{ route: string; agent: string; description: string }> = [
  { route: '/source/events/[id]', agent: 'Sentinel', description: 'Source event detail — synthesis prose, gate ribbon, mission list, contradiction cards, cascade cards, evidence ingestion.' },
  { route: '/programs/[id]', agent: 'Nexus', description: 'Program detail — synthesis prose, gate ribbon, missions, contradictions, cascade view.' },
  { route: '/tower', agent: 'Atlas', description: 'Portfolio synthesis with the top-patterns tile sourced from telemetry.' },
  { route: '/source/patterns', agent: '—', description: 'Lifecycle pattern catalogue (Layer 1 read-through).' },
  { route: '/source/patterns/[id]', agent: '—', description: 'Pattern detail — stages, expected artifacts, failure modes, evidence shape.' },
  { route: '/admin/reasoning', agent: 'Steward', description: 'Telemetry dashboard — cache hit rate, latency, citation grounding, contradictions, failure modes, feedback signal.' },
];

const LAYER_DIAGRAM = `Layer 1 — Pattern definitions
  • Knowledge patterns (corpus): SOURCING_PATTERNS (24 entries)
  • Lifecycle patterns: 7 source-event + 6 program = 13 typed
    LifecyclePatternSeed instances

Layer 2 — Tenant instances
  • SourceEventInstance, ProgramInstance — typed, bound to a patternId

Layer 3 — Pattern application runtime
  • Gate evaluator, contradiction detector, failure-mode detector,
    artifact tracker, cross-instance reasoner, mission derivation,
    evidence ingestion, telemetry, resolution state

Layer 4 — Synthesis
  • Sentinel (Source), Nexus (Programs), Atlas (Tower) —
    Anthropic-streamed prose grounded in the typed contexts of Layer 3`;

function ModuleTable({ rows }: { rows: ReadonlyArray<ModuleRow> }) {
  return (
    <ul style={{ ...LIST_STYLE, paddingLeft: 0, listStyle: 'none' }}>
      {rows.map((row) => (
        <li key={row.symbol} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Code>{row.symbol}</Code>
          <span style={{ fontSize: 13.5, color: `${COLORS.ink}aa`, lineHeight: 1.55 }}>
            {row.description}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ReasoningArchitectureDocPage() {
  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Docs · Reasoning"
        title="AbarVa reasoning layer · architecture"
        subtitle="A static, hand-authored map of the four-layer reasoning model: pattern definitions, tenant instances, the pattern-application runtime, and the synthesis voices that read from it."
      >
        <Section eyebrow="Quickstart" title="Wiring Layer 3 into a new surface?">
          <p style={PROSE_STYLE}>
            This page is the architectural map. If you want a working,
            SDK-style walkthrough — install, hello-gates, hello-contradictions,
            hello-synthesis, plus checklists for adding new patterns, new
            instances, and a new surface — read the{' '}
            <Link
              href="/docs/reasoning/quickstart"
              style={{ color: COLORS.navy, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              reasoning quickstart
            </Link>
            . For a dense, per-export listing of every public symbol with its
            TypeScript signature, see the{' '}
            <Link
              href="/docs/reasoning/api"
              style={{ color: COLORS.navy, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              reasoning API reference
            </Link>
            . For an autogenerated, git-derived list of every reasoning-layer
            commit shipped to date, see the{' '}
            <Link
              href="/docs/reasoning/changelog"
              style={{ color: COLORS.navy, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              reasoning changelog
            </Link>
            . For a hands-on, click-through tour of the live product surfaces
            wired through Layer 3, see the{' '}
            <Link
              href="/docs/reasoning/demo"
              style={{ color: COLORS.navy, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              5-minute demo walkthrough
            </Link>
            .
          </p>
        </Section>

        <Section eyebrow="Section 1" title="Why this exists">
          <p style={PROSE_STYLE}>
            Before the reasoning runtime, AbarVa had two halves of a brain that could not
            speak to each other. Layer 1 held the pattern definitions — the lifecycle
            knowledge corpus, with stages, expected artifacts, contradictions, and
            failure modes typed as <Code>LifecyclePatternSeed</Code> instances.
            Layer 2 held the tenant instances — <Code>SourceEventInstance</Code> and
            {' '}<Code>ProgramInstance</Code> records, each bound to a <Code>patternId</Code>.
            Nothing in between actually <em>applied</em> the pattern to the instance.
            UI surfaces hand-rolled their own gate logic, contradiction copy, and
            cascade reasoning, and Layer 4 (LLM synthesis) was asked to invent
            structure from a flat blob of fields.
          </p>
          <p style={PROSE_STYLE}>
            The reasoning layer (<Code>src/lib/reasoning/*</Code>) closes that gap. It is a
            deterministic, pure-function runtime that takes a typed instance plus its
            pattern seed and returns typed gate evaluations, contradictions, failure-mode
            detections, artifact tracking, cross-instance cascades, and a typed
            <Code>SynthesisContext</Code> that the Anthropic-streamed agents
            (Sentinel, Nexus, Atlas) ground their prose in. Every UI surface that
            previously hand-rolled reasoning now reads from this single source.
          </p>
        </Section>

        <Section eyebrow="Section 2" title="The 4 layers">
          <pre style={PRE_STYLE}>{LAYER_DIAGRAM}</pre>
          <p style={PROSE_STYLE}>
            Layers 1 and 2 are typed data. Layer 3 is the deterministic runtime that
            applies Layer 1 to Layer 2 and produces typed reasoning artifacts. Layer 4
            is the only layer that calls an LLM, and it never sees raw instances —
            only the typed <Code>SynthesisContext</Code> built by Layer 3.
          </p>
        </Section>

        <Section eyebrow="Section 3a" title="Module map · types">
          <p style={PROSE_STYLE}>
            Public type exports from <Code>src/lib/reasoning/index.ts</Code>. These
            describe the shape of every reasoning artifact that flows through the
            runtime and into Layer 4.
          </p>
          <ModuleTable rows={TYPE_ROWS} />
        </Section>

        <Section eyebrow="Section 3b" title="Module map · runtime">
          <p style={PROSE_STYLE}>
            Public runtime exports from <Code>src/lib/reasoning/index.ts</Code>. Every
            class is a deterministic, pure-function evaluator; every <Code>create*</Code>
            factory and <Code>build*</Code> function returns typed results without I/O.
          </p>
          <ModuleTable rows={RUNTIME_ROWS} />
        </Section>

        <Section eyebrow="Section 4" title="User-facing surfaces">
          <p style={PROSE_STYLE}>
            The routes below all read from the reasoning layer. None of them
            reproduce gate, contradiction, or cascade logic locally — they render
            the typed output of Layer 3 directly, and Layer 4 prose is anchored to
            the same context.
          </p>
          <ul style={{ ...LIST_STYLE, paddingLeft: 0, listStyle: 'none' }}>
            {SURFACE_ROWS.map((row) => (
              <li key={row.route} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'flex', gap: SPACING.sm, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Code>{row.route}</Code>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: COLORS.navy,
                      background: COLORS.skyPale,
                      borderRadius: RADIUS.pill,
                      padding: '2px 10px',
                      fontWeight: 600,
                    }}
                  >
                    {row.agent}
                  </span>
                </span>
                <span style={{ fontSize: 13.5, color: `${COLORS.ink}aa`, lineHeight: 1.55 }}>
                  {row.description}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Section 5" title="Testing posture">
          <p style={PROSE_STYLE}>
            Layer 3 is exercised by <strong>308+ unit tests</strong> in
            {' '}<Code>src/lib/reasoning/__tests__/</Code>. Every evaluator is a pure
            function over typed inputs — no network, no database, no LLM in tests.
            Each test asserts on the typed reasoning artifacts directly, which is what
            keeps the runtime deterministic and reviewable.
          </p>
          <p style={PROSE_STYLE}>
            Layer 4 (synthesis) is the only layer that calls Anthropic. Its tests
            stub the streaming client and assert on the typed context that was built
            for it, never on prose. The telemetry ring buffer
            (<Code>recordSynthesisEvent</Code>) is the operational view of Layer 4
            and is what <Code>/admin/reasoning</Code> renders.
          </p>
          <p style={PROSE_STYLE}>
            Telemetry persistence is pluggable through a narrow{' '}
            <Code>TelemetryBackend</Code> interface (
            <Code>write</Code>, <Code>writeFeedback</Code>). The default backend is
            an in-memory ring of capacity 5000 — no DB required, suitable for dev
            and ephemeral environments. Setting <Code>DATABASE_URL</Code> together
            with <Code>REASONING_TELEMETRY_BACKEND=postgres</Code> swaps in the
            Postgres backend, which write-throughs every recorded event and
            feedback signal into the <Code>reasoning_telemetry_events</Code> table
            (migration <Code>20260428180000</Code>). Backend writes are
            fire-and-forget — failures are logged but never propagate to the
            caller, so persistence latency or outages cannot block a synthesis
            response.
          </p>
        </Section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
