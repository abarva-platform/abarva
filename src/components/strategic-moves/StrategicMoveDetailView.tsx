import Link from 'next/link';
import styles from './StrategicMoves.module.css';
import type { StrategicMove } from '@/lib/programs/types.ui';

interface Props {
  move: StrategicMove;
}

function actionLabel(statusKey: string, phaseLabel: string): string {
  if (statusKey === 'gate_blocked') return 'Open gate review';
  if (statusKey === 'awaiting_decision') return 'Prepare decision packet';
  if (statusKey === 'on_track') return `Continue ${phaseLabel}`;
  if (statusKey === 'validated') return 'Review verification';
  return 'Resume move';
}

export function StrategicMoveDetailView({ move }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Strategic Move</div>
          <h1 className={styles.title}>{move.name}</h1>
        </div>
        <Link className={styles.newMove} href="/strategic-moves/new">
          + New Move
        </Link>
      </div>

      <section className={styles.detailShell}>
        <aside className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.eyebrow}>Nexus</div>
            <div>Move Orchestrator</div>
          </div>
          <div className={styles.chatBody}>
            <div className={styles.bubbleNexus}>
              I am scoped to <strong>{move.displayCode}</strong>. You are in {move.phaseLabel}. Current status: {move.status.text.toLowerCase()}.
            </div>
            <div className={styles.bubbleNexus}>
              Next best action: {actionLabel(move.status.key, move.phaseLabel)}.
            </div>
            <div className={styles.bubbleUser}>Show me what is still missing for this gate.</div>
            <div className={styles.bubbleNexus}>
              I mapped the criteria on the right rail and linked the latest evidence so you can review quickly.
            </div>
          </div>
        </aside>

        <article className={styles.rightPane}>
          <div className={styles.statusBanner}>
            <div className={styles.eyebrow}>{move.status.text}</div>
            <div>{move.status.description}</div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <button className={styles.primaryAction} type="button">
              {actionLabel(move.status.key, move.phaseLabel)} <span>→</span>
            </button>
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
                    {participant.name} · {participant.role}
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

