'use client';

// SynthesisPreviewClient — L4 synthesis output viewer.
//
// Instance dropdown + structured synthesis display. On selection, fetches
// from /api/reasoning/synthesis-preview?instanceId=xxx and renders:
//   - Health grade + confidence score
//   - Narrative assessment (assembled from structured data)
//   - Gate summary + hard blockers
//   - Contradiction summary
//   - Failure mode detections
//   - Missing artifacts
//   - Per-stage micro-synthesis
//   - Citations

import React, { useState, useTransition } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { InstanceListItem } from './page';
import type { SynthesisPreviewResponse } from '@/app/api/reasoning/synthesis-preview/route';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  instances: InstanceListItem[];
  defaultData: SynthesisPreviewResponse | null;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  fontWeight: 600,
};

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 16,
  color: SHELL.INK,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  margin: 0,
};

const MONO: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

function gradePalette(grade: 'green' | 'amber' | 'red') {
  if (grade === 'green') return { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT };
  if (grade === 'amber') return { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT };
  return { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT };
}

function severityPalette(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT };
  if (severity === 'medium') return { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT };
  return { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT };
}

function confPalette(grade: 'high' | 'medium' | 'low') {
  if (grade === 'high') return { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT };
  if (grade === 'medium') return { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT };
  return { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT };
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function GradePill({ grade }: { grade: 'green' | 'amber' | 'red' }) {
  const pal = gradePalette(grade);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {grade}
    </span>
  );
}

function ConfPill({ grade }: { grade: 'high' | 'medium' | 'low' }) {
  const pal = confPalette(grade);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {grade} confidence
    </span>
  );
}

function SevPill({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const pal = severityPalette(severity);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {severity}
    </span>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.sm,
      }}
    >
      <h3 style={SECTION_HEADER}>{title}</h3>
      {count !== undefined && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {count} item{count === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function NarrativeSection({ narrative }: { narrative: string }) {
  const paragraphs = narrative.split('\n\n').filter(Boolean);
  return (
    <SectionCard>
      <SectionHead title="Assessment narrative" />
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              lineHeight: 1.7,
              color: SHELL.INK_MID,
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </SectionCard>
  );
}

function HeaderMetrics({ data }: { data: SynthesisPreviewResponse }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.xl,
        alignItems: 'flex-start',
      }}
    >
      {/* Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '2 1 200px' }}>
        <span style={LABEL}>Instance</span>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {data.instanceLabel}
        </span>
        <span style={{ ...MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
          {data.instanceType} · {data.patternId} · {data.currentStage}
        </span>
      </div>

      {/* Health */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
        <span style={LABEL}>Health</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 32,
              color: SHELL.INK,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {data.health.score}
          </span>
          <span style={{ ...MONO, color: SHELL.INK_MUTED }}>/100</span>
          <GradePill grade={data.health.grade} />
        </div>
        {data.health.reasons.length > 0 && (
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: SHELL.INK_SOFT, maxWidth: 200 }}>
            {data.health.reasons.slice(0, 2).join('; ')}
          </span>
        )}
      </div>

      {/* Confidence */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
        <span style={LABEL}>Confidence</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 32,
              color: SHELL.INK,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {data.confidence.score}
          </span>
          <span style={{ ...MONO, color: SHELL.INK_MUTED }}>/100</span>
          <ConfPill grade={data.confidence.grade} />
        </div>
      </div>

      {/* Gate progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
        <span style={LABEL}>Gates</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 32,
              color: SHELL.INK,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {data.gates.met}
          </span>
          <span style={{ ...MONO, color: SHELL.INK_MUTED }}>/ {data.gates.total}</span>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: SHELL.INK_SOFT }}>
          {data.gates.unmet} unmet · {data.gates.blockers.length} blocker{data.gates.blockers.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

function GateBlockersSection({ blockers }: { blockers: SynthesisPreviewResponse['gates']['blockers'] }) {
  if (blockers.length === 0) {
    return (
      <SectionCard>
        <SectionHead title="Hard gate blockers" count={0} />
        <div style={{ padding: SPACING.lg }}>
          <span style={{ ...MONO, color: SHELL.MINT_TEXT }}>No hard gate blockers — all hard gates met.</span>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHead title="Hard gate blockers" count={blockers.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {blockers.map((b) => (
          <div
            key={b.criterionId}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: SHELL.INK,
                  fontWeight: 600,
                  flex: '1 1 auto',
                }}
              >
                {b.description}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: b.gateType === 'hard' ? SHELL.RUST_BG : SHELL.PEACH_BG,
                  border: `1px solid ${b.gateType === 'hard' ? SHELL.PEACH_LINE : SHELL.PEACH_LINE}`,
                  color: b.gateType === 'hard' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT,
                  borderRadius: RADIUS.pill,
                  padding: '1px 8px',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {b.gateType}
              </span>
            </div>
            {b.evaluationHint && (
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_SOFT }}>
                {b.evaluationHint}
              </span>
            )}
            <span style={{ ...MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
              stage: {b.stageId} · id: {b.criterionId}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ContradictionsSection({ contradictions }: { contradictions: SynthesisPreviewResponse['contradictions'] }) {
  if (contradictions.length === 0) {
    return (
      <SectionCard>
        <SectionHead title="Contradictions" count={0} />
        <div style={{ padding: SPACING.lg }}>
          <span style={{ ...MONO, color: SHELL.MINT_TEXT }}>No contradictions detected.</span>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHead title="Contradictions" count={contradictions.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {contradictions.map((c) => (
          <div
            key={c.templateId}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm }}>
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK, fontWeight: 600, flex: '1 1 auto' }}>
                {c.label}
              </span>
              <SevPill severity={c.severity} />
              <span style={{ ...MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
                conf {(c.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_SOFT }}>
              {c.partyA} vs {c.partyB}
            </span>
            {c.resolutionPath && (
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_MID, fontStyle: 'italic' }}>
                Resolution: {c.resolutionPath}
              </span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function FailureModesSection({ failureModes }: { failureModes: SynthesisPreviewResponse['failureModes'] }) {
  if (failureModes.length === 0) {
    return (
      <SectionCard>
        <SectionHead title="Failure mode detections" count={0} />
        <div style={{ padding: SPACING.lg }}>
          <span style={{ ...MONO, color: SHELL.MINT_TEXT }}>No failure modes detected.</span>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHead title="Failure mode detections" count={failureModes.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {failureModes.map((f) => (
          <div
            key={f.failureModeId}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm }}>
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK, fontWeight: 600, flex: '1 1 auto' }}>
                {f.label}
              </span>
              <span style={{ ...MONO, fontSize: 11, color: f.confidence >= 0.7 ? SHELL.RUST_TEXT : SHELL.INK_SOFT }}>
                {(f.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            {f.description && (
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_SOFT }}>{f.description}</span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MissingArtifactsSection({ artifacts }: { artifacts: SynthesisPreviewResponse['missingArtifacts'] }) {
  if (artifacts.length === 0) {
    return (
      <SectionCard>
        <SectionHead title="Missing artifacts" count={0} />
        <div style={{ padding: SPACING.lg }}>
          <span style={{ ...MONO, color: SHELL.MINT_TEXT }}>No missing artifacts for the current stage.</span>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHead title="Missing artifacts" count={artifacts.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {artifacts.map((a) => (
          <div
            key={a.artifactId}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
          >
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK, flex: '1 1 auto' }}>
              {a.label}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: a.gateType === 'hard' ? SHELL.RUST_BG : SHELL.GRAY_BG,
                border: `1px solid ${a.gateType === 'hard' ? SHELL.PEACH_LINE : SHELL.GRAY_LINE}`,
                color: a.gateType === 'hard' ? SHELL.RUST_TEXT : SHELL.GRAY_TEXT,
                borderRadius: RADIUS.pill,
                padding: '1px 8px',
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {a.gateType} · {a.requirement}
            </span>
            <span style={{ ...MONO, fontSize: 11, color: SHELL.INK_MUTED }}>{a.stageId}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function StageMicroSynthesisSection({ map }: { map: Record<string, string> }) {
  const entries = Object.entries(map);
  if (entries.length === 0) {
    return null;
  }
  return (
    <SectionCard>
      <SectionHead title="Per-stage micro-synthesis" count={entries.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {entries.map(([stageId, text]) => (
          <div
            key={stageId}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ ...MONO, fontSize: 11, color: SHELL.INK_SOFT, fontWeight: 700 }}>{stageId}</span>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK_MID, lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CitationsSection({ citations }: { citations: SynthesisPreviewResponse['citations'] }) {
  if (citations.length === 0) return null;
  return (
    <SectionCard>
      <SectionHead title="Pattern citations" count={citations.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {citations.map((c, i) => (
          <div
            key={i}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <span style={{ ...MONO, fontSize: 11, color: SHELL.INK_SOFT }}>{c.section}</span>
            {c.excerpt && (
              <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_MID, lineHeight: 1.5 }}>
                {c.excerpt}
              </span>
            )}
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
              {c.relevance}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function SynthesisPreviewClient({ instances, defaultData }: Props) {
  const [selectedId, setSelectedId] = useState<string>(instances[0]?.id ?? '');
  const [data, setData] = useState<SynthesisPreviewResponse | null>(defaultData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(id: string) {
    setSelectedId(id);
    setError(null);
    startTransition(() => {
      fetch(`/api/reasoning/synthesis-preview?instanceId=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((json: SynthesisPreviewResponse & { error?: string }) => {
          if (json.error) {
            setError(json.error);
            setData(null);
          } else {
            setData(json);
          }
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Fetch failed');
          setData(null);
        });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Instance selector */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <span style={LABEL}>Instance</span>
        <select
          value={selectedId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSelect(e.target.value)}
          disabled={isPending}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.INK,
            background: SHELL.PAPER,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.md,
            padding: '6px 10px',
            cursor: isPending ? 'wait' : 'pointer',
            flex: '1 1 260px',
            maxWidth: 480,
          }}
        >
          <optgroup label="Source events">
            {instances
              .filter((i) => i.type === 'SOURCE')
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label} — {i.currentStage}
                </option>
              ))}
          </optgroup>
          <optgroup label="Programs">
            {instances
              .filter((i) => i.type === 'PROGRAM')
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label} — {i.currentStage}
                </option>
              ))}
          </optgroup>
        </select>
        {isPending && (
          <span style={{ ...MONO, color: SHELL.INK_MUTED }}>Loading…</span>
        )}
      </div>

      {error && (
        <div
          style={{
            background: SHELL.RUST_BG,
            border: `1px solid ${SHELL.PEACH_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.RUST_TEXT,
          }}
        >
          Error: {error}
        </div>
      )}

      {data && !error && (
        <>
          <HeaderMetrics data={data} />
          <NarrativeSection narrative={data.narrative} />
          <GateBlockersSection blockers={data.gates.blockers} />
          <ContradictionsSection contradictions={data.contradictions} />
          <FailureModesSection failureModes={data.failureModes} />
          <MissingArtifactsSection artifacts={data.missingArtifacts} />
          <StageMicroSynthesisSection map={data.stageMicroSynthesis} />
          <CitationsSection citations={data.citations} />
        </>
      )}

      {!data && !error && !isPending && (
        <div
          style={{
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.GRAY_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: SHELL.GRAY_TEXT,
          }}
        >
          No synthesis data available for this instance.
        </div>
      )}
    </div>
  );
}
