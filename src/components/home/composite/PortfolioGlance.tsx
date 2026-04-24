import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { ProgramCard } from '@/components/shared/entities/ProgramCard';

export interface PortfolioProgram {
  id: string;
  // Identifier used in the nav target URL. Demo/composite rows pass the
  // program's mock id so the link resolves to /programs/[id] (C17). Real
  // engagement rows pass the graph_node_id and use the engagement console
  // fallback route.
  graphNodeId: string;
  // Override for the link target · '/programs' for the new C17 route,
  // '/engagements' for the legacy EngagementConsole. Defaults to
  // '/programs' because the demo path is the Wave 3 flow.
  routePrefix?: '/programs' | '/engagements';
  name: string;
  currentPhase: number;
  sponsorName: string | null;
  sponsorTitle: string | null;
  objective: string | null;
  outcomeFeeUsd: number | null;
  healthSignal: 'healthy' | 'watch' | 'attention' | null;
  href?: string;
}

interface Props {
  programs: PortfolioProgram[];
  // Total programs in the user's scope · if more than programs.length we
  // show a "See all" link. Optional · when null we skip the overflow CTA.
  totalCount?: number | null;
}

// Right-rail compact view of the user's active programs with health
// signals. Per spec §3.3 shows top 4-5 by relevance. On mobile the parent
// layout drops this below the briefing in a single column.
export function PortfolioGlance({ programs, totalCount }: Props) {
  const top = programs.slice(0, 5);
  const rest = totalCount != null && totalCount > top.length ? totalCount - top.length : 0;

  if (top.length === 0) {
    return (
      <aside aria-labelledby="portfolio-heading" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <EyebrowLabel tone="teal" size="xs">PORTFOLIO</EyebrowLabel>
        <Body size="sm" tone="secondary">
          No active programs yet. <EntityLink href="/engagements/new" variant="inline">Start a program intake.</EntityLink>
        </Body>
      </aside>
    );
  }

  return (
    <aside
      aria-labelledby="portfolio-heading"
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <EyebrowLabel tone="teal" size="xs">
          <span id="portfolio-heading">PORTFOLIO · {top.length}</span>
        </EyebrowLabel>
        {rest > 0 ? (
          <EntityLink href="/engagements" variant="ghost">
            + {rest} more
          </EntityLink>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top.map((p) => {
          const root = p.routePrefix ?? '/programs';
          const slug = root === '/programs' ? p.id : p.graphNodeId;
          const href = p.href ?? `${root}/${encodeURIComponent(slug)}`;
          return (
            <ProgramCard
              key={p.id}
              programName={p.name}
              currentPhase={p.currentPhase}
              sponsorName={p.sponsorName}
              sponsorTitle={p.sponsorTitle}
              objective={p.objective}
              outcomeFeeUsd={p.outcomeFeeUsd}
              healthSignal={p.healthSignal}
              href={href}
              size="compact"
            />
          );
        })}
      </div>
    </aside>
  );
}
