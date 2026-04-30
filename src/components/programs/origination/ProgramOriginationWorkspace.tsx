'use client';

// ProgramOriginationWorkspace · Surface 1 of Programs Strict Completion v1.2
//
// Two-pane workbench: Steward chat on the left, reactive Program Brief
// on the right. Replaces the legacy 3-step form (per kickoff §5: "the
// 3-step wizard is deleted, not deprecated").
//
// PR2 wires the structured-artifact channel: Steward emits artifacts
// inline with its text response; this component lifts the brief state
// and applies each artifact incrementally so the right pane materializes
// the agent's reasoning as it happens.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import type {
  Artifact,
  BriefProgressArtifact,
  OverlapAlertArtifact,
} from '@/lib/agent/artifacts';
import {
  ProgramBriefPanel,
  EMPTY_BRIEF,
  type ProgramBriefDraft,
  type PatternMatchCard,
} from './ProgramBriefPanel';
import { StewardChat, type ChatTurn } from './StewardChat';
import { buildBriefSnapshot } from './types';

/**
 * The reducer's working state. The brief itself remains the canonical
 * field-by-field shape (ProgramBriefDraft); the two meta artifacts
 * introduced in OV2-1a — `brief-progress` and `overlap-alert` — are
 * surfaced as sibling slots so the right pane can render them as
 * dedicated cards above the field rows.
 */
export interface OriginationBriefState {
  brief: ProgramBriefDraft;
  /**
   * Latest `brief-progress` emission. Steward emits one per turn;
   * latest replaces previous (no merging — the artifact already carries
   * the full field-status snapshot).
   */
  briefProgress: BriefProgressArtifact | null;
  /**
   * Active overlap alerts, deduped by `overlappingProgramId`. Same
   * upsert pattern that `pattern-match` and `phase-progress` use in
   * NexusReactivePanel.selectVisibleArtifacts — re-emits for the same
   * program replace the prior entry; distinct program ids coexist.
   */
  overlapAlerts: OverlapAlertArtifact[];
}

export const EMPTY_BRIEF_STATE: OriginationBriefState = {
  brief: EMPTY_BRIEF,
  briefProgress: null,
  overlapAlerts: [],
};

/**
 * Pure reducer for the origination brief state. Returns the next state
 * given an artifact emitted by Steward. Covers the origination-relevant
 * artifact types; everything else is ignored.
 *
 * Exported so the OV2-1c filter (pattern-match dropped on /programs/new)
 * and the OV2-1b meta-artifact handling can be exercised by unit tests
 * without rendering the workspace.
 */
export function applyArtifactToBrief(
  state: OriginationBriefState,
  artifact: Artifact,
): OriginationBriefState {
  switch (artifact.type) {
    case 'brief-field':
      return {
        ...state,
        brief: { ...state.brief, [artifact.field]: artifact.value },
      };
    case 'pattern-match':
      // OV2-1c · Founder feedback: pattern-match cards are the wrong
      // content for /programs/new — pattern matching belongs at
      // /programs/<id> after a program exists, not during brief
      // creation. The artifacts.ts parser still accepts the type
      // (Nexus uses it on the program-detail surface); we just skip
      // it here so it never surfaces in the origination panel.
      return state;
    case 'cross-program-dependency': {
      const next = `${artifact.programId} · ${artifact.programName} (${artifact.currentPhase})`;
      if (state.brief.crossProgramDependencies.includes(next)) return state;
      return {
        ...state,
        brief: {
          ...state.brief,
          crossProgramDependencies: [...state.brief.crossProgramDependencies, next],
        },
      };
    }
    case 'classification':
      return {
        ...state,
        brief: { ...state.brief, classification: artifact.archetypeLabel },
      };
    case 'brief-progress':
      // OV2-1b · latest emission wins. Steward emits one per turn and
      // the artifact carries the full field-status snapshot, so there's
      // nothing to merge.
      return { ...state, briefProgress: artifact };
    case 'overlap-alert': {
      // OV2-1b · dedupe-by-overlappingProgramId, latest emission wins.
      // Distinct program ids coexist. Mirrors the upsert pattern in
      // NexusReactivePanel.selectVisibleArtifacts.
      const filtered = state.overlapAlerts.filter(
        (a) => a.overlappingProgramId !== artifact.overlappingProgramId,
      );
      return { ...state, overlapAlerts: [...filtered, artifact] };
    }
    default:
      return state;
  }
}

export interface ProgramOriginationWorkspaceProps {
  surface: '/programs/new' | '/demo/programs/new';
  tenantName: string;
  initialTurns: ChatTurn[];
}

export function ProgramOriginationWorkspace({
  surface,
  tenantName,
  initialTurns,
}: ProgramOriginationWorkspaceProps) {
  const [briefState, setBriefState] = useState<OriginationBriefState>(EMPTY_BRIEF_STATE);
  const [patternMatch, setPatternMatch] = useState<PatternMatchCard | null>(null);
  // Lift turns up so we can rehydrate from the saved draft on mount.
  // Until hydration completes we render `initialTurns` (the cold-open).
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [hydrated, setHydrated] = useState(false);

  // PR3 — hydrate from the saved origination draft on mount.
  // The demo route is public (no tenancy); the API will 401/403, and
  // we just stay with the cold-open turns.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/programs/origination-draft?surface=${encodeURIComponent(surface)}`,
          { method: 'GET', cache: 'no-store' },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { draft: { state: { turns?: ChatTurn[]; brief?: ProgramBriefDraft | null; patternMatch?: PatternMatchCard | null } } | null };
        if (cancelled || !body.draft) return;
        const state = body.draft.state ?? {};
        if (Array.isArray(state.turns) && state.turns.length > 0) {
          setTurns(state.turns);
        }
        if (state.brief) {
          const nextBrief: ProgramBriefDraft = state.brief;
          setBriefState((prev) => ({ ...prev, brief: nextBrief }));
        }
        if (state.patternMatch) setPatternMatch(state.patternMatch);
      } catch {
        // Non-fatal — proceed with the cold-open.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surface]);

  const applyArtifact = useCallback((artifact: Artifact) => {
    setBriefState((prev) => applyArtifactToBrief(prev, artifact));
  }, []);

  // PR3 — persist the draft after each non-streaming change so the
  // server has the latest snapshot. We debounce lightly via a ref so
  // a flurry of artifact dispatches in one stream collapses to one
  // POST. Only the brief field-state is persisted; the meta artifacts
  // (briefProgress, overlapAlerts) re-emit on every Steward turn so
  // they don't need server snapshots.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return; // don't write back the cold-open as a "saved" state
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fetch('/api/programs/origination-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface,
          state: { turns, brief: briefState.brief, patternMatch },
        }),
      }).catch(() => {
        /* non-fatal */
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [turns, briefState.brief, patternMatch, surface, hydrated]);

  const handleTurnsChange = useCallback((next: ChatTurn[]) => {
    setTurns(next);
  }, []);

  return (
    <main
      style={{
        background: BrandColors.paper,
        // Bound the page to viewport height so the chat panel's internal
        // scroll container — not the page — handles overflow when the
        // conversation grows. Without this the textarea drifts below the
        // fold as Steward's responses accumulate.
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 28px 28px',
        boxSizing: 'border-box',
        fontFamily: BrandTypography.sans,
        color: BrandColors.inkBlack,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flex: '0 0 auto',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: BrandColors.stone,
            fontWeight: 700,
          }}
        >
          Programs · Originate
        </span>
        <h1
          style={{
            fontFamily: BrandTypography.serif,
            fontSize: 26,
            fontWeight: 400,
            margin: 0,
            color: BrandColors.inkBlack,
          }}
        >
          Stand up a new program
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: BrandColors.slate,
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Steward will conduct origination as a conversation, classify the use
          case against the AbarVa pattern library, and assemble the brief on
          the right as the picture fills in. Confirm to register.
        </p>
      </header>

      <div
        style={{
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
          gap: 20,
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        <StewardChat
          surface={surface}
          tenantName={tenantName}
          turns={turns}
          onTurnsChange={handleTurnsChange}
          onArtifact={applyArtifact}
          // PR-K · pass current brief.programName through so the
          // origination → active handoff marker can address the
          // program by name when commit_program lands.
          programName={briefState.brief.programName}
          // OV2-WIRE-CLIENT · project the live brief into the snapshot
          // shape /api/chat/agent expects on `surfaceContext.briefSnapshot`.
          briefSnapshot={buildBriefSnapshot(briefState.brief)}
        />
        {/* OV2-1c · No `patternMatch` prop on /programs/new (founder feedback). */}
        {/* OV2-1b · Brief Progress + Overlap Alerts surface as cards above field rows. */}
        <ProgramBriefPanel
          brief={briefState.brief}
          briefProgress={briefState.briefProgress}
          overlapAlerts={briefState.overlapAlerts}
        />
      </div>
    </main>
  );
}
