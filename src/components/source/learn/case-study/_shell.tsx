'use client';
// Meridian case study · shared shell for chapter components.
//
// Renders prev/next chapter links at the bottom of each chapter so a
// reader can walk the whole story like a single document. Also exposes
// a few case-study-specific UI primitives that compose the existing
// learn primitives (HeroBand, Section, Callout, …) — gate-criteria
// status boxes, "common pitfall" boxes, and inline artifact specimens.

import Link from 'next/link';
import {
  caseStudyChapterNeighbors,
  type CaseStudyNeighbors,
} from '@/lib/source/learn/learn-nav';
import { T } from '@/components/home/learn/primitives';

/**
 * Wraps a chapter's content with a "where we are" recap band at the
 * top (rendered by the chapter itself via children) plus prev/next
 * navigation at the bottom for one-story flow.
 */
export function ChapterShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const neighbors = caseStudyChapterNeighbors(slug);
  return (
    <>
      {children}
      <ChapterFooterNav neighbors={neighbors} />
    </>
  );
}

function ChapterFooterNav({ neighbors }: { neighbors: CaseStudyNeighbors }) {
  return (
    <nav
      aria-label="Case study chapter navigation"
      style={{
        padding: '40px clamp(32px, 4vw, 64px) 64px',
        borderTop: `1px solid ${T.borderLt}`,
        background: T.surface2,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
      }}
    >
      <div>
        {neighbors.prev ? (
          <Link
            href={`/source/learn/${neighbors.prev.slug}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              background: T.surface,
            }}
          >
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 6,
              }}
            >
              ← Previous chapter
            </div>
            <div
              style={{
                fontFamily: T.fBody,
                fontSize: 14,
                fontWeight: 600,
                color: T.navy,
                lineHeight: 1.4,
              }}
            >
              {neighbors.prev.label}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
      <div>
        {neighbors.next ? (
          <Link
            href={`/source/learn/${neighbors.next.slug}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              background: T.surface,
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 6,
              }}
            >
              Next chapter →
            </div>
            <div
              style={{
                fontFamily: T.fBody,
                fontSize: 14,
                fontWeight: 600,
                color: T.navy,
                lineHeight: 1.4,
              }}
            >
              {neighbors.next.label}
            </div>
          </Link>
        ) : (
          <div
            style={{
              border: `1px dashed ${T.borderLt}`,
              borderRadius: 8,
              padding: '14px 18px',
              textAlign: 'right',
              fontFamily: T.fBody,
              fontSize: 12,
              fontStyle: 'italic',
              color: T.faint,
            }}
          >
            End of case study. Return to{' '}
            <Link
              href="/source/learn/case-study"
              style={{ color: T.navy, fontWeight: 600 }}
            >
              the overview
            </Link>
            .
          </div>
        )}
      </div>
    </nav>
  );
}

/**
 * Renders a recap band — the one-paragraph "where we are in the story"
 * Each chapter opens with. Sits below the HeroBand, above the first
 * Section.
 */
export function StoryRecap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#FBFAF6',
        borderBottom: `1px solid ${T.borderLt}`,
        padding: '20px clamp(32px, 4vw, 64px)',
      }}
    >
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 6,
        }}
      >
        Where we are in the story
      </div>
      <p
        style={{
          fontFamily: T.fBody,
          fontSize: 14,
          color: T.body,
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 760,
        }}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Gate-criteria status box. Each criterion is a row with a hard / met /
 * unmet pill on the right. Used at the close of each chapter to show
 * what advanced + what stayed open.
 */
export function GateStatusBox({
  stage,
  rows,
}: {
  stage: string;
  rows: Array<{ text: string; status: 'met' | 'unmet' | 'overridden' }>;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        margin: '24px 0',
        background: T.surface,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: T.navy,
          color: '#fff',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Gate · {stage}
        </span>
        <span
          style={{
            fontFamily: T.fBody,
            fontSize: 12,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {rows.filter((r) => r.status === 'met').length} / {rows.length} criteria met
        </span>
      </div>
      <div>
        {rows.map((r, i) => {
          const pillBg =
            r.status === 'met' ? T.tealSoft : r.status === 'overridden' ? T.amberSoft : T.surface3;
          const pillFg =
            r.status === 'met' ? T.teal : r.status === 'overridden' ? T.amber : T.faint;
          const pillText =
            r.status === 'met' ? 'Met' : r.status === 'overridden' ? 'Overridden' : 'Unmet';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 18px',
                borderTop: i === 0 ? 'none' : `1px solid ${T.borderLt}`,
                fontFamily: T.fBody,
                fontSize: 13,
                color: T.body,
                lineHeight: 1.55,
              }}
            >
              <span style={{ flex: 1 }}>{r.text}</span>
              <span
                style={{
                  fontFamily: T.fMono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: pillFg,
                  background: pillBg,
                  borderRadius: 4,
                  padding: '4px 8px',
                  flexShrink: 0,
                }}
              >
                {pillText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "Common pitfall" callout. Two shapes: avoided (teal) or not avoided
 * (amber). Used to surface the lesson at the close of each chapter.
 */
export function PitfallBox({
  kind,
  title,
  children,
}: {
  kind: 'avoided' | 'missed';
  title: string;
  children: React.ReactNode;
}) {
  const isAvoided = kind === 'avoided';
  const bg = isAvoided ? T.tealSoft : T.amberSoft;
  const line = isAvoided ? T.tealLine : T.amberLine;
  const accent = isAvoided ? T.teal : T.amber;
  const label = isAvoided ? 'Pitfall avoided' : 'Pitfall not avoided';
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${line}`,
        borderRadius: 8,
        padding: '16px 20px',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.fBody,
          fontSize: 14,
          fontWeight: 700,
          color: T.ink,
          marginBottom: 6,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Inline artifact specimen — a small framed block used to show what a
 * d-code body actually contained at this point in the story.
 */
export function ArtifactSpecimen({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        margin: '20px 0',
        background: T.surface,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: T.surface2,
          borderBottom: `1px solid ${T.borderLt}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.navy,
            background: T.navySoft,
            border: `1px solid ${T.navyLine}`,
            borderRadius: 4,
            padding: '2px 7px',
          }}
        >
          {code}
        </span>
        <span
          style={{
            fontFamily: T.fBody,
            fontSize: 13,
            fontWeight: 700,
            color: T.ink,
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          padding: '14px 18px',
          fontFamily: T.fBody,
          fontSize: 13,
          color: T.body,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Sentinel-vs-human callout — explains what Sentinel did automatically
 * vs what the procurement lead had to decide. Used inline within
 * chapter narrative.
 */
export function AgentSplitBox({
  agent,
  human,
}: {
  agent: { who: 'Sentinel' | 'Atlas'; did: React.ReactNode };
  human: { who: string; did: React.ReactNode };
}) {
  const agentBg = agent.who === 'Atlas' ? T.purpleSoft : T.navySoft;
  const agentLine = agent.who === 'Atlas' ? T.purpleLine : T.navyLine;
  const agentColor = agent.who === 'Atlas' ? T.purple : T.navy;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        margin: '20px 0',
      }}
    >
      <div
        style={{
          background: agentBg,
          border: `1px solid ${agentLine}`,
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: agentColor,
            marginBottom: 6,
          }}
        >
          {agent.who} did
        </div>
        <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.55 }}>
          {agent.did}
        </div>
      </div>
      <div
        style={{
          background: T.surface3,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.faint,
            marginBottom: 6,
          }}
        >
          {human.who} decided
        </div>
        <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.55 }}>
          {human.did}
        </div>
      </div>
    </div>
  );
}
