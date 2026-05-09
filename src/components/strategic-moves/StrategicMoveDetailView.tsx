import Link from 'next/link';
import { Suspense } from 'react';
import styles from './StrategicMoves.module.css';
import { PhaseRail } from './PhaseRail';
import { MoveArtifactUpload } from './MoveArtifactUpload';
import { StrategicMoveDetailClient } from './StrategicMoveDetailClient';
import { PhaseDocumentsPanel } from './PhaseDocumentsPanel';
import type { StrategicMove } from '@/lib/programs/types.ui';

type Tab = 'overview' | 'documents' | 'activity';

interface Props {
  move: StrategicMove;
  activeTab?: Tab;
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function verifiedFallback(phase: number): string {
  if (phase >= 5) return '— tracked (pending)';
  return '— pending verification';
}

function primaryAction(move: StrategicMove): { label: string; href: string } {
  const { status, currentPhase, phaseLabel, id } = move;
  if (status.key === 'gate_blocked') return { label: 'Open gate review', href: `/strategic-moves/${id}?panel=gate` };
  if (status.key === 'awaiting_decision') return { label: 'Resolve decision', href: '/admin/programs/approvals' };
  if (status.key === 'validated') return { label: 'Review verification', href: `/tower?move=${id}` };
  return { label: `Continue ${phaseLabel}`, href: `/strategic-moves/${id}/phase/${currentPhase}` };
}

function secondaryAction(move: StrategicMove): { label: string; href: string } | null {
  if (move.status.key === 'awaiting_decision') {
    return { label: 'Reopen brief', href: `/strategic-moves/${move.id}?panel=brief` };
  }
  return null;
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({ moveId, active }: { moveId: string; active: Tab }) {
  const tabs: { key: Tab; label: string; href: string }[] = [
    { key: 'overview',   label: 'Overview',   href: `/strategic-moves/${moveId}` },
    { key: 'documents',  label: 'Documents',  href: `/strategic-moves/${moveId}?tab=documents` },
    { key: 'activity',   label: 'Activity',   href: `/strategic-moves/${moveId}?tab=activity` },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid #e5e5e5',
      marginBottom: 20,
      marginTop: 2,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#1A1A18' : '#9AA3B2',
              textDecoration: 'none',
              borderBottom: isActive ? '2px solid #1B2B5C' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.1s',
              letterSpacing: isActive ? '0.01em' : undefined,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Overview tab content ───────────────────────────────────────────────────────

function OverviewContent({ move }: { move: StrategicMove }) {
  return (
    <div className={styles.detailBody}>
      <div
        className={`${styles.statusBanner} ${
          move.statusColor === 'red' ? styles.statusBannerRed :
          move.statusColor === 'amber' ? styles.statusBannerAmber :
          move.statusColor === 'teal' ? styles.statusBannerTeal :
          styles.statusBannerGreen
        }`}
      >
        <span className={styles.statusBannerPulse} aria-hidden />
        <div className={styles.statusBannerText}>
          <div className={styles.statusBannerStatus}>{move.status.text}</div>
          <div className={styles.statusBannerDesc}>{move.status.description}</div>
        </div>
      </div>

      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          {move.phaseLabel.toUpperCase()} &middot; Gate criteria
        </div>
        <ul className={styles.critList}>
          {move.gateCriteria.map((criterion) => (
            <li key={criterion.id}>
              <span
                className={`${styles.critCheck} ${criterion.completed ? styles.critCheckDone : ''}`}
                aria-hidden
              >
                {criterion.completed ? '✓' : ''}
              </span>
              <span>{criterion.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.sectionGrid}>
        <section className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Sponsor &amp; team</div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Sponsor</span>
            <span className={styles.kvV}>
              {move.sponsor ? `${move.sponsor.name} · ${formatRole(move.sponsor.role)}` : 'Unassigned'}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Tenant</span>
            <span className={styles.kvV}>{move.tenant.name}</span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Archetype</span>
            <span className={`${styles.kvV} ${styles.kvVMono}`}>{move.archetype}</span>
          </div>
          {move.participants.slice(0, 3).map((participant) => (
            <div className={styles.kvPair} key={participant.personId}>
              <span className={styles.kvK}>{formatRole(participant.role)}</span>
              <span className={styles.kvV}>{participant.name}</span>
            </div>
          ))}
        </section>

        <section className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Value at stake</div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Projected</span>
            <span className={styles.kvV}>
              {move.valueAtStake.projected
                ? `${move.valueAtStake.projected.currency} ${move.valueAtStake.projected.low.toLocaleString()}–${move.valueAtStake.projected.high.toLocaleString()}`
                : 'Not set'}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Range</span>
            <span className={styles.kvV}>
              {move.valueAtStake.projected ? 'projected' : 'pending capture'}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Verified</span>
            <span className={`${styles.kvV} ${move.valueAtStake.verified ? styles.kvVGreen : ''}`}>
              {move.valueAtStake.verified
                ? `${move.valueAtStake.verified.amount.toLocaleString()} (${move.valueAtStake.verified.status})`
                : verifiedFallback(move.currentPhase)}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Activity tab content ──────────────────────────────────────────────────────

function ActivityContent({ move }: { move: StrategicMove }) {
  return (
    <div className={styles.detailBody}>
      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Recent activity</div>
        <div className={styles.timeline}>
          {move.recentActivity.map((activity) => (
            <div className={styles.tlItem} key={`${activity.at}-${activity.action}`}>
              <span className={styles.tlTime}>{formatActivityTime(activity.at)}</span>
              <span className={styles.tlDot} aria-hidden />
              <span className={styles.tlText}>
                <strong>{activity.action}</strong> &middot; {activity.summary}
              </span>
            </div>
          ))}
        </div>
        {move.recentActivity.length >= 3 && (
          <a className={styles.tlMore} href={`/strategic-moves/${move.id}?panel=activity`}>
            View all activity &rarr;
          </a>
        )}
      </section>

      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Evidence from intelligence</div>
        <div className={styles.evidenceList}>
          {move.linkedEvidence.length === 0 ? (
            <div className={styles.evEmpty}>No linked evidence yet.</div>
          ) : (
            move.linkedEvidence.map((evidence) => (
              <a className={styles.evItem} href={evidence.url} key={evidence.id}>
                <span className={styles.evNum}>{evidence.anchor}</span>
                <span className={styles.evText}>{evidence.summary}</span>
                <span className={styles.evLink} aria-hidden>&#8599;</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className={styles.detailSection} data-testid="move-artifact-upload-section">
        <div className={styles.detailSectionTitle}>Attachments</div>
        <MoveArtifactUpload programId={move.id} phase={move.currentPhase ?? 0} />
      </section>
    </div>
  );
}

// ── Documents tab content ─────────────────────────────────────────────────────

function DocumentsContent({ move }: { move: StrategicMove }) {
  return (
    <div style={{ padding: '0 4px' }}>
      <Suspense fallback={
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, color: '#9AA3B2' }}>
          Loading documents…
        </div>
      }>
        <PhaseDocumentsPanel
          moveId={move.id}
          currentPhase={move.currentPhase ?? 1}
          compact
        />
      </Suspense>
    </div>
  );
}

// ── Right pane (workspace) ────────────────────────────────────────────────────

function RightPane({ move, activeTab }: { move: StrategicMove; activeTab: Tab }) {
  const primary = primaryAction(move);
  const secondary = secondaryAction(move);

  return (
    <article className={styles.rightPane}>
      <div className={styles.detailHead}>
        <div className={styles.detailHeadTop}>
          <div className={styles.detailHeadLeft}>
            <div className={styles.detailBreadcrumb}>
              <Link className={styles.detailCrumb} href="/strategic-moves">
                Strategic Moves
              </Link>
              <span aria-hidden>&rsaquo;</span>
              <span>{move.tenant.name}</span>
              <span aria-hidden>&rsaquo;</span>
              <span>{move.displayCode}</span>
            </div>
            <h1 className={styles.detailTitle}>{move.name}</h1>
            <div className={styles.detailId}>
              {move.archetype} &middot; Sponsor: {(move.sponsor?.name ?? 'Unassigned').toUpperCase()}
            </div>
          </div>
          <div className={styles.detailHeadActions}>
            {secondary && (
              <Link className={styles.btnGhost} href={secondary.href}>
                {secondary.label}
              </Link>
            )}
            <Link className={styles.btnPhase} href={primary.href}>
              {primary.label} <span className={styles.btnArrow} aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>
        <PhaseRail current={move.currentPhase} status={move.statusColor} />
      </div>

      <div style={{ paddingLeft: 0, paddingRight: 0 }}>
        <TabBar moveId={move.id} active={activeTab} />
      </div>

      {activeTab === 'overview'  && <OverviewContent move={move} />}
      {activeTab === 'documents' && <DocumentsContent move={move} />}
      {activeTab === 'activity'  && <ActivityContent move={move} />}
    </article>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function StrategicMoveDetailView({ move, activeTab = 'overview' }: Props) {
  return (
    <div className={styles.page}>
      <div
        data-testid="move-detail-splitter-shell"
        style={{
          height: 'calc(100vh - 220px)',
          minHeight: 620,
          display: 'flex',
          gap: 0,
        }}
      >
        <StrategicMoveDetailClient
          move={move}
          workspace={<RightPane move={move} activeTab={activeTab} />}
        />
      </div>
    </div>
  );
}

function formatActivityTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const now = Date.now();
  const diffMs = now - then.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 60) return `${Math.max(1, min)}m ago`;
  const hr = Math.round(diffMs / 3_600_000);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(diffMs / 86_400_000);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  return then.toLocaleDateString();
}
