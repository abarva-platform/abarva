"use client";

/**
 * useOperationsLens — orchestrates the Operations & Vendor Intelligence lens over
 * the EXISTING governed provider methods (explore / relationships / evidence-gaps
 * / brief / suggested-questions). It adds no new endpoint and no new source of
 * truth: it composes envelopes the provider already returns, so it lights up
 * automatically once a real baseline is active behind the HTTP provider.
 *
 * Every provider call is settled independently. A rejected or empty call becomes
 * an explicit unavailable state — never a fixture fallback and never a fabricated
 * zero. If the baseline anchor (brief) itself is unavailable, the lens reports a
 * "no active baseline / projections unavailable" state rather than rendering.
 */

import { useEffect, useMemo, useState } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type {
  ConsumptionEnvelope,
  ConsumptionWarning,
  DepthLevel,
  EnterpriseBriefV1,
  EntityExploreResultV1,
  EntitySummaryV1,
  KnowledgeLens,
  RelationshipProjectionV1,
  SuggestedQuestionV1,
} from "@/lib/knowledge/consumption-contracts";
import {
  composeCapabilities,
  composeOverview,
  composeVendorList,
  type CapabilityView,
  type LensSource,
  type OperationsOverview,
} from "@/lib/knowledge/operations-lens";

export interface LensBaselineMeta {
  tenantKey: string;
  knowledgeBaselineRef: string;
  asOf: string;
  freshnessState: string;
  availabilityState: string;
  contentHash: string;
  projectionContractVersion: string;
  domainPublicationVersions: Record<string, string>;
  providerKind: string;
}

export interface OperationsLensResult {
  loading: boolean;
  /** Set when the baseline anchor is unavailable (no active baseline / API down). */
  unavailable: string | null;
  meta: LensBaselineMeta | null;
  source: LensSource | null;
  overview: OperationsOverview | null;
  capabilities: CapabilityView[];
  vendors: ReturnType<typeof composeVendorList>;
  suggestedQuestions: SuggestedQuestionV1[];
  warnings: ConsumptionWarning[];
  /** Domains whose projection failed to load (surfaced, not hidden). */
  unavailableSources: string[];
}

async function settle<T>(p: Promise<ConsumptionEnvelope<T>>): Promise<ConsumptionEnvelope<T> | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export function useOperationsLens(depth: DepthLevel, lens: KnowledgeLens): OperationsLensResult {
  const runtime = useConsumption();
  const tenantKey = runtime.binding.tenantKey;

  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [meta, setMeta] = useState<LensBaselineMeta | null>(null);
  const [source, setSource] = useState<LensSource | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestionV1[]>([]);
  const [warnings, setWarnings] = useState<ConsumptionWarning[]>([]);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setUnavailable(null);

    (async () => {
      const base = { tenantKey, depth, lens };

      // Baseline anchor first — if this fails there is no governed baseline to show.
      const briefEnv = await settle(runtime.provider.getEnterpriseBrief(base));
      if (!alive) return;
      if (!briefEnv) {
        setUnavailable(
          "No active Knowledge Baseline is available for this tenant. Operations & Vendor Intelligence renders once a baseline and its consumption projections are activated.",
        );
        setLoading(false);
        return;
      }
      // A fully-suppressed baseline (whole projection not loaded / withheld) must
      // render as an explicit unavailable state — never as zero counts that read
      // as "there are none".
      if (briefEnv.availabilityState === "not_loaded" || briefEnv.availabilityState === "withheld") {
        setUnavailable(
          briefEnv.availabilityState === "withheld"
            ? "The knowledge projections for this baseline are withheld. Operations & Vendor Intelligence renders when the projections are available."
            : "The knowledge projections for this baseline are not loaded. Operations & Vendor Intelligence renders once the consumption projections are available.",
        );
        setLoading(false);
        return;
      }

      const [techEnv, vendorsEnv, risksEnv, programsEnv, gapsEnv, sqEnv] =
        await Promise.all([
          settle(runtime.provider.exploreEntities({ ...base, domainKey: "technology", pageSize: 200 })),
          settle(runtime.provider.exploreEntities({ ...base, domainKey: "vendors", pageSize: 200 })),
          settle(runtime.provider.exploreEntities({ ...base, domainKey: "risks", pageSize: 200 })),
          settle(runtime.provider.exploreEntities({ ...base, domainKey: "programs", pageSize: 200 })),
          settle(runtime.provider.getEvidenceAndGaps(base)),
          settle(runtime.provider.getSuggestedQuestions({ ...base, mode: "explore" })),
        ]);
      if (!alive) return;

      // Relationships are seeded by the applications we just resolved, so the graph
      // covers the connective tissue (app↔vendor↔risk) the lens links across.
      const relEnv = await settle(
        runtime.provider.getRelationships({
          ...base,
          knowledgeBaselineRef: briefEnv.knowledgeBaselineRef,
          focalEntityRefs: entityRefsOf(techEnv?.data.entities ?? []),
          direction: "both",
          hopDepth: 2,
          currentTargetScope: "both",
          authorityMinimum: "accepted",
          includeCandidates: true,
          maxNodes: 200,
          maxEdges: 400,
        }),
      );
      if (!alive) return;

      const missing: string[] = [];
      const entitiesOf = (env: ConsumptionEnvelope<EntityExploreResultV1> | null, name: string): EntitySummaryV1[] => {
        if (!env) { missing.push(name); return []; }
        return env.data.entities;
      };

      const techEntities = entitiesOf(techEnv, "technology");
      const vendorEntities = entitiesOf(vendorsEnv, "vendors");
      const riskEntities = entitiesOf(risksEnv, "risks");
      const programEntities = entitiesOf(programsEnv, "programs");
      if (!gapsEnv) missing.push("evidence-gaps");
      if (!relEnv) missing.push("relationships");

      // Split the technology and vendors domains by governed entityType.
      const applications = techEntities.filter((e) => e.entityType === "application");
      const vendors = vendorEntities.filter((e) => e.entityType === "vendor");
      const contracts = vendorEntities.filter((e) => e.entityType === "contract");

      const domains =
        briefEnv.data.domains.length > 0
          ? briefEnv.data.domains
          : dedupeDomains([
              techEnv?.data.domains ?? [],
              vendorsEnv?.data.domains ?? [],
              risksEnv?.data.domains ?? [],
              programsEnv?.data.domains ?? [],
            ]);

      const relationships: RelationshipProjectionV1 =
        relEnv?.data ?? emptyRel();

      const composedSource: LensSource = {
        asOf: briefEnv.asOf,
        applications,
        vendors,
        contracts,
        risks: riskEntities.filter((e) => e.entityType === "risk" || e.domainKey === "risks"),
        programs: programEntities.filter((e) => e.entityType === "program" || e.domainKey === "programs"),
        relationships,
        gaps: gapsEnv?.data.gaps ?? [],
        overallEvidenceCoverage: gapsEnv?.data.overallEvidenceCoverage ?? null,
        domains,
      };

      const collectedWarnings = dedupeWarnings(
        [briefEnv, techEnv, vendorsEnv, risksEnv, programsEnv, gapsEnv, relEnv]
          .filter(Boolean)
          .flatMap((e) => (e as ConsumptionEnvelope<unknown>).warnings),
      );

      setMeta({
        tenantKey: briefEnv.tenantKey,
        knowledgeBaselineRef: briefEnv.knowledgeBaselineRef,
        asOf: briefEnv.asOf,
        freshnessState: briefEnv.freshnessState,
        availabilityState: briefEnv.availabilityState,
        contentHash: briefEnv.contentHash,
        projectionContractVersion: briefEnv.projectionContractVersion,
        domainPublicationVersions: briefEnv.domainPublicationVersions,
        providerKind: runtime.binding.kind,
      });
      setSource(composedSource);
      setSuggestedQuestions(sqEnv?.data ?? []);
      setWarnings(collectedWarnings);
      setUnavailableSources(missing);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [runtime, tenantKey, depth, lens]);

  const overview = useMemo(() => (source ? composeOverview(source) : null), [source]);
  const capabilities = useMemo(() => (source ? composeCapabilities(source) : []), [source]);
  const vendors = useMemo(() => (source ? composeVendorList(source) : []), [source]);

  return {
    loading,
    unavailable,
    meta,
    source,
    overview,
    capabilities,
    vendors,
    suggestedQuestions,
    warnings,
    unavailableSources,
  };
}

// --- helpers -------------------------------------------------------------

function entityRefsOf(entities: EntitySummaryV1[]): string[] {
  return entities.filter((e) => e.entityType === "application").map((e) => e.entityRef);
}

function emptyRel(): RelationshipProjectionV1 {
  return {
    focalEntityRefs: [],
    nodes: [],
    edges: [],
    evidenceByEdge: {},
    truncated: false,
    aggregationApplied: false,
    omittedNodeCount: 0,
    acceptedEdgeCount: 0,
    candidateEdgeCount: 0,
    openGapCount: 0,
  };
}

function dedupeDomains(lists: EnterpriseBriefV1["domains"][]): EnterpriseBriefV1["domains"] {
  const seen = new Map<string, EnterpriseBriefV1["domains"][number]>();
  for (const list of lists) for (const d of list) if (!seen.has(d.domainKey)) seen.set(d.domainKey, d);
  return Array.from(seen.values());
}

function dedupeWarnings(ws: ConsumptionWarning[]): ConsumptionWarning[] {
  const seen = new Set<string>();
  const out: ConsumptionWarning[] = [];
  for (const w of ws) {
    const k = `${w.code}:${w.scope ?? ""}`;
    if (!seen.has(k)) { seen.add(k); out.push(w); }
  }
  return out;
}
