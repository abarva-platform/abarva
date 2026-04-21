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
import { PageShell } from '@/components/shared/layout/PageShell';
import { OpeningGreeting } from '@/components/home/composite/OpeningGreeting';
import { BriefingSurface, type BriefingSummary } from '@/components/home/composite/BriefingSurface';
import { PortfolioGlance, type PortfolioProgram } from '@/components/home/composite/PortfolioGlance';
import { StakeholderLens, type StakeholderSummary } from '@/components/home/composite/StakeholderLens';
import { ContextFooter } from '@/components/home/composite/ContextFooter';

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

  const portfolio: PortfolioProgram[] = engagements.map((e) => ({
    id: e.id,
    graphNodeId: e.graph_node_id,
    name: e.name,
    currentPhase: e.current_phase ?? 0,
    sponsorName: e.sponsor_name,
    sponsorTitle: e.sponsor_role,
    objective: null, // outcome-objective column coming in a later seed pass
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
  const minutesSinceRefresh = mostRecent
    ? Math.max(0, Math.round((Date.now() - mostRecent.getTime()) / 60000))
    : null;

  const displayName = maestro?.name?.split(/\s+/)[0] ?? null;

  const now = new Date();

  return (
    <PageShell width="wide" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <OpeningGreeting
          displayName={displayName}
          framingLine={null}
          now={now}
        />

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
