// C11 · Composite Home. Wave 3 primary surface · per docs:
//   - `.claude-queue/waves3/c11-composite-home-template.md`
//   - Wave 3 README §5 (design guardrails) + §8 (quality bar)
//
// Structure:
//   1. Opening greeting (voice-shaped, personalized)
//   2. Briefing surface (primary content) · empty-state until Briefing Engine lands
//   3. Portfolio glance (right rail on desktop, below briefing on mobile)
//   4. Stakeholder lens (below the briefing, full-width)
//   5. Quiet context footer (freshness + trust)
//
// Data dependencies that don't yet exist in main land as empty states per
// spec §4. When the Briefing Engine (Wave 2 B1) and Executive Profile
// System (Wave 1 Drop 5) ship, the two remaining `null` data points wire
// in without structural changes.

import { getCurrentPerson } from '@/lib/auth/maestro';
import { getAllActiveEngagements } from '@/lib/db/engagement';
import { getActiveClientRow } from '@/lib/active-client';
import { getAllPersons } from '@/lib/db/person';
import { getAllPrograms } from '@/lib/programs/mock';
import { PageShell } from '@/components/shared/layout/PageShell';
import { OpeningGreeting } from '@/components/home/composite/OpeningGreeting';
import { BriefingSurface, type BriefingSummary } from '@/components/home/composite/BriefingSurface';
import { PortfolioGlance, type PortfolioProgram } from '@/components/home/composite/PortfolioGlance';
import { StakeholderLens, type StakeholderSummary } from '@/components/home/composite/StakeholderLens';
import { ContextFooter } from '@/components/home/composite/ContextFooter';
import { TenantBreadthRow, type BreadthChip } from '@/components/home/composite/TenantBreadthRow';

export const dynamic = 'force-dynamic';

// Scope stakeholder candidates to the active client's organization · same
// pattern the engagement-create route uses. Substring keeps "Meridian Health"
// matching both "Meridian Health" and "Meridian Health System".
function scopePersonsToOrg<T extends { organization: string | null }>(
  persons: T[],
  activeClientName: string | null,
): T[] {
  if (!activeClientName) return persons;
  const keyword = activeClientName.split(/\s+/)[0]?.toLowerCase();
  if (!keyword) return persons;
  return persons.filter((p) => (p.organization ?? '').toLowerCase().includes(keyword));
}

function healthFromPhase(phase: number): 'healthy' | 'watch' | 'attention' {
  // Temporary heuristic until the Operating Review / contradiction-engine
  // wiring lands · newer phases read as "watch" so the UI always has
  // legible signal tone. Will be replaced by real aggregates in Wave 2.
  if (phase >= 4) return 'healthy';
  if (phase >= 2) return 'watch';
  return 'attention';
}

export default async function HomePage() {
  const [maestro, activeClient, allPersons] = await Promise.all([
    getCurrentPerson(),
    getActiveClientRow(),
    getAllPersons(),
  ]);

  const activeClientId = activeClient?.id ?? null;

  const engagements = await getAllActiveEngagements(
    maestro?.id,
    activeClientId,
  );

  // Portfolio source precedence for demo flow:
  // 1. Mock programs scoped to the active client · route cleanly to C17
  //    at /programs/[mockId] with deep data (phases, deliverables,
  //    activity, stakeholders). Preferred when any match.
  // 2. Real engagements table fallback · route to /engagements/[graphId]
  //    which is the older EngagementConsole. Used for clients that
  //    don't yet have composite mock data.
  const allMockPrograms = getAllPrograms();
  const activeClientName = activeClient?.name ?? null;
  const matchesMockTenant = (tenant: string) => {
    if (!activeClientName) return false;
    const keyword = activeClientName.split(/\s+/)[0]?.toLowerCase() ?? '';
    return keyword.length > 0 && tenant.toLowerCase().includes(keyword);
  };
  const mockForActive = allMockPrograms.filter((p) => matchesMockTenant(p.clientName));

  const portfolio: PortfolioProgram[] = mockForActive.length > 0
    ? mockForActive.map((p) => ({
        id: p.id,
        graphNodeId: p.id, // programs/[id] route uses the same id
        routePrefix: '/programs' as const,
        name: p.name,
        currentPhase: p.currentPhase,
        sponsorName: p.sponsorPerson.name,
        sponsorTitle: p.sponsorPerson.title,
        objective: p.archetype.replace(/_/g, ' ').toUpperCase(),
        outcomeFeeUsd: null,
        healthSignal: p.gateStatus === 'blocked' ? 'attention' as const
          : p.gateStatus === 'cleared' ? 'healthy' as const
          : 'watch' as const,
      }))
    : engagements.map((e) => ({
        id: e.id,
        graphNodeId: e.graph_node_id,
        routePrefix: '/engagements' as const,
        name: e.name,
        currentPhase: e.current_phase ?? 0,
        sponsorName: e.sponsor_name,
        sponsorTitle: e.sponsor_role,
        objective: null,
        outcomeFeeUsd: null,
        healthSignal: healthFromPhase(e.current_phase ?? 0),
      }));

  const scopedPersons = scopePersonsToOrg(allPersons, activeClient?.name ?? null);

  // Rank: sponsors of active programs first, then other scoped org members.
  const sponsorIds = new Set(engagements.map((e) => e.sponsor_name).filter(Boolean) as string[]);
  const ranked = [...scopedPersons].sort((a, b) => {
    const aSponsor = sponsorIds.has(a.name) ? 1 : 0;
    const bSponsor = sponsorIds.has(b.name) ? 1 : 0;
    return bSponsor - aSponsor;
  });

  const stakeholders: StakeholderSummary[] = ranked.slice(0, 8).map((p) => {
    const style = (p.communication_style ?? {}) as {
      title?: string;
      primary_focus?: string;
    };
    const isSponsor = sponsorIds.has(p.name);
    return {
      id: p.id,
      graphNodeId: p.graph_node_id,
      name: p.name,
      title: style.title ?? p.role,
      organization: p.organization,
      focus: style.primary_focus ?? null,
      activityTag: isSponsor ? 'SPONSORING · ACTIVE PROGRAM' : null,
    };
  });

  // Briefing Engine hasn't landed yet · surface the empty state.
  const briefing: BriefingSummary | null = null;

  // Most-recent engagement.updated_at stands in as a refresh proxy until
  // intelligence-layer telemetry is surfaced.
  const mostRecent = engagements.reduce<Date | null>((acc, e) => {
    const t = new Date(e.updated_at);
    if (!acc || t > acc) return t;
    return acc;
  }, null);
  const now = new Date();
  const minutesSinceRefresh = mostRecent
    ? Math.max(0, Math.round((now.getTime() - mostRecent.getTime()) / 60000))
    : null;

  const displayName = maestro?.name?.split(/\s+/)[0] ?? null;

  // Tenant data breadth row · Fix Spec v3 §7. Counts derive from real
  // relational reads where available, fall back to tenant-sized
  // approximations per spec §7 demo note so the row never reads as empty
  // for a demo-ready tenant. When the Tenant Intelligence Command Center
  // wiring lands, replace the fallbacks with live counts.
  const programCount = portfolio.length;
  const stakeholderTotal = scopedPersons.length;
  const tenantName = activeClient?.name ?? null;
  const isApex = tenantName?.toLowerCase().includes('apex') ?? false;
  const isMeridian = tenantName?.toLowerCase().includes('meridian') ?? false;
  const isFirstCapital = tenantName?.toLowerCase().includes('first') ?? tenantName?.toLowerCase().includes('arcturus') ?? false;

  const breadthChips: BreadthChip[] = [
    {
      key: 'programs',
      label: 'Programs',
      value: programCount > 0 ? programCount : isApex ? 18 : isMeridian ? 12 : 9,
      sub: 'across 5 phases',
      href: '/engagements',
    },
    {
      key: 'executives',
      label: 'Executives',
      value: stakeholderTotal > 0 ? stakeholderTotal : isApex ? 11 : 9,
      sub: 'with profiles',
      href: '/engagements',
    },
    {
      key: 'priorities',
      label: 'Strategic priorities',
      value: isApex ? 8 : isMeridian ? 7 : isFirstCapital ? 9 : 6,
      sub: 'currently tracked',
      href: '/tower',
    },
    {
      key: 'kpis',
      label: 'KPIs',
      value: isApex ? 42 : isMeridian ? 38 : isFirstCapital ? 47 : 36,
      sub: 'live + baselined',
      href: '/tower',
    },
    {
      key: 'it_systems',
      label: 'IT systems',
      value: isApex ? 178 : isMeridian ? 156 : isFirstCapital ? 212 : 134,
      sub: 'in tech stack catalog',
      href: '/tower/tech-stack',
    },
    {
      key: 'financial_scale',
      label: 'Financial scale',
      value: isApex ? '$2.4B' : isMeridian ? '$3.1B' : isFirstCapital ? '$4.8B' : '$1.8B',
      sub: 'opex in scope',
      href: '/tower',
    },
    {
      key: 'customers',
      label: 'Customers',
      value: isApex ? '28M' : isMeridian ? '1.4M' : isFirstCapital ? '6.2M' : '12M',
      sub: isApex ? 'retail + loyalty' : isMeridian ? 'patients · all lines' : isFirstCapital ? 'accounts · commercial + retail' : 'current tier',
      href: '/platform/data',
    },
    {
      key: 'sources',
      label: 'Connected sources',
      value: isApex ? 64 : isMeridian ? 71 : isFirstCapital ? 83 : 52,
      sub: 'feeding intelligence',
      href: '/platform/data',
    },
  ];

  const governance = maestro
    ? {
        maestroCount: 1 + (stakeholderTotal > 0 ? Math.min(3, Math.ceil(stakeholderTotal / 4)) : 2),
        lastUpdated: mostRecent,
        href: '/platform/admin/data-governance',
      }
    : null;

  return (
    <PageShell width="wide" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <OpeningGreeting
          displayName={displayName}
          framingLine={null}
          now={now}
        />

        {/* Tenant data breadth row · Fix Spec v3 §7 · sits between greeting
            and briefing so the first impression signals "AbarVa has modeled
            your enterprise at breadth" within 2 seconds of page load. */}
        <TenantBreadthRow chips={breadthChips} accessGovernance={governance} />

        {/* Two-column on desktop · briefing left, portfolio glance right.
            Breakpoints handled via simple grid-template-columns with a
            max-width fallback at mobile widths. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 320px)',
            gap: 40,
          }}
          className="composite-home-layout"
        >
          <BriefingSurface briefing={briefing} />
          <PortfolioGlance
            programs={portfolio}
            totalCount={portfolio.length}
          />
        </div>

        <StakeholderLens
          stakeholders={stakeholders}
          totalCount={scopedPersons.length}
        />

        <ContextFooter
          minutesSinceRefresh={minutesSinceRefresh}
          tenantName={activeClient?.name ?? null}
        />
      </div>

      {/* Collapse to single column below 960px · the right-rail becomes a
          full-width section stacked under the briefing. */}
      <style>{`
        @media (max-width: 960px) {
          .composite-home-layout { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </PageShell>
  );
}
