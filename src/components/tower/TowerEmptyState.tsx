'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';

// ---------------------------------------------------------------------------
// Step card
// ---------------------------------------------------------------------------

function SetupStep({ number, title, description, href, cta }: {
  number: number; title: string; description: string; href: string; cta: string;
}) {
  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '18px 22px', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: SHELL.INK, color: SHELL.PAPER,
        fontFamily: SHELL.MONO, fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 700, color: SHELL.INK, marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, marginBottom: 10, lineHeight: 1.55 }}>{description}</div>
        <Link
          href={href}
          style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 600, color: SHELL.INK, background: SHELL.GRAY_BG, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 6, padding: '5px 14px', textDecoration: 'none', display: 'inline-block' }}
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main empty state
// ---------------------------------------------------------------------------

export function TowerEmptyState() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'AI Control Tower' }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote="No AI programs in the portfolio yet. To start tracking ROI, add your first vendor-backed AI program. I'll begin monitoring spend, adoption, and value capture as soon as the first program is logged."
        agentContext="Nexus · Portfolio · Empty state"
        actions={[
          { letter: 'A', text: 'Add your first AI program', detail: 'Name, vendor, value model, adoption target' },
          { letter: 'B', text: 'Import from spreadsheet', detail: 'CSV with program list and spend data' },
          { letter: 'C', text: 'Connect a procurement system', detail: 'Pull contracts from Source events automatically' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Illustration area */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: SHELL.GRAY_BG, border: `2px dashed ${SHELL.CARD_LINE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 40, marginBottom: 20,
        }}>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 28, color: SHELL.INK_MUTED }}>∅</span>
        </div>

        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 24, fontWeight: 400, color: SHELL.INK, margin: '0 0 8px', textAlign: 'center', lineHeight: 1.2 }}>
          No AI programs tracked yet
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_SOFT, margin: '0 0 32px', textAlign: 'center', maxWidth: 480, lineHeight: 1.6 }}>
          The AI Control Tower monitors your vendor-backed AI programs — tracking spend, adoption, value capture, and ROI in one place.
        </p>

        {/* Setup steps */}
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 14 }}>
            Get started in 3 steps
          </div>

          <SetupStep
            number={1}
            title="Add your first AI program"
            description="Log a vendor-backed AI rollout — Copilot, Claude Code, ServiceNow AI, or any custom deployment. Include spend, value model, and target adoption."
            href="/tower/programs/new"
            cta="Add program"
          />
          <SetupStep
            number={2}
            title="Set your value model"
            description="Define how value will be measured: time saved, revenue lift, cost deflection, or throughput. Nexus tracks actuals against this promise."
            href="/tower/programs/new"
            cta="Define value model"
          />
          <SetupStep
            number={3}
            title="Connect a data source"
            description="Wire up usage telemetry, HRIS, or finance data so adoption and value metrics auto-populate. Manual CSV upload is always available."
            href="/setup/connectors"
            cta="Set up connectors"
          />
        </div>

        {/* Or view demo data */}
        <div style={{ marginTop: 32, padding: '14px 20px', background: SHELL.PAPER_DEEP, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, marginBottom: 8 }}>
            Want to see what the portfolio looks like with data?
          </div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
            Demo tenant · Apex Retail Group · 5 programs · $11.7M portfolio
          </div>
        </div>
      </div>
    </AppShell>
  );
}
