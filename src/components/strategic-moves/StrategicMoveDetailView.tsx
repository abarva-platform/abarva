import Link from 'next/link';
import styles from './StrategicMoves.module.css';
import { PhaseRail } from './PhaseRail';
import type { StrategicMove } from '@/lib/programs/types.ui';

interface Props {
  move: StrategicMove;
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function verifiedFallback(phase: number): string {
  if (phase >= 5) return '\u2014 tracked (pending)';
  return '\u2014 pending verification';
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

export function StrategicMoveDetailView({ move }: Props) {
  const primary = primaryAction(move);
  const secondary = secondaryAction(move);
  return (
    <div className={styles.page}>
      <section className={styles.detailShell}>
        <aside className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.agentRow}>
              <div className={styles.agentAvatar} aria-hidden>✦</div>
              <div>
                <div className={styles.agentName}>Nexus</div>
                <div className={styles.agentStatus}>
                  <span className={styles.agentStatusDot} aria-hidden />
                  SCOPED TO {move.displayCode}
                </div>
              </div>
            </div>
            <div className={styles.chatSubhead}>
              Ask anything about this move. I&rsquo;ll work in the right pane.
            </div>
          </div>
          <div className={styles.chatThread}>
            <div className={styles.bubbleNexus}>
              I&rsquo;m scoped to <em>{move.displayCode}</em> &mdash; {move.name}. Currently in{' '}
              <em>{move.phaseLabel}</em>. Status: <em>{move.status.text.toLowerCase()}</em>.
            </div>
            <div className={styles.bubbleNexus}>
              {move.status.description}. Want me to walk through what&rsquo;s needed to advance?
            </div>
            <div className={styles.bubbleUser}>Show me what is still missing for this gate.</div>
            <div className={styles.bubbleNexus}>
              I mapped the criteria on the right rail and linked the latest evidence so you can review quickly.
            </div>
          </div>
          <div className={styles.chatInput}>
            <div className={styles.suggestedPrompts}>
              <button className={styles.promptChip} type="button">What&rsquo;s blocking the gate?</button>
            </div>
            <div className={styles.inputRow}>
              <input type="text" placeholder={`Ask Nexus about ${move.displayCode}\u2026`} />
              <button className={styles.sendBtn} type="button" aria-label="Send">&#8593;</button>
            </div>
          </div>
        </aside>

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
                {secondary ? (
                  <Link className={styles.btnGhost} href={secondary.href}>
                    {secondary.label}
                  </Link>
                ) : null}
                <Link className={styles.btnPhase} href={primary.href}>
                  {primary.label} <span className={styles.btnArrow} aria-hidden>&rarr;</span>
                </Link>
              </div>
            </div>
            <PhaseRail current={move.currentPhase} status={move.statusColor} />
          </div>

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
                      {criterion.completed ? '\u2713' : ''}
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
                      ? `${move.valueAtStake.projected.currency} ${move.valueAtStake.projected.low.toLocaleString()}\u2013${move.valueAtStake.projected.high.toLocaleString()}`
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

            <section className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>Recent activity</div>
              <div className={styles.timeline}>
                {move.recentActivity.slice(0, 8).map((activity) => (
                  <div className={styles.tlItem} key={`${activity.at}-${activity.action}`}>
                    <span className={styles.tlTime}>{formatActivityTime(activity.at)}</span>
                    <span className={styles.tlDot} aria-hidden />
                    <span className={styles.tlText}>
                      <strong>{activity.action}</strong> &middot; {activity.summary}
                    </span>
                  </div>
                ))}
              </div>
              {move.recentActivity.length >= 3 ? (
                <a className={styles.tlMore} href={`/strategic-moves/${move.id}?panel=activity`}>
                  View all activity &rarr;
                </a>
              ) : null}
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
          </div>
        </article>
      </section>
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
