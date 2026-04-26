// MW7 · Workshop Template Library.
//
// Server component. Calm panel that renders the deterministic workshop
// template catalog grouped by category. Reads only from the workshop
// template library read model. No client interactivity (no useState,
// useEffect, useMemo, useReducer, useCallback). No fetch. No
// Date.now / Math.random / new Date.
//
// Future-only "Open template" actions are rendered as disabled controls
// to make the deferred path visible without wiring booking or a live
// editor today.
//
// Imports nothing from src/lib/source/**, src/lib/sentinel/**,
// src/lib/atlas/**, src/lib/nexus/**, src/lib/agent/**,
// src/components/agent/**, src/lib/auth/**, supabase/**, or
// src/lib/programs/mock.ts.

import { COLORS, FONT } from '@/lib/design/abarva-theme';
import type {
  WorkshopTemplate,
  WorkshopTemplateCategory,
  WorkshopTemplateLibrarySummary,
} from '@/lib/programs/workshop-template-library';
import {
  buildWorkshopTemplateLibrary,
  listWorkshopTemplateCategories,
  summarizeWorkshopTemplateLibrary,
} from '@/lib/programs/workshop-template-library';

const FONT_BODY = FONT.body;
const FONT_MONO = FONT.mono;

export interface WorkshopTemplateLibraryProps {
  templates?: ReadonlyArray<WorkshopTemplate>;
  summary?: WorkshopTemplateLibrarySummary;
}

export function WorkshopTemplateLibrary({
  templates,
  summary,
}: WorkshopTemplateLibraryProps) {
  const list: ReadonlyArray<WorkshopTemplate> =
    templates ?? buildWorkshopTemplateLibrary();
  const resolvedSummary: WorkshopTemplateLibrarySummary =
    summary ?? summarizeWorkshopTemplateLibrary(list);
  const categories = listWorkshopTemplateCategories();

  return (
    <section
      data-workshop-template-library="mw7"
      aria-label="Workshop template library"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        fontFamily: FONT_BODY,
        color: COLORS.ink,
        overflow: 'hidden',
      }}
    >
      <Header summary={resolvedSummary} />
      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {categories.map((category, index) => {
            const templatesInCategory = list.filter((t) => t.category === category);
            if (templatesInCategory.length === 0) return null;
            return (
              <CategoryGroup
                key={category}
                category={category}
                templates={templatesInCategory}
                isLast={index === categories.length - 1}
              />
            );
          })}
          <Caption />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------

function Header({ summary }: { summary: WorkshopTemplateLibrarySummary }) {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '14px 18px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        Workshop template library · MW7
      </span>
      <span style={{ fontSize: 13, color: COLORS.body }}>
        {summary.totalCount} templates across {summary.uniqueCategories.length} categories
        <span style={{ color: COLORS.muted }}>
          {' · '}
          {summary.totalDurationMinutes} agenda minutes
        </span>
      </span>
    </header>
  );
}

// ---------------------------------------------------------------------
// Category group
// ---------------------------------------------------------------------

function CategoryGroup({
  category,
  templates,
  isLast,
}: {
  category: WorkshopTemplateCategory;
  templates: ReadonlyArray<WorkshopTemplate>;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.borderSoft}`,
      }}
    >
      <div
        style={{
          padding: '10px 18px',
          background: COLORS.surface2,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          borderBottom: `1px solid ${COLORS.borderSoft}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {categoryLabel(category)}
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            color: COLORS.mutedSoft,
          }}
        >
          {templates.length}
        </span>
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {templates.map((template, i) => (
          <li
            key={template.id}
            style={{
              borderBottom:
                i === templates.length - 1
                  ? 'none'
                  : `1px solid ${COLORS.borderSoft}`,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <TemplateRow template={template} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Template row
// ---------------------------------------------------------------------

function TemplateRow({ template }: { template: WorkshopTemplate }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.3,
          }}
        >
          {template.title}
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {template.durationMinutes} min
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: COLORS.body,
          lineHeight: 1.55,
        }}
      >
        {template.purpose}
      </p>
      <DecisionRow decision={template.decisionToLand} />
      <InputsBlock inputs={template.inputs} />
      <AgendaBlock agenda={template.agenda} />
      <OutputsBlock outputs={template.outputs} />
      {template.facilitatorNotes.length > 0 ? (
        <FacilitatorNotes notes={template.facilitatorNotes} />
      ) : null}
      <DisabledOpenAction />
    </>
  );
}

// ---------------------------------------------------------------------
// Decision / inputs / agenda / outputs / facilitator notes
// ---------------------------------------------------------------------

function DecisionRow({ decision }: { decision: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Decision
      </span>
      <span
        style={{
          fontSize: 12,
          color: COLORS.muted,
          lineHeight: 1.5,
        }}
      >
        {decision}
      </span>
    </div>
  );
}

function InputsBlock({
  inputs,
}: {
  inputs: { required: ReadonlyArray<string>; optional: ReadonlyArray<string> };
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Inputs
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {inputs.required.length > 0 ? (
          <BulletList label="Required" items={inputs.required} tone="required" />
        ) : null}
        {inputs.optional.length > 0 ? (
          <BulletList label="Optional" items={inputs.optional} tone="optional" />
        ) : null}
      </div>
    </div>
  );
}

function BulletList({
  label,
  items,
  tone,
}: {
  label: string;
  items: ReadonlyArray<string>;
  tone: 'required' | 'optional';
}) {
  const fg = tone === 'required' ? COLORS.navy : COLORS.muted;
  const bg = tone === 'required' ? COLORS.navySoft : COLORS.surface2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: fg,
          background: bg,
          border: `1px solid ${COLORS.borderSoft}`,
          padding: '2px 6px',
          borderRadius: 4,
          alignSelf: 'flex-start',
        }}
      >
        {label}
      </span>
      <ul
        style={{
          listStyle: 'disc',
          paddingLeft: 18,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {items.map((item, i) => (
          <li
            key={`${label}-${i}`}
            style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgendaBlock({
  agenda,
}: {
  agenda: ReadonlyArray<{
    step: number;
    title: string;
    durationMinutes: number;
    intent: string;
  }>;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Agenda
      </span>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {agenda.map((step) => (
          <li
            key={`step-${step.step}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr auto',
              columnGap: 8,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.mutedSoft,
              }}
            >
              {String(step.step).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 12,
                  color: COLORS.ink,
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                {step.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  lineHeight: 1.45,
                }}
              >
                {step.intent}
              </span>
            </div>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.mutedSoft,
              }}
            >
              {step.durationMinutes}m
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OutputsBlock({ outputs }: { outputs: ReadonlyArray<string> }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Outputs
      </span>
      <ul
        style={{
          listStyle: 'disc',
          paddingLeft: 18,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {outputs.map((line, i) => (
          <li
            key={`out-${i}`}
            style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FacilitatorNotes({ notes }: { notes: ReadonlyArray<string> }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Notes
      </span>
      <ul
        style={{
          listStyle: 'disc',
          paddingLeft: 18,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {notes.map((line, i) => (
          <li
            key={`note-${i}`}
            style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Disabled action
// ---------------------------------------------------------------------

function DisabledOpenAction() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-future-action="open-template"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          background: COLORS.surface2,
          border: `1px solid ${COLORS.border}`,
          padding: '4px 10px',
          borderRadius: 4,
          cursor: 'not-allowed',
          opacity: 0.7,
        }}
      >
        Open template
      </button>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Future action · not wired
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Empty state and caption
// ---------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        Workshop templates
      </span>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
        No workshop templates are currently available. The library renders from
        the deterministic seed only; live agenda generation is not wired.
      </p>
    </div>
  );
}

function Caption() {
  return (
    <div
      style={{
        padding: '10px 18px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.surface,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Source · deterministic workshop template library seed · open-template action deferred
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------

function categoryLabel(category: WorkshopTemplateCategory): string {
  switch (category) {
    case 'discovery':
      return 'Discovery';
    case 'framing':
      return 'Framing';
    case 'value':
      return 'Value';
    case 'governance':
      return 'Governance';
    case 'architecture':
      return 'Architecture';
    case 'adoption':
      return 'Adoption';
    case 'executive_review':
      return 'Executive review';
  }
}
