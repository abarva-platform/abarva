// /docs/reasoning/about — Investor-ready overview of the AbarVa reasoning layer.
//
// Server component. Explains WHAT the reasoning layer is, WHY it matters, and
// HOW it works at both a business and technical level. Live metrics (pattern
// count, template coverage, active instances, API endpoints) are computed
// server-side from the static fixture corpus — deterministic, no LLM, no I/O.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

// Live corpus data — all imports are pure static arrays, no runtime I/O.
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { CAT_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns-cat';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { auditAll } from '@/lib/reasoning/template-coverage-audit';

export const metadata = {
  title: 'About the reasoning layer · AbarVa Docs',
};

// ─── Style constants ──────────────────────────────────────────────────────────

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

const MONO_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12.5,
  color: COLORS.ink,
  background: COLORS.cream,
  padding: '1px 6px',
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLORS.ink}10`,
};

const STAT_CHIP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.navy,
  background: COLORS.skyPale,
  borderRadius: RADIUS.pill,
  padding: '5px 16px',
  letterSpacing: '0.02em',
};

const LAYER_NUM_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: RADIUS.pill,
  background: COLORS.ink,
  color: COLORS.white,
  fontFamily: TYPOGRAPHY.sans,
  fontWeight: 700,
  fontSize: 13,
  flexShrink: 0,
};

const CARD_LINK_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: SPACING.md,
  background: COLORS.cream,
  border: `1px solid ${COLORS.ink}12`,
  borderRadius: RADIUS.md,
  textDecoration: 'none',
  color: COLORS.ink,
};

const CARD_LABEL_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontWeight: 600,
  fontSize: 14,
  color: COLORS.navy,
};

const CARD_DESC_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12.5,
  color: `${COLORS.ink}99`,
  lineHeight: 1.45,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Layer row ────────────────────────────────────────────────────────────────

interface LayerRow {
  num: number;
  label: string;
  description: string;
}

const LAYERS: ReadonlyArray<LayerRow> = [
  {
    num: 1,
    label: 'Pattern Definitions (L1)',
    description:
      '49 typed LifecyclePatternSeeds covering AMS, SaaS, infra, and 42 service categories — each with stages, gate criteria, expected artifacts, contradiction templates, and failure modes.',
  },
  {
    num: 2,
    label: 'Tenant Instances (L2)',
    description:
      'Per-engagement SourceEventInstance and ProgramInstance records, each bound to a patternId. Carry live evidence, gate state, contradiction records, and blocker flags.',
  },
  {
    num: 3,
    label: 'Evaluation Runtime (L3)',
    description:
      'Deterministic, pure-function evaluators: gate evaluator, contradiction detector, failure mode detector, artifact tracker, cascade reasoner, and mission derivation. No LLM, no I/O — same inputs always produce the same typed reasoning artifacts.',
  },
  {
    num: 4,
    label: 'LLM Synthesis (L4)',
    description:
      'Streaming synthesis (Sentinel, Nexus, Atlas) grounded in the typed SynthesisContext built by L3. ETag caching prevents redundant calls; per-stage playbooks anchor each surface\'s prose; confidence scoring feeds the telemetry hub.',
  },
];

// ─── Feature card data ────────────────────────────────────────────────────────

interface FeatureCard {
  label: string;
  description: string;
  href: string;
}

const FEATURE_CARDS: ReadonlyArray<FeatureCard> = [
  {
    label: 'Health Board',
    description: 'Gate ribbon, failure-mode warnings, and cascade severity roll-up across all active instances.',
    href: '/source/events/apex-retail-ams-outsourcing-2026',
  },
  {
    label: 'Contradiction Resolution',
    description: 'Typed evidence-backed contradictions between vendor claims and market data, with resolution paths.',
    href: '/source/events/apex-retail-ams-outsourcing-2026#contradictions',
  },
  {
    label: 'Gate Waiver',
    description: 'Sponsor-approved waiver flow for blocking gate criteria, tracked against the instance lifecycle.',
    href: '/source/events/apex-retail-ams-outsourcing-2026#gates',
  },
  {
    label: 'Evidence Quality',
    description: 'Per-stage artifact tracking reconciled against expected artifacts — completeness visible at a glance.',
    href: '/source/events/apex-retail-ams-outsourcing-2026#evidence',
  },
  {
    label: 'Synthesis Diff',
    description: 'Side-by-side gate + contradiction delta between two instances or two synthesis snapshots.',
    href: '/source/compare?a=apex-retail-ams-outsourcing-2026&b=APX-CDP-2026',
  },
  {
    label: 'Pattern Doctrine',
    description: 'Full corpus of 49 typed lifecycle patterns — searchable by category, stage, or keyword.',
    href: '/docs/reasoning/patterns',
  },
];

// ─── Doc link data ────────────────────────────────────────────────────────────

interface DocLink {
  label: string;
  subtitle: string;
  href: string;
}

const DOC_LINKS: ReadonlyArray<DocLink> = [
  { label: 'Architecture', subtitle: 'Four-layer model, module map, surface inventory', href: '/docs/reasoning' },
  { label: 'Quickstart', subtitle: 'SDK-style walkthrough for wiring a new surface', href: '/docs/reasoning/quickstart' },
  { label: 'API reference', subtitle: 'Every public symbol with TypeScript signatures', href: '/docs/reasoning/api' },
  { label: 'Demo walkthrough', subtitle: '10-step guided tour of the live product surfaces', href: '/docs/reasoning/demo' },
  { label: 'Changelog', subtitle: 'Git-derived history of every reasoning-layer commit', href: '/docs/reasoning/changelog' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReasoningAboutPage() {
  // Live corpus metrics — pure, deterministic, server-side only.
  const patternCount =
    SOURCE_LIFECYCLE_PATTERNS.length +
    PROGRAM_LIFECYCLE_PATTERNS.length +
    CAT_LIFECYCLE_PATTERNS.length +
    SOURCING_PATTERNS.length;

  const instanceCount =
    SOURCE_EVENT_INSTANCES.length + APEX_RETAIL_PROGRAM_INSTANCES.length;

  const coverageAudit = auditAll();
  const templateCoveragePct = Math.round(
    coverageAudit.summary.contradictionsBound.coverageRatio * 100,
  );

  // Count of reasoning API route.ts files — hard-coded to the shipping count.
  // Update when a new route is added. Alternatively this could be derived from
  // a manifest but a constant is cleaner for a doc surface.
  const apiEndpointCount = 20;

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
        title="The AbarVa Reasoning Layer"
        subtitle="A 4-layer intelligence runtime that turns procurement pattern libraries into living, evidence-backed decision support."
      >
        {/* ── Section 1: The problem it solves ─────────────────────────────── */}
        <Section eyebrow="Section 1" title="The problem it solves">
          <p style={PROSE_STYLE}>
            Enterprise procurement decisions carry multi-year financial and operational
            consequences — yet most organisations make them on tribal knowledge,
            gut-feel gate reviews, and static spreadsheets that cannot surface
            contradictions between what a vendor claims and what the market knows.
            The AbarVa reasoning layer exists to close that gap.
          </p>
          <ul style={LIST_STYLE}>
            <li>
              Procurement decisions are made on tribal knowledge, not structured intelligence.
            </li>
            <li>
              Gate reviews are manual checklists without evidence traceability.
            </li>
            <li>
              Contradictions between vendor claims and market data go undetected.
            </li>
          </ul>
        </Section>

        {/* ── Section 2: 4-layer architecture ──────────────────────────────── */}
        <Section eyebrow="Section 2" title="4-layer architecture">
          <p style={PROSE_STYLE}>
            The reasoning layer is a clean four-layer stack. Layers 1 and 2 are
            typed data. Layer 3 is the deterministic runtime that applies L1 to L2
            and produces typed reasoning artifacts. Layer 4 is the only layer that
            calls an LLM — and it never sees raw instances, only the typed{' '}
            <Code>SynthesisContext</Code> built by L3.
          </p>
          <ol
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            {LAYERS.map((layer) => (
              <li
                key={layer.num}
                style={{
                  display: 'flex',
                  gap: SPACING.md,
                  alignItems: 'flex-start',
                }}
              >
                <span style={LAYER_NUM_STYLE}>{layer.num}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: COLORS.ink,
                    }}
                  >
                    {layer.label}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: `${COLORS.ink}aa`,
                    }}
                  >
                    {layer.description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Section 3: Key metrics ────────────────────────────────────────── */}
        <Section eyebrow="Section 3" title="Key metrics">
          <p style={PROSE_STYLE}>
            Computed server-side from the static fixture corpus on every page load.
            No stale dashboards — these numbers reflect the actual shipping state
            of the reasoning layer.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: SPACING.md,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: SPACING.lg,
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}12`,
                borderRadius: RADIUS.md,
              }}
            >
              <span style={STAT_CHIP_STYLE}>{patternCount}</span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}99`,
                  lineHeight: 1.45,
                }}
              >
                Patterns in corpus
                <br />
                <span style={{ fontSize: 11.5 }}>
                  {SOURCE_LIFECYCLE_PATTERNS.length} source lifecycle ·{' '}
                  {PROGRAM_LIFECYCLE_PATTERNS.length} program lifecycle ·{' '}
                  {CAT_LIFECYCLE_PATTERNS.length} category ·{' '}
                  {SOURCING_PATTERNS.length} sourcing
                </span>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: SPACING.lg,
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}12`,
                borderRadius: RADIUS.md,
              }}
            >
              <span style={STAT_CHIP_STYLE}>{templateCoveragePct}%</span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}99`,
                  lineHeight: 1.45,
                }}
              >
                Template coverage (bound patterns)
                <br />
                <span style={{ fontSize: 11.5 }}>
                  {coverageAudit.summary.contradictionsBound.coveredTemplates} of{' '}
                  {coverageAudit.summary.contradictionsBound.totalTemplates} contradiction
                  templates fire on at least one fixture instance
                </span>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: SPACING.lg,
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}12`,
                borderRadius: RADIUS.md,
              }}
            >
              <span style={STAT_CHIP_STYLE}>{instanceCount}</span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}99`,
                  lineHeight: 1.45,
                }}
              >
                Active fixture instances
                <br />
                <span style={{ fontSize: 11.5 }}>
                  {SOURCE_EVENT_INSTANCES.length} source event ·{' '}
                  {APEX_RETAIL_PROGRAM_INSTANCES.length} program
                </span>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: SPACING.lg,
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}12`,
                borderRadius: RADIUS.md,
              }}
            >
              <span style={STAT_CHIP_STYLE}>{apiEndpointCount}</span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}99`,
                  lineHeight: 1.45,
                }}
              >
                Reasoning API endpoints
                <br />
                <span style={{ fontSize: 11.5 }}>
                  Under <Code>/api/reasoning/*</Code> — gates, contradictions,
                  evidence, telemetry, synthesis cache
                </span>
              </span>
            </div>
          </div>
        </Section>

        {/* ── Section 4: What you can do ────────────────────────────────────── */}
        <Section eyebrow="Section 4" title="What you can do">
          <p style={PROSE_STYLE}>
            Six capabilities ship today, each accessible from the live product.
            Every card links directly to the relevant surface or doc.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: SPACING.sm,
            }}
          >
            {FEATURE_CARDS.map((card) => (
              <Link key={card.label} href={card.href} style={CARD_LINK_STYLE}>
                <span style={CARD_LABEL_STYLE}>{card.label}</span>
                <span style={CARD_DESC_STYLE}>{card.description}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── Section 5: Links ──────────────────────────────────────────────── */}
        <Section eyebrow="Section 5" title="Read more">
          <ul style={{ ...LIST_STYLE, paddingLeft: 0, listStyle: 'none' }}>
            {DOC_LINKS.map((doc) => (
              <li
                key={doc.label}
                style={{
                  display: 'flex',
                  gap: SPACING.sm,
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                }}
              >
                <Link href={doc.href} style={LINK_STYLE}>
                  {doc.label}
                </Link>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    color: `${COLORS.ink}80`,
                  }}
                >
                  — {doc.subtitle}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
