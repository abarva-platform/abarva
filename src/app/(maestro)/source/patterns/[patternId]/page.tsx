/**
 * Source pattern detail page — server component
 *
 * Renders a `LifecyclePatternSeed` (source-event or program lifecycle) so the
 * authored doctrine — stages, gates, expected artifacts, contradictions,
 * failure modes, body prose — is navigable as a real URL. Citation chips in
 * SourceProvenanceRibbon link here.
 */

import { notFound } from 'next/navigation';
import type {
  ContradictionTemplate,
  ExpectedArtifact,
  FailureMode,
  GateCriterion,
  LifecyclePatternSeed,
  LifecycleStage,
} from '@/lib/intelligence/seed-types';
import {
  findLifecyclePattern,
  getAllLifecyclePatternIds,
  isLifecyclePatternId,
} from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PatternDoctrineLink } from '@/components/source/PatternDoctrineLink';
import { SHELL } from '@/lib/shell/shell-tokens';

export function generateStaticParams() {
  return getAllLifecyclePatternIds().map((patternId) => ({ patternId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const decoded = decodeURIComponent(patternId);
  const pattern = findLifecyclePattern(decoded);
  if (!pattern) return { title: 'Pattern not found' };
  return { title: `${pattern.patternId} · ${pattern.title}` };
}

export default async function SourcePatternDetailPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const decoded = decodeURIComponent(patternId);
  const pattern = findLifecyclePattern(decoded);
  if (!pattern) notFound();

  return (
    <main
      style={{
        background: SHELL.PAPER,
        minHeight: '100vh',
        padding: '40px 24px 80px',
        fontFamily: SHELL.SANS,
        color: SHELL.INK,
      }}
    >
      <article
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <Header pattern={pattern} />
        <BodyProse body={pattern.body} />
        <StagesSection stages={pattern.stages} />
        <GateCriteriaSection
          stages={pattern.stages}
          criteria={pattern.gateCriteria}
        />
        <ExpectedArtifactsSection
          stages={pattern.stages}
          artifacts={pattern.expectedArtifacts}
        />
        <ContradictionTemplatesSection
          contradictions={pattern.contradictionTemplates}
        />
        <FailureModesSection failureModes={pattern.failureModes} />
        <CoAppliesSection patternIds={pattern.coAppliesWithPatternIds} />
      </article>
    </main>
  );
}

// ── Sections ────────────────────────────────────────────────────────────────

function Header({ pattern }: { pattern: LifecyclePatternSeed }) {
  const { typicalDurationDays } = pattern;
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 24,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        {pattern.patternId} · lifecycle
      </div>
      <h1
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 400,
          fontSize: 42,
          lineHeight: 1.15,
          margin: 0,
          color: SHELL.INK,
        }}
      >
        {pattern.title}
      </h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 4,
        }}
      >
        <MetaChip label="Tier" value={pattern.tier} />
        <MetaChip label="Version" value={pattern.version} />
        <MetaChip
          label="Confidence"
          value={`${Math.round(pattern.confidence * 100)}%`}
        />
        <MetaChip
          label="Typical duration"
          value={`${typicalDurationDays.min}–${typicalDurationDays.max} days`}
        />
        <MetaChip label="Domain" value={pattern.domain} />
      </div>
      {pattern.thesis ? (
        <p
          style={{
            margin: '12px 0 0',
            fontFamily: SHELL.SERIF,
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: 1.5,
            color: SHELL.INK_MID,
          }}
        >
          {pattern.thesis}
        </p>
      ) : null}
    </header>
  );
}

function BodyProse({ body }: { body: string }) {
  if (!body) return null;
  const paragraphs = body.split(/\n\n+/g).map((p) => p.trim()).filter(Boolean);
  return (
    <section>
      <SectionHeader>Doctrine</SectionHeader>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          fontSize: 15,
          lineHeight: 1.65,
          color: SHELL.INK_MID,
          fontFamily: SHELL.SANS,
        }}
      >
        {paragraphs.map((p, i) => {
          // Render `## Heading` lines as small serif headings.
          if (p.startsWith('## ')) {
            return (
              <h3
                key={i}
                style={{
                  fontFamily: SHELL.SERIF,
                  fontWeight: 400,
                  fontSize: 22,
                  margin: '12px 0 0',
                  color: SHELL.INK,
                }}
              >
                {p.replace(/^##\s+/, '')}
              </h3>
            );
          }
          return (
            <p key={i} style={{ margin: 0 }}>
              {p}
            </p>
          );
        })}
      </div>
    </section>
  );
}

function StagesSection({ stages }: { stages: LifecycleStage[] }) {
  if (!stages.length) return null;
  const ordered = [...stages].sort((a, b) => a.order - b.order);
  return (
    <section>
      <SectionHeader>Stages</SectionHeader>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {ordered.map((stage) => (
          <li
            key={stage.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              borderRadius: 6,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 18,
                color: SHELL.INK,
                marginBottom: 4,
              }}
            >
              {stage.order}. {stage.label}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13.5,
                color: SHELL.INK_SOFT,
                lineHeight: 1.55,
              }}
            >
              {stage.description}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GateCriteriaSection({
  stages,
  criteria,
}: {
  stages: LifecycleStage[];
  criteria: GateCriterion[];
}) {
  if (!criteria.length) return null;
  const groups = groupByStage(stages, criteria, (c) => c.stageId);
  return (
    <section>
      <SectionHeader>Gate criteria</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(({ stage, items }) => (
          <div key={stage.id}>
            <StageGroupLabel>{stage.label}</StageGroupLabel>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((c) => (
                <li
                  key={c.id}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    background: SHELL.CARD_WHITE,
                    borderRadius: 6,
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <GateTypeChip gateType={c.gateType} />
                    <span
                      style={{
                        fontFamily: SHELL.SANS,
                        fontSize: 13.5,
                        color: SHELL.INK,
                        fontWeight: 500,
                      }}
                    >
                      {c.description}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 12.5,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.55,
                    }}
                  >
                    {c.evaluationHint}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpectedArtifactsSection({
  stages,
  artifacts,
}: {
  stages: LifecycleStage[];
  artifacts: ExpectedArtifact[];
}) {
  if (!artifacts.length) return null;
  const groups = groupByStage(stages, artifacts, (a) => a.stageId);
  return (
    <section>
      <SectionHeader>Expected artifacts</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(({ stage, items }) => (
          <div key={stage.id}>
            <StageGroupLabel>{stage.label}</StageGroupLabel>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((a) => (
                <li
                  key={a.id}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    background: SHELL.CARD_WHITE,
                    borderRadius: 6,
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <RequirementChip requirement={a.requirement} />
                    <span
                      style={{
                        fontFamily: SHELL.SANS,
                        fontSize: 13.5,
                        color: SHELL.INK,
                        fontWeight: 500,
                      }}
                    >
                      {a.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 12.5,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.55,
                    }}
                  >
                    {a.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContradictionTemplatesSection({
  contradictions,
}: {
  contradictions: ContradictionTemplate[];
}) {
  if (!contradictions.length) return null;
  return (
    <section>
      <SectionHeader>Contradiction templates</SectionHeader>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {contradictions.map((c) => (
          <li
            key={c.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              borderRadius: 6,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                flexWrap: 'wrap',
              }}
            >
              <SeverityChip severity={c.severity} />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  color: SHELL.INK,
                }}
              >
                {c.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11.5,
                color: SHELL.INK_SOFT,
                marginBottom: 8,
              }}
            >
              {c.partyA} <span style={{ color: SHELL.INK_MUTED }}>vs</span>{' '}
              {c.partyB}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MID,
                lineHeight: 1.55,
                marginBottom: 6,
              }}
            >
              <strong style={{ fontWeight: 600 }}>Detection: </strong>
              {c.detectionHint}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MID,
                lineHeight: 1.55,
              }}
            >
              <strong style={{ fontWeight: 600 }}>Resolution: </strong>
              {c.resolutionPath}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FailureModesSection({
  failureModes,
}: {
  failureModes: FailureMode[];
}) {
  if (!failureModes.length) return null;
  return (
    <section>
      <SectionHeader>Failure modes</SectionHeader>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {failureModes.map((f) => (
          <li
            key={f.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              borderRadius: 6,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                fontWeight: 600,
                color: SHELL.INK,
                marginBottom: 4,
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MID,
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              {f.description}
            </div>
            {f.stages.length > 0 ? (
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_SOFT,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: SHELL.INK_MUTED,
                  }}
                >
                  Stages:{' '}
                </span>
                {f.stages.join(' · ')}
              </div>
            ) : null}
            {f.mitigations.length > 0 ? (
              <div>
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: SHELL.INK_MUTED,
                    marginBottom: 4,
                  }}
                >
                  Mitigations
                </div>
                <ul
                  style={{
                    listStyle: 'disc',
                    margin: 0,
                    padding: '0 0 0 18px',
                    fontFamily: SHELL.SANS,
                    fontSize: 12.5,
                    color: SHELL.INK_MID,
                    lineHeight: 1.55,
                  }}
                >
                  {f.mitigations.map((m, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CoAppliesSection({ patternIds }: { patternIds: string[] }) {
  if (!patternIds.length) return null;
  const linkable = patternIds.filter(isLifecyclePatternId);
  const nonLinkable = patternIds.filter((id) => !isLifecyclePatternId(id));
  return (
    <section>
      <SectionHeader>Co-applies with</SectionHeader>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {linkable.map((id) => (
          <PatternDoctrineLink key={id} patternId={id} />
        ))}
        {nonLinkable.map((id) => (
          <span
            key={id}
            title={id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 999,
              background: SHELL.PAPER_SOFT,
              padding: '3px 9px',
              fontFamily: SHELL.MONO,
              fontSize: 9.5,
              fontWeight: 600,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.04em',
            }}
          >
            {id}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Reusable bits ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: SHELL.SERIF,
        fontWeight: 400,
        fontSize: 28,
        margin: '0 0 14px',
        color: SHELL.INK,
      }}
    >
      {children}
    </h2>
  );
}

function StageGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: SHELL.INK_MUTED,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        background: SHELL.CARD_WHITE,
        padding: '3px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </span>
  );
}

function GateTypeChip({ gateType }: { gateType: 'hard' | 'soft' }) {
  const isHard = gateType === 'hard';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${isHard ? SHELL.RUST_BG : SHELL.GRAY_LINE}`,
        background: isHard ? SHELL.RUST_BG : SHELL.GRAY_BG,
        color: isHard ? SHELL.RUST_TEXT : SHELL.GRAY_TEXT,
        borderRadius: 999,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {gateType}
    </span>
  );
}

function RequirementChip({
  requirement,
}: {
  requirement: 'required' | 'recommended' | 'optional';
}) {
  const palette = (() => {
    if (requirement === 'required') {
      return { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT };
    }
    if (requirement === 'recommended') {
      return { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID };
    }
    return { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT };
  })();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${palette.line}`,
        background: palette.bg,
        color: palette.text,
        borderRadius: 999,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {requirement}
    </span>
  );
}

function SeverityChip({
  severity,
}: {
  severity: 'low' | 'medium' | 'high';
}) {
  const palette = (() => {
    if (severity === 'high') {
      return { bg: SHELL.RUST_BG, line: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
    }
    if (severity === 'medium') {
      return { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT };
    }
    return { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT };
  })();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${palette.line}`,
        background: palette.bg,
        color: palette.text,
        borderRadius: 999,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {severity}
    </span>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupByStage<T>(
  stages: LifecycleStage[],
  items: T[],
  getStageId: (item: T) => string,
): Array<{ stage: LifecycleStage; items: T[] }> {
  const stageOrder = new Map<string, number>();
  const stageById = new Map<string, LifecycleStage>();
  for (const s of stages) {
    stageOrder.set(s.id, s.order);
    stageById.set(s.id, s);
  }
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const stageId = getStageId(item);
    const bucket = buckets.get(stageId) ?? [];
    bucket.push(item);
    buckets.set(stageId, bucket);
  }
  const groups: Array<{ stage: LifecycleStage; items: T[] }> = [];
  for (const [stageId, list] of buckets.entries()) {
    const stage =
      stageById.get(stageId) ?? {
        id: stageId,
        label: stageId,
        description: '',
        order: 9999,
      };
    groups.push({ stage, items: list });
  }
  groups.sort((a, b) => a.stage.order - b.stage.order);
  return groups;
}
