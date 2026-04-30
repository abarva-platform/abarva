'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SourcePortfolioReactivePanel } from '@/components/source/SourcePortfolioReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';

interface SourcePortfolioAgentCanvasProps {
  quote: string;
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  artifacts: Artifact[];
  onArtifact: (artifact: Artifact) => void;
}

const NEXUS_AGENT = {
  initials: 'Nx',
  name: 'Nexus',
  role: 'Source Orchestrator',
} as const;

export function SourcePortfolioAgentCanvas({
  quote,
  events,
  activeStage,
  activeStatus,
  artifacts,
  onArtifact,
}: SourcePortfolioAgentCanvasProps) {
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const blockedEvents = events.filter((event) => event.isAtRisk || event.blocker).length;
  const valueAtStake = events.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);

  return (
    <section
      data-testid="source-portfolio-agent-canvas"
      aria-label="Agent-led Source command workspace"
      style={AGENT_CANVAS}
    >
      <div style={CHAT_COLUMN}>
        <AtlasDrawer
          embedded
          isOpen={true}
          onClose={() => {
            // Embedded Source command workspace stays visible; it is not a drawer overlay.
          }}
          agent={NEXUS_AGENT}
          quote={quote}
          surface="/source"
          onArtifact={onArtifact}
          emptyState={<SourcePortfolioPromptDeck events={events} />}
        />
      </div>

      <aside aria-label="Source reasoning and evidence pane" style={REASONING_COLUMN}>
        <section style={REASONING_INTRO_CARD}>
          <div style={EYEBROW}>Sentinel source reasoning - live</div>
          <p style={INTRO_COPY}>
            As the conversation runs, this pane materializes intake progress, evidence cautions, gate blockers,
            commercial traps, and executive implications. It starts with the static Source doctrine so the user is
            never staring at an empty rail.
          </p>
          <div style={METRIC_GRID}>
            <ReasoningMetric label="Active" value={String(activeEvents)} />
            <ReasoningMetric label="Blocked" value={String(blockedEvents)} />
            <ReasoningMetric label="Value" value={formatUsd(valueAtStake)} />
          </div>
        </section>

        <SourcePortfolioReactivePanel
          events={events}
          activeStage={activeStage}
          activeStatus={activeStatus}
          artifacts={artifacts}
        />
      </aside>
    </section>
  );
}

function SourcePortfolioPromptDeck({ events }: { events: SourcingEventSummary[] }) {
  const amsEvent = events.find((event) =>
    `${event.name} ${event.archetype}`.toLowerCase().includes('ams')
    || `${event.name} ${event.archetype}`.toLowerCase().includes('managed services')
    || `${event.name}`.toLowerCase().includes('application')
  );

  return (
    <div style={PROMPT_DECK}>
      <div style={DARK_CARD}>
        <div style={DARK_EYEBROW}>Nexus intake posture</div>
        <p style={DARK_LEAD}>
          I can help stand up a technology sourcing event or work an existing one. For a new event, I only need the
          first five facts: trigger, decision owner, scope boundary, baseline evidence, and stop/approval condition.
        </p>
        <Link href="/source/new" style={DARK_ACTION}>
          Create IT sourcing event
        </Link>
      </div>

      <div style={DARK_GRID}>
        <PromptCard
          label="1. Register event"
          body="Capture trigger, named decision owner, scope boundary, baseline evidence, and stop/approval condition."
        />
        <PromptCard
          label="2. Attach evidence"
          body="Use the paperclip lane for inventories, contracts, pricing files, meeting notes, and vendor responses; Sentinel should not cite unparsed files."
        />
        <PromptCard
          label="3. Generate artifacts"
          body="Create the sourcing strategy memo, scope document, RFP package, pricing workbook, BAFO pack, and executive decision brief at the right gate."
        />
        <PromptCard
          label="4. Run sessions"
          body="Prepare sponsor 1:1s, scope workshops, vendor Q&A, evaluation meetings, BAFO prep, and selection reviews with expected outputs."
        />
        <PromptCard
          label="5. Sync outcomes"
          body="After each meeting or workshop, ingest notes, extract decisions/actions, update gate readiness, and brief the team on the next step."
        />
        <PromptCard
          label="AMS starting kit"
          body="For AMS, start with run-rate, app/service inventory, incumbents, renewal dates, service pain, tower boundaries, and transition constraints."
        />
        <PromptCard
          label="Open seeded event"
          body={
            amsEvent
              ? `${amsEvent.name} is available at ${amsEvent.currentStageLabel}.`
              : 'No AMS seeded event is visible in this filter; reset filters or start a new intake.'
          }
        />
      </div>
    </div>
  );
}

function PromptCard({ label, body }: { label: string; body: string }) {
  return (
    <div style={DARK_PROMPT_CARD}>
      <div style={DARK_EYEBROW}>{label}</div>
      <div style={DARK_PROMPT_COPY}>{body}</div>
    </div>
  );
}

function ReasoningMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC_CARD}>
      <div style={METRIC_LABEL}>{label}</div>
      <div style={METRIC_VALUE}>{value}</div>
    </div>
  );
}

const AGENT_CANVAS: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) minmax(min(100%, 360px), 1fr)',
  gap: 16,
  alignItems: 'stretch',
  minHeight: 520,
  marginBottom: 20,
};

const CHAT_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 520,
  display: 'grid',
};

const REASONING_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const REASONING_INTRO_CARD: CSSProperties = {
  border: '1px dashed rgba(12, 26, 58, 0.18)',
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: '14px 16px',
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const INTRO_COPY: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
};

const METRIC_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  marginTop: 12,
};

const METRIC_CARD: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: '8px 9px',
};

const METRIC_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const METRIC_VALUE: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SERIF,
  fontSize: 19,
  lineHeight: 1,
  color: SHELL.INK,
  fontWeight: 800,
};

const PROMPT_DECK: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 10,
  padding: '0 0 8px',
};

const DARK_CARD: CSSProperties = {
  border: '1px solid rgba(250,247,241,0.12)',
  borderRadius: 12,
  background: 'rgba(250,247,241,0.055)',
  padding: '11px 12px',
};

const DARK_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(250,247,241,0.48)',
  fontWeight: 700,
};

const DARK_LEAD: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: SHELL.SERIF,
  fontSize: 14.5,
  lineHeight: 1.36,
  color: 'rgba(250,247,241,0.88)',
};

const DARK_ACTION: CSSProperties = {
  display: 'inline-flex',
  marginTop: 10,
  borderRadius: 999,
  border: '1px solid rgba(250,247,241,0.22)',
  background: 'rgba(250,247,241,0.08)',
  color: 'rgba(250,247,241,0.92)',
  padding: '7px 10px',
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
};

const DARK_GRID: CSSProperties = {
  display: 'grid',
  gap: 7,
};

const DARK_PROMPT_CARD: CSSProperties = {
  border: '1px solid rgba(250,247,241,0.10)',
  borderRadius: 10,
  padding: '8px 10px',
  background: 'rgba(250,247,241,0.035)',
};

const DARK_PROMPT_COPY: CSSProperties = {
  marginTop: 3,
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.34,
  color: 'rgba(250,247,241,0.78)',
};
