// /admin/reasoning/governance-flags — Governance flag viewer across all instances.
//
// Server component. Collects all GovernanceFlag entries from every
// SourceEventInstance and ProgramInstance, groups them by kind
// (blocker → risk → exception → note), and renders an open/resolved
// status view with per-instance context.

import { RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { ProgramGovernanceFlag } from '@/lib/programs/program-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Governance flags · AbarVa Admin',
};

// ─── Normalised flag shape ────────────────────────────────────────────────────

type FlagKind = 'blocker' | 'risk' | 'exception' | 'note';

interface NormalisedFlag {
  id: string;
  kind: FlagKind;
  description: string;
  raisedBy: string;
  raisedAt: string;
  status: 'open' | 'resolved';
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
}

// ─── Data collection ──────────────────────────────────────────────────────────

/**
 * ProgramGovernanceFlag uses 'decision' instead of 'exception'.
 * Normalise to the four display kinds by mapping 'decision' → 'note'.
 */
function normaliseProgramKind(kind: ProgramGovernanceFlag['kind']): FlagKind {
  if (kind === 'decision') return 'note';
  return kind as FlagKind;
}

function collectAllFlags(): NormalisedFlag[] {
  const flags: NormalisedFlag[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    for (const f of inst.flags) {
      flags.push({
        id: f.id,
        kind: f.kind as FlagKind,
        description: f.description,
        raisedBy: f.raisedBy,
        raisedAt: f.raisedAt,
        status: f.status,
        instanceId: inst.id,
        instanceName: inst.name,
        instanceType: 'source',
      });
    }
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const f of inst.flags) {
      flags.push({
        id: f.id,
        kind: normaliseProgramKind(f.kind),
        description: f.description,
        raisedBy: f.raisedBy,
        raisedAt: f.raisedAt,
        status: f.status,
        instanceId: inst.id,
        instanceName: inst.name,
        instanceType: 'program',
      });
    }
  }

  return flags;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

// ─── Style constants ──────────────────────────────────────────────────────────

const KIND_ORDER: ReadonlyArray<FlagKind> = ['blocker', 'risk', 'exception', 'note'];

const KIND_LABEL: Record<FlagKind, string> = {
  blocker: 'Blocker',
  risk: 'Risk',
  exception: 'Exception',
  note: 'Note',
};

/** Dot colour for open flags by kind; resolved flags use a muted gray. */
function dotColor(kind: FlagKind, status: 'open' | 'resolved'): string {
  if (status === 'resolved') return SHELL.INK_MUTED;
  switch (kind) {
    case 'blocker':  return SHELL.RUST_TEXT;
    case 'risk':     return SHELL.AMBER_DOT;
    case 'exception': return SHELL.PEACH_TEXT;
    case 'note':     return SHELL.INK_MUTED;
  }
}

/** Section accent colour by kind. */
function sectionAccent(kind: FlagKind): string {
  switch (kind) {
    case 'blocker':  return SHELL.RUST_BG;
    case 'risk':     return '#fff4de';      // warm amber tint
    case 'exception': return SHELL.PEACH_BG;
    case 'note':     return SHELL.GRAY_BG;
  }
}

function sectionAccentLine(kind: FlagKind): string {
  switch (kind) {
    case 'blocker':  return '#e6bfaa';
    case 'risk':     return '#e8c86a';
    case 'exception': return SHELL.PEACH_LINE;
    case 'note':     return SHELL.GRAY_LINE;
  }
}

function sectionAccentText(kind: FlagKind): string {
  switch (kind) {
    case 'blocker':  return SHELL.RUST_TEXT;
    case 'risk':     return '#8a6a00';
    case 'exception': return SHELL.PEACH_TEXT;
    case 'note':     return SHELL.GRAY_TEXT;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  open,
  resolved,
  perKind,
}: {
  total: number;
  open: number;
  resolved: number;
  perKind: Record<FlagKind, number>;
}) {
  return (
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
      {/* Headline counts */}
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          fontWeight: 600,
          marginRight: SPACING.sm,
        }}
      >
        {total} total
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.RUST_TEXT,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: SHELL.RUST_TEXT,
            display: 'inline-block',
          }}
        />
        {open} open
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_MUTED,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: SHELL.INK_MUTED,
            display: 'inline-block',
          }}
        />
        {resolved} resolved
      </span>

      {/* Divider */}
      <span
        style={{
          width: 1,
          height: 20,
          background: SHELL.CARD_LINE,
          flexShrink: 0,
        }}
      />

      {/* Per-kind chips */}
      {KIND_ORDER.map((kind) => (
        <span
          key={kind}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: sectionAccent(kind),
            border: `1px solid ${sectionAccentLine(kind)}`,
            borderRadius: RADIUS.pill,
            padding: '3px 10px',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: sectionAccentText(kind),
            fontWeight: 600,
          }}
        >
          {KIND_LABEL[kind]} · {perKind[kind]}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: 'open' | 'resolved' }) {
  if (status === 'open') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: SHELL.RUST_BG,
          color: SHELL.RUST_TEXT,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: SHELL.SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Open
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.MINT_BG,
        color: SHELL.MINT_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      Resolved
    </span>
  );
}

function FlagRow({ flag }: { flag: NormalisedFlag }) {
  const isResolved = flag.status === 'resolved';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.md,
        padding: `${SPACING.md} ${SPACING.lg}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        opacity: isResolved ? 0.6 : 1,
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor(flag.kind, flag.status),
          flexShrink: 0,
          marginTop: 4,
        }}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Flag ID */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            marginBottom: 3,
          }}
        >
          {flag.id}
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1.4,
            marginBottom: 4,
          }}
        >
          {flag.description}
        </div>

        {/* Instance name */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            marginBottom: 4,
          }}
        >
          {flag.instanceName}{' '}
          <span style={{ color: SHELL.INK_MUTED }}>({flag.instanceId})</span>
        </div>

        {/* raisedBy · raisedAt */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
          }}
        >
          {flag.raisedBy}
          <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
          {formatDate(flag.raisedAt)}
        </div>
      </div>

      {/* Status pill */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <StatusPill status={flag.status} />
      </div>
    </div>
  );
}

function KindSection({
  kind,
  flags,
}: {
  kind: FlagKind;
  flags: NormalisedFlag[];
}) {
  const openCount = flags.filter((f) => f.status === 'open').length;

  // Open flags first, then resolved
  const sorted = [
    ...flags.filter((f) => f.status === 'open'),
    ...flags.filter((f) => f.status === 'resolved'),
  ];

  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          background: sectionAccent(kind),
        }}
      >
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            color: SHELL.INK,
            margin: 0,
            letterSpacing: '-0.01em',
            fontWeight: 600,
          }}
        >
          {KIND_LABEL[kind]}
        </h2>

        {/* Open count badge */}
        {openCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: sectionAccentLine(kind),
              color: sectionAccentText(kind),
              borderRadius: RADIUS.pill,
              padding: '2px 9px',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {openCount} open
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {flags.length} total
        </span>
      </header>

      {/* Flag rows */}
      {sorted.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_MUTED,
          }}
        >
          No {KIND_LABEL[kind].toLowerCase()} flags across any instance.
        </div>
      ) : (
        <div>
          {sorted.map((flag) => (
            <FlagRow key={`${flag.instanceId}:${flag.id}`} flag={flag} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GovernanceFlagsPage() {
  const allFlags = collectAllFlags();

  const total = allFlags.length;
  const open = allFlags.filter((f) => f.status === 'open').length;
  const resolved = allFlags.filter((f) => f.status === 'resolved').length;

  const perKind = KIND_ORDER.reduce<Record<FlagKind, number>>(
    (acc, kind) => {
      acc[kind] = allFlags.filter((f) => f.kind === kind).length;
      return acc;
    },
    { blocker: 0, risk: 0, exception: 0, note: 0 },
  );

  const byKind: Record<FlagKind, NormalisedFlag[]> = {
    blocker: allFlags.filter((f) => f.kind === 'blocker'),
    risk: allFlags.filter((f) => f.kind === 'risk'),
    exception: allFlags.filter((f) => f.kind === 'exception'),
    note: allFlags.filter((f) => f.kind === 'note'),
  };

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Governance flags"
        subtitle="All governance flags across instances — risks, blockers, exceptions, and notes."
      >
        <SummaryStrip
          total={total}
          open={open}
          resolved={resolved}
          perKind={perKind}
        />

        {KIND_ORDER.map((kind) => (
          <KindSection key={kind} kind={kind} flags={byKind[kind]} />
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
