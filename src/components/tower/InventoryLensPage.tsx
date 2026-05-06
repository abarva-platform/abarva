'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { INVENTORY_ITEMS, INVENTORY_AGENT_VOICE, type InventoryItem } from '@/lib/tower/shell-lens-fixture';

const CATEGORY_LABELS: Record<InventoryItem['category'], string> = {
  use_case: 'Use case',
  program: 'Program',
  vendor_stack: 'Vendor stack',
  integration: 'Integration',
};

const STATUS_STYLES: Record<InventoryItem['status'], { bg: string; color: string; label: string }> = {
  production: { bg: SHELL.MINT_BG, color: SHELL.MINT_TEXT, label: 'Production' },
  pilot: { bg: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT, label: 'Pilot' },
  design: { bg: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT, label: 'Design' },
  discovery: { bg: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT, label: 'Discovery' },
  shadow: { bg: SHELL.GRAY_BG, color: SHELL.RUST_TEXT, label: 'Shadow / unmanaged' },
};

function StatusBadge({ status }: { status: InventoryItem['status'] }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 8,
        background: s.bg,
        color: s.color,
        lineHeight: 1.4,
      }}
    >
      {s.label}
    </span>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
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
          {CATEGORY_LABELS[item.category]}
        </span>
        <StatusBadge status={item.status} />
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          {item.programs} {item.programs === 1 ? 'program' : 'programs'}
        </span>
      </div>

      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK,
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.4,
          marginBottom: 8,
        }}
      >
        {item.notes}
      </div>

      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.06em',
          color: SHELL.INK_MUTED,
        }}
      >
        Owner · {item.owner}
      </div>
    </div>
  );
}

export function InventoryLensPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Inventory Lens',
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={INVENTORY_AGENT_VOICE.quote}
        agentContext={INVENTORY_AGENT_VOICE.agentContext}
        actions={INVENTORY_AGENT_VOICE.actions}
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
          Inventory Lens
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '0 0 20px 0',
          }}
        >
          AI use cases, programs, vendor stack, and integrations across the portfolio
        </p>

        {INVENTORY_ITEMS.map((item) => (
          <InventoryCard key={item.id} item={item} />
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
            Inventory updates daily. Shadow IT items are surfaced via license discovery and require governance review before becoming first-class.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
