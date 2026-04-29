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

import { useCallback, useState } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import type { Artifact } from '@/lib/agent/artifacts';
import {
  ProgramBriefPanel,
  EMPTY_BRIEF,
  type ProgramBriefDraft,
  type PatternMatchCard,
} from './ProgramBriefPanel';
import { StewardChat, type ChatTurn } from './StewardChat';

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
  const [brief, setBrief] = useState<ProgramBriefDraft>(EMPTY_BRIEF);
  const [patternMatch, setPatternMatch] = useState<PatternMatchCard | null>(null);

  const applyArtifact = useCallback((artifact: Artifact) => {
    switch (artifact.type) {
      case 'brief-field':
        setBrief((prev) => ({ ...prev, [artifact.field]: artifact.value }));
        return;
      case 'pattern-match':
        setPatternMatch({
          patternId: artifact.patternId,
          name: artifact.name,
          summary: artifact.summary,
          successRatePct: artifact.successRatePct,
          deploymentCount: artifact.deploymentCount,
          typicalDurationMonths: artifact.typicalDurationMonths,
        });
        // Mirror the matched-pattern id onto the brief so the brief row
        // renders alongside the rich card.
        setBrief((prev) => ({ ...prev, matchedPatternId: artifact.patternId }));
        return;
      case 'cross-program-dependency':
        setBrief((prev) => {
          const next = `${artifact.programId} · ${artifact.programName} (${artifact.currentPhase})`;
          if (prev.crossProgramDependencies.includes(next)) return prev;
          return {
            ...prev,
            crossProgramDependencies: [...prev.crossProgramDependencies, next],
          };
        });
        return;
      case 'classification':
        setBrief((prev) => ({ ...prev, classification: artifact.archetypeLabel }));
        return;
    }
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
          initialTurns={initialTurns}
          onArtifact={applyArtifact}
        />
        <ProgramBriefPanel brief={brief} patternMatch={patternMatch} />
      </div>
    </main>
  );
}
