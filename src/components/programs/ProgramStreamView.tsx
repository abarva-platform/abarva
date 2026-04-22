'use client';

import { useMemo, useState } from 'react';
import { COLORS } from '@/lib/design-system';
import type { ActivityEntry, ProgramFullState } from '@/lib/programs/types.ui';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';

interface Props {
  program: ProgramFullState;
}

const TYPE_LABELS: Record<ActivityEntry['type'], string> = {
  gate: 'GATE',
  deliverable: 'DELIVERABLE',
  nexus: 'NEXUS',
  risk: 'RISK',
  milestone: 'MILESTONE',
  approval: 'APPROVAL',
};

const TYPE_TONES: Record<ActivityEntry['type'], 'teal' | 'amber' | 'red' | 'muted'> = {
  gate: 'teal',
  deliverable: 'teal',
  nexus: 'teal',
  risk: 'amber',
  milestone: 'teal',
  approval: 'teal',
};

// Chronological activity feed per C17 §4 · time-ordered events with type
// filter + simple search. Loads all events initially (demo programs have
// <100 events); pagination deferred to post-demo.
export function ProgramStreamView({ program }: Props) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityEntry['type'] | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return program.activity
      .filter((e) => typeFilter === 'all' || e.type === typeFilter)
      .filter((e) =>
        q.length === 0 ||
        e.title.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.actor.name.toLowerCase().includes(q),
      )
      .slice()
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [program.activity, query, typeFilter]);

  return (
    <section aria-labelledby="stream-heading" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <EyebrowLabel tone="teal" size="sm" id="stream-heading">STREAM · {program.activity.length} events</EyebrowLabel>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events…"
          aria-label="Search program activity"
          style={{
            flex: '1 1 260px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: COLORS.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityEntry['type'] | 'all')}
          aria-label="Filter by event type"
          style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: COLORS.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
          }}
        >
          <option value="all">All event types</option>
          <option value="gate">Gates</option>
          <option value="deliverable">Deliverables</option>
          <option value="nexus">Nexus activity</option>
          <option value="risk">Risks</option>
          <option value="milestone">Milestones</option>
          <option value="approval">Approvals</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Body size="sm" tone="muted">No events match this filter.</Body>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((event) => (
            <li key={event.id}>
              <article
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: 16,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: COLORS.teal, letterSpacing: '0.12em' }}>
                    {event.at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()} · {event.at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <EyebrowLabel tone={TYPE_TONES[event.type]} size="xs">
                    {TYPE_LABELS[event.type]}
                  </EyebrowLabel>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Body size="md" weight={500} tone="primary">
                    {event.title}
                  </Body>
                  <Body size="sm" tone="secondary">
                    {event.detail}
                  </Body>
                  <MetaLabel>{event.actor.name} · {event.actor.title}</MetaLabel>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
