import { AgentColumn } from '@/components/shell/AgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SHELL } from '@/lib/shell/shell-tokens';

export function SourceEmptyState() {
  return (
    <>
      <AgentColumn
        agent={{ initials: 'Se', name: 'Sentinel', role: 'Source Orchestrator' }}
        quote="No source events have been created yet for this tenant. Start by creating your first sourcing event."
        agentContext="Sentinel · Source · No events"
        actions={[
          { letter: 'A', text: 'Create first event', detail: 'Open the intake wizard to originate a new sourcing event' },
          { letter: 'B', text: 'Review setup connectors', detail: 'Ensure data connectors are configured before sourcing' },
          { letter: 'C', text: 'View portfolio guide', detail: 'How to use the 10-stage tracker for sourcing events' },
        ]}
        surface="source"
      />
      <SourceWorkingPane>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              color: SHELL.INK,
              fontWeight: 'normal',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            No sourcing events yet
          </h2>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_SOFT,
              margin: 0,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Create your first sourcing event to begin tracking vendor selection, BAFO, and commercial readiness.
          </p>
          <a
            href="/source/new"
            style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '10px 20px',
              backgroundColor: SHELL.PAPER_DEEP,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              color: SHELL.INK,
              textDecoration: 'none',
              fontFamily: SHELL.MONO,
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Originate new event
          </a>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginTop: 4,
            }}
          >
            Sentinel monitors events once created
          </span>
        </div>
      </SourceWorkingPane>
    </>
  );
}
