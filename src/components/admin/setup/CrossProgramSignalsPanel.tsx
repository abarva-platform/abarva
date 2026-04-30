/**
 * CrossProgramSignalsPanel · SETUP-1.3
 *
 * The Atlas surface — every cross-program signal the platform
 * currently sees, grouped by severity bucket. Each signal shows
 * the recommendation in Sentinel-voice + the impacted programs.
 *
 * This is the "look what we can reason about" page. The 12
 * signals (for Apex) include 2 HIGH-severity contradictions
 * (CDP-CRM extraction unfunded; CMO-vs-CFO posture) — these are
 * the demos the page is built to surface.
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.3 (capability map).
 */

import Link from 'next/link';

import type { CrossProgramSignal, SignalSeverityBucket } from '@/lib/admin/setup-data-broker';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';

export interface CrossProgramSignalsPanelProps {
  tenantDisplayName: string;
  signals: CrossProgramSignal[];
}

export function CrossProgramSignalsPanel({
  tenantDisplayName,
  signals,
}: CrossProgramSignalsPanelProps) {
  const grouped = groupBySeverity(signals);
  return (
    <EditorialCanvas
      eyebrow={`Cross-program signals · ${tenantDisplayName}`}
      title={`${signals.length} signal${signals.length === 1 ? '' : 's'} across the active portfolio`}
      subtitle="Atlas detects signals that span more than one active program — shared SMEs, shared systems, conflicting strategic theses, vendor-renewal coordination. High-severity entries warrant a sponsor decision; medium and low entries warrant tracking."
    >
      <div
        data-testid="admin-xprog-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}
      >
        <Link
          href="/admin"
          data-testid="admin-xprog-breadcrumb"
          style={{
            color: COLORS.navy,
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            alignSelf: 'flex-start',
            borderBottom: `1px dotted ${COLORS.navy}66`,
          }}
        >
          ← Back to setup landing
        </Link>

        {signals.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SeverityGroup
              bucket="critical"
              eyebrow="Critical severity — immediate escalation required"
              signals={grouped.critical}
            />
            <SeverityGroup
              bucket="high"
              eyebrow="High severity — sponsor decision required"
              signals={grouped.high}
            />
            <SeverityGroup
              bucket="medium"
              eyebrow="Medium severity — tracked"
              signals={grouped.medium}
            />
            <SeverityGroup
              bucket="low"
              eyebrow="Low severity — informational"
              signals={grouped.low}
            />
            {grouped.unknown.length > 0 ? (
              <SeverityGroup
                bucket="unknown"
                eyebrow="Severity not classified"
                signals={grouped.unknown}
              />
            ) : null}
          </>
        )}
      </div>
    </EditorialCanvas>
  );
}

function groupBySeverity(signals: CrossProgramSignal[]) {
  const groups: Record<SignalSeverityBucket, CrossProgramSignal[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    unknown: [],
  };
  for (const s of signals) groups[s.severityBucket].push(s);
  return groups;
}

function SeverityGroup({
  bucket,
  eyebrow,
  signals,
}: {
  bucket: SignalSeverityBucket;
  eyebrow: string;
  signals: CrossProgramSignal[];
}) {
  if (signals.length === 0) return null;
  return (
    <section
      data-testid={`admin-xprog-group-${bucket}`}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: groupTone(bucket).text,
          fontWeight: 700,
        }}
      >
        {eyebrow} · {signals.length}
      </h2>
      <ul
        role="list"
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {signals.map((signal) => (
          <SignalCard key={signal.recordId} signal={signal} />
        ))}
      </ul>
    </section>
  );
}

function SignalCard({ signal }: { signal: CrossProgramSignal }) {
  const tone = groupTone(signal.severityBucket);
  return (
    <li
      role="listitem"
      data-testid={`admin-xprog-signal-${signal.signalId}`}
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${tone.border}`,
        borderLeft: `3px solid ${tone.accent}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            color: SHELL.INK,
            lineHeight: 1.4,
            fontWeight: 600,
          }}
        >
          {signal.title}
        </p>
        <SeverityPill bucket={signal.severityBucket} severityRaw={signal.severityRaw} />
      </div>
      {signal.description ? (
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            lineHeight: 1.55,
          }}
        >
          {signal.description}
        </p>
      ) : null}
      {signal.recommendation ? (
        <div
          style={{
            background: COLORS.skyPale,
            border: `1px solid ${COLORS.navy}22`,
            borderRadius: RADIUS.sm,
            padding: SPACING.sm,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
            }}
          >
            Recommendation
          </p>
          <p
            style={{
              margin: `${SPACING.xs} 0 0`,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              lineHeight: 1.5,
            }}
          >
            {signal.recommendation}
          </p>
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
          alignItems: 'baseline',
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        <span>Type: {signal.signalType.replace(/_/g, ' ')}</span>
        {signal.programs.length > 0 ? (
          <span>
            Programs:{' '}
            {signal.programs.map((p, i) => (
              <span key={p}>
                <Link
                  href={`/programs/${p}`}
                  data-testid={`admin-xprog-program-link-${signal.signalId}-${i}`}
                  style={{ color: COLORS.navy, textDecoration: 'none' }}
                >
                  {p}
                </Link>
                {i < signal.programs.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        ) : null}
        {signal.raisedBy ? <span>Raised by: {signal.raisedBy}</span> : null}
        {signal.raisedDate ? <span>{signal.raisedDate}</span> : null}
        {signal.status ? <span>Status: {signal.status}</span> : null}
      </div>
    </li>
  );
}

function SeverityPill({
  bucket,
  severityRaw,
}: {
  bucket: SignalSeverityBucket;
  severityRaw: string;
}) {
  const tone = groupTone(bucket);
  const display = severityRaw.length > 0 ? severityRaw : bucket;
  return (
    <span
      data-testid={`admin-xprog-severity-${bucket}`}
      style={{
        display: 'inline-block',
        padding: `2px ${SPACING.sm}`,
        background: tone.background,
        color: tone.text,
        borderRadius: RADIUS.pill,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {display}
    </span>
  );
}

function groupTone(bucket: SignalSeverityBucket): {
  background: string;
  border: string;
  accent: string;
  text: string;
} {
  switch (bucket) {
    case 'critical':
      return {
        background: '#FEE2E2',
        border: '#991b1b33',
        accent: '#991b1b',
        text: '#991b1b',
      };
    case 'high':
      return {
        background: COLORS.coralSoft,
        border: `${COLORS.coralInk}33`,
        accent: COLORS.coralInk,
        text: COLORS.coralInk,
      };
    case 'medium':
      return {
        background: COLORS.amberSoft,
        border: `${COLORS.amberInk}33`,
        accent: COLORS.amberInk,
        text: COLORS.amberInk,
      };
    case 'low':
      return {
        background: COLORS.skyPale,
        border: `${COLORS.navy}33`,
        accent: COLORS.navy,
        text: COLORS.navy,
      };
    case 'unknown':
      return {
        background: SHELL.GRAY_BG,
        border: SHELL.CARD_LINE,
        accent: SHELL.INK_MUTED,
        text: SHELL.INK_MUTED,
      };
  }
}

function EmptyState() {
  return (
    <section
      data-testid="admin-xprog-empty"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 18,
          color: SHELL.INK,
          lineHeight: 1.4,
        }}
      >
        Atlas hasn&apos;t surfaced any cross-program signals yet.
      </p>
      <p
        style={{
          margin: `${SPACING.sm} 0 0`,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          maxWidth: '520px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Cross-program reasoning needs at least two programs in the inventory and a populated org-structure + IT-landscape so Atlas can detect shared SMEs, shared systems, and conflicting theses.
      </p>
    </section>
  );
}
