import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  selectVisibleSourcingArtifacts,
  SourcingReactivePanel,
} from '@/components/source/SourcingReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

describe('selectVisibleSourcingArtifacts', () => {
  it('keeps Sourcing artifact types and reverses order', () => {
    const artifacts: Artifact[] = [
      {
        type: 'vendor-card',
        vendorId: 'ven-a',
        name: 'Vendor A',
        tier: 'enterprise',
        positioning: 'Enterprise incumbent with ITSM depth.',
      },
      {
        type: 'pricing-benchmark',
        category: 'AMS managed services',
        metric: 'monthly run-rate per application',
        median: 4200,
        source: 'Apex benchmark pack',
      },
      {
        type: 'contract-clause',
        clauseId: 'exit-assistance-rate-card',
        title: 'Exit assistance rate card',
        recommendedLanguage: 'Attach transition roles and rate caps.',
        leverage: 'BAFO is still open.',
      },
    ];

    const visible = selectVisibleSourcingArtifacts(artifacts);

    expect(visible.map((artifact) => artifact.type)).toEqual([
      'contract-clause',
      'pricing-benchmark',
      'vendor-card',
    ]);
  });

  it('drops non-Sourcing artifact types', () => {
    const artifacts: Artifact[] = [
      { type: 'brief-field', field: 'programName', value: 'AMS 2026' },
      { type: 'gate-evaluation', gate: 'Build gate', status: 'pending' },
      {
        type: 'pattern-match',
        patternId: 'PAT-PRG-CDP-001',
        name: 'CDP Activation',
        summary: 'Program pattern.',
      },
    ];

    expect(selectVisibleSourcingArtifacts(artifacts)).toEqual([]);
  });

  it('dedupes stable Sourcing cards and keeps the latest occurrence', () => {
    const artifacts: Artifact[] = [
      {
        type: 'sourcing-stage-progress',
        evidenceItemId: 'bafo-calendar-locked',
        label: 'BAFO calendar locked',
        severity: 'hard',
        status: 'unmet',
      },
      {
        type: 'vendor-card',
        vendorId: 'ven-a',
        name: 'Vendor A',
        tier: 'enterprise',
        positioning: 'Initial read.',
      },
      {
        type: 'sourcing-stage-progress',
        evidenceItemId: 'bafo-calendar-locked',
        label: 'BAFO calendar locked',
        severity: 'hard',
        status: 'met',
        detail: 'Calendar is now locked.',
      },
      {
        type: 'vendor-card',
        vendorId: 'ven-a',
        name: 'Vendor A',
        tier: 'enterprise',
        positioning: 'Updated read.',
        riskFlags: ['Customization sprawl'],
      },
    ];

    const visible = selectVisibleSourcingArtifacts(artifacts);

    expect(visible).toHaveLength(2);
    expect(visible[0]).toMatchObject({
      type: 'vendor-card',
      vendorId: 'ven-a',
      positioning: 'Updated read.',
    });
    expect(visible[1]).toMatchObject({
      type: 'sourcing-stage-progress',
      evidenceItemId: 'bafo-calendar-locked',
      status: 'met',
    });
  });
});

describe('SourcingReactivePanel', () => {
  it('renders Sentinel-specific empty-state prompts', () => {
    const html = renderToStaticMarkup(createElement(SourcingReactivePanel, { artifacts: [] }));

    expect(html).toContain('Sentinel sourcing reasoning - live');
    expect(html).toContain('Compare these vendors');
    expect(html).toContain('Run BAFO check');
    expect(html).toContain('walkaway');
  });

  it('renders Sourcing cards without route wiring', () => {
    const artifacts: Artifact[] = [
      {
        type: 'walkaway-signal',
        credibility: 'soft',
        reasoning: 'Two alternatives exist, but challenger availability is not locked.',
        recommendation: 'Lock challenger dates before threatening walkaway.',
      },
      {
        type: 'bafo-scoreboard',
        vendors: [
          { vendorId: 'ven-a', name: 'Vendor A' },
          { vendorId: 'ven-b', name: 'Vendor B' },
        ],
        dimensions: [
          { label: 'Commercial fit', weight: 35 },
          { label: 'Transition risk', weight: 25 },
        ],
        scoresMatrix: [
          [82, 68],
          [76, 84],
        ],
      },
    ];

    const html = renderToStaticMarkup(createElement(SourcingReactivePanel, { artifacts }));

    expect(html).toContain('BAFO scoreboard');
    expect(html).toContain('Vendor A');
    expect(html).toContain('Walkaway credibility');
    expect(html).not.toContain('href=');
  });
});
