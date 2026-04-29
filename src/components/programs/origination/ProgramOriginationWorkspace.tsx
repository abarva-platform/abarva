'use client';

// ProgramOriginationWorkspace · Surface 1 of Programs Strict Completion v1.2
//
// Two-pane workbench: Steward chat on the left, reactive Program Brief
// on the right. Replaces the legacy 3-step form (per kickoff §5: "the
// 3-step wizard is deleted, not deprecated").
//
// In this PR the brief panel renders an empty/placeholder draft. PR2
// adds structured-artifact extraction so the brief assembles reactively
// as Steward identifies fields. PR3 adds engagement-keyed conversation
// persistence (Obs #4 — conversation lost on reload).

import { useState } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import {
  ProgramBriefPanel,
  EMPTY_BRIEF,
  type ProgramBriefDraft,
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
  // Brief state lives here so PR2's structured-artifact channel can
  // hand mutations down without restructuring the component tree.
  const [brief] = useState<ProgramBriefDraft>(EMPTY_BRIEF);

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
        <StewardChat surface={surface} tenantName={tenantName} initialTurns={initialTurns} />
        <ProgramBriefPanel brief={brief} />
      </div>
    </main>
  );
}
