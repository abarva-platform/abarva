/**
 * Runtime factory. Assembles a ConsumptionRuntime (data provider + aVa provider
 * + binding) for either the fixture or the real HTTP path. Components receive a
 * ConsumptionRuntime and never branch on which one it is.
 */

import type {
  AvaReasoningProvider,
  EvidenceDescriptor,
  KnowledgeConsumptionProvider,
  ProviderBinding,
} from "../consumption-contracts";
import {
  assertFixtureNamespace,
  getFixturePack,
  scenarioDisablesModels,
  type FixtureScenario,
} from "../fixtures";
import { ContractFixtureConsumptionProvider } from "./contract-fixture-provider";
import { HttpConsumptionApiProvider } from "./http-consumption-provider";
import {
  DeterministicAvaReasoningProvider,
  NullAvaReasoningProvider,
} from "./ava-provider";

export interface ConsumptionRuntime {
  provider: KnowledgeConsumptionProvider;
  ava: AvaReasoningProvider;
  binding: ProviderBinding;
  baselineRef: string;
  domainPublicationVersions: Record<string, string>;
  /** True when the aVa reasoning path is available in this runtime. */
  modelsEnabled: boolean;
  /**
   * Resolve evidence refs to descriptors for the evidence drawer. Fixtures
   * resolve from their pack; the HTTP path will resolve via a published
   * /evidence endpoint (backend gap register) and returns [] until then.
   */
  resolveEvidence: (refs: string[]) => EvidenceDescriptor[];
}

export function createFixtureRuntime(
  tenantKey: string,
  scenario: FixtureScenario,
): ConsumptionRuntime {
  // Activation guard: a real/canonical tenant must never resolve to fixtures.
  assertFixtureNamespace(tenantKey);
  const pack = getFixturePack(tenantKey);
  if (!pack) {
    throw new Error(
      `createFixtureRuntime: no fixture pack for "${tenantKey}" (no legacy fallback).`,
    );
  }
  const provider = new ContractFixtureConsumptionProvider({ tenantKey, scenario });
  const modelsDisabled = scenarioDisablesModels(scenario);
  const ava: AvaReasoningProvider = modelsDisabled
    ? new NullAvaReasoningProvider()
    : new DeterministicAvaReasoningProvider();
  return {
    provider,
    ava,
    binding: provider.binding,
    baselineRef: pack.meta.knowledgeBaselineRef,
    domainPublicationVersions: pack.meta.domainPublicationVersions,
    modelsEnabled: !modelsDisabled,
    resolveEvidence: (refs) => provider.resolveEvidence(refs),
  };
}

export function createHttpRuntime(
  tenantKey: string,
  opts: { modelsEnabled?: boolean } = {},
): ConsumptionRuntime {
  const provider = new HttpConsumptionApiProvider(tenantKey);
  const modelsEnabled = opts.modelsEnabled ?? false;
  const ava: AvaReasoningProvider = modelsEnabled
    ? new DeterministicAvaReasoningProvider()
    : new NullAvaReasoningProvider();
  const binding: ProviderBinding = { kind: "http_consumption_api", tenantKey };
  return {
    provider,
    ava,
    binding,
    // Baseline/publication versions arrive with each envelope for the HTTP path.
    baselineRef: "resolved-per-response",
    domainPublicationVersions: {},
    modelsEnabled,
    // Until a published /evidence endpoint exists, descriptors travel inline in
    // envelopes (e.g. evidenceByEdge); ref-only resolution returns [].
    resolveEvidence: () => [],
  };
}
