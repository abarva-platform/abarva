import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { COLORS } from '@/lib/design-system';
import type { ResolvedIndustryComposition } from '@/lib/intelligence/industry-compositions';

interface Props {
  composition: ResolvedIndustryComposition;
  backHref: string;
  backLabel: string;
  anchorHref: string;
  anchorLabel: string;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span
            aria-hidden="true"
            style={{
              color: COLORS.teal,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              marginTop: 5,
            }}
          >
            ▸
          </span>
          <Body size="md" tone="primary" style={{ maxWidth: 880 }}>{item}</Body>
        </li>
      ))}
    </ul>
  );
}

export function IndustryCompositionPage({
  composition,
  backHref,
  backLabel,
  anchorHref,
  anchorLabel,
}: Props) {
  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 42 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <EntityLink href={backHref} variant="ghost">
              ← {backLabel}
            </EntityLink>
            <MetaLabel>{composition.verticalLabel.toUpperCase()} VERTICAL LENS</MetaLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 960 }}>
            <EyebrowLabel tone="teal" size="sm">
              INDUSTRY KNOWLEDGE LAYER · {composition.verticalLabel.toUpperCase()}
            </EyebrowLabel>
            <PageTitle size="display">{composition.title}</PageTitle>
            <Body size="lg" tone="secondary" style={{ maxWidth: 920 }}>
              {composition.subtitle}
            </Body>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <EntityLink href={anchorHref} variant="inline">{anchorLabel}</EntityLink>
              <MetaLabel>{composition.resolvedSections.length} composed sections</MetaLabel>
              <MetaLabel>{composition.slug}</MetaLabel>
            </div>
          </div>
        </header>

        <section style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {composition.intro.map((paragraph) => (
            <div
              key={paragraph}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '18px 18px 20px',
              }}
            >
              <Body size="md" tone="primary">{paragraph}</Body>
            </div>
          ))}
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">TIME-STAMPED POV</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 16 }}>
            What changed in 2025-2026 that makes this page necessary now
          </SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 940 }}>
            {composition.timeStampedPov.map((paragraph) => (
              <Body key={paragraph} size="md" tone="primary">{paragraph}</Body>
            ))}
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">COMPOSED FROM THE INDUSTRY LAYER</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 18 }}>
            The vertical context we pull in before forming a point of view
          </SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {composition.resolvedSections.map((section) => (
              <div key={`${section.categoryKey}:${section.title}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <EyebrowLabel tone="muted" size="xs">{section.categoryKey.replace(/-/g, ' ')}</EyebrowLabel>
                  <SectionHeading size="sm">{section.title}</SectionHeading>
                  <Body size="sm" tone="secondary" style={{ maxWidth: 940 }}>
                    {section.abarvaPov}
                  </Body>
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        padding: '16px 16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <Body size="md" weight={600} tone="primary" as="div">{item.title}</Body>
                      <Body size="sm" tone="secondary" as="div">{item.body}</Body>
                      {item.meta ? <MetaLabel>{item.meta}</MetaLabel> : null}
                      {item.children?.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                          {item.children.map((child) => (
                            <div
                              key={child.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: 'rgba(20,184,166,0.08)',
                                border: '0.5px solid rgba(20,184,166,0.22)',
                              }}
                            >
                              <Body size="sm" weight={600} tone="primary" as="div">{child.title}</Body>
                              <Body size="sm" tone="secondary" as="div" style={{ marginTop: 3 }}>{child.body}</Body>
                              {child.meta ? <MetaLabel style={{ display: 'block', marginTop: 4 }}>{child.meta}</MetaLabel> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EyebrowLabel tone="amber" size="sm">OBSERVED FAILURE MODES</EyebrowLabel>
            <SectionHeading size="sm">Where this work usually starts going wrong</SectionHeading>
            <BulletList items={composition.observedFailureModes} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EyebrowLabel tone="red" size="sm">ABARVA REFUSALS</EyebrowLabel>
            <SectionHeading size="sm">What we would not recommend here</SectionHeading>
            <BulletList items={composition.refusals} />
          </div>
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">DECISION ARCHITECTURE</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 16 }}>
            The order we would force the decisions
          </SectionHeading>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {composition.decisionArchitecture.map((step) => (
              <li key={step}>
                <Body size="md" tone="primary">{step}</Body>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageShell>
  );
}
