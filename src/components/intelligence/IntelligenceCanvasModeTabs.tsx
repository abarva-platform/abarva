// I5 · Intelligence Canvas mode tabs.
//
// Server component. Renders the four-mode tab strip + active body
// for a Sentinel pattern detail surface. Mode is read deterministically
// from a searchParams prop with no client-runtime directives, no
// React state hooks, and no effect hooks. Switching tabs is a pure
// URL change via the Link element from next/link.
//
// The component composes buildIntelligenceCanvasView from
// @/lib/intelligence/intelligence-canvas-modes and renders the
// resulting body. No live Sentinel runtime, no Atlas / Nexus /
// Claude / OpenAI invocation, no random IDs, no wall-clock reads.

import Link from 'next/link';
import {
  buildIntelligenceCanvasView,
  parseCanvasModeFromSearchParam,
  type IntelligenceCanvasBody,
  type IntelligenceCanvasModeTab,
  type IntelligenceCanvasView,
} from '@/lib/intelligence/intelligence-canvas-modes';

interface IntelligenceCanvasModeTabsProps {
  patternKey: string;
  tenantSlug: string;
  /**
   * Next.js dynamic-route searchParams. We only consume the `canvas`
   * key; everything else is ignored. The prop is optional so the
   * component is reusable in places where searchParams is not yet
   * threaded through.
   */
  searchParams?: { canvas?: string | string[] };
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  accent: '#0E9F8C',
  accentSoft: 'rgba(14,159,140,0.08)',
} as const;

export function IntelligenceCanvasModeTabs({
  patternKey,
  tenantSlug,
  searchParams,
}: IntelligenceCanvasModeTabsProps) {
  const mode = parseCanvasModeFromSearchParam(searchParams?.canvas);
  const view: IntelligenceCanvasView = buildIntelligenceCanvasView({
    patternKey,
    mode,
    tenantSlug,
  });

  return (
    <section
      data-intelligence-canvas-modes="i5"
      data-intelligence-canvas-mode={view.mode}
      aria-label={`Intelligence canvas · ${view.surfaceLabel}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '18px clamp(16px, 4vw, 24px)',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        color: COLORS.ink,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          Intelligence canvas · {view.surfaceLabel}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: COLORS.mutedSoft,
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          {view.honestDisclaimer}
        </p>
      </header>

      <nav
        aria-label="Canvas modes"
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 8,
        }}
      >
        {view.modes.map((tab) => (
          <CanvasModeTab key={tab.key} tab={tab} />
        ))}
      </nav>

      <div
        data-intelligence-canvas-body={view.body.kind}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <CanvasBody body={view.body} />
      </div>
    </section>
  );
}

// --- Sub-components ---------------------------------------------------

function CanvasModeTab({ tab }: { tab: IntelligenceCanvasModeTab }) {
  const active = tab.isActive;
  return (
    <Link
      href={tab.href}
      data-canvas-mode={tab.key}
      aria-current={active ? 'page' : undefined}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '6px 12px',
        borderRadius: 999,
        textDecoration: 'none',
        color: active ? COLORS.accent : COLORS.muted,
        background: active ? COLORS.accentSoft : 'transparent',
        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
      }}
    >
      {tab.label}
    </Link>
  );
}

function CanvasBody({ body }: { body: IntelligenceCanvasBody }) {
  switch (body.kind) {
    case 'summary':
      return (
        <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={headingStyle()}>{body.content.title}</h3>
          <p style={paragraphStyle()}>{body.content.rationale}</p>
          {body.content.bullets.length > 0 ? (
            <ul style={listStyle()}>
              {body.content.bullets.map((bullet, idx) => (
                <li key={`summary-bullet-${idx}`} style={listItemStyle()}>
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      );
    case 'evidence':
      return (
        <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={headingStyle()}>{body.content.title}</h3>
          <p style={paragraphStyle()}>{body.content.citationReadinessHint}</p>
          {body.content.rows.length === 0 ? (
            <EmptyHint>
              Evidence rows for this canvas surface are seeded empty today.
            </EmptyHint>
          ) : (
            <ul style={listStyle()}>
              {body.content.rows.map((row) => (
                <li key={row.id} style={listItemStyle()}>
                  {row.label}
                </li>
              ))}
            </ul>
          )}
        </article>
      );
    case 'programs':
      return (
        <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={headingStyle()}>{body.content.title}</h3>
          <p style={paragraphStyle()}>{body.content.helperText}</p>
          {body.content.rows.length === 0 ? (
            <EmptyHint>
              Affected programs render in the pattern detail surface below.
            </EmptyHint>
          ) : (
            <ul style={listStyle()}>
              {body.content.rows.map((row) => (
                <li key={row.key} style={listItemStyle()}>
                  {row.label}
                </li>
              ))}
            </ul>
          )}
        </article>
      );
    case 'actions':
      return (
        <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={headingStyle()}>{body.content.title}</h3>
          <p style={paragraphStyle()}>{body.content.helperText}</p>
          {body.content.rows.length === 0 ? (
            <EmptyHint>
              Recommended action handoffs render in the pattern detail surface
              below.
            </EmptyHint>
          ) : (
            <ul style={listStyle()}>
              {body.content.rows.map((row) => (
                <li key={row.key} style={listItemStyle()}>
                  {row.label}
                </li>
              ))}
            </ul>
          )}
        </article>
      );
    default: {
      const _exhaustive: never = body;
      void _exhaustive;
      return null;
    }
  }
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function headingStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.ink,
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 1.55,
  };
}

function listStyle(): React.CSSProperties {
  return {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };
}

function listItemStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 1.55,
    paddingLeft: 12,
    borderLeft: `2px solid ${COLORS.border}`,
  };
}
