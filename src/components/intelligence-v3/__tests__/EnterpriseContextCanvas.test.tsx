/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { EnterpriseContextCanvas } from '../EnterpriseContextCanvas';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';
import type { ContextInsight } from '@/lib/intelligence/context-insights';

function makeOverview(): EnterpriseContextOverview {
  return {
    tenantKey: 'meridian-health',
    tenantName: 'Meridian Health',
    counts: {
      sources: 10,
      records: 1030,
      facts: 11428,
      relationships: 220,
      evidence: 1030,
      qualityIssues: 4,
      stewardshipTasks: 2,
      chunkQueue: 0,
    },
    recordTypeCounts: {
      cmdb_applications_services: 42,
      vendors_contract_inventory: 12,
    },
    freshnessCounts: { fresh: 900, attention: 130 },
    sourceSystems: ['ServiceNow', 'Workday'],
    evidenceUsableCount: 980,
    confidenceAverage: 0.88,
    qualitySummary: {},
    cards: [],
    sentinelFacts: [],
  };
}

function makeInsight(): ContextInsight {
  return {
    id: 'insight-1',
    tenantKey: 'meridian-health',
    headline: 'Databricks foundation is the unlock for prior auth automation',
    soWhat:
      'Clinical, claims, pharmacy, and call-center records are loaded, but automation value depends on the lakehouse semantic layer landing first.',
    domain: 'data-foundation',
    materiality: 'high',
    derivedFromRecordIds: ['rec-clinical-1', 'rec-claims-1'],
    derivedFromFactIds: ['fact-clinical-1', 'fact-claims-1'],
    ruleId: 'healthcare-data-foundation-gate',
    evidence: 'enterprise_context_facts',
    confidence: 'high',
    freshnessStatus: 'fresh',
    lifecycleState: 'active',
    action: 'Sequence prior-auth AI after the clinical + claims lakehouse gate.',
    entityName: 'Databricks Lakehouse',
    entityType: 'platform',
    insightPayload: {},
    updatedAt: '2026-06-18T09:00:00.000Z',
  };
}

describe('EnterpriseContextCanvas live insights', () => {
  it('renders materialized context insights with source IDs', () => {
    render(
      <EnterpriseContextCanvas
        overview={makeOverview()}
        tenantName="Meridian Health"
        insights={[makeInsight()]}
      />,
    );

    expect(screen.getByText('Live cross-domain insights')).toBeInTheDocument();
    expect(
      screen.getByText('Databricks foundation is the unlock for prior auth automation'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Clinical, claims, pharmacy/)).toBeInTheDocument();
    expect(screen.getByText(/healthcare-data-foundation-gate/)).toBeInTheDocument();
    expect(screen.getByText('fact-clinical-1')).toBeInTheDocument();
    expect(screen.getByText('rec-claims-1')).toBeInTheDocument();
  });

  it('keeps the no-insights state explicit', () => {
    render(
      <EnterpriseContextCanvas
        overview={makeOverview()}
        tenantName="Lakeshore"
        insights={[]}
      />,
    );

    expect(
      screen.getByText(/no materialized insight rows are active/i),
    ).toBeInTheDocument();
  });
});
