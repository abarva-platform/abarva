// I4 · Sentinel authored pattern content panel.
//
// Server component. Renders the deterministic authored content for a
// canonical I1 pattern key as a structured surface alongside the I3
// pattern detail page.
//
// No live Sentinel runtime, no Claude / OpenAI invocation, no client
// interactivity in this slice. Imports restricted to next/link and the
// I4 content module.

import Link from 'next/link';
import type { SentinelPatternAuthoredContent } from '@/lib/intelligence/sentinel-pattern-content';

interface SentinelPatternContentPanelProps {
  content: SentinelPatternAuthoredContent;
  /** Optional intelligence landing href for cross-pattern routing. */
  intelligenceLandingHref?: string;
  /** Optional helper to construct a related-pattern routeHref. */
  buildRelatedPatternHref?: (patternKey: string) => string;
}

const COLORS = {
  ink: '#1a1612',
  body: '#3D3B38',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  accent: '#0E9F8C',
  accentSoft: 'rgba(14,159,140,0.08)',
  amber: '#D97706',
  amberSoft: 'rgba(217,119,6,0.08)',
} as const;

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export function SentinelPatternContentPanel({
  content,
  buildRelatedPatternHref,
}: SentinelPatternContentPanelProps) {
  return (
    <section
      aria-label={`Authored pattern content · ${content.patternName}`}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.accent}`,
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: COLORS.ink,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.accent,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Authored pattern content · {content.contentCompleteness}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {content.patternName}
          </h2>
        </div>
        <span
          title="Authored deterministically; no live retrieval."
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: COLORS.accentSoft,
            color: COLORS.accent,
          }}
        >
          source · {content.authoredAt.replace(/_/g, ' ')}
        </span>
      </header>

      <Section title="Definition">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: COLORS.body }}>
          {content.definition}
        </p>
      </Section>

      <Section title="How Sentinel detects it">
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {content.howSentinelDetected.map((sig) => (
            <li
              key={sig}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                padding: '3px 8px',
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 999,
                color: COLORS.muted,
              }}
            >
              {sig.replace(/_/g, ' ')}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Why it matters">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: COLORS.muted }}>
          {content.whyItMatters}
        </p>
      </Section>

      <Section title={`Failure modes · ${content.failureModes.length}`}>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {content.failureModes.map((fm) => (
            <li key={fm.id} style={{ fontSize: 13, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: COLORS.ink }}>{fm.title}</span>
              <div style={{ color: COLORS.muted, marginTop: 2 }}>{fm.description}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`Interventions · ${content.interventions.length}`}>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {content.interventions.map((iv) => (
            <li key={iv.id} style={{ fontSize: 13, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: COLORS.accent }}>{iv.title}</span>
              <div style={{ color: COLORS.muted, marginTop: 2 }}>{iv.description}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`Required evidence · ${content.requiredEvidence.length}`}>
        <ul
          style={{
            margin: '0 0 0 18px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.55,
          }}
        >
          {content.requiredEvidence.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>

      {content.relatedPatterns.length > 0 ? (
        <Section title={`Related patterns · ${content.relatedPatterns.length}`}>
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {content.relatedPatterns.map((rel) => (
              <li
                key={rel.patternKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 280px) 1fr',
                  gap: 8,
                  alignItems: 'baseline',
                  fontSize: 13,
                }}
              >
                {buildRelatedPatternHref ? (
                  <Link
                    href={buildRelatedPatternHref(rel.patternKey)}
                    data-sentinel-related-pattern={rel.patternKey}
                    style={{ color: COLORS.accent, fontWeight: 600, textDecoration: 'none' }}
                  >
                    {rel.patternKey.replace(/_/g, ' ')}
                  </Link>
                ) : (
                  <span style={{ color: COLORS.ink, fontWeight: 600, fontFamily: MONO, fontSize: 11 }}>
                    {rel.patternKey}
                  </span>
                )}
                <span style={{ color: COLORS.muted, lineHeight: 1.55 }}>{rel.reason}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={`Handoff guidance · ${content.handoffGuidance.length}`}>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {content.handoffGuidance.map((row) => (
            <li
              key={row.target}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 140px) 1fr',
                gap: 10,
                alignItems: 'baseline',
                fontSize: 13,
                color: COLORS.body,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                handoff · {row.target}
              </span>
              <span style={{ lineHeight: 1.55 }}>{row.guidance}</span>
            </li>
          ))}
        </ul>
      </Section>

      {content.contentCompleteness === 'partial' ? (
        <div
          style={{
            padding: '12px 14px',
            background: COLORS.amberSoft,
            border: `1px dashed ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 12,
            color: COLORS.amber,
            lineHeight: 1.55,
          }}
        >
          Authored content is partial today. Sections marked above are
          fully authored; remaining sections will land in a future
          authoring slice.
        </div>
      ) : null}

      <footer
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: `1px dashed ${COLORS.border}`,
        }}
      >
        Authored deterministically; not a live retrieval. No Claude /
        OpenAI / Pinecone invocation.
      </footer>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3
        style={{
          margin: 0,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
