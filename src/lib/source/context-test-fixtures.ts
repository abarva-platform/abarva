// Deterministic test fixtures for AbarVa Source context validation.
//
// S3 slice. These helpers exist solely to drive the deterministic
// validation tests in src/lib/source/__tests__/context-validation.test.ts.
// They must not be imported from production code paths.
//
// The fixture inputs match the canonical golden Source demo events:
// - Data & AI Modernization SI Selection ($18.5M)
// - AMS Consolidation Assessment ($42.0M)
// - Digital App Build Partner Selection ($2.8M)
// Total: $63.3M

import { SOURCE_GOLDEN_EVENT_IDS } from './constants';
import type { SourceContextBuilderInput } from './context-builder';

/** Stable timestamp so freshness comparisons stay deterministic. */
export const SOURCE_TEST_FIXTURE_TIMESTAMP = '2026-04-24T00:00:00.000Z';

/** Stable user identity used across all golden-event fixtures. */
export const SOURCE_TEST_TENANT = {
  tenantId: 'tenant-northstar',
  tenantKey: 'northstar',
  tenantName: 'Northstar Holdings',
  activeClientId: 'client-northstar',
  activeClientName: 'Northstar Holdings',
} as const;

export const SOURCE_TEST_USER = {
  id: 'user-source-tester',
  email: 'tester+source@example.com',
  name: 'Source Validation Tester',
} as const;

function baseInput(
  eventId: string | undefined,
  overrides: Partial<SourceContextBuilderInput> = {},
): SourceContextBuilderInput {
  return {
    tenant: { ...SOURCE_TEST_TENANT },
    user: { ...SOURCE_TEST_USER },
    route: eventId ? `/source/events/${eventId}` : '/source',
    surface: eventId ? 'eventCanvas' : 'dashboard',
    userPrompt: 'What needs my attention?',
    eventId,
    selectedAttachmentIds: [],
    priorConversationTurns: [],
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    ...overrides,
  };
}

export function buildPortfolioContextInput(): SourceContextBuilderInput {
  return baseInput(undefined);
}

export function buildDataAiModernizationContextInput(): SourceContextBuilderInput {
  return baseInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
}

export function buildAmsConsolidationContextInput(): SourceContextBuilderInput {
  return baseInput(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation);
}

export function buildDigitalAppBuildContextInput(): SourceContextBuilderInput {
  return baseInput(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
}

/** All three golden-event inputs in canonical order. */
export const GOLDEN_SOURCE_EVENT_INPUTS: ReadonlyArray<{
  id: string;
  label: string;
  expectedName: string;
  expectedValueUsd: number;
  buildInput: () => SourceContextBuilderInput;
}> = [
  {
    id: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    label: 'Data & AI Modernization SI Selection',
    expectedName: 'Data & AI Modernization SI Selection',
    expectedValueUsd: 18_500_000,
    buildInput: buildDataAiModernizationContextInput,
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    label: 'AMS Consolidation Assessment',
    expectedName: 'AMS Consolidation Assessment',
    expectedValueUsd: 42_000_000,
    buildInput: buildAmsConsolidationContextInput,
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    label: 'Digital App Build Partner Selection',
    expectedName: 'Digital App Build Partner Selection',
    expectedValueUsd: 2_800_000,
    buildInput: buildDigitalAppBuildContextInput,
  },
];
