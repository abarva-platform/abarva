// /admin/reasoning/changelog — 114-entry reasoning system commit history.
//
// Pure server component. Reads the pre-generated changelog JSON, sorts newest-first,
// and renders a flat list with PR links, sha anchors, and kind badges.
// No client JS needed.

import changelogData from '@/lib/reasoning/generated/changelog.json';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';

export const metadata = {
  title: 'Reasoning changelog | AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangelogEntry = {
  sha: string;
  subject: string;
  author: string;
  date: string;
  prNumber: number | null;
  kind: string;
  short: string;
};

type ChangelogJson = {
  generatedAt: string;
  entries: ChangelogEntry[];
};

// ─── Kind badge palette ────────────────────────────────────────────────────────

type KindStyle = { bg: string; fg: string; label: string };

function kindStyle(kind: string): KindStyle {
  switch (kind) {
    case 'feat':
      return { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT, label: 'feat' };
    case 'fix':
      return { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT, label: 'fix' };
    case 'docs':
      return { bg: SHELL.BLUE_BG, fg: COLORS.navy, label: 'docs' };
    case 'refactor':
      return { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT, label: 'refactor' };
    case 'chore':
      return { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT, label: 'chore' };
    default:
      return { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT, label: kind };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

const GITHUB_BASE = 'https://github.com/anandsundaram-hash/abarva';

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  total,
  oldest,
  newest,
}: {
  total: number;
  oldest: string;
  newest: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Reasoning system changelog
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {total} entries
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {oldest} → {newest}
        </div>
      </div>
      <a
        href={`${GITHUB_BASE}/commits`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.navy,
          background: SHELL.BLUE_BG,
          border: `1px solid ${SHELL.BLUE_LINE}`,
          borderRadius: RADIUS.pill,
          padding: '6px 16px',
          textDecoration: 'none',
          letterSpacing: '0.02em',
        }}
      >
        View on GitHub ↗
      </a>
    </div>
  );
}

// ─── Kind badge ───────────────────────────────────────────────────────────────

function KindBadge({ kind }: { kind: string }) {
  const s = kindStyle(kind);
  return (
    <span
      style={{
        display: 'inline-block',
        background: s.bg,
        color: s.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'lowercase',
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: ChangelogEntry }) {
  const shortSha = entry.sha.slice(0, 7);
  const dateStr = formatDate(entry.date);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: SPACING.md,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        borderBottom: `1px solid ${COLORS.ink}0c`,
        flexWrap: 'wrap',
      }}
    >
      {/* Date */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}66`,
          flexShrink: 0,
          minWidth: 80,
        }}
      >
        {dateStr}
      </span>

      {/* SHA link */}
      <a
        href={`${GITHUB_BASE}/commit/${entry.sha}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: COLORS.navy,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <code
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.GRAY_LINE}`,
            borderRadius: RADIUS.sm,
            padding: '1px 5px',
          }}
        >
          {shortSha}
        </code>
      </a>

      {/* Kind badge */}
      <KindBadge kind={entry.kind} />

      {/* Subject with optional PR link */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          lineHeight: 1.4,
          flex: 1,
          minWidth: 200,
        }}
      >
        {entry.short}
        {entry.prNumber !== null ? (
          <>
            {' '}
            <a
              href={`${GITHUB_BASE}/pull/${entry.prNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: COLORS.navy,
                textDecoration: 'none',
              }}
            >
              #{entry.prNumber}
            </a>
          </>
        ) : null}
      </span>

      {/* Author */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}55`,
          flexShrink: 0,
        }}
      >
        {entry.author}
      </span>
    </div>
  );
}

// ─── Changelog list ───────────────────────────────────────────────────────────

function ChangelogList({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          All commits
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {entries.length} entries · newest first
        </span>
      </header>
      <div>
        {entries.map((entry) => (
          <EntryRow key={entry.sha} entry={entry} />
        ))}
      </div>
    </section>
  );
}

// ─── Kind breakdown strip ─────────────────────────────────────────────────────

function KindBreakdown({ entries }: { entries: ChangelogEntry[] }) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        By kind
      </span>
      {sorted.map(([kind, count]) => {
        const s = kindStyle(kind);
        return (
          <span
            key={kind}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: s.bg,
              color: s.fg,
              borderRadius: RADIUS.pill,
              padding: '3px 10px',
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
            }}
          >
            <span style={{ fontWeight: 700 }}>{kind}</span>
            <span style={{ opacity: 0.7 }}>·</span>
            <span>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReasoningChangelogPage() {
  const data = changelogData as ChangelogJson;

  // Sort newest-first
  const entries = [...data.entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const newest = entries.length > 0 ? formatDate(entries[0].date) : '—';
  const oldest = entries.length > 0 ? formatDate(entries[entries.length - 1].date) : '—';

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="System changelog"
        subtitle="Audit history of all reasoning system changes, newest first. Each entry links to its GitHub commit and PR."
      >
        <SummaryCard total={entries.length} oldest={oldest} newest={newest} />
        <KindBreakdown entries={entries} />
        <ChangelogList entries={entries} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
