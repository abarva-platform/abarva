// src/app/(maestro)/source/compare/page.tsx
//
// Two-instance reasoning comparison view.
//
// Reads `?a=instanceId&b=instanceId` from the URL, resolves each id (source
// event or program) via the unified instance resolver, and renders a
// side-by-side `InstanceComparisonGrid` populated with each side's Layer 3
// `SynthesisContext`. When one or both ids are missing or unresolvable, the
// page renders an instance picker form so the user can choose two ids from
// the known catalogue.
//
// Server component — no client-side state. AbarVa palette only.

import Link from 'next/link';
import {
  resolveAnyInstance,
  getAllInstanceIds,
  type ResolvedInstance,
} from '@/lib/reasoning/instance-resolver';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import {
  InstanceComparisonGrid,
  type InstanceComparisonSide,
} from '@/components/source/InstanceComparisonGrid';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SynthesisContext } from '@/lib/reasoning/types';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';

export const metadata = {
  title: 'Compare reasoning · Source · AbarVa',
};

export const dynamic = 'force-dynamic';

// ── Helpers ────────────────────────────────────────────────────────────────

function programStageLabel(instance: ProgramInstance): string {
  const phase = instance.phases.find((p) => p.phaseId === instance.currentPhase);
  return `P${instance.currentPhase} ${phase?.phaseLabel ?? ''}`.trim();
}

/**
 * Build the synthesis context for any resolved instance, dispatching to the
 * right builder by kind. Falls back to the AMS source pattern when no
 * specific source pattern is registered (preserves the same fallback the
 * Source detail page uses).
 */
function buildContextForResolved(resolved: ResolvedInstance): {
  context: SynthesisContext;
  stageLabel: string;
} {
  if (resolved.kind === 'source') {
    const pattern = findLifecyclePattern(resolved.instance.patternId) ?? PAT_SRC_AMS_001;
    return {
      context: buildSourceSynthesisContext(resolved.instance, pattern),
      stageLabel: resolved.instance.currentStage,
    };
  }
  // Program — buildProgramSynthesisContext resolves the pattern internally
  // and falls back to a shape-only context if no typed pattern is registered.
  const pattern = findLifecyclePattern(resolved.instance.patternId);
  return {
    context: buildProgramSynthesisContext(resolved.instance, pattern),
    stageLabel: programStageLabel(resolved.instance),
  };
}

function toSide(resolved: ResolvedInstance): InstanceComparisonSide {
  const { context, stageLabel } = buildContextForResolved(resolved);
  return {
    instanceId: resolved.instance.id,
    kind: resolved.kind,
    stageLabel,
    context,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

interface CompareSearchParams {
  a?: string | string[];
  b?: string | string[];
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SourceCompareReasoningPage({
  searchParams,
}: {
  searchParams: Promise<CompareSearchParams>;
}) {
  const params = await searchParams;
  const aId = firstParam(params.a);
  const bId = firstParam(params.b);

  const a = aId ? resolveAnyInstance(aId) : null;
  const b = bId ? resolveAnyInstance(bId) : null;

  const showPicker = a === null || b === null;

  return (
    <main
      style={{
        background: SHELL.PAPER,
        minHeight: '100vh',
        padding: '32px clamp(20px, 4vw, 48px)',
        fontFamily: SHELL.SANS,
        color: SHELL.INK,
      }}
    >
      <header style={{ marginBottom: 24, maxWidth: 1280 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: 8,
          }}
        >
          Reasoning · Compare
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF_DISPLAY,
            fontSize: 28,
            margin: 0,
            letterSpacing: '-0.015em',
            color: SHELL.INK,
          }}
        >
          Two-instance reasoning comparison
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            color: SHELL.INK_SOFT,
            fontSize: 14,
            maxWidth: 720,
            lineHeight: 1.55,
          }}
        >
          Pick any two instances — source events or programs — and see their
          gate counts, contradictions, failure modes, and cascade impacts side
          by side. The column with more issues on each row is tinted to draw
          the eye.
        </p>
      </header>

      {showPicker ? (
        <ComparePicker
          aId={aId}
          bId={bId}
          aResolved={a}
          bResolved={b}
        />
      ) : (
        <div style={{ maxWidth: 1280 }}>
          <InstanceComparisonGrid left={toSide(a)} right={toSide(b)} />
          <PickerLink aId={aId!} bId={bId!} />
        </div>
      )}
    </main>
  );
}

// ── Picker ─────────────────────────────────────────────────────────────────

function ComparePicker({
  aId,
  bId,
  aResolved,
  bResolved,
}: {
  aId: string | undefined;
  bId: string | undefined;
  aResolved: ResolvedInstance | null;
  bResolved: ResolvedInstance | null;
}) {
  const { sourceEvents, programs } = getAllInstanceIds();

  const aError = aId !== undefined && aResolved === null;
  const bError = bId !== undefined && bResolved === null;

  return (
    <form
      method="GET"
      action="/source/compare"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: 24,
        maxWidth: 720,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: SHELL.SERIF_DISPLAY,
            fontSize: 18,
            margin: '0 0 4px',
            color: SHELL.INK,
            letterSpacing: '-0.01em',
          }}
        >
          Choose two instances
        </h2>
        <p
          style={{
            margin: 0,
            color: SHELL.INK_SOFT,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Select an instance for each side of the comparison. Source events
          and programs can be mixed.
        </p>
      </div>

      <PickerSelect
        name="a"
        label="Side A"
        defaultValue={aId ?? ''}
        sourceEvents={sourceEvents}
        programs={programs}
        invalid={aError}
        invalidValue={aId}
      />
      <PickerSelect
        name="b"
        label="Side B"
        defaultValue={bId ?? ''}
        sourceEvents={sourceEvents}
        programs={programs}
        invalid={bError}
        invalidValue={bId}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="submit"
          style={{
            background: SHELL.INK,
            color: SHELL.PAPER,
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Compare
        </button>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
          }}
        >
          {sourceEvents.length} source event{sourceEvents.length === 1 ? '' : 's'} ·{' '}
          {programs.length} program{programs.length === 1 ? '' : 's'} known
        </span>
      </div>
    </form>
  );
}

function PickerSelect({
  name,
  label,
  defaultValue,
  sourceEvents,
  programs,
  invalid,
  invalidValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
  sourceEvents: string[];
  programs: string[];
  invalid: boolean;
  invalidValue: string | undefined;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        style={{
          padding: '10px 12px',
          background: SHELL.PAPER,
          border: `1px solid ${invalid ? SHELL.RUST_TEXT : SHELL.CARD_LINE}`,
          borderRadius: 6,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
        }}
      >
        <option value="">— select an instance —</option>
        <optgroup label="Source events">
          {sourceEvents.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </optgroup>
        <optgroup label="Programs">
          {programs.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </optgroup>
      </select>
      {invalid && invalidValue !== undefined ? (
        <span style={{ fontSize: 12, color: SHELL.RUST_TEXT }}>
          Unknown instance id: <code>{invalidValue}</code>
        </span>
      ) : null}
    </label>
  );
}

function PickerLink({ aId, bId }: { aId: string; bId: string }) {
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        Comparing {aId} vs {bId}
      </span>
      <Link
        href="/source/compare"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          letterSpacing: '0.08em',
          textDecoration: 'underline',
        }}
      >
        Change selection
      </Link>
    </div>
  );
}
