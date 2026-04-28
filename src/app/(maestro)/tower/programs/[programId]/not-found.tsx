import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';

export default function ProgramNotFound() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'AI Control Tower · Program not found' }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote="That program ID isn't in the portfolio. It may have been removed, the link may be stale, or you may have followed an ID from a different tenant."
        agentContext="Nexus · Error · Program not found"
        actions={[
          { letter: 'A', text: 'Return to portfolio', detail: 'View all active AI programs' },
          { letter: 'B', text: 'Add a new program', detail: 'Onboard a new vendor-backed AI rollout' },
          { letter: 'C', text: 'Check decisions log', detail: 'Program may have been killed or consolidated' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: SHELL.RUST_BG, border: `2px solid ${SHELL.RUST_TEXT}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 60, marginBottom: 20,
        }}>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 28, color: SHELL.RUST_TEXT }}>!</span>
        </div>

        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 24, fontWeight: 400, color: SHELL.INK, margin: '0 0 8px', textAlign: 'center' }}>
          Program not found
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_SOFT, margin: '0 0 32px', textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
          This program ID doesn&apos;t exist in the AI portfolio. The program may have been removed, consolidated, or the link may be outdated.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/tower"
            style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.PAPER, background: SHELL.INK, border: 'none', borderRadius: 7, padding: '9px 22px', textDecoration: 'none', display: 'inline-block' }}
          >
            ← Back to Control Tower
          </Link>
          <Link
            href="/tower/programs/new"
            style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, background: SHELL.GRAY_BG, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 7, padding: '9px 22px', textDecoration: 'none', display: 'inline-block' }}
          >
            Add new program
          </Link>
          <Link
            href="/tower/activity"
            style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK_SOFT, background: 'transparent', border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 7, padding: '9px 22px', textDecoration: 'none', display: 'inline-block' }}
          >
            Decisions log →
          </Link>
        </div>

        <div style={{ marginTop: 40, padding: '12px 20px', background: SHELL.PAPER_DEEP, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 6 }}>
            Active programs in this portfolio
          </div>
          {['twr-prog-m365-copilot', 'twr-prog-claude-code', 'twr-prog-now-assist', 'twr-prog-sap-joule', 'twr-prog-fow'].map((id) => (
            <div key={id} style={{ padding: '4px 0' }}>
              <Link href={`/tower/programs/${id}`} style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT, textDecoration: 'none' }}>
                {id} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
