'use client';

import { useState, type CSSProperties } from 'react';
import { ANALYTICS, taskVerb } from './analytics-tokens';
import type {
  StageTaskView,
  TaskFileView,
  TaskReviewRowView,
  TaskState,
  TaskTemplateView,
  TaskType,
} from './view-model';

interface TaskChecklistProps {
  tasks: readonly StageTaskView[];
}

const TYPE_LABEL: Record<TaskType, string> = {
  provide: 'Provide',
  confirm: 'Confirm',
  decide: 'Decide',
};

/**
 * Beat 2 — "Your inputs & feedback." The stage task checklist. Every task is
 * typed provide / confirm / decide, carries its "where this comes from:
 * owner · source" line, a concrete state, and its complete affordance. One row
 * per task; the form reveals on click (density contract: "every click is a
 * decision").
 */
export function TaskChecklist({ tasks }: TaskChecklistProps) {
  // Track local "just completed" so the demo feels responsive without a backend.
  const [openId, setOpenId] = useState<string | null>(() => {
    const firstOpen = tasks.find((t) => t.state === 'todo');
    return firstOpen?.id ?? null;
  });
  const [locallyDone, setLocallyDone] = useState<ReadonlySet<string>>(new Set());

  const done = tasks.filter(
    (t) => t.state === 'done' || locallyDone.has(t.id),
  ).length;

  return (
    <div data-testid="task-checklist">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          margin: '0 0 10px 2px',
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: ANALYTICS.FAINT,
            fontWeight: 600,
          }}
        >
          Your inputs &amp; feedback
        </span>
        <span style={{ fontSize: 12, color: ANALYTICS.MUTED, fontWeight: 600 }}>
          {done} / {tasks.length} complete
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task) => {
          const isDone = task.state === 'done' || locallyDone.has(task.id);
          const isOpen = openId === task.id;
          return (
            <TaskRow
              key={task.id}
              task={task}
              isDone={isDone}
              isOpen={isOpen}
              onToggle={() => setOpenId(isOpen ? null : task.id)}
              onComplete={() =>
                setLocallyDone((prev) => new Set(prev).add(task.id))
              }
            />
          );
        })}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: StageTaskView;
  isDone: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

function TaskRow({ task, isDone, isOpen, onToggle, onComplete }: TaskRowProps) {
  const effectiveState: TaskState = isDone ? 'done' : 'todo';
  const rowStyle: CSSProperties = {
    border: `1px solid ${isOpen ? ANALYTICS.LINE_STRONG : ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS,
    background: ANALYTICS.CARD,
    overflow: 'hidden',
  };

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 13,
          alignItems: 'center',
          width: '100%',
          padding: '13px 15px',
          border: 'none',
          background: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: ANALYTICS.SANS,
        }}
      >
        <StatusDot done={isDone} type={task.type} />
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 14.5,
              fontWeight: 600,
              color: ANALYTICS.INK,
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 12,
              color: ANALYTICS.MUTED,
              marginTop: 3,
            }}
          >
            {task.subtitle}
          </span>
        </span>
        <TypeTag type={task.type} done={isDone} />
      </button>

      {isOpen ? (
        <div
          style={{
            padding: '0 15px 15px 15px',
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: ANALYTICS.INK_2,
              lineHeight: 1.55,
              margin: '13px 0',
            }}
          >
            {task.guide}
          </p>

          {task.template ? <TemplateChip template={task.template} /> : null}
          {task.rows ? <ReviewRows rows={task.rows} /> : null}
          {task.file ? (
            <FileChip file={task.file} />
          ) : task.type === 'provide' && !task.template ? (
            <DropZone signed={/letter|commit/i.test(task.title)} />
          ) : null}

          {task.provenance ? (
            <div
              style={{
                fontSize: 12,
                color: ANALYTICS.MUTED,
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              Where this comes from:{' '}
              <b style={{ color: ANALYTICS.INK_2 }}>{task.provenance.owner}</b> ·{' '}
              {task.provenance.source}
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            {effectiveState === 'done' ? (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: ANALYTICS.GREEN,
                }}
              >
                ✓ Done
              </span>
            ) : (
              <button
                type="button"
                onClick={onComplete}
                style={{
                  border: 'none',
                  borderRadius: ANALYTICS.RADIUS_SM,
                  background: ANALYTICS.INK,
                  color: '#fff',
                  fontFamily: ANALYTICS.SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '9px 16px',
                  cursor: 'pointer',
                }}
              >
                {task.cta}
              </button>
            )}
            <span
              style={{
                marginLeft: 12,
                fontSize: 11.5,
                color: ANALYTICS.FAINT,
              }}
            >
              {taskVerb(task.type)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusDot({ done, type }: { done: boolean; type: TaskType }) {
  if (done) {
    return (
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: ANALYTICS.GREEN,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✓
      </span>
    );
  }
  const hue =
    type === 'provide'
      ? ANALYTICS.BLUE
      : type === 'confirm'
        ? ANALYTICS.GREEN
        : ANALYTICS.AMBER;
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: `1.5px solid ${hue}`,
        background: ANALYTICS.CARD,
        flexShrink: 0,
      }}
    />
  );
}

function TypeTag({ type, done }: { type: TaskType; done: boolean }) {
  return (
    <span
      style={{
        fontFamily: ANALYTICS.MONO,
        fontSize: 9,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 5,
        background: done ? 'rgba(10,10,11,0.05)' : 'rgba(10,10,11,0.06)',
        color: done ? ANALYTICS.FAINT : ANALYTICS.MUTED,
        whiteSpace: 'nowrap',
      }}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}

function ReviewRows({ rows }: { rows: readonly TaskReviewRowView[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        overflow: 'hidden',
      }}
    >
      {rows.map((row, i) => (
        <div
          key={`${row.key}-${i}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '9px 12px',
            borderTop: i === 0 ? 'none' : `1px solid ${ANALYTICS.LINE_SOFT}`,
            fontSize: 13,
          }}
        >
          <span style={{ color: ANALYTICS.MUTED }}>{row.key}</span>
          <span
            style={{
              fontWeight: 600,
              color: row.flag ? ANALYTICS.AMBER_TEXT : ANALYTICS.INK,
              textAlign: 'right',
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FileChip({ file }: { file: TaskFileView }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        background: ANALYTICS.SOFT,
      }}
    >
      <span
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 700,
          padding: '6px 8px',
          borderRadius: 5,
          background: ANALYTICS.CARD,
          border: `1px solid ${ANALYTICS.LINE}`,
          color: ANALYTICS.MUTED,
        }}
      >
        {file.format}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: ANALYTICS.INK }}>
          {file.name}
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: ANALYTICS.MUTED }}>
          {file.meta}
        </span>
      </span>
    </div>
  );
}

function TemplateChip({ template }: { template: TaskTemplateView }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        background: ANALYTICS.CARD,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 700,
          padding: '6px 8px',
          borderRadius: 5,
          background: ANALYTICS.BLUE_TINT,
          color: ANALYTICS.BLUE,
        }}
      >
        {template.format}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: ANALYTICS.INK }}>
          {template.name}
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: ANALYTICS.MUTED }}>
          {template.meta}
        </span>
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: ANALYTICS.BLUE }}>
        Download blank →
      </span>
    </div>
  );
}

function DropZone({ signed }: { signed: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '15px 16px',
        border: `1.5px dashed ${ANALYTICS.LINE_STRONG}`,
        borderRadius: ANALYTICS.RADIUS,
        background: ANALYTICS.SOFT,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: ANALYTICS.CARD,
          border: `1px solid ${ANALYTICS.LINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: ANALYTICS.MUTED,
          flexShrink: 0,
        }}
      >
        ↑
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: ANALYTICS.INK }}>
          Drop a file here, or browse
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: ANALYTICS.MUTED }}>
          {signed ? 'PDF · signed document' : 'CSV or XLSX · up to 200 MB'}
        </span>
      </span>
    </div>
  );
}
