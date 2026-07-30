/**
 * KnowledgeUiViewModelAssembler implementation. Composes the real 8
 * KnowledgeConsumptionProvider queries into UI-ready view models. Performs no
 * fetch/HTTP/pg of its own — every call goes through `query.runtime.provider`
 * (the real ConsumptionRuntime, already bound to a tenant server-side upstream
 * of here). Never imports src/lib/knowledge/providers/** or
 * src/components/knowledge/** (enforced by eslint.config.mjs's
 * no-restricted-imports rule scoped to this directory).
 *
 * See reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * VIEW_MODEL_ASSEMBLER_INTERFACES.md for the full spec.
 */

import type {
  ConsumptionEnvelope,
  DomainReadinessV1,
  GovernedMetricValue,
  KnowledgeLens,
  KnowledgeMode,
} from "../consumption-contracts";
import {
  deriveReadiness,
  defaultUnavailableReason,
  readinessIsRenderable,
} from "./readiness";
import { isSourceIncomplete } from "./source-incomplete";
import { AIRLINE_LENS_DEFINITIONS, resolveAirlineLenses } from "./lenses";
import type {
  AirlineLensId,
  AssemblerQuery,
  AbarVaViewViewModel,
  AvaContextViewModel,
  ComponentReadinessState,
  CurrentVsTargetSide,
  CurrentVsTargetViewModel,
  DecisionReadinessRollup,
  DecisionReadinessViewModel,
  DecisionsWaitingViewModel,
  EnterpriseBriefViewModel,
  EnterpriseProfileViewModel,
  EvidenceAndGapsViewModel,
  ExploreInventoryViewModel,
  IndustryContextViewModel,
  KnowledgeUiViewModelAssembler,
  LeadershipAgendaViewModel,
  RelationshipNeighborhoodViewModel,
  ResolvedAirlineLens,
  StrategicContextViewModel,
  TopOpportunitiesViewModel,
  TopUseCasesViewModel,
  ViewModelEnvelope,
} from "./types";

function toRealLens(lens: AirlineLensId | undefined): KnowledgeLens {
  if (!lens) return "none";
  return (
    AIRLINE_LENS_DEFINITIONS.find((l) => l.lensId === lens)?.nearestRealLens ??
    "none"
  );
}

interface WrapOptions {
  readonly sourceIncomplete?: boolean;
  readonly restricted?: boolean;
  readonly proven?: boolean;
  readonly unavailableReasonOverride?: string;
}

function wrap<T>(
  env: ConsumptionEnvelope<unknown>,
  data: T,
  opts: WrapOptions = {},
): ViewModelEnvelope<T> {
  const readiness = deriveReadiness({
    availabilityState: env.availabilityState,
    authorityState: env.authorityState,
    freshnessState: env.freshnessState,
    warnings: env.warnings,
    sourceIncomplete: opts.sourceIncomplete,
    restricted: opts.restricted,
    proven: opts.proven,
  });
  const renderable = readinessIsRenderable(readiness);
  return {
    readiness,
    unavailableReason: renderable
      ? null
      : (opts.unavailableReasonOverride ?? defaultUnavailableReason(readiness)),
    data: renderable ? data : null,
    evidenceRefs: env.evidenceRefs,
    knownGapRefs: env.knownGapRefs,
    asOf: env.asOf,
    knowledgeBaselineRef: env.knowledgeBaselineRef,
    warnings: env.warnings,
  };
}

function unavailable<T>(
  env: ConsumptionEnvelope<unknown>,
  readiness: ComponentReadinessState,
  reason?: string,
): ViewModelEnvelope<T> {
  return {
    readiness,
    unavailableReason: reason ?? defaultUnavailableReason(readiness),
    data: null,
    evidenceRefs: env.evidenceRefs,
    knownGapRefs: env.knownGapRefs,
    asOf: env.asOf,
    knowledgeBaselineRef: env.knowledgeBaselineRef,
    warnings: env.warnings,
  };
}

function domainRollup(
  domain: DomainReadinessV1,
  env: ConsumptionEnvelope<unknown>,
): DecisionReadinessRollup {
  const readiness = deriveReadiness({
    availabilityState: domain.availabilityState,
    authorityState: env.authorityState,
    freshnessState: env.freshnessState,
    warnings: env.warnings,
  });
  return {
    domainKey: domain.domainKey,
    label: domain.label,
    readiness,
    openGapCount: readinessIsRenderable(readiness) ? domain.openGapCount : null,
  };
}

function metricSide(
  metric: GovernedMetricValue | null,
  env: ConsumptionEnvelope<unknown>,
): CurrentVsTargetSide {
  if (!metric) {
    return { readiness: "NOT_ASSESSED", value: null };
  }
  const readiness = deriveReadiness({
    availabilityState: metric.availabilityState,
    authorityState: env.authorityState,
    freshnessState: env.freshnessState,
    warnings: env.warnings,
  });
  return { readiness, value: readinessIsRenderable(readiness) ? metric : null };
}

async function getStrategicContextImpl(
  query: AssemblerQuery,
): Promise<ViewModelEnvelope<StrategicContextViewModel>> {
  const env = await query.runtime.provider.getEnterpriseBrief({
    tenantKey: query.tenantKey,
    depth: query.depth,
    lens: toRealLens(query.lens),
  });
  if (!env.data.interpretation) {
    return unavailable(
      env,
      "PROJECTION_UNAVAILABLE",
      "No AbarVa interpretation is pinned for this baseline yet.",
    );
  }
  return wrap(env, {
    interpretation: env.data.interpretation,
    lens: query.lens,
  });
}

export function createKnowledgeUiViewModelAssembler(): KnowledgeUiViewModelAssembler {
  return {
    async getEnterpriseBrief(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<EnterpriseBriefViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
        currentTargetScope: query.currentTargetScope,
      });
      return wrap(env, {
        identity: env.data.identity,
        headlineMetrics: env.data.headlineMetrics,
        domains: env.data.domains,
        topGapRefs: env.data.topGapRefs,
      });
    },

    async getEnterpriseProfile(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<EnterpriseProfileViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      return wrap(env, env.data.identity);
    },

    async getStrategicContext(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<StrategicContextViewModel>> {
      return getStrategicContextImpl(query);
    },

    async getLeadershipAgenda(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<LeadershipAgendaViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      const hasData = env.data.perspectives.length > 0;
      return wrap(
        env,
        { perspectives: env.data.perspectives },
        { sourceIncomplete: isSourceIncomplete("leadership_agenda", hasData) },
      );
    },

    async getIndustryContext(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<IndustryContextViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      return wrap(env, {
        benchmarks: env.data.benchmarks.filter(
          (b) => b.contentClass === "industry_benchmark",
        ),
        patterns: env.data.benchmarks.filter(
          (b) => b.contentClass === "industry_pattern",
        ),
      });
    },

    async getAbarVaView(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<AbarVaViewViewModel>> {
      return getStrategicContextImpl(query);
    },

    async getTopOpportunities(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<TopOpportunitiesViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      return wrap(env, {
        targets: env.data.targets,
        domains: env.data.domains,
      });
    },

    async getTopUseCases(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<TopUseCasesViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      return wrap(env, {
        patterns: env.data.benchmarks.filter(
          (b) => b.contentClass === "industry_pattern",
        ),
      });
    },

    async getDecisionsWaiting(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<DecisionsWaitingViewModel>> {
      const briefEnv = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      // Composition: combine domain readiness (Brief) with gap severity (Evidence & gaps).
      await query.runtime.provider.getEvidenceAndGaps({
        tenantKey: query.tenantKey,
      });
      const rollups = briefEnv.data.domains.map((d) =>
        domainRollup(d, briefEnv),
      );
      return wrap(briefEnv, { rollups });
    },

    async getExploreInventory(
      query: AssemblerQuery & { domainKey: string },
    ): Promise<ViewModelEnvelope<ExploreInventoryViewModel>> {
      const env = await query.runtime.provider.exploreEntities({
        tenantKey: query.tenantKey,
        domainKey: query.domainKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      return wrap(env, {
        domainKey: query.domainKey,
        entities: env.data.entities,
        totalCount: env.data.totalCount,
      });
    },

    async getRelationshipNeighborhood(
      query: AssemblerQuery & { focalEntityRefs: string[]; hopDepth: 1 | 2 },
    ): Promise<ViewModelEnvelope<RelationshipNeighborhoodViewModel>> {
      const env = await query.runtime.provider.getRelationships({
        tenantKey: query.tenantKey,
        knowledgeBaselineRef: query.runtime.baselineRef,
        focalEntityRefs: query.focalEntityRefs,
        direction: "both",
        hopDepth: query.hopDepth,
        currentTargetScope: query.currentTargetScope ?? "current",
        authorityMinimum: "accepted",
        maxNodes: 80,
        maxEdges: 150,
        // Fetch candidates too rather than silently dropping them — the assembler's job is to
        // tag every edge with its own readiness so the UI can render candidates dashed (an
        // explicit opt-in view), never to hide them from the neighborhood entirely.
        includeCandidates: true,
      });
      const edges = env.data.edges.map((edge) => ({
        ...edge,
        // For an individual relationship edge there is no separate "UI cite-render proof"
        // concept beyond its own governed authority/availability — unlike whole-page narrative
        // content, an edge's authorityState IS the full render-safety signal. So `proven: true`
        // here means "trust the edge's own authority/availability state," not "a screenshot
        // test exists." A candidate edge still cannot reach ENABLED_AND_PROVEN because
        // deriveReadiness routes candidate authority to DATA_RECONCILED_BUT_UI_UNPROVEN before
        // the `proven` flag is ever consulted (see readiness.ts step ordering) — this is what
        // keeps "solid vs dashed" correct: solid only for ENABLED_AND_PROVEN edges.
        readiness: deriveReadiness({
          availabilityState: edge.availabilityState,
          authorityState: edge.authorityState,
          freshnessState: env.freshnessState,
          warnings: env.warnings,
          proven: true,
        }),
      }));
      return wrap(env, {
        focalEntityRefs: env.data.focalEntityRefs,
        nodes: env.data.nodes,
        edges,
        truncated: env.data.truncated,
      });
    },

    async getEvidenceAndGaps(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<EvidenceAndGapsViewModel>> {
      const env = await query.runtime.provider.getEvidenceAndGaps({
        tenantKey: query.tenantKey,
      });
      return wrap(env, {
        gaps: env.data.gaps,
        overallEvidenceCoverage: env.data.overallEvidenceCoverage,
        severityCounts: env.data.severityCounts,
      });
    },

    async getCurrentVsTarget(
      query: AssemblerQuery & { entityRef?: string },
    ): Promise<ViewModelEnvelope<CurrentVsTargetViewModel>> {
      const env = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
        currentTargetScope: "both",
      });
      const target = query.entityRef
        ? (env.data.targets.find((t) => t.id === query.entityRef) ??
          env.data.targets[0])
        : env.data.targets[0];
      if (!target) {
        return unavailable(
          env,
          "PROJECTION_UNAVAILABLE",
          "No governed current/target comparison is defined for this baseline yet.",
        );
      }
      return wrap(env, {
        label: target.label,
        current: metricSide(target.current, env),
        target: metricSide(target.target, env),
      });
    },

    async getDecisionReadiness(
      query: AssemblerQuery,
    ): Promise<ViewModelEnvelope<DecisionReadinessViewModel>> {
      const briefEnv = await query.runtime.provider.getEnterpriseBrief({
        tenantKey: query.tenantKey,
        depth: query.depth,
        lens: toRealLens(query.lens),
      });
      const gapsEnv = await query.runtime.provider.getEvidenceAndGaps({
        tenantKey: query.tenantKey,
      });
      const domains = briefEnv.data.domains.map((d) =>
        domainRollup(d, briefEnv),
      );
      return wrap(briefEnv, {
        domains,
        overallEvidenceCoverage: readinessIsRenderable(
          deriveReadiness({
            availabilityState: gapsEnv.availabilityState,
            authorityState: gapsEnv.authorityState,
            freshnessState: gapsEnv.freshnessState,
            warnings: gapsEnv.warnings,
          }),
        )
          ? gapsEnv.data.overallEvidenceCoverage
          : null,
      });
    },

    async getAvaContext(
      query: AssemblerQuery & { mode: KnowledgeMode },
    ): Promise<ViewModelEnvelope<AvaContextViewModel>> {
      const env = await query.runtime.provider.getSuggestedQuestions({
        tenantKey: query.tenantKey,
        mode: query.mode,
      });
      return wrap(env, {
        suggestedQuestions: env.data,
        modelsEnabled: query.runtime.modelsEnabled,
      });
    },

    async listAirlineLenses(
      query: AssemblerQuery,
    ): Promise<readonly ResolvedAirlineLens[]> {
      const env = await query.runtime.provider.exploreEntities({
        tenantKey: query.tenantKey,
      });
      const available = new Set(
        env.data.domains
          .filter((d) => d.availabilityState === "available")
          .map((d) => d.domainKey),
      );
      return resolveAirlineLenses(available);
    },
  };
}
