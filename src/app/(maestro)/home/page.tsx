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
import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { CLIENT_KEY_TO_ROUTE_SLUG } from '@/lib/client-config';
import { getAllPersons } from '@/lib/db/person';
import { getAllPrograms } from '@/lib/programs/mock';
import { BriefingSurface, type BriefingSummary } from '@/components/home/composite/BriefingSurface';
import { PortfolioGlance, type PortfolioProgram } from '@/components/home/composite/PortfolioGlance';
import { StakeholderLens, type StakeholderSummary } from '@/components/home/composite/StakeholderLens';
import { ContextFooter } from '@/components/home/composite/ContextFooter';
import { TenantBreadthRow, type BreadthChip } from '@/components/home/composite/TenantBreadthRow';
import { CommandCenter } from '@/components/home/command-center/CommandCenter';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';

export const dynamic = 'force-dynamic';

const PAGE_BG = '#F6F1E8';
const PANEL_BG = '#FFFDF9';
const PANEL_ALT = '#F1E7DA';
const INK = '#171411';
const INK_SOFT = '#40342D';
const INK_MUTED = '#6B5B52';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#14B8A6';
const DARK = '#101418';
const DARK_PANEL = '#171C21';
const DARK_LINE = 'rgba(255,255,255,0.08)';
const CREAM = '#F7F2EA';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", monospace';

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
  const [maestro, activeClient, allPersons, activeClientKey] = await Promise.all([
    getCurrentPerson(),
    getActiveClientRow(),
    getAllPersons(),
    getActiveClientKey(),
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
  const seededTenant = findTenantByRouteSlug(CLIENT_KEY_TO_ROUTE_SLUG[activeClientKey]);
  const matchesMockTenant = (tenant: string) => {
    if (!activeClientName) return false;
    const keyword = activeClientName.split(/\s+/)[0]?.toLowerCase() ?? '';
    return keyword.length > 0 && tenant.toLowerCase().includes(keyword);
  };
  const mockForActive = allMockPrograms.filter((p) => matchesMockTenant(p.clientName));

  const portfolio: PortfolioProgram[] = seededTenant?.programs?.length
    ? seededTenant.programs.map((program) => ({
        id: program.programSlug,
        graphNodeId: program.programSlug,
        routePrefix: '/programs' as const,
        href: program.routePath,
        name: program.name,
        currentPhase: program.currentAppPhase,
        sponsorName: null,
        sponsorTitle: null,
        objective: program.roleInDemo,
        outcomeFeeUsd: null,
        healthSignal: healthFromPhase(program.currentAppPhase),
      }))
    : mockForActive.length > 0
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
  const programCount = seededTenant?.programs.length ?? portfolio.length;
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

  const salutation = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const heroName = displayName ? `${salutation}, ${displayName}.` : `${salutation}.`;
  const heroTimestamp = `${now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })} · ${now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  const heroNarrative = activeClientName
    ? `${activeClientName} is no longer trapped in decks and inboxes. Programs, stakeholders, systems, and evidence are already structured into a working surface so the team can move from narrative to operating memory.`
    : 'Programs, stakeholders, systems, and evidence are already being gathered into a working surface so the team can move from narrative to operating memory.';
  const heroStats = breadthChips.filter((chip) =>
    ['programs', 'executives', 'kpis', 'sources'].includes(chip.key),
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 24px 96px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <header
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 34,
              border: `1px solid ${LINE}`,
              background:
                `radial-gradient(circle at top left, rgba(127,184,255,0.22), transparent 34%),
                 radial-gradient(circle at top right, rgba(20,184,166,0.16), transparent 28%),
                 linear-gradient(180deg, ${PANEL_BG} 0%, ${PAGE_BG} 100%)`,
              boxShadow: '0 28px 80px rgba(23,20,17,0.08)',
              padding: '44px 40px 38px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 24,
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
                alignItems: 'end',
              }}
              className="home-hero-grid"
            >
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: TEAL,
                  }}
                >
                  {activeClientName ? `${activeClientName} · modeled enterprise` : 'Modeled enterprise'}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                  }}
                >
                  {heroTimestamp}
                </div>
                <h1
                  style={{
                    margin: '16px 0 0',
                    maxWidth: 820,
                    fontFamily: SERIF,
                    fontSize: 'clamp(46px, 5vw, 92px)',
                    lineHeight: 0.94,
                    letterSpacing: '-0.055em',
                    color: INK,
                  }}
                >
                  {heroName}
                </h1>
                <p
                  style={{
                    margin: '22px 0 0',
                    maxWidth: 760,
                    fontSize: 'clamp(19px, 1.7vw, 28px)',
                    lineHeight: 1.46,
                    color: INK_SOFT,
                  }}
                >
                  {heroNarrative}
                </p>
              </div>

              <div
                style={{
                  padding: 22,
                  borderRadius: 24,
                  border: `1px solid ${LINE}`,
                  background: `linear-gradient(180deg, ${PANEL_ALT} 0%, rgba(255,253,249,0.92) 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                  }}
                >
                  What is live now
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'grid',
                    gap: 10,
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  }}
                  className="home-hero-stats"
                >
                  {heroStats.map((chip) => (
                    <div
                      key={chip.key}
                      style={{
                        padding: '14px 14px 12px',
                        borderRadius: 18,
                        background: 'rgba(255,255,255,0.72)',
                        border: `1px solid ${LINE}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: INK_MUTED,
                        }}
                      >
                        {chip.label}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontFamily: SERIF,
                          fontSize: 'clamp(28px, 2vw, 38px)',
                          lineHeight: 0.98,
                          letterSpacing: '-0.04em',
                          color: INK,
                        }}
                      >
                        {chip.value}
                      </div>
                      {chip.sub ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 14,
                            lineHeight: 1.45,
                            color: INK_SOFT,
                          }}
                        >
                          {chip.sub}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <section
            style={{
              borderRadius: 34,
              background: `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)`,
              color: CREAM,
              padding: '30px 28px',
              boxShadow: '0 30px 72px rgba(23,20,17,0.18)',
            }}
          >
            {/* Tenant data breadth row · Fix Spec v3 §7 · sits near the top so
                the first impression still signals modeled enterprise breadth,
                but now inside a deliberate dark operator band. */}
            <TenantBreadthRow chips={breadthChips} accessGovernance={governance} />

            <div
              style={{
                marginTop: 26,
                paddingTop: 26,
                borderTop: `1px solid ${DARK_LINE}`,
              }}
            >
              {/* Command center · Fix Spec v4 §10/§11/§12 · IT Stack · Vendors
                  · Uploaded Data tabs under a single section below breadth row. */}
              <CommandCenter tenantKey={activeClient?.name ?? null} />
            </div>
          </section>

          <section
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 360px)',
              alignItems: 'end',
            }}
            className="home-editorial-bridge"
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TEAL,
                }}
              >
                Morning brief
              </div>
              <h2
                style={{
                  margin: '12px 0 0',
                  maxWidth: 720,
                  fontFamily: SERIF,
                  fontSize: 'clamp(32px, 2.5vw + 10px, 52px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.04em',
                  color: INK,
                }}
              >
                Intelligence should feel composed before it feels dense.
              </h2>
            </div>
            <div
              style={{
                padding: '20px 22px',
                borderRadius: 22,
                border: `1px solid ${LINE}`,
                background: 'rgba(255,253,249,0.88)',
                boxShadow: '0 14px 40px rgba(23,20,17,0.06)',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                }}
              >
                Design note
              </div>
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 16,
                  lineHeight: 1.62,
                  color: INK_SOFT,
                }}
              >
                The hero and transition panels stay warm and open. The dense grids remain darker on purpose so
                the scan-heavy product surfaces still read crisply on smaller laptops.
              </p>
            </div>
          </section>

          <section
            style={{
              borderRadius: 34,
              background: `linear-gradient(180deg, #12171C 0%, #0D1116 100%)`,
              color: CREAM,
              padding: '30px 28px 24px',
              boxShadow: '0 30px 72px rgba(23,20,17,0.18)',
            }}
          >
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

            <div
              style={{
                marginTop: 30,
                paddingTop: 28,
                borderTop: `1px solid ${DARK_LINE}`,
              }}
            >
              <StakeholderLens
                stakeholders={stakeholders}
                totalCount={scopedPersons.length}
              />
            </div>

            <ContextFooter
              minutesSinceRefresh={minutesSinceRefresh}
              tenantName={activeClient?.name ?? null}
            />
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 1040px) {
          .home-hero-grid,
          .home-editorial-bridge {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 720px) {
          .home-hero-stats {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 960px) {
          .composite-home-layout { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
