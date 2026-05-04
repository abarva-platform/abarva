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

function primaryAction(move: StrategicMove): { label: string; href: string } {
  const { status, currentPhase, phaseLabel, id } = move;
  if (status.key === 'gate_blocked') return { label: 'Open gate review', href: `/strategic-moves/${id}?panel=gate` };
  if (status.key === 'awaiting_decision') return { label: 'Resolve decision', href: '/admin/programs/approvals' };
  if (status.key === 'validated') return { label: 'Review verification', href: `/tower?move=${id}` };
  return { label: `Continue ${phaseLabel}`, href: `/strategic-moves/${id}?phase=${currentPhase}` };
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
            <div className={styles.suggestedLabel}>&#8627; Suggested questions</div>
            <div className={styles.suggestedPrompts}>
              <button className={styles.promptChip} type="button">What&rsquo;s blocking the gate?</button>
              <button className={styles.promptChip} type="button">Show me the evidence trail</button>
              <button className={styles.promptChip} type="button">Who needs to weigh in next?</button>
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
            <PhaseRail current={move.currentPhase} totalPhases={8} status={move.statusColor} />
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

          <div className={styles.twoCol} style={{ marginBottom: 10 }}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Sponsor & Team</div>
              <div className={styles.rowList}>
                <div className={styles.rowItem}>
                  <strong>Sponsor:</strong> {move.sponsor ? `${move.sponsor.name} · ${move.sponsor.role}` : 'Unassigned'}
                </div>
                {move.participants.slice(0, 4).map((participant) => (
                  <div className={styles.rowItem} key={participant.personId}>
                    {participant.name} · {formatRole(participant.role)}
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Value at Stake</div>
              <div className={styles.rowList}>
                <div className={styles.rowItem}>
                  Projected:{' '}
                  {move.valueAtStake.projected
                    ? `${move.valueAtStake.projected.currency} ${move.valueAtStake.projected.low.toLocaleString()}–${move.valueAtStake.projected.high.toLocaleString()}`
                    : 'Not set'}
                </div>
                <div className={styles.rowItem}>
                  Verified:{' '}
                  {move.valueAtStake.verified
                    ? `${move.valueAtStake.verified.amount.toLocaleString()} (${move.valueAtStake.verified.status})`
                    : 'Pending'}
                </div>
              </div>
            </section>
          </div>

          <section className={styles.section} style={{ marginBottom: 10 }}>
            <div className={styles.sectionTitle}>Deliverables</div>
            <div className={styles.rowList}>
              {move.deliverables.length === 0 ? (
                <div className={styles.rowItem}>No deliverables captured yet.</div>
              ) : (
                move.deliverables.slice(0, 3).map((deliverable) => (
                  <details className={styles.rowItem} key={deliverable.id}>
                    <summary className={styles.deliverableSummary}>
                      <span>
                        <strong>{deliverable.title}</strong>
                      </span>
                      <span className={styles.deliverableStatus}>{deliverable.status}</span>
                    </summary>
                    <p className={styles.deliverablePreview}>{deliverable.preview}</p>
                    <a className={styles.deliverableLink} href={deliverable.url} target="_blank" rel="noreferrer">
                      Open module state →
                    </a>
                  </details>
                ))
              )}
              {move.deliverables.length > 3 ? (
                <div className={styles.rowItem}>
                  Showing 3 of {move.deliverables.length} deliverables.
                </div>
              ) : null}
            </div>
          </section>

          <section className={styles.section} style={{ marginBottom: 10 }}>
            <div className={styles.sectionTitle}>{move.phaseLabel} · Gate Criteria</div>
            <div className={styles.rowList}>
              {move.gateCriteria.map((criterion) => (
                <div className={styles.rowItem} key={criterion.id}>
                  {criterion.completed ? '●' : '○'} {criterion.label}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} style={{ marginBottom: 10 }}>
            <div className={styles.sectionTitle}>Recent Activity</div>
            <div className={styles.rowList}>
              {move.recentActivity.slice(0, 8).map((activity) => (
                <div className={styles.rowItem} key={`${activity.at}-${activity.action}`}>
                  <strong>{activity.action}</strong> · {activity.summary}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Linked Evidence</div>
            <div className={styles.rowList}>
              {move.linkedEvidence.length === 0 ? (
                <div className={styles.rowItem}>No linked evidence yet.</div>
              ) : (
                move.linkedEvidence.map((evidence) => (
                  <a
                    className={styles.rowItem}
                    href={evidence.url}
                    key={evidence.id}
                  >
                    <strong>{evidence.anchor}</strong> &middot; {evidence.summary}
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
