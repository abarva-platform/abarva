'use client';

import { useState } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ProgramFullState } from '@/lib/programs/types';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';

export type ProgramView = 'journey' | 'stream' | 'stakeholders';

interface Props {
  program: ProgramFullState;
  currentView: ProgramView;
  onViewChange: (view: ProgramView) => void;
}

const VIEW_TABS: Array<{ key: ProgramView; label: string }> = [
  { key: 'journey', label: 'Journey' },
  { key: 'stream', label: 'Stream' },
  { key: 'stakeholders', label: 'Stakeholders' },
];

// C17 header · breadcrumb · title + archetype · meta row · tab switcher.
// Health pill color derived from gateStatus · teal/amber/soft-red per
// design-system guardrails (no stoplight RGB).
export function ProgramDetailHeader({ program, currentView, onViewChange }: Props) {
  const healthTone = program.gateStatus === 'blocked' ? 'amber' : program.gateStatus === 'cleared' ? 'teal' : 'muted';
  const healthLabel = program.gateStatus === 'blocked' ? 'ATTENTION' : program.gateStatus === 'cleared' ? 'ON TRACK' : 'IN REVIEW';

  const archetypeLabel = program.archetype.replace(/_/g, ' ').toUpperCase();

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <EntityLink href="/programs" variant="ghost">Portfolio</EntityLink>
          <span style={{ color: 'rgba(245,245,240,0.3)' }}>/</span>
          <Body size="sm" tone="secondary">{program.name}</Body>
        </div>
        <EyebrowLabel tone={healthTone} size="xs">{healthLabel}</EyebrowLabel>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <EyebrowLabel tone="teal" size="sm">{archetypeLabel}</EyebrowLabel>
        <PageTitle size="page">{program.name}</PageTitle>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'baseline',
        }}
      >
        <Body size="sm" tone="secondary">
          <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Sponsor · </strong>
          <EntityLink href={`/persons/${encodeURIComponent(program.sponsorPerson.id)}`} variant="inline">
            {program.sponsorPerson.name}
          </EntityLink>
          <MetaLabel style={{ marginLeft: 6 }}>{program.sponsorPerson.title}</MetaLabel>
        </Body>
        <Body size="sm" tone="secondary">
          <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Lead · </strong>
          <EntityLink href={`/persons/${encodeURIComponent(program.leadPerson.id)}`} variant="inline">
            {program.leadPerson.name}
          </EntityLink>
        </Body>
        <Body size="sm" tone="secondary">
          <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Phase · </strong>
          {program.currentPhase} · {program.phases.find((p) => p.canonicalPhase === program.currentPhase)?.name ?? '—'}
        </Body>
        <Body size="sm" tone="secondary">
          <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Client · </strong>
          {program.clientName}
        </Body>
      </div>

      <ViewTabs currentView={currentView} onViewChange={onViewChange} />
    </header>
  );
}

function ViewTabs({ currentView, onViewChange }: { currentView: ProgramView; onViewChange: (v: ProgramView) => void }) {
  const reducedMotion = useReducedMotion();
  const [hoveredTab, setHoveredTab] = useState<ProgramView | null>(null);

  return (
    <nav
      role="tablist"
      aria-label="Program detail view"
      style={{
        display: 'flex',
        gap: 20,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        marginTop: 10,
      }}
    >
      {VIEW_TABS.map((tab) => {
        const isActive = tab.key === currentView;
        const isHovered = hoveredTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onViewChange(tab.key)}
            onMouseEnter={() => setHoveredTab(tab.key)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '10px 2px',
              color: isActive ? COLORS.textPrimary : isHovered ? COLORS.teal : 'rgba(245,245,240,0.72)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              borderBottom: `2px solid ${isActive ? COLORS.teal : 'transparent'}`,
              marginBottom: -1,
              outline: 'none',
              transition: reducedMotion ? undefined : `color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = FOCUS_RING.brand; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
