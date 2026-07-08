// Moves phase workspace — the Stripe-style "get started" task checklist.
// Presentational: renders the deterministic PhaseWorkflow (buildPhaseWorkflow)
// as an ordered checklist with real statuses + one action each. The final
// "advance" task is locked until the prerequisites are done. Optional action
// callbacks let the host wire the buttons to the SAME handlers its own controls
// use (single write path); with no callbacks it renders as a read-only guide.

import * as React from 'react';
import type { PhaseTask, PhaseWorkflow } from '../../../lib/programs/phase-templates/phase-workflow';
import { Card } from './primitives';

const ICON: Record<PhaseTask['status'], string> = {
  done: '✓',
  active: '→',
  todo: '',
  locked: '🔒',
};

export function PhaseTaskChecklist({
  phaseLabel,
  workflow,
  onAction,
}: {
  phaseLabel: string;
  workflow: PhaseWorkflow;
  /** Wire a task's single action to the host's own handler. Optional. */
  onAction?: (taskId: PhaseTask['id']) => void;
}): React.ReactElement {
  const pct = workflow.totalCount > 0 ? Math.round((workflow.doneCount / workflow.totalCount) * 100) : 0;
  return (
    <Card kicker="Complete this phase" title="What to do next" note={phaseLabel}>
      <div className="pw-prog">
        <div className="pw-prog-track">
          <div className="pw-prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pw-prog-label">
          {workflow.doneCount} of {workflow.totalCount} done
        </span>
      </div>
      <div className="pw-tasks">
        {workflow.tasks.map((t, i) => {
          const clickable = t.status !== 'locked' && !!onAction;
          return (
            <div className={`pw-task ${t.status}`} key={t.id}>
              <span className="pw-task-ico">{ICON[t.status] || i + 1}</span>
              <div className="pw-task-body">
                <span className="pw-task-t">{t.title}</span>
                <span className="pw-task-d">{t.detail}</span>
              </div>
              <div className="pw-task-side">
                <span className="pw-task-prog">{t.progressLabel}</span>
                {clickable ? (
                  <button type="button" className="pw-task-btn" onClick={() => onAction(t.id)}>
                    {t.actionLabel}
                  </button>
                ) : (
                  <span className="pw-task-hint">{t.actionLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
