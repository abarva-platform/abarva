'use client';

import Link from 'next/link';
import type { ActivityEntry, AttentionVariant, DeliverableSummary, Milestone, PersonRef, ProgramSummary } from '@/lib/programs/types.ui';

export function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function badgeTone(variant?: AttentionVariant) {
  switch (variant) {
    case 'danger':
      return 'red';
    case 'warning':
      return 'amber';
    case 'success':
      return 'green';
    default:
      return 'teal';
  }
}

export function ProgressSegments({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="programs-progress" aria-label={`Current phase ${currentPhase} of 6`}>
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className={index < currentPhase ? 'active' : ''} />
      ))}
    </div>
  );
}

export function PersonBadge({ person, suffix }: { person: PersonRef; suffix?: string }) {
  return (
    <div className="programs-row" style={{ gap: 8 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: person.avatarColor ?? '#0f766e',
          color: '#f8fffd',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--programs-mono)',
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {person.initials}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{person.name}</div>
        <div className="programs-subtle" style={{ fontSize: 12 }}>
          {suffix ?? person.title}
        </div>
      </div>
    </div>
  );
}

export function ProgramCard({
  program,
  href,
}: {
  program: ProgramSummary;
  href: string;
}) {
  const badgeClass = badgeTone(program.attentionBadge?.variant);
  return (
    <Link href={href} className="programs-link programs-module-tile">
      <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
        <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="programs-chip teal">{program.clientName}</span>
          <span className="programs-chip">{program.patternName ?? 'Custom shape'}</span>
          <span className={`programs-chip ${badgeClass}`}>{program.phaseStatus.replace('_', ' ')}</span>
        </div>
        {program.attentionBadge ? <span className={`programs-chip ${badgeClass}`}>{program.attentionBadge.label}</span> : null}
      </div>
      <div>
        <div className="programs-name" style={{ fontSize: 24, marginTop: 10 }}>
          {program.name}
        </div>
        <div className="programs-muted" style={{ fontSize: 14, marginTop: 6 }}>
          {program.charterSummary}
        </div>
      </div>
      <ProgressSegments currentPhase={program.currentPhase} />
      <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <div className="programs-stack" style={{ gap: 8 }}>
          <div className="programs-mono-label">{program.shape}</div>
          <div className="programs-row" style={{ gap: 14, flexWrap: 'wrap' }}>
            <PersonBadge person={program.sponsorPerson} suffix="Sponsor" />
            <PersonBadge person={program.leadPerson} suffix="Lead" />
          </div>
        </div>
        <div className="programs-subtle" style={{ fontSize: 12 }}>
          Last activity {formatRelative(program.lastActivityAt)}
        </div>
      </div>
    </Link>
  );
}

export function MetricCard({ label, value, tone = 'default', note }: { label: string; value: string; tone?: 'default' | 'teal' | 'amber' | 'red'; note?: string }) {
  const colors: Record<string, string> = {
    default: 'var(--programs-text)',
    teal: 'var(--programs-teal)',
    amber: 'var(--programs-amber)',
    red: 'var(--programs-red)',
  };
  return (
    <div className="programs-metric">
      <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>
        {label}
      </div>
      <div className="programs-metric-value" style={{ color: colors[tone] }}>
        {value}
      </div>
      {note ? (
        <div className="programs-subtle" style={{ fontSize: 12, marginTop: 6 }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  return (
    <div className="programs-list">
      {items.map((item) => (
        <div key={item.id} className="programs-list-item">
          <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                {item.detail}
              </div>
            </div>
            <span className="programs-chip">{item.type}</span>
          </div>
          <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <div className="programs-subtle" style={{ fontSize: 12 }}>
              {item.actor.name}
            </div>
            <div className="programs-subtle" style={{ fontSize: 12 }}>
              {formatDate(item.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeliverableList({
  programId,
  deliverables,
}: {
  programId: string;
  deliverables: DeliverableSummary[];
}) {
  return (
    <div className="programs-list">
      {deliverables.map((deliverable) => (
        <Link
          key={deliverable.id}
          href={`/programs/${programId}/deliverable/${deliverable.id}`}
          className="programs-link programs-list-item"
        >
          <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{deliverable.title}</div>
              <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                {deliverable.summary}
              </div>
            </div>
            <span className="programs-chip">{deliverable.status}</span>
          </div>
          <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <div className="programs-subtle" style={{ fontSize: 12 }}>
              {deliverable.owner.name}
            </div>
            <div className="programs-subtle" style={{ fontSize: 12 }}>
              v{deliverable.version} · {formatRelative(deliverable.updatedAt)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function MilestoneSummary({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="programs-list">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="programs-list-item">
          <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{milestone.name}</div>
              <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                {milestone.plannedWindow}
                {milestone.actualWindow ? ` · actual ${milestone.actualWindow}` : ''}
              </div>
            </div>
            <span className={`programs-chip ${badgeTone(milestone.status === 'at_risk' ? 'danger' : milestone.status === 'done' ? 'success' : milestone.status === 'in_progress' ? 'warning' : 'info')}`}>
              {milestone.status.replace('_', ' ')}
            </span>
          </div>
          <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <PersonBadge person={milestone.owner} />
            <div className="programs-subtle" style={{ fontSize: 12 }}>
              {milestone.progressLabel} · {milestone.evidenceCount} evidence items
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
