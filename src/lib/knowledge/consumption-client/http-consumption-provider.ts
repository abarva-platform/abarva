/**
 * HttpConsumptionApiProvider — the real-API implementation of the SAME
 * KnowledgeConsumptionProvider interface. It calls published consumption APIs
 * over HTTP, validates every response's envelope metadata against the shared
 * zod schema, and retains a last-known-good response so a transient API failure
 * degrades to LKG rather than a blank page.
 *
 * The consumption API endpoints do NOT exist yet (they are on the backend gap
 * register). Until they are published, this provider is wired but inert: each
 * method issues its request and, on failure, surfaces LKG or a typed error.
 * Components never change when this replaces the fixture provider.
 *
 * The browser NEVER receives Cube credentials, SQL, or graph-query capability —
 * it only calls these narrow, governed endpoints.
 */

import type {
  ConsumptionEnvelope,
  EnterpriseBriefQuery,
  EnterpriseBriefV1,
  EntityDetailQuery,
  EntityDetailV1,
  EntityExploreQuery,
  EntityExploreResultV1,
  EvidenceGapQuery,
  EvidenceGapResultV1,
  KnowledgeConsumptionProvider,
  KnowledgeSearchQuery,
  KnowledgeSearchResultV1,
  ModuleHandoffPreviewV1,
  ModuleHandoffQuery,
  ProviderBinding,
  RelationshipProjectionV1,
  RelationshipQuery,
  SuggestedQuestionQuery,
  SuggestedQuestionV1,
} from "../consumption-contracts";
import { envelopeMetaSchema } from "../consumption-contracts";

export interface HttpProviderOptions {
  /** Base path for the published consumption API. Server resolves the tenant. */
  basePath?: string;
  /** Injected fetch (tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE = "/api/knowledge/consumption";

export class HttpConsumptionApiProvider
  implements KnowledgeConsumptionProvider
{
  readonly binding: ProviderBinding;
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;
  /** Last-known-good cache keyed by endpoint+query hash. */
  private readonly lkg = new Map<string, ConsumptionEnvelope<unknown>>();

  constructor(tenantKey: string, opts: HttpProviderOptions = {}) {
    this.base = opts.basePath ?? DEFAULT_BASE;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.binding = { kind: "http_consumption_api", tenantKey };
  }

  private async call<T>(
    path: string,
    body: unknown,
  ): Promise<ConsumptionEnvelope<T>> {
    const cacheKey = `${path}:${JSON.stringify(body)}`;
    try {
      const res = await this.fetchImpl(`${this.base}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`consumption API ${path} → HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      // Validate envelope metadata (data payload validated per-mode at call sites/tests).
      const meta = { ...(json as Record<string, unknown>) };
      delete meta.data;
      const parsed = envelopeMetaSchema.safeParse(meta);
      if (!parsed.success) {
        throw new Error(
          `consumption API ${path} returned an envelope that violates the contract: ${parsed.error.message}`,
        );
      }
      const envelope = json as ConsumptionEnvelope<T>;
      this.lkg.set(cacheKey, envelope as ConsumptionEnvelope<unknown>);
      return envelope;
    } catch (err) {
      const cached = this.lkg.get(cacheKey);
      if (cached) {
        return {
          ...(cached as ConsumptionEnvelope<T>),
          freshnessState: "stale",
          warnings: [
            ...cached.warnings,
            {
              code: "last_known_good",
              message:
                "The consumption API is unavailable; showing the last known-good response.",
            },
          ],
        };
      }
      throw new ConsumptionApiUnavailableError(path, err);
    }
  }

  getEnterpriseBrief(q: EnterpriseBriefQuery) {
    return this.call<EnterpriseBriefV1>("/enterprise-brief", q);
  }
  exploreEntities(q: EntityExploreQuery) {
    return this.call<EntityExploreResultV1>("/explore", q);
  }
  getEntityDetail(q: EntityDetailQuery) {
    return this.call<EntityDetailV1>("/entity-detail", q);
  }
  getRelationships(q: RelationshipQuery & { tenantKey: string }) {
    return this.call<RelationshipProjectionV1>("/relationships", q);
  }
  getEvidenceAndGaps(q: EvidenceGapQuery) {
    return this.call<EvidenceGapResultV1>("/evidence-gaps", q);
  }
  searchKnowledge(q: KnowledgeSearchQuery) {
    return this.call<KnowledgeSearchResultV1>("/search", q);
  }
  getSuggestedQuestions(q: SuggestedQuestionQuery) {
    return this.call<SuggestedQuestionV1[]>("/suggested-questions", q);
  }
  previewModuleHandoff(q: ModuleHandoffQuery) {
    return this.call<ModuleHandoffPreviewV1>("/module-handoff-preview", q);
  }
}

export class ConsumptionApiUnavailableError extends Error {
  constructor(readonly path: string, readonly cause: unknown) {
    super(
      `Consumption API "${path}" is not available and no last-known-good response is cached. ` +
        `The published consumption endpoints are on the backend gap register.`,
    );
    this.name = "ConsumptionApiUnavailableError";
  }
}
