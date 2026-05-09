jest.mock('server-only', () => ({}));

import { retrieveSurfaceContextSources } from '../retrievers/surface-context';
import type { AskSurfaceContext, SourceType } from '../types';

const apexContext: AskSurfaceContext = {
  activeTab: 'vendors',
  activeClient: 'Apex Retail Group',
  clientKey: 'apexretail',
  pageFacts: [
    'This is the live Apex Retail Intelligence substrate, not the Meridian or Epic healthcare fixture.',
  ],
  stageFacts: [
    'Vendors: $107.4M annualized spend across 21 active vendors; 2 at risk and 6 on watch.',
  ],
  tenantFacts: [
    'Tenant 360: Apex Retail is the active retail demo tenant. Do not use Meridian Healthcare, Epic EHR, IDN, CMIO, HIPAA, or clinical AI facts unless the user explicitly asks for healthcare examples.',
  ],
  vendorFacts: [
    'Data and analytics landscape: Adobe Experience Platform $8.8M - CDP; Salesforce Commerce + Marketing Cloud $14.6M - commerce and loyalty; Snowflake $3.8M - analytics foundation; Databricks $2.9M - ML workspace.',
  ],
  riskFacts: [
    'Risk: loyalty AI, personalization, and clienteling cannot scale safely until customer identity, consent, and CDP ownership are settled.',
  ],
  graphFacts: [
    'Graph edge: CMO loyalty outcome ownership contradicts CTO CDP/platform control; impacts Salesforce, Adobe Experience Platform, identity, consent, and loyalty AI.',
    'Graph edge: AI timeline depends on data readiness; item-location, identity stitching, consent, promo history, and substitution history are gating inputs.',
  ],
  qualityFacts: [
    'Quality gate: current-state answers must start from SURFACE, TENANT, and GRAPH sources before generic corpus or worldview sources.',
  ],
};

const goldenQuestions: Array<{
  query: string;
  types: SourceType[];
  mustInclude: string[];
}> = [
  {
    query: 'Can you give me a perspective of current state of data analytics landscape?',
    types: ['SURFACE', 'TENANT', 'GRAPH'],
    mustInclude: ['Adobe Experience Platform', 'Snowflake', 'not the Meridian'],
  },
  {
    query: 'What is the current CDP ownership contradiction?',
    types: ['SURFACE', 'TENANT', 'GRAPH'],
    mustInclude: ['CMO loyalty outcome ownership', 'CTO CDP/platform control'],
  },
  {
    query: 'What is blocking Apex Retail AI readiness?',
    types: ['SURFACE', 'TENANT', 'GRAPH'],
    mustInclude: ['data readiness', 'identity stitching', 'consent'],
  },
];

describe('Sentinel Intel 360 retrieval eval', () => {
  it.each(goldenQuestions)('grounds "$query" in live surface, tenant, and graph context', ({ query, types, mustInclude }) => {
    const sources = retrieveSurfaceContextSources(apexContext, query);
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources.map((source) => source.type)).toEqual(types);
    for (const phrase of mustInclude) {
      expect(detail).toContain(phrase);
    }
  });
});
