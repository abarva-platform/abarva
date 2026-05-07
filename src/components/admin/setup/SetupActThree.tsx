/**
 * SetupActThree · SETUP-1.2 + Setup Fix Package PR 4
 *
 * Act 3 — "What changes when you upload one more thing."
 *
 * Each entry shows:
 *   • Headline of the capability gained
 *   • Today / After preview pair (Sentinel's voice changes when
 *     the data lands)
 *   • Programs that benefit
 *   • Click-through to the segment (deep link to be wired in
 *     SETUP-1.7)
 *   • Format preview + starter template download (PR 4 — for the
 *     four segments with templates: 01, 03, 06, 12)
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.4.
 */

import Link from 'next/link';

import type { CapabilityGainEntry } from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

import { SetupActHeader } from './SetupActOne';

// ── Setup Fix Package PR 4 · Upload templates ────────────────────────────────
// One entry per Act 3 segment with a starter template available. Inline
// preview keeps the format honest before download (3-5 fields max).
interface UploadTemplate {
  /** Path served from `public/setup-templates/`. */
  href: string;
  /** Format label shown next to the download CTA. */
  format: 'YAML' | 'CSV';
  /** 1-3 line inline preview of the file contents. */
  previewLines: string[];
  /** Footer copy describing the full template surface. */
  footnote: string;
}

const UPLOAD_TEMPLATES: Record<string, UploadTemplate> = {
  // Segment 01 · Enterprise Profile (YAML — narrative shape).
  '01': {
    href: '/setup-templates/enterprise-profile.yaml',
    format: 'YAML',
    previewLines: [
      'legal_entity: "First Capital Financial Holdings Inc."',
      'revenue_mix:',
      '  - segment: Retail Banking',
      '    pct: 45',
    ],
    footnote:
      'Full template: legal entity, revenue mix, regulators, strategic priorities, risk committee cadence.',
  },
  // Segment 03 · IT System Landscape (CSV — one row per system).
  '03': {
    href: '/setup-templates/it-system-landscape.csv',
    format: 'CSV',
    previewLines: [
      'system_name,domain,authoritative_for,owner,vendor,environment,data_classification,integrations',
      'Core Banking - Temenos T24,Core Banking,Customer/Account/Transaction,VP Core Platforms,Temenos,Production,Restricted,"CRM,DataWarehouse,Payments"',
    ],
    footnote: 'One row per system. Columns: name, domain, authoritative_for, owner, vendor, environment, classification, integrations.',
  },
  // Segment 06 · Program Inventory (CSV — one row per program).
  '06': {
    href: '/setup-templates/program-inventory.csv',
    format: 'CSV',
    previewLines: [
      'program_name,phase,sponsor,owner,start_date,target_completion,budget_committed,strategic_objective',
      'Digital Banking Risk Controls Modernization,P2 Discover,CRO,VP Risk Operations,2026-01-15,2026-12-31,3500000,Reduce manual control burden 40%',
    ],
    footnote: 'One row per program. Columns: program_name, phase, sponsor, owner, start_date, target_completion, budget_committed, strategic_objective.',
  },
  // Segment 12 · Compliance and Regulatory (CSV — multiple controls).
  '12': {
    href: '/setup-templates/compliance-and-regulatory.csv',
    format: 'CSV',
    previewLines: [
      'control_framework,control_id,owner,status,evidence_url,last_tested,next_test',
      'GLBA Safeguards Rule,GLBA-001,Director Information Security,In Place,/evidence/glba-001-2026q1.pdf,2026-03-15,2026-09-15',
    ],
    footnote: 'One row per control. Columns: framework, control_id, owner, status, evidence_url, last_tested, next_test.',
  },
};

export interface SetupActThreeProps {
  gains: CapabilityGainEntry[];
}

export function SetupActThree({ gains }: SetupActThreeProps) {
  const sorted = [...gains].sort((a, b) => a.rank - b.rank);
  return (
    <section
      data-testid="admin-setup-act-three"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <SetupActHeader
        eyebrow="Act 3"
        title="What changes when you upload one more thing"
        subtitle="Each row shows the capability gained from completing one segment, the program(s) it impacts, and how Sentinel's voice changes once the data lands. Ranked by program impact."
      />
      <ol
        data-testid="admin-setup-gain-list"
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {sorted.map((gain) => (
          <GainCard key={gain.id} gain={gain} />
        ))}
      </ol>
    </section>
  );
}

function GainCard({ gain }: { gain: CapabilityGainEntry }) {
  const segmentHref = `/admin/segments/${gain.targetSegmentId}`;
  const template = UPLOAD_TEMPLATES[gain.targetSegmentId];
  return (
    <li
      data-testid={`admin-setup-gain-${gain.id}`}
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            color: SHELL.INK,
            lineHeight: 1.35,
          }}
        >
          {gain.capabilityGained}
        </p>
        <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
          {template ? (
            <a
              href={template.href}
              download
              data-testid={`admin-setup-gain-template-${gain.id}`}
              data-template-format={template.format}
              style={{
                color: SHELL.INK,
                fontFamily: SHELL.SANS,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                border: `1px solid ${SHELL.INK}30`,
                borderRadius: RADIUS.pill,
                padding: `4px ${SPACING.md}`,
                whiteSpace: 'nowrap',
                background: SHELL.CARD_WHITE,
              }}
            >
              Download {template.format} template ↓
            </a>
          ) : null}
          <Link
            href={segmentHref}
            data-testid={`admin-setup-gain-cta-${gain.id}`}
            style={{
              color: COLORS.navy,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${COLORS.navy}55`,
              borderRadius: RADIUS.pill,
              padding: `4px ${SPACING.md}`,
              whiteSpace: 'nowrap',
            }}
          >
            Add {gain.targetSegmentName} →
          </Link>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        {gain.targetSegmentName}
        {gain.impactedPrograms.length > 0
          ? ` · Impacts ${gain.impactedPrograms.join(', ')}`
          : ' · Portfolio-wide'}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: SPACING.sm,
          marginTop: SPACING.xs,
        }}
      >
        <Preview
          eyebrow="Today"
          tone="amber"
          quote={gain.todayPreview}
          testid={`admin-setup-gain-today-${gain.id}`}
        />
        <Preview
          eyebrow="After upload"
          tone="mint"
          quote={gain.afterPreview}
          testid={`admin-setup-gain-after-${gain.id}`}
        />
      </div>
      {template ? (
        <FormatPreview
          template={template}
          testid={`admin-setup-gain-format-${gain.id}`}
        />
      ) : null}
    </li>
  );
}

function FormatPreview({
  template,
  testid,
}: {
  template: UploadTemplate;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      data-template-format={template.format}
      style={{
        background: SHELL.PAPER,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 700,
        }}
      >
        Format preview · {template.format}
      </p>
      <pre
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {template.previewLines.join('\n')}
      </pre>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 11.5,
          color: SHELL.INK_MUTED,
          lineHeight: 1.45,
        }}
      >
        {template.footnote}
      </p>
    </div>
  );
}

function Preview({
  eyebrow,
  tone,
  quote,
  testid,
}: {
  eyebrow: string;
  tone: 'amber' | 'mint';
  quote: string;
  testid: string;
}) {
  const palette =
    tone === 'amber'
      ? {
          background: COLORS.amberSoft,
          border: `${COLORS.amberInk}33`,
          text: COLORS.amberInk,
        }
      : {
          background: COLORS.mintSoft,
          border: `${COLORS.mintInk}33`,
          text: COLORS.mintInk,
        };
  return (
    <div
      data-testid={testid}
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: palette.text,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 14,
          lineHeight: 1.45,
          color: SHELL.INK,
        }}
      >
        {quote}
      </p>
    </div>
  );
}
