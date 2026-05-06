'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { COST_ITEMS, COST_AGENT_VOICE, type CostItem } from '@/lib/tower/shell-lens-fixture';

const VARIANCE_STYLES: Record<CostItem['variance'], { bg: string; color: string }> = {
  over: { bg: SHELL.GRAY_BG, color: SHELL.RUST_TEXT },
  under: { bg: SHELL.MINT_BG, color: SHELL.MINT_TEXT },
  on_track: { bg: SHELL.PAPER_DEEP, color: SHELL.INK_SOFT },
};

function VarianceBadge({ item }: { item: CostItem }) {
  const s = VARIANCE_STYLES[item.variance];
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 8,
        background: s.bg,
        color: s.color,
        lineHeight: 1.4,
        fontWeight: 600,
      }}
    >
      {item.varianceLabel}
    </span>
  );
}

function CostCard({ item }: { item: CostItem }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            color: SHELL.INK_MUTED,
          }}
        >
          {item.displayId}
        </span>
        <div style={{ flex: 1 }} />
        <VarianceBadge item={item} />
      </div>

      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK,
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        {item.category}
      </div>

      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          marginBottom: 12,
        }}
      >
        {item.program}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 17,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {item.monthlyRunRate}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Run rate
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              lineHeight: 1.3,
            }}
          >
            {item.ytdSpend}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            YTD spend
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              lineHeight: 1.3,
            }}
          >
            {item.budget}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Budget
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.4,
          paddingTop: 8,
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
        }}
      >
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, letterSpacing: '0.06em', marginRight: 6 }}>
          DRIVER
        </span>
        {item.driver}
      </div>
    </div>
  );
}

export function CostLensPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Cost Lens',
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={COST_AGENT_VOICE.quote}
        agentContext={COST_AGENT_VOICE.agentContext}
        actions={COST_AGENT_VOICE.actions}
        surface="tower"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        <a
          href="/tower"
          style={{
            display: 'inline-block',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            marginBottom: 12,
            letterSpacing: '0.06em',
          }}
        >
          ← Control Tower
        </a>

        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 400,
            color: SHELL.INK,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          Cost Lens
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '0 0 20px 0',
          }}
        >
          AI cloud spend, run rate, and budget variance across active programs
        </p>

        {COST_ITEMS.map((item) => (
          <CostCard key={item.id} item={item} />
        ))}

        <div
          style={{
            background: SHELL.PAPER_SOFT,
            padding: '12px 20px',
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            Cost data refreshes daily from cloud billing exports. Variance highlights run-rate-vs-budget gaps where rate-card negotiation or pattern transfer can recover material spend.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
