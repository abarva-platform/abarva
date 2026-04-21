import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { ExecutiveCard } from '@/components/shared/entities/ExecutiveCard';

export interface StakeholderSummary {
  id: string;
  graphNodeId: string | null;
  name: string;
  title: string | null;
  organization: string | null;
  focus: string | null;
  // Recent-activity tag · e.g. "3 OPEN DECISIONS" or "MEETING IN 2 HOURS".
  // When null we skip the tag row.
  activityTag: string | null;
}

interface Props {
  stakeholders: StakeholderSummary[];
  totalCount?: number | null;
}

// Horizontal row of the executives the user most interacts with. Per spec
// §3.4 · ≤6 shown with overflow link.
export function StakeholderLens({ stakeholders, totalCount }: Props) {
  const top = stakeholders.slice(0, 6);
  const rest = totalCount != null && totalCount > top.length ? totalCount - top.length : 0;

  if (top.length === 0) {
    return (
      <section aria-labelledby="stakeholder-heading" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <EyebrowLabel tone="teal" size="xs" id="stakeholder-heading">STAKEHOLDER LENS</EyebrowLabel>
        <Body size="sm" tone="muted">
          No stakeholder activity yet.
        </Body>
      </section>
    );
  }

  return (
    <section aria-labelledby="stakeholder-heading" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <EyebrowLabel tone="teal" size="xs" id="stakeholder-heading">
          STAKEHOLDER LENS · {top.length}
        </EyebrowLabel>
        {rest > 0 ? (
          <EntityLink href="/engagements" variant="ghost">
            + {rest} more
          </EntityLink>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {top.map((s) => (
          <ExecutiveCard
            key={s.id}
            name={s.name}
            title={s.title}
            organization={s.organization}
            focus={s.focus}
            roleTag={s.activityTag}
            size="card"
            href={s.graphNodeId ? `/persons/${encodeURIComponent(s.graphNodeId)}` : undefined}
          />
        ))}
      </div>
    </section>
  );
}
