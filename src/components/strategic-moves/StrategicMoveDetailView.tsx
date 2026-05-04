import Link from 'next/link';
import styles from './StrategicMoves.module.css';
import type { StrategicMove } from '@/lib/programs/types.ui';

interface Props {
  move: StrategicMove;
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function actionLabel(statusKey: string, phaseLabel: string): string {
  if (statusKey === 'gate_blocked') return 'Open gate review';
  if (statusKey === 'awaiting_decision') return 'Prepare decision packet';
  if (statusKey === 'on_track') return `Continue ${phaseLabel}`;
  if (statusKey === 'validated') return 'Review verification';
  return 'Resume move';
}

function actionHref(move: StrategicMove): string {
  if (move.status.key === 'gate_blocked') return `/strategic-moves/${move.id}?panel=gate`;
  if (move.status.key === 'awaiting_decision') return '/admin/programs/approvals';
  if (move.status.key === 'validated') return `/tower?move=${move.id}`;
  return `/strategic-moves/${move.id}?phase=${move.currentPhase}`;
}

export function StrategicMoveDetailView({ move }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link className={styles.backLink} href="/strategic-moves">
          ← Back to Strategic Moves
        </Link>
      </div>

      <div className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Strategic Move</div>
          <h1 className={styles.title}>{move.name}</h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Link className={styles.backLink} href="/strategic-moves">
            ← Back
          </Link>
          <Link className={styles.newMove} href="/strategic-moves/new">
            + New Move
          </Link>
        </div>
      </div>

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
          <div className={styles.detailHeadBlock}>
            <div className={styles.detailBreadcrumb}>
              <span>Strategic Moves</span>
              <span>·</span>
              <span>{move.tenant.name}</span>
              <span>·</span>
              <span>{move.displayCode}</span>
            </div>
            <div className={styles.detailMetaLine}>
              {move.archetype} · Sponsor: {move.sponsor?.name ?? 'Unassigned'}
            </div>
          </div>

          <div className={styles.statusBanner}>
            <div className={styles.eyebrow}>{move.status.text}</div>
            <div>{move.status.description}</div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <Link className={styles.primaryActionLink} href={actionHref(move)}>
              {actionLabel(move.status.key, move.phaseLabel)} <span>→</span>
            </Link>
          </div>

          <div className={styles.section} style={{ marginBottom: 10 }}>
            <div className={styles.sectionTitle}>Phase Rail</div>
            <div className={styles.phaseRail}>
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={`phase-dot-${index}`}
                  className={`${styles.phaseDot} ${
                    index < move.currentPhase
                      ? styles.phaseDotDone
                      : index === move.currentPhase
                        ? styles.phaseDotCurrent
                        : ''
                  }`}
                  title={`P${index}`}
                />
              ))}
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
                    <strong>{evidence.anchor}</strong> · {evidence.summary}
                  </a>
                ))
              )}
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}
