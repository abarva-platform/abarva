'use client';

import { useMemo, useState } from 'react';
import type { ParticipantRef, ProgramFullState } from '@/lib/programs/types';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { ExecutiveCard } from '@/components/shared/entities/ExecutiveCard';

interface Props {
  program: ProgramFullState;
}

const ROLE_LABELS: Record<ParticipantRef['role'], string> = {
  sponsor: 'SPONSOR',
  lead: 'PROGRAM LEAD',
  team_member: 'TEAM MEMBER',
  operator: 'OPERATOR',
  maestro: 'MAESTRO',
  founder: 'FOUNDER',
};

const ROLE_SORT_ORDER: ParticipantRef['role'][] = ['sponsor', 'lead', 'maestro', 'founder', 'operator', 'team_member'];

// Stakeholder grid per C17 §5 · who's involved and how engaged they are.
// Composes the shared ExecutiveCard so click-through routes to C12 when it
// lands; for the demo window we use the person id as the graph node id.
export function ProgramStakeholdersView({ program }: Props) {
  const [roleFilter, setRoleFilter] = useState<ParticipantRef['role'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'role' | 'recent'>('role');

  const filtered = useMemo(() => {
    const list = program.team.filter((p) => roleFilter === 'all' || p.role === roleFilter);
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'role') {
        return ROLE_SORT_ORDER.indexOf(a.role) - ROLE_SORT_ORDER.indexOf(b.role);
      }
      // Stable fallback · activitySummary may be absent, keep original order.
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [program.team, roleFilter, sortBy]);

  const sponsors = program.team.filter((p) => p.role === 'sponsor').length;
  const leads = program.team.filter((p) => p.role === 'lead').length;

  return (
    <section aria-labelledby="stakeholders-heading" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <EyebrowLabel tone="teal" size="sm" id="stakeholders-heading">
            STAKEHOLDERS · {program.team.length}
          </EyebrowLabel>
          <Body tone="secondary" size="sm" style={{ marginTop: 6 }}>
            {sponsors} sponsor{sponsors === 1 ? '' : 's'} · {leads} lead{leads === 1 ? '' : 's'}
          </Body>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ParticipantRef['role'] | 'all')}
            aria-label="Filter by role"
            style={filterStyle}
          >
            <option value="all">All roles</option>
            <option value="sponsor">Sponsor</option>
            <option value="lead">Program lead</option>
            <option value="team_member">Team members</option>
            <option value="operator">Operators</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'role' | 'recent')}
            aria-label="Sort"
            style={filterStyle}
          >
            <option value="role">By role</option>
            <option value="recent">By name</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Body size="sm" tone="muted">No stakeholders match this filter.</Body>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <ExecutiveCard
              key={p.id}
              name={p.name}
              title={p.title}
              organization={program.clientName}
              focus={p.activitySummary ?? (p.workstream ? `Workstream: ${p.workstream}` : null)}
              roleTag={ROLE_LABELS[p.role as keyof typeof ROLE_LABELS] ?? p.role.toUpperCase()}
              size="card"
              href={`/persons/${encodeURIComponent(p.id)}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const filterStyle = {
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#EFF6FF',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
} as const;
