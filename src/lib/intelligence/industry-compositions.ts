import {
  getIndustryItems,
  getIndustryVertical,
  type IndustryCategoryKey,
  type IndustryKnowledgeItem,
  type IndustryVerticalKey,
} from '@/lib/intelligence/industry-knowledge';

export type IndustryCompositionKind = 'topic' | 'pattern';

export interface IndustryCompositionSection {
  categoryKey: IndustryCategoryKey;
  title: string;
  itemIds: string[];
}

export interface IndustryCompositionDefinition {
  kind: IndustryCompositionKind;
  artifactKey: string;
  verticalKey: IndustryVerticalKey;
  slug: string;
  title: string;
  subtitle: string;
  intro: string[];
  timeStampedPov: string[];
  observedFailureModes: string[];
  refusals: string[];
  decisionArchitecture: string[];
  sections: IndustryCompositionSection[];
}

export interface ResolvedIndustryCompositionSection extends IndustryCompositionSection {
  items: IndustryKnowledgeItem[];
  abarvaPov: string;
}

export interface ResolvedIndustryComposition extends IndustryCompositionDefinition {
  verticalLabel: string;
  resolvedSections: ResolvedIndustryCompositionSection[];
}

const COMPOSITIONS: IndustryCompositionDefinition[] = [
  {
    kind: 'topic',
    artifactKey: 'analytics_modernization',
    verticalKey: 'healthcare-provider',
    slug: 'analytics-modernization-healthcare-provider',
    title: 'Analytics Modernization × Healthcare Provider',
    subtitle:
      'A provider-specific read on how Clarity, Caboodle, Cosmos, Epic-on-Azure, and cloud data-platform choices reshape the 2026 modernization conversation.',
    intro: [
      'Healthcare analytics modernization is no longer a generic cloud migration story. In 2026 it is a coexistence problem: what stays in Epic, what leaves it, and how to keep the decision grounded in operational reporting, regulatory posture, and clinician trust instead of architecture fashion.',
      'The mistake we keep seeing is a false binary. Teams frame the work as Clarity versus cloud, or Epic versus modern analytics, when the real design choice is workload-by-workload. Research, operational reporting, cross-domain analytics, and natural-language access each behave differently and deserve different evidence thresholds.',
      'This page composes the healthcare-provider industry layer against the Analytics Modernization topic so a sponsor can see the current ecosystem, the regulatory edges, the decision-makers who actually matter, and the anti-patterns that repeatedly derail the work.',
    ],
    timeStampedPov: [
      'What changed in 2025-2026 is Epic-on-Azure. It removed one of the old straw-man modernization arguments, because the question is no longer whether Epic can have cloud proximity. The harder question is how far you can push analytics ambition while still respecting the managed Epic boundary.',
      'At the same time, ambient documentation and clinician-facing AI raised the stakes on where data products live. The integration surface is no longer just dashboards and batch reporting. It is workflow-adjacent intelligence that has to land where clinicians already work.',
      'That is why the Clarity-versus-Caboodle-versus-Cosmos confusion matters more now. Each solves a different problem, and treating them as substitutes creates architecture debt before the first migration wave begins.',
    ],
    observedFailureModes: [
      'The system picks a warehouse before it decides which workloads actually need to move, so the architecture is optimized for fashion rather than for refresh discipline.',
      'Caboodle is treated as the modernization answer, which works until claims, pharmacy, or cross-system analytics become board-visible and the model starts fighting the question.',
      'Master patient identity is deferred under the logic that platform migration should come first; six months later MPI becomes the gating risk on every cross-domain use case.',
      'The program is framed as a CIO or data-platform effort without CMIO sponsorship, which makes the clinician-facing adoption path structurally weak before it starts.',
    ],
    refusals: [
      "We would not recommend a Caboodle-only path when non-Epic data is already material to the sponsor's outcome question.",
      "We would not let Cosmos stand in for an operational analytics strategy because its research value and operational value are simply not the same thing.",
      'We would not allow Epic-on-Azure to become shorthand for "cloud solved it" when refresh cadence, identity, and workflow integration remain unresolved.',
    ],
    decisionArchitecture: [
      'Start by separating operational reporting, cross-domain analytics, research, and clinician-facing AI into four distinct workload classes.',
      'Prove the identity and refresh model before selecting the long-term warehouse pattern; if MPI and cadence are weak, warehouse choice is a distraction.',
      'Secure the actual sponsor triangle early: CIO for platform, CDO for analytics, and CMIO for workflow legitimacy.',
      'Use third-party analytics-service fragmentation as evidence, not as the architecture. The real decision is what to retain, what to rationalize, and what to absorb into the internal cloud foundation.',
    ],
    sections: [
      {
        categoryKey: 'ecosystem-map',
        title: 'Ecosystem forces shaping the modernization path',
        itemIds: ['epic_clarity', 'epic_caboodle', 'epic_cosmos', 'epic_on_azure', 'snowflake', 'databricks'],
      },
      {
        categoryKey: 'sub-verticals',
        title: 'Provider sub-verticals where the economics change',
        itemIds: ['academic_medical_center', 'integrated_delivery_network'],
      },
      {
        categoryKey: 'regulatory',
        title: 'Regulatory posture that changes the design',
        itemIds: ['hipaa', 'onc_cures_act'],
      },
      {
        categoryKey: 'ai-vendor-landscape',
        title: 'AI and integration surfaces that now matter to analytics decisions',
        itemIds: ['epic_cds_hooks', 'databricks_genie', 'abridge', 'comet_vendor'],
      },
      {
        categoryKey: 'decision-makers',
        title: 'Seats that must co-own the decision',
        itemIds: ['cmio', 'cdo_health', 'cio'],
      },
      {
        categoryKey: 'anti-patterns',
        title: 'Refusals that protect the program',
        itemIds: ['cosmos_substitution', 'caboodle_only_path', 'mpi_deferral'],
      },
      {
        categoryKey: 'third-party-analytics-services',
        title: 'Fragmented third-party services that shape the baseline',
        itemIds: ['innovaccer', 'health_catalyst', 'arcadia'],
      },
    ],
  },
  {
    kind: 'pattern',
    artifactKey: 'apex_pattern_owned_brand_margin_underperformance',
    verticalKey: 'retail',
    slug: 'owned-brand-margin-retail',
    title: 'Owned Brand Margin × Retail',
    subtitle:
      'A retail-specific read on how pricing, sourcing, cloud data foundations, merchant sponsorship, and third-party signals shape the owned-brand margin pattern.',
    intro: [
      'Owned-brand margin underperformance is not a single-function problem. The leak shows up in gross margin, but the causal chain usually spans merchandising, pricing, sourcing, freight, promo, shrink, and the way the retailer has wired data authority across those teams.',
      'That is why the retail vertical matters. A generic analytics recommendation misses the real seats, the real regulatory edges, and the way mass, grocery, luxury, or DTC economics change what "good" looks like.',
      'This page composes the retail industry layer against the owned-brand margin pattern so the sponsor sees both the live tooling landscape and the deeper operating model choices underneath Morrison-style margin failure.',
    ],
    timeStampedPov: [
      'The 2026 change is that private-label margin recovery has become a CFO-level priority across mass and grocery, not just a merchandising initiative. That changes sponsorship and raises the bar on evidence.',
      'At the same time, Snowflake and Databricks made internal attribution builds much more plausible, which is why more retailers are asking whether they still need as many external analytics providers around pricing, assortment, and customer science.',
      'The result is a sharper question: which external signal providers still add differentiated insight, and which ones are now compensating for a retailer-owned data foundation that should already exist.',
    ],
    observedFailureModes: [
      'Pricing teams optimize against national-brand benchmarks while ignoring the owned-brand elasticity and landed-cost reality that actually determines margin.',
      'Merchants are consulted after the architecture is defined, which means the data model lacks the category logic and operating exceptions that determine whether the recommendations survive contact with the business.',
      'Promo AI is turned on without reconnecting promo decisions to freight, sourcing, and shrink, so the retailer automates the leak instead of fixing it.',
      'Teams try to solve the problem with another CDP or personalization purchase when the real blocker is item master, vendor hierarchy, and cross-functional attribution.',
    ],
    refusals: [
      "We would not treat owned-brand margin recovery as a pricing-only project when the failure lives across promo, sourcing, and operations.",
      "We would not start with a vendor bake-off while item-master quality and cost attribution remain weak.",
      "We would not let Chief Merchant sit outside the ownership circle for a margin-focused program; if the merchant isn't in, the program won't stick.",
    ],
    decisionArchitecture: [
      'Establish the source-of-truth stack first: item master, landed-cost decomposition, pricing and promo telemetry, and category-level margin views.',
      'Put Chief Merchant, CFO, and the data/platform owner in the same decision room before evaluating tooling changes.',
      'Separate what must be solved with internal attribution models from what external partners still do better because they bring differentiated signal or market data.',
      'Sequence interventions so promo and pricing changes do not outrun sourcing and operational cost visibility.',
    ],
    sections: [
      {
        categoryKey: 'ecosystem-map',
        title: 'Retail architecture around the margin problem',
        itemIds: ['oracle_retail', 'blue_yonder', 'snowflake_retail', 'databricks_retail', 'gcp_retail'],
      },
      {
        categoryKey: 'sub-verticals',
        title: 'Sub-verticals where owned-brand economics differ',
        itemIds: ['mass_merchant', 'grocery', 'specialty_apparel'],
      },
      {
        categoryKey: 'regulatory',
        title: 'Regulatory and compliance edges that still matter',
        itemIds: ['ccpa_cpra', 'ftc_section_5', 'tariff_and_sourcing_compliance'],
      },
      {
        categoryKey: 'ai-vendor-landscape',
        title: 'Vendor categories that influence owned-brand margin recovery',
        itemIds: ['revionics', 'nielseniq_circana', 'persado', 'luminate_o9_kinaxis_anaplan'],
      },
      {
        categoryKey: 'decision-makers',
        title: 'Seats that control whether the program sticks',
        itemIds: ['chief_merchant', 'cfo_retail', 'cdo_retail', 'supply_chain'],
      },
      {
        categoryKey: 'anti-patterns',
        title: 'Refusals that keep the work honest',
        itemIds: ['item_master_first', 'promo_without_ops_loop', 'merchant_consultation_only', 'generic_cdp_identity'],
      },
      {
        categoryKey: 'third-party-analytics-services',
        title: 'External signal providers worth evaluating against internal builds',
        itemIds: ['dunnhumby', 'circana', 'niq', 'affinity_placer_similarweb'],
      },
    ],
  },
];

function resolveComposition(definition: IndustryCompositionDefinition): ResolvedIndustryComposition {
  const vertical = getIndustryVertical(definition.verticalKey);
  const resolvedSections = definition.sections.map((section) => ({
    ...section,
    items: getIndustryItems(definition.verticalKey, section.categoryKey, section.itemIds),
    abarvaPov: vertical.categories[section.categoryKey].abarvaPov,
  }));

  return {
    ...definition,
    verticalLabel: vertical.label,
    resolvedSections,
  };
}

export function getTopicIndustryCompositions(topicKey: string): ResolvedIndustryComposition[] {
  return COMPOSITIONS
    .filter((composition) => composition.kind === 'topic' && composition.artifactKey === topicKey)
    .map(resolveComposition);
}

export function getPatternIndustryCompositions(patternKey: string): ResolvedIndustryComposition[] {
  return COMPOSITIONS
    .filter((composition) => composition.kind === 'pattern' && composition.artifactKey === patternKey)
    .map(resolveComposition);
}

export function getTopicIndustryComposition(
  topicKey: string,
  verticalKey: IndustryVerticalKey,
): ResolvedIndustryComposition | null {
  const composition = COMPOSITIONS.find(
    (entry) => entry.kind === 'topic' && entry.artifactKey === topicKey && entry.verticalKey === verticalKey,
  );
  return composition ? resolveComposition(composition) : null;
}

export function getPatternIndustryComposition(
  patternKey: string,
  verticalKey: IndustryVerticalKey,
): ResolvedIndustryComposition | null {
  const composition = COMPOSITIONS.find(
    (entry) => entry.kind === 'pattern' && entry.artifactKey === patternKey && entry.verticalKey === verticalKey,
  );
  return composition ? resolveComposition(composition) : null;
}
