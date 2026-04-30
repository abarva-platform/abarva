'use client';

// Phase0Primer · OV2-3b
//
// Renders an `ArchetypePrimer` (PR-OV2-3a contract) as a structured
// page section on `/programs/<id>` when the program is in Phase 0.
// Per design doc Section D.0.6, the primer is the platform's voice at
// the moment of approval: "your program is approved → here is exactly
// what comes next". Outcome statement, SMEs, templates, workshops, data
// assets, prep checklist — all surfaced before the agent canvas, no
// search required.
//
// Architecture decision (per OV2-3b spec):
// ────────────────────────────────────────
// This component is a static, prop-driven renderer. It is NOT part of
// `NexusReactivePanel` (whose job is streamed reactive artifacts). It
// sits as a top-level page section ABOVE the AgentCanvas when phase=0
// and renders nothing when no primer is provided. The primer registry
// (`src/lib/programs/archetype-primers/*`) is server-only; this component
// receives the resolved primer as a prop, so it stays client-safe.
//
// The downloadable HTML brief is a follow-on slice (OV2-3c). Until then
// `downloadHref` is omitted by the page integration; when supplied it
// renders a small download chip at the bottom of the panel.

import type { CSSProperties, ReactNode } from 'react';
import type {
  ArchetypePrimer,
  PrimerEngagementWindow,
  PrimerSME,
  PrimerTemplate,
  PrimerWorkshop,
  PrimerDataAsset,
  PrimerPrepItem,
  PrimerTemplateKind,
  PrimerDataAssetFormat,
} from '@/lib/programs/archetype-primers/types';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import { getPhasePack } from '@/lib/programs/phase-packs';
import type { PhaseStep } from '@/lib/programs/phase-packs/types';

export interface Phase0PrimerProps {
  primer: ArchetypePrimer;
  /**
   * Optional: link to download the HTML brief (OV2-3c future slice).
   * For now omit or pass undefined.
   */
  downloadHref?: string;
}

// ── Visual tokens ────────────────────────────────────────────────────────────
//
// Matches the density and palette of `NexusReactivePanel` so the page
// reads as one piece. We pull from `BrandColors` / `BrandTypography`
// only — no new palettes.

const CARD_BG = '#FFFFFF';
const CARD_BORDER = `1px solid rgba(12,26,58,0.12)`;
const CARD_BORDER_SOFT = `1px solid rgba(12,26,58,0.08)`;
const CARD_RADIUS = 10;
const CARD_SHADOW = '0 1px 2px rgba(12,26,58,0.04)';

const ROW_DIVIDER = `1px solid rgba(12,26,58,0.06)`;

// ── Tiny UI primitives ───────────────────────────────────────────────────────

function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: BrandColors.slate,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MonoChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 7px',
        borderRadius: 999,
        background: 'rgba(12,26,58,0.06)',
        border: '1px solid rgba(12,26,58,0.10)',
        color: BrandColors.navyInk,
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  index,
  title,
  hint,
}: {
  index: number;
  title: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <Eyebrow>{`Section ${index} · ${title}`}</Eyebrow>
      {hint ? (
        <div
          style={{
            marginTop: 4,
            fontFamily: BrandTypography.sans,
            fontSize: 12.5,
            color: BrandColors.slate,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

// ── Section helpers ──────────────────────────────────────────────────────────

const ENGAGEMENT_WINDOW_LABEL: Record<PrimerEngagementWindow, string> = {
  kickoff: 'Kickoff',
  'data-discovery': 'Data discovery',
  baseline: 'Baseline',
  'synthesis-prep': 'Synthesis prep',
};

const TEMPLATE_KIND_LABEL: Record<PrimerTemplateKind, string> = {
  workshop_facilitator_guide: 'Facilitator guide',
  interview_script: 'Interview script',
  capture_template: 'Capture template',
  baseline_spreadsheet: 'Baseline spreadsheet',
  document: 'Document',
};

const DATA_FORMAT_LABEL: Record<PrimerDataAssetFormat, string> = {
  CSV: 'CSV',
  spreadsheet: 'Spreadsheet',
  PDF: 'PDF',
  'text-summary': 'Text summary',
  'structured-export': 'Structured export',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function P1OutcomeBlock({ statement }: { statement: string }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="p1-outcome"
    >
      <SectionHeader index={1} title="Phase 1 outcome" />
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 15,
          lineHeight: 1.6,
          color: BrandColors.inkBlack,
        }}
      >
        {statement}
      </p>
    </div>
  );
}

function StepsBlock({ steps }: { steps: ReadonlyArray<PhaseStep> }) {
  if (steps.length === 0) return null;
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="p1-steps"
    >
      <SectionHeader
        index={2}
        title="Steps you'll work through in P1"
        hint="From the canonical P1 Discovery pack. Complex steps require off-platform work (workshop / interview / baseline)."
      />
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: 6,
        }}
      >
        {steps.map((step, idx) => (
          <li
            key={step.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr auto',
              gap: 10,
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: idx === steps.length - 1 ? 'none' : ROW_DIVIDER,
            }}
            data-step-id={step.id}
          >
            <span
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 11,
                color: BrandColors.slate,
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: BrandTypography.sans,
                fontSize: 13.5,
                color: BrandColors.inkBlack,
                lineHeight: 1.45,
              }}
            >
              {step.label}
            </span>
            <MonoChip>{step.complexity}</MonoChip>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SmeCard({ sme }: { sme: PrimerSME }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER_SOFT,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      data-sme-role={sme.role}
    >
      <Eyebrow>{sme.role}</Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          lineHeight: 1.5,
          color: BrandColors.inkBlack,
        }}
      >
        {sme.rationale}
      </p>
      {sme.escalationHint ? (
        <p
          style={{
            margin: 0,
            fontFamily: BrandTypography.sans,
            fontSize: 12,
            lineHeight: 1.45,
            color: BrandColors.slate,
            fontStyle: 'italic',
          }}
        >
          Escalation: {sme.escalationHint}
        </p>
      ) : null}
      <div style={{ marginTop: 2 }}>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: BrandColors.slate,
            fontWeight: 600,
          }}
        >
          Engaged at · {ENGAGEMENT_WINDOW_LABEL[sme.neededAt]}
        </span>
      </div>
    </div>
  );
}

function SmesBlock({ smes }: { smes: ReadonlyArray<PrimerSME> }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="smes"
    >
      <SectionHeader
        index={3}
        title="Team / SMEs you'll need"
        hint="In approximately the order they're engaged across P1."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 10,
        }}
        data-sme-count={smes.length}
      >
        {smes.map((sme) => (
          <SmeCard key={sme.role} sme={sme} />
        ))}
      </div>
    </div>
  );
}

function TemplateRow({ tpl }: { tpl: PrimerTemplate }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 6,
        padding: '10px 0',
        borderBottom: ROW_DIVIDER,
      }}
      data-template-id={tpl.id}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.sans,
            fontSize: 13.5,
            fontWeight: 600,
            color: BrandColors.inkBlack,
          }}
        >
          {tpl.title}
        </span>
        <MonoChip>{TEMPLATE_KIND_LABEL[tpl.kind]}</MonoChip>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: BrandColors.slate,
        }}
      >
        {tpl.description}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 9.5,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: BrandColors.slate,
          }}
        >
          Satisfies ·
        </span>
        {tpl.satisfiesEvidenceItems.map((id) => (
          <span
            key={id}
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 10,
              color: BrandColors.navyInk,
              padding: '0 2px',
            }}
          >
            {id}
          </span>
        ))}
      </div>
    </div>
  );
}

function TemplatesBlock({ templates }: { templates: ReadonlyArray<PrimerTemplate> }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="templates"
    >
      <SectionHeader
        index={4}
        title="Templates you'll use"
        hint="The agent surfaces these inline as you work through P1 steps."
      />
      <div data-template-count={templates.length}>
        {templates.map((tpl, idx) => (
          <div
            key={tpl.id}
            style={{
              borderBottom: idx === templates.length - 1 ? 'none' : undefined,
            }}
          >
            <TemplateRow tpl={tpl} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkshopCard({ ws }: { ws: PrimerWorkshop }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER_SOFT,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      data-workshop-id={ws.id}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <Eyebrow>{ws.title}</Eyebrow>
        <MonoChip>{`${ws.durationHours}h`}</MonoChip>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          lineHeight: 1.5,
          color: BrandColors.inkBlack,
        }}
      >
        {ws.description}
      </p>
      <div
        style={{
          display: 'grid',
          gap: 4,
          marginTop: 2,
        }}
      >
        <div
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: BrandColors.slate,
            fontWeight: 600,
          }}
        >
          Attendees
        </div>
        <div
          style={{
            fontFamily: BrandTypography.sans,
            fontSize: 12.5,
            color: BrandColors.inkBlack,
            lineHeight: 1.5,
          }}
        >
          {ws.attendees.join(' · ')}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 9.5,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: BrandColors.slate,
          }}
        >
          Uses ·
        </span>
        {ws.usesTemplates.map((id) => (
          <span
            key={id}
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 10,
              color: BrandColors.navyInk,
            }}
          >
            {id}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkshopsBlock({ workshops }: { workshops: ReadonlyArray<PrimerWorkshop> }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="workshops"
    >
      <SectionHeader
        index={5}
        title="Workshops to schedule"
        hint="Schedule these before P1 kickoff. Calendar lock is the gating step."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 10,
        }}
        data-workshop-count={workshops.length}
      >
        {workshops.map((ws) => (
          <WorkshopCard key={ws.id} ws={ws} />
        ))}
      </div>
    </div>
  );
}

function DataAssetRow({ asset }: { asset: PrimerDataAsset }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 4,
        padding: '10px 0',
        borderBottom: ROW_DIVIDER,
      }}
      data-data-asset-id={asset.id}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.sans,
            fontSize: 13.5,
            fontWeight: 600,
            color: BrandColors.inkBlack,
          }}
        >
          {asset.label}
        </span>
        <MonoChip>{DATA_FORMAT_LABEL[asset.format]}</MonoChip>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: BrandColors.slate,
        }}
      >
        {asset.rationale}
      </p>
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: BrandColors.slate,
          fontWeight: 600,
        }}
      >
        Needed at · {ENGAGEMENT_WINDOW_LABEL[asset.neededAt]}
      </div>
    </div>
  );
}

function DataAssetsBlock({ assets }: { assets: ReadonlyArray<PrimerDataAsset> }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="data-assets"
    >
      <SectionHeader
        index={6}
        title="Data to gather before kicking off"
        hint="Extracts have lead time. Request these at P1 kickoff, not Day 1."
      />
      <div data-data-asset-count={assets.length}>
        {assets.map((asset, idx) => (
          <div
            key={asset.id}
            style={{
              borderBottom: idx === assets.length - 1 ? 'none' : undefined,
            }}
          >
            <DataAssetRow asset={asset} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PrepChecklistBlock({ items }: { items: ReadonlyArray<PrimerPrepItem> }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: '16px 18px',
      }}
      data-section="prep-checklist"
    >
      <SectionHeader
        index={7}
        title="Prep checklist"
        hint="Concrete actions to take BEFORE Phase 1 starts. Visual only — no state in this slice."
      />
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: 8,
        }}
        data-prep-item-count={items.length}
      >
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr',
              gap: 10,
              alignItems: 'flex-start',
              padding: '8px 0',
              borderBottom: ROW_DIVIDER,
            }}
            data-prep-id={item.id}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: 3,
                border: `1.5px solid ${BrandColors.stone}`,
                background: BrandColors.paper,
                marginTop: 2,
              }}
            />
            <div style={{ display: 'grid', gap: 2 }}>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: BrandColors.inkBlack,
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 12.5,
                  color: BrandColors.slate,
                  lineHeight: 1.5,
                }}
              >
                {item.rationale}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function Phase0Primer({ primer, downloadHref }: Phase0PrimerProps) {
  // Pull P1 step decomposition at runtime. Keeps the primer registry
  // free of pack content (single source of truth for steps stays in
  // phase-packs/P1_discovery.ts).
  const p1Pack = getPhasePack(1);
  const p1Steps = p1Pack?.steps ?? [];

  return (
    <section
      data-testid="phase-0-primer"
      data-pattern-id={primer.patternId}
      style={{
        display: 'grid',
        gap: 14,
        marginBottom: 20,
      }}
    >
      {/* 1. Header — serif title + mono subtitle */}
      <header style={{ display: 'grid', gap: 6 }}>
        <Eyebrow>{`Phase 0 prep · ${primer.patternId}`}</Eyebrow>
        <h2
          style={{
            margin: 0,
            fontFamily: BrandTypography.serif,
            fontSize: 26,
            fontWeight: 400,
            color: BrandColors.inkBlack,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Welcome to {primer.displayName}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: BrandTypography.sans,
            fontSize: 13,
            color: BrandColors.slate,
            lineHeight: 1.5,
          }}
        >
          Your program is approved. Here is exactly what comes next — the
          team you&rsquo;ll need, the templates you&rsquo;ll use, the data
          to gather, and the prep to do before P1 starts.
        </p>
      </header>

      {/* 2. P1 outcome statement */}
      <P1OutcomeBlock statement={primer.p1OutcomeStatement} />

      {/* 3. Steps you'll work through in P1 (from P1 phase pack) */}
      <StepsBlock steps={p1Steps} />

      {/* 4. SMEs */}
      <SmesBlock smes={primer.smes} />

      {/* 5. Templates */}
      <TemplatesBlock templates={primer.templates} />

      {/* 6. Workshops */}
      <WorkshopsBlock workshops={primer.workshops} />

      {/* 7. Data assets */}
      <DataAssetsBlock assets={primer.dataAssets} />

      {/* 8. Prep checklist */}
      <PrepChecklistBlock items={primer.prepChecklist} />

      {/* 9. Optional download chip */}
      {downloadHref ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: 4,
          }}
        >
          <a
            href={downloadHref}
            data-testid="phase-0-primer-download"
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: BrandColors.signalBlue,
              textDecoration: 'none',
              borderBottom: `1px dashed ${BrandColors.signalBlue}`,
              padding: '4px 0',
            }}
          >
            Download as HTML brief →
          </a>
        </div>
      ) : null}
    </section>
  );
}

