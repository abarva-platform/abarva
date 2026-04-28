// MW6 · SME Recommendation Panel.
//
// Server component. Calm panel that renders the deterministic SME
// recommendations for the next workshop or for the program. Reads only
// from the SmeRecommendation read model. Never fabricates real names —
// roles only.
//
// No client interactivity (no useState / useEffect / useMemo). No
// fetch, no Date.now / Math.random / new Date. No imports from
// src/lib/nexus/**, src/lib/agent/**, src/lib/source/**,
// src/lib/auth/**, supabase/**, or src/lib/programs/mock.ts.

import { COLORS, FONT } from '@/lib/design/abarva-theme';
import type {
  SmeParticipationMode,
  SmeReadiness,
  SmeRecommendation,
  SmeRecommendationSummary,
} from '@/lib/programs/sme-recommendations';
import { summarizeSmeRecommendations } from '@/lib/programs/sme-recommendations';

const FONT_BODY = FONT.body;
const FONT_MONO = FONT.mono;

export interface SmeRecommendationPanelProps {
  recommendations?: ReadonlyArray<SmeRecommendation>;
  summary?: SmeRecommendationSummary;
  workshopTitle?: string | null;
  programLabel?: string | null;
}

export function SmeRecommendationPanel({
  recommendations,
  summary,
  workshopTitle = null,
  programLabel = null,
}: SmeRecommendationPanelProps) {
  const list: ReadonlyArray<SmeRecommendation> = recommendations ?? [];
  const resolvedSummary: SmeRecommendationSummary =
    summary ?? summarizeSmeRecommendations(list);

  return (
    <section
      data-sme-recommendation-panel="mw6"
      aria-label="SME recommendation panel"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 0,
        fontFamily: FONT_BODY,
        color: COLORS.ink,
        overflow: 'hidden',
      }}
    >
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
          SME recommendations · MW6
        </span>
        <span style={{ fontSize: 13, color: COLORS.body }}>
          {programLabel ? programLabel : 'Program SMEs'}
          {workshopTitle ? <span style={{ color: COLORS.muted }}> · {workshopTitle}</span> : null}
        </span>
      </header>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 0,
          }}
        >
          <SummaryStrip summary={resolvedSummary} />
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {list.map((rec, i) => (
              <li
                key={rec.id}
                style={{
                  borderBottom:
                    i === list.length - 1
                      ? 'none'
                      : `1px solid ${COLORS.borderSoft}`,
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <SmeRecommendationRow rec={rec} />
              </li>
            ))}
          </ul>
          <Caption />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Summary strip
// ---------------------------------------------------------------------

function SummaryStrip({ summary }: { summary: SmeRecommendationSummary }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 18px',
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.surface2,
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: COLORS.muted,
      }}
    >
      <span>Total: {summary.totalCount}</span>
      <span>Required: {summary.byParticipationMode.required}</span>
      <span>Optional: {summary.byParticipationMode.optional}</span>
      <span>Advisory: {summary.byParticipationMode.advisory}</span>
      <span>Client: {summary.byOrganization.client}</span>
      <span>AbarVa: {summary.byOrganization.abarva}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Per-recommendation row
// ---------------------------------------------------------------------

function SmeRecommendationRow({ rec }: { rec: SmeRecommendation }) {
  const modeTone = participationTone(rec.participationMode);
  const readinessTone = readinessToneFor(rec.readiness);
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.3,
          }}
        >
          {rec.roleLabel}
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
          {rec.organization === 'client' ? 'Client' : 'AbarVa'}
        </span>
        <Tag label={participationLabel(rec.participationMode)} tone={modeTone} />
        <Tag label={readinessLabel(rec.readiness)} tone={readinessTone} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: COLORS.body,
          lineHeight: 1.55,
        }}
      >
        {rec.whyNeeded}
      </p>
      {rec.workshopType !== null ? (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          Workshop · {rec.workshopType.replace(/_/g, ' ')}
        </div>
      ) : null}
      <ReasonBlock rec={rec} />
      {rec.suggestedFocus.length > 0 ? (
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
          {rec.suggestedFocus.map((line, i) => (
            <li
              key={`focus-${i}`}
              style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------
// Reason block (evidence gap, failure mode, archetype)
// ---------------------------------------------------------------------

function ReasonBlock({ rec }: { rec: SmeRecommendation }) {
  const items: Array<{ label: string; value: string }> = [];
  if (rec.reason.evidenceGap) {
    items.push({ label: 'Evidence', value: rec.reason.evidenceGap });
  }
  if (rec.reason.failureModeKey) {
    items.push({
      label: 'Failure mode',
      value: rec.reason.failureModeKey.replace(/_/g, ' '),
    });
  }
  if (rec.reason.archetypeAnchor) {
    items.push({
      label: 'Archetype',
      value: rec.reason.archetypeAnchor.replace(/_/g, ' '),
    });
  }
  items.push({ label: 'Phase', value: rec.reason.phaseRationale });

  return (
    <dl
      style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 100px) 1fr',
        rowGap: 4,
        columnGap: 10,
      }}
    >
      {items.map((item, i) => (
        <div
          key={`reason-${i}`}
          style={{ display: 'contents' }}
        >
          <dt
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              alignSelf: 'baseline',
            }}
          >
            {item.label}
          </dt>
          <dd
            style={{
              margin: 0,
              fontSize: 12,
              color: COLORS.muted,
              lineHeight: 1.5,
            }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------
// Empty state + caption
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
        SME recommendations
      </span>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
        No SME recommendations are available for this surface. The panel renders
        from the deterministic seed only; live SME directory lookup is not wired.
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
        Source · deterministic SME recommendation seed · roles only, no live directory
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tag + tone helpers
// ---------------------------------------------------------------------

interface Tone {
  bg: string;
  border: string;
  fg: string;
}

function Tag({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: FONT_MONO,
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        padding: '2px 6px',
        borderRadius: 4,
      }}
    >
      {label}
    </span>
  );
}

function participationLabel(mode: SmeParticipationMode): string {
  switch (mode) {
    case 'required':
      return 'Required';
    case 'optional':
      return 'Optional';
    case 'advisory':
      return 'Advisory';
  }
}

function readinessLabel(readiness: SmeReadiness): string {
  switch (readiness) {
    case 'confirmed':
      return 'Confirmed';
    case 'tentative':
      return 'Tentative';
    case 'awaiting_outreach':
      return 'Awaiting outreach';
    case 'unstaffed':
      return 'Unstaffed';
  }
}

function participationTone(mode: SmeParticipationMode): Tone {
  switch (mode) {
    case 'required':
      return {
        bg: COLORS.navySoft,
        border: 'rgba(27, 43, 92, 0.20)',
        fg: COLORS.navy,
      };
    case 'optional':
      return {
        bg: COLORS.surface2,
        border: COLORS.border,
        fg: COLORS.muted,
      };
    case 'advisory':
      return {
        bg: COLORS.borderSoft,
        border: COLORS.border,
        fg: COLORS.mutedSoft,
      };
  }
}

function readinessToneFor(readiness: SmeReadiness): Tone {
  switch (readiness) {
    case 'confirmed':
      return {
        bg: COLORS.navySoft,
        border: 'rgba(27, 43, 92, 0.20)',
        fg: COLORS.navy,
      };
    case 'tentative':
      return {
        bg: COLORS.surface2,
        border: COLORS.border,
        fg: COLORS.muted,
      };
    case 'awaiting_outreach':
      return {
        bg: COLORS.amberSoft,
        border: 'rgba(180, 83, 9, 0.25)',
        fg: COLORS.amber,
      };
    case 'unstaffed':
      return {
        bg: COLORS.borderSoft,
        border: COLORS.border,
        fg: COLORS.mutedSoft,
      };
  }
}
