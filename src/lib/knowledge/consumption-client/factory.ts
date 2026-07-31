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
  AnthropicAvaReasoningProvider,
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

export interface CreateFixtureRuntimeOptions {
  /**
   * "deterministic" (default): DeterministicAvaReasoningProvider, a non-model,
   * template-composed stand-in. Existing callers that omit this option see NO
   * behavior change.
   * "real": AnthropicAvaReasoningProvider, a thin client that calls
   * /api/knowledge/fixture-ava (the real Claude reasoning happens
   * server-side -- see that route + consumption-server/fixture-ava.ts). It
   * stays scoped strictly to the packet's
   * evidenceRefs/acceptedFactRefs/knownGapRefs and still refuses when the
   * scope can't substantiate an answer. Opt-in only. Availability
   * (ANTHROPIC_API_KEY) can only be checked server-side -- this factory
   * always constructs the provider when "real" is requested; an
   * unconfigured server surfaces as a clean, visible refusal from ask()
   * rather than a silent fallback to a different provider class.
   */
  aiProvider?: "deterministic" | "real";
}

export function createFixtureRuntime(
  tenantKey: string,
  scenario: FixtureScenario,
  options: CreateFixtureRuntimeOptions = {},
): ConsumptionRuntime {
  // Activation guard: a real/canonical tenant must never resolve to fixtures.
  assertFixtureNamespace(tenantKey);
  const pack = getFixturePack(tenantKey);
  if (!pack) {
    throw new Error(
      `createFixtureRuntime: no fixture pack for "${tenantKey}" (no legacy fallback).`,
    );
  }
  const provider = new ContractFixtureConsumptionProvider({
    tenantKey,
    scenario,
  });
  const modelsDisabled = scenarioDisablesModels(scenario);
  // Give the deterministic provider an in-scope corpus so it can exhibit
  // evidence-bound tables/charts (it still only uses refs the packet carries).
  const artifactEntities = pack.exploreLanding.entities.map((e) => ({
    entityRef: e.entityRef,
    displayName: e.displayName,
    entityType: e.entityType,
    domainKey: e.domainKey,
    availabilityState: e.availabilityState,
    evidenceRefs: e.evidenceRefs,
  }));

  const aiProvider = options.aiProvider ?? "deterministic";
  let ava: AvaReasoningProvider;
  if (modelsDisabled) {
    ava = new NullAvaReasoningProvider();
  } else if (aiProvider === "real") {
    ava = new AnthropicAvaReasoningProvider(tenantKey, scenario, {
      entitiesForArtifacts: artifactEntities,
    });
  } else {
    ava = new DeterministicAvaReasoningProvider({ entities: artifactEntities });
  }

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
  opts: { modelsEnabled?: boolean; adminCanaryTenantKey?: string } = {},
): ConsumptionRuntime {
  const provider = new HttpConsumptionApiProvider(tenantKey, {
    adminCanaryTenantKey: opts.adminCanaryTenantKey,
  });
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
