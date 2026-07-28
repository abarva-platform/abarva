/**
 * Fixture pack shape + scenario enum. A FixturePack holds the payloads the
 * ContractFixtureConsumptionProvider wraps into ConsumptionEnvelopes.
 *
 * FIXTURE-ONLY invariant: every pack sets `fixtureOnly: true` and uses a
 * synthetic tenant namespace (`fixture-*-demo-new`). Packs contain no real
 * client information, no hidden truth, and no copied legacy Home packs.
 */

import type {
  EnterpriseBriefV1,
  EntityDetailV1,
  EntityExploreResultV1,
  EvidenceDescriptor,
  EvidenceGapResultV1,
  KnowledgeSearchHitV1,
  ModuleHandoffPreviewV1,
  ReceivingModule,
  RelationshipProjectionV1,
  SuggestedQuestionV1,
} from "../consumption-contracts";

/** The ten conditions fixtures must be able to demonstrate. */
export const FIXTURE_SCENARIOS = [
  "normal",
  "partial",
  "stale",
  "conflicting",
  "withheld",
  "not_measured",
  "not_loaded",
  "models_disabled",
  "newer_baseline",
  "api_failure_lkg",
] as const;
export type FixtureScenario = (typeof FIXTURE_SCENARIOS)[number];

export interface FixturePackMeta {
  fixtureOnly: true;
  /** Synthetic namespace, never a canonical tenant key. */
  tenantKey: `fixture-${string}`;
  displayName: string;
  industry: string;
  knowledgeBaselineRef: string;
  domainPublicationVersions: Record<string, string>;
  cubeSemanticModelVersion: string;
}

export interface FixturePack {
  meta: FixturePackMeta;
  brief: EnterpriseBriefV1;
  exploreLanding: EntityExploreResultV1;
  entityDetails: Record<string, EntityDetailV1>;
  relationships: RelationshipProjectionV1;
  evidence: EvidenceGapResultV1;
  searchDocs: KnowledgeSearchHitV1[];
  suggestedQuestions: SuggestedQuestionV1[];
  handoffPreviews: Partial<Record<ReceivingModule, ModuleHandoffPreviewV1>>;
  /** Keyed by evidenceRef, powering the evidence drawer. */
  evidenceDescriptors: Record<string, EvidenceDescriptor>;
}
