import { SHELL } from '@/lib/shell/shell-tokens';
import type { WorkshopNotesActionPlanView } from '@/lib/programs/workshop-notes-action-plan-view';

export interface WorkshopNotesActionPlanPanelProps {
  view: WorkshopNotesActionPlanView;
}

export function WorkshopNotesActionPlanPanel({
  view,
}: WorkshopNotesActionPlanPanelProps) {
  return (
    <section
      data-testid="workshop-notes-plan-panel"
      style={{
        marginTop: 14,
        marginBottom: 16,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        background: SHELL.PAPER,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        {view.headline}
      </div>
      <div
        style={{
          marginTop: 6,
          marginBottom: 10,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        {view.contextLine}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Lane
          testId="workshop-notes-plan-known"
          title="Known"
          accent={SHELL.MINT_BG}
          items={view.known}
        />
        <Lane
          testId="workshop-notes-plan-missing"
          title="Missing"
          accent={SHELL.PEACH_BG}
          items={view.missing}
        />
        <Lane
          testId="workshop-notes-plan-blocked"
          title="Blocked"
          accent={SHELL.RUST_BG}
          items={view.blocked}
        />
      </div>

      <div
        data-testid="workshop-notes-plan-next-action"
        style={{
          padding: '10px 12px',
          borderRadius: 7,
          border: `1px solid ${SHELL.CARD_LINE}`,
          background: SHELL.PAPER_DEEP,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 4,
          }}
        >
          Next action
        </div>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, lineHeight: 1.55 }}>
          {view.nextAction}
        </div>
        <div style={{ marginTop: 6, fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
          Deliverable lane: {view.deliverableNextAction}
        </div>
      </div>

      <p
        data-testid="workshop-notes-plan-disclaimer"
        data-honest-disclaimer="workshop-notes-plan"
        style={{
          margin: '10px 0 0',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          lineHeight: 1.45,
          color: SHELL.INK_MUTED,
        }}
      >
        {view.honestDisclaimer}
      </p>
    </section>
  );
}

interface LaneProps {
  testId: string;
  title: string;
  accent: string;
  items: readonly string[];
}

function Lane({ testId, title, accent, items }: LaneProps) {
  return (
    <div
      data-testid={testId}
      style={{
        borderRadius: 7,
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: accent,
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.45 }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
