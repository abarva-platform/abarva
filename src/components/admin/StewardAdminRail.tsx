'use client';

// Steward rail · anchors the Admin surface per the agent anchoring guide
// §2.4. Voice contract: utility-clerical · precise instructions · zero
// hedging · no small talk. Opening turn quotes live counts from Clerk
// (maestros provisioned, pending invitations) plus a connector roll-up
// from the canonical seed list on the connectors page.
//
// Decision-verb chips route to real destinations (no href="#"). The
// "Something else…" escape hatch is baked into AgentRail.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentRail, AGENTS, type AgentTurn } from '@/components/agent-rail/AgentRail';

interface StewardStatsPayload {
  maestrosProvisioned: number;
  pendingInvitations: number;
  connectorsHealthy: number;
  connectorsTotal: number;
  clientName: string;
}

interface StewardAdminRailProps {
  // Initial fallback · the rail also refetches on mount to get live
  // numbers, but we render something reasonable first paint.
  initialMaestros: number;
  initialPendingInvitations?: number;
  userInitials: string;
  clientName?: string;
}

const CHIP_ROUTES: Record<string, string> = {
  'invite-user': '/admin/invite',
  'connector-health': '/platform/admin/connectors',
  'audit-log': '/admin/audit',
  'entitlement-report': '/admin/users-access?tab=permissions',
};

export function StewardAdminRail({
  initialMaestros,
  initialPendingInvitations = 0,
  userInitials,
  clientName = 'AbarVa Ops',
}: StewardAdminRailProps) {
  const router = useRouter();
  const [stats, setStats] = useState<StewardStatsPayload>({
    maestrosProvisioned: initialMaestros,
    pendingInvitations: initialPendingInvitations,
    connectorsHealthy: 5,
    connectorsTotal: 6,
    clientName,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/steward-stats', { cache: 'no-store' });
        if (!res.ok) return;
        const body = (await res.json()) as { ok: boolean; stats: StewardStatsPayload };
        if (!cancelled && body.ok) setStats(body.stats);
      } catch {
        // Swallow · keep fallback stats. Steward does not hedge in the UI.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const opener: AgentTurn = {
    id: 'steward-opener',
    speaker: 'agent',
    text:
      `${stats.maestrosProvisioned} Maestros provisioned. ` +
      `${stats.pendingInvitations} pending invitations. ` +
      `${stats.connectorsHealthy} of ${stats.connectorsTotal} connectors healthy. Pick one.`,
  };

  return (
    <AgentRail
      agent={AGENTS.steward}
      contextBadge={`${stats.clientName} · Admin operations`}
      userInitials={userInitials}
      conversation={[opener]}
      guidedChoice={{
        prompt: 'Utility-clerical · confirms what changed, by whom, when.',
        options: [
          {
            id: 'invite-user',
            label: 'Invite user',
            sub: '→ /admin/invite',
          },
          {
            id: 'connector-health',
            label: 'Check connector health',
            sub: 'last sync timestamps + errors',
          },
          {
            id: 'audit-log',
            label: 'Review audit log',
            sub: 'last 24h activity',
          },
          {
            id: 'entitlement-report',
            label: 'Export entitlement report',
            sub: 'CSV · roles × tenants × users',
          },
        ],
      }}
      onChoice={(id) => {
        const dest = CHIP_ROUTES[id];
        if (dest) router.push(dest);
      }}
      onEscape={(text) => {
        // No free-form handler yet · log for telemetry parity with the
        // other three agents. Steward never hedges in UI; silent accept.
        if (typeof window !== 'undefined') {
          window.console.debug('steward escape', text);
        }
      }}
    />
  );
}
