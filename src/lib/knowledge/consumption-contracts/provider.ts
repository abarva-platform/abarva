/**
 * The KnowledgeConsumptionProvider boundary. React components consume ONLY this
 * interface. They must not know whether the active provider is the contract
 * fixture provider or the real HTTP consumption API. Both implementations must
 * be interchangeable without any component change.
 *
 * Every method returns a ConsumptionEnvelope so governance metadata, evidence
 * refs, known-gap refs and warnings always travel with the data.
 */

import type { ConsumptionEnvelope } from "./core";
import type {
  EnterpriseBriefQuery,
  EntityDetailQuery,
  EntityExploreQuery,
  EvidenceGapQuery,
  KnowledgeSearchQuery,
  SuggestedQuestionQuery,
} from "./queries";
import type {
  EnterpriseBriefV1,
  EntityDetailV1,
  EntityExploreResultV1,
  EvidenceGapResultV1,
  KnowledgeSearchResultV1,
  SuggestedQuestionV1,
} from "./projections";
import type { RelationshipProjectionV1, RelationshipQuery } from "./relationships";
import type { ModuleHandoffPreviewV1, ModuleHandoffQuery } from "./handoff";

export interface KnowledgeConsumptionProvider {
  getEnterpriseBrief(
    query: EnterpriseBriefQuery,
  ): Promise<ConsumptionEnvelope<EnterpriseBriefV1>>;

  exploreEntities(
    query: EntityExploreQuery,
  ): Promise<ConsumptionEnvelope<EntityExploreResultV1>>;

  getEntityDetail(
    query: EntityDetailQuery,
  ): Promise<ConsumptionEnvelope<EntityDetailV1>>;

  getRelationships(
    query: RelationshipQuery & { tenantKey: string },
  ): Promise<ConsumptionEnvelope<RelationshipProjectionV1>>;

  getEvidenceAndGaps(
    query: EvidenceGapQuery,
  ): Promise<ConsumptionEnvelope<EvidenceGapResultV1>>;

  searchKnowledge(
    query: KnowledgeSearchQuery,
  ): Promise<ConsumptionEnvelope<KnowledgeSearchResultV1>>;

  getSuggestedQuestions(
    query: SuggestedQuestionQuery,
  ): Promise<ConsumptionEnvelope<SuggestedQuestionV1[]>>;

  previewModuleHandoff(
    query: ModuleHandoffQuery,
  ): Promise<ConsumptionEnvelope<ModuleHandoffPreviewV1>>;
}

/** The identity a provider is bound to. Resolved server-side, never browser-trusted. */
export interface ProviderBinding {
  /** Which implementation is active — surfaced in Proof depth for transparency. */
  kind: "contract_fixture" | "http_consumption_api";
  tenantKey: string;
  /** For fixtures, the fixture scenario in play (e.g. "normal", "partial"). */
  fixtureScenario?: string;
}
