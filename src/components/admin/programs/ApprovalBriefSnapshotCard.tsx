// OV2-2c · Tenant-admin approval queue · brief snapshot card
//
// Read-only render of the briefSnapshot JSON captured at submission
// time. Mirrors the field language of ProgramBriefPanel without
// importing it directly (that component is a 'use client' artifact
// for the live origination canvas; here we want a server-renderable
// static card with no agent state).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  safeApprovalPersonLabel,
} from '@/lib/programs/approval-display';

export interface ApprovalBriefSnapshotCardProps {
  briefSnapshot: Record<string, unknown>;
  resolvePersonName?: (personId: string) => string | null;
}

interface FieldRow {
  label: string;
  value: string | null;
  multiline?: boolean;
  mono?: boolean;
}

function pick(
  snapshot: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = snapshot[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function displayPersonField(
  snapshot: Record<string, unknown>,
  personIdKey: string,
  fallbackKey: string,
  placeholder: string,
  resolvePersonName?: (personId: string) => string | null,
): string | null {
  const personId = pick(snapshot, personIdKey);
  if (personId) {
    const resolved = resolvePersonName?.(personId);
    if (resolved) return resolved;
  }

  const fallbackValue = pick(snapshot, fallbackKey);
  if (fallbackValue) {
    return safeApprovalPersonLabel(fallbackValue, placeholder);
  }

  return personId ? safeApprovalPersonLabel(personId, placeholder) : null;
}

function buildFields(
  snapshot: Record<string, unknown>,
  resolvePersonName?: (personId: string) => string | null,
): FieldRow[] {
  return [
    { label: 'Problem', value: pick(snapshot, 'problem_statement', 'problemStatement'), multiline: true },
    { label: 'Outcome', value: pick(snapshot, 'target_outcome', 'targetOutcome'), multiline: true },
    { label: 'Timeline', value: pick(snapshot, 'timeline') },
    { label: 'Classification', value: pick(snapshot, 'classification'), mono: true },
    { label: 'Matched pattern', value: pick(snapshot, 'matched_pattern_id', 'matchedPatternId'), mono: true },
    {
      label: 'Sponsor',
      value: displayPersonField(
        snapshot,
        'sponsor_person_id',
        'sponsor',
        'Selected sponsor',
        resolvePersonName,
      ),
    },
    {
      label: 'Lead',
      value: displayPersonField(
        snapshot,
        'lead_person_id',
        'lead',
        'Selected lead',
        resolvePersonName,
      ),
    },
    { label: 'Submitted from', value: pick(snapshot, 'submitted_from_surface', 'submittedFromSurface') },
  ];
}

function FieldRowView({ row }: { row: FieldRow }) {
  const filled = row.value !== null && row.value !== '';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: SPACING.md,
        padding: '10px 0',
        borderBottom: `1px solid ${COLORS.ink}10`,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}80`,
          fontWeight: 600,
        }}
      >
        {row.label}
      </span>
      <span
        style={{
          fontFamily: row.mono ? TYPOGRAPHY.mono : TYPOGRAPHY.sans,
          fontSize: row.mono ? 12 : 14,
          color: filled ? COLORS.ink : `${COLORS.ink}66`,
          fontStyle: filled ? 'normal' : 'italic',
          lineHeight: row.multiline ? 1.5 : 1.4,
          whiteSpace: row.multiline ? 'pre-wrap' : 'normal',
          wordBreak: 'break-word',
        }}
      >
        {filled ? row.value : '—'}
      </span>
    </div>
  );
}

export function ApprovalBriefSnapshotCard({
  briefSnapshot,
  resolvePersonName,
}: ApprovalBriefSnapshotCardProps) {
  const programName =
    pick(briefSnapshot, 'program_name', 'programName') ?? 'Untitled program';
  const fields = buildFields(briefSnapshot, resolvePersonName);

  return (
    <section
      aria-label="Brief snapshot"
      data-testid="approval-brief-snapshot"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <header style={{ marginBottom: SPACING.md }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            fontWeight: 700,
          }}
        >
          Brief snapshot
        </span>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.ink,
            margin: '6px 0 0',
            lineHeight: 1.2,
          }}
        >
          {programName}
        </h2>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {fields.map((row) => (
          <FieldRowView key={row.label} row={row} />
        ))}
      </div>
    </section>
  );
}
