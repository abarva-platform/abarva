import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';

export interface BriefingItem {
  id: string;
  // "kpi_drift" | "peer_move" | "commitment_risk" etc. Renders as a
  // category eyebrow.
  category: string;
  categoryLabel: string;
  headline: string;
  contextParagraph: string;
  whyItMatters: string;
  recommendedAction?: string | null;
  // Entities the item references · render as EntityLinks inline under the
  // item. Briefing Engine should return pre-parsed entity refs so this
  // surface doesn't have to parse prose.
  entityRefs?: Array<{ label: string; href: string }>;
}

export interface BriefingSummary {
  // Subtle stale indicator · hours since generation. Briefing Engine sets
  // the source timestamp.
  ageHours: number | null;
  // Full set of items in composition order.
  items: BriefingItem[];
}

interface Props {
  briefing: BriefingSummary | null;
}

// Primary content of the composite home · renders the Briefing Engine
// output. When briefing data isn't yet available, surfaces a quiet empty
// state per spec §3.2 · never faked content.
export function BriefingSurface({ briefing }: Props) {
  if (!briefing) {
    return (
      <section aria-labelledby="briefing-heading" style={{ maxWidth: 720 }}>
        <EyebrowLabel tone="teal" size="sm" style={{ marginBottom: 10 }}>
          WHAT&apos;S CHANGED
        </EyebrowLabel>
        <SectionHeading id="briefing-heading" size="md" style={{ marginBottom: 12 }}>
          Your briefing is on the way
        </SectionHeading>
        <Body size="md" tone="secondary">
          Intelligence layer is still populating. Your first briefing appears here once this morning&apos;s changes
          have been synthesized · usually within 24 hours of first sign-in.
        </Body>
      </section>
    );
  }

  const staleLabel =
    briefing.ageHours != null && briefing.ageHours > 12
      ? `BRIEFING · ${Math.round(briefing.ageHours)} HOURS OLD · GENERATING REFRESH`
      : null;

  if (briefing.items.length === 0) {
    return (
      <section aria-labelledby="briefing-heading" style={{ maxWidth: 720 }}>
        <EyebrowLabel tone="teal" size="sm" style={{ marginBottom: 10 }}>
          WHAT&apos;S CHANGED
        </EyebrowLabel>
        <SectionHeading id="briefing-heading" size="md" style={{ marginBottom: 12 }}>
          No material changes overnight
        </SectionHeading>
        <Body size="md" tone="secondary">
          Nothing moved far enough to warrant your attention this morning. The intelligence layer is watching ·
          you&apos;ll see a briefing the moment something shifts.
        </Body>
      </section>
    );
  }

  return (
    <section aria-labelledby="briefing-heading" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <EyebrowLabel tone="teal" size="sm">WHAT&apos;S CHANGED</EyebrowLabel>
        {staleLabel ? <EyebrowLabel tone="amber" size="xs">{staleLabel}</EyebrowLabel> : null}
      </div>
      <SectionHeading id="briefing-heading" size="md" style={{ position: 'absolute', left: -9999 }}>
        Briefing
      </SectionHeading>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {briefing.items.map((item) => (
          <li key={item.id}>
            <article style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <EyebrowLabel tone="muted" size="xs">{item.categoryLabel.toUpperCase()}</EyebrowLabel>
              <Body size="lg" weight={700} tone="primary" as="div" style={{ lineHeight: 1.35 }}>
                {item.headline}
              </Body>
              <Body size="md" tone="secondary" style={{ lineHeight: 1.7 }}>
                {item.contextParagraph}
              </Body>
              <Body size="md" weight={500} tone="primary">
                <MetaLabel style={{ marginRight: 6, color: 'rgba(245,245,240,0.72)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  WHY IT MATTERS ·
                </MetaLabel>
                {item.whyItMatters}
              </Body>

              {item.recommendedAction ? (
                <div
                  style={{
                    borderLeft: '2px solid #2DD4C8',
                    paddingLeft: 12,
                    marginTop: 4,
                  }}
                >
                  <Body size="md" weight={500} tone="primary" style={{ fontStyle: 'italic' }}>
                    <MetaLabel style={{ marginRight: 6, color: 'rgba(45,212,200,0.9)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontStyle: 'normal' }}>
                      RECOMMEND ·
                    </MetaLabel>
                    {item.recommendedAction}
                  </Body>
                </div>
              ) : null}

              {item.entityRefs && item.entityRefs.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                  {item.entityRefs.map((e) => (
                    <EntityLink key={`${item.id}-${e.href}`} href={e.href} variant="inline">
                      {e.label}
                    </EntityLink>
                  ))}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
