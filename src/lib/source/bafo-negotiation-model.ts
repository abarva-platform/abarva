// 12 lever types
export type BafoLeverType =
  | 'price' | 'scope' | 'term' | 'transition' | 'governance'
  | 'liability' | 'exclusion' | 'timing' | 'volume'
  | 'service_level' | 'evidence' | 'payment_terms';

export type BafoNegotiationOpportunityStrength = 'strong' | 'moderate' | 'weak';
export type BafoNegotiationRiskLevel = 'high' | 'medium' | 'low';
export type BafoNegotiationAskType = 'price_reduction' | 'scope_clarification' | 'evidence_request' | 'term_adjustment' | 'governance_change';
export type BafoScenarioOutcome = 'accept' | 'counter' | 'reject' | 'escalate';

export interface BafoNegotiationLever {
  leverType: BafoLeverType;
  description: string;
  currentPosition: string;
  targetPosition: string;
  rationale: string;
  estimatedValueImpact: string; // e.g., "5-8% cost reduction"
}

export interface BafoNegotiationOpportunity {
  opportunityId: string;
  vendorId: string;
  vendorName: string;
  lever: BafoLeverType;
  description: string;
  strength: BafoNegotiationOpportunityStrength;
  evidenceRequired: string[];
  estimatedImpact: string;
}

export interface BafoNegotiationRisk {
  riskId: string;
  leverType: BafoLeverType;
  description: string;
  level: BafoNegotiationRiskLevel;
  mitigation: string;
}

export interface BafoNegotiationAsk {
  askId: string;
  askType: BafoNegotiationAskType;
  vendorId: string;
  lever: BafoLeverType;
  statement: string;
  justification: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BafoNegotiationScenario {
  scenarioId: string;
  name: string;
  description: string;
  leversActivated: BafoLeverType[];
  asks: BafoNegotiationAsk[];
  risks: BafoNegotiationRisk[];
  expectedOutcome: BafoScenarioOutcome;
  estimatedTotalImpact: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface BafoRecommendation {
  recommendationId: string;
  summary: string;
  primaryLever: BafoLeverType;
  supportingLevers: BafoLeverType[];
  rationale: string;
  urgency: 'immediate' | 'next_session' | 'deferred';
}

export interface BafoNegotiationModelInput {
  eventId: string;
  eventName: string;
  vendorIds: string[];
  stage: string;
}

export interface BafoSummary {
  eventId: string;
  eventName: string;
  stage: string;
  generatedAt: string;
  opportunities: BafoNegotiationOpportunity[];
  levers: BafoNegotiationLever[];
  risks: BafoNegotiationRisk[];
  scenarios: BafoNegotiationScenario[];
  recommendations: BafoRecommendation[];
  totalLeversActivated: number;
  highPriorityAsks: number;
  estimatedAggregateImpact: string;
  modelVersion: '1.0';
}

export function buildBafoNegotiationSummary(input: BafoNegotiationModelInput): BafoSummary {
  // Deterministic seeded builder — no model calls, no network calls
  const opportunities: BafoNegotiationOpportunity[] = input.vendorIds.map((vendorId, i) => ({
    opportunityId: `opp-${vendorId}-price`,
    vendorId,
    vendorName: `Vendor ${i + 1}`,
    lever: 'price' as BafoLeverType,
    description: 'Seeded pricing opportunity based on market benchmark delta',
    strength: 'moderate' as BafoNegotiationOpportunityStrength,
    evidenceRequired: ['market-benchmark', 'tco-model'],
    estimatedImpact: '4-7% cost reduction',
  }));

  const levers: BafoNegotiationLever[] = [
    {
      leverType: 'price',
      description: 'Base pricing adjustment vs. benchmark',
      currentPosition: 'Vendor quote',
      targetPosition: 'Market median minus 5%',
      rationale: 'Competitive market pressure',
      estimatedValueImpact: '5-8% cost reduction',
    },
    {
      leverType: 'scope',
      description: 'Scope clarification to eliminate gold-plating',
      currentPosition: 'Broad scope with ambiguous inclusions',
      targetPosition: 'Explicit scope with exclusions listed',
      rationale: 'Reduces scope creep risk',
      estimatedValueImpact: '2-3% cost reduction',
    },
    {
      leverType: 'governance',
      description: 'Governance model for performance accountability',
      currentPosition: 'Informal reviews',
      targetPosition: 'Monthly SLA review with penalty triggers',
      rationale: 'Accountability drives performance',
      estimatedValueImpact: 'Risk reduction',
    },
  ];

  const risks: BafoNegotiationRisk[] = [
    {
      riskId: 'risk-price-anchor',
      leverType: 'price',
      description: 'Aggressive price ask may trigger vendor withdrawal',
      level: 'medium' as BafoNegotiationRiskLevel,
      mitigation: 'Frame as market alignment, not adversarial demand',
    },
  ];

  const asks: BafoNegotiationAsk[] = input.vendorIds.flatMap((vendorId) => [
    {
      askId: `ask-${vendorId}-price`,
      askType: 'price_reduction' as BafoNegotiationAskType,
      vendorId,
      lever: 'price' as BafoLeverType,
      statement: 'Provide revised pricing aligned to market median',
      justification: 'Market benchmark analysis shows 5-8% delta',
      priority: 'high' as const,
    },
    {
      askId: `ask-${vendorId}-scope`,
      askType: 'scope_clarification' as BafoNegotiationAskType,
      vendorId,
      lever: 'scope' as BafoLeverType,
      statement: 'Provide explicit exclusion list and dependency assumptions',
      justification: 'Ambiguous scope creates downstream change-order risk',
      priority: 'high' as const,
    },
  ]);

  const scenarios: BafoNegotiationScenario[] = [
    {
      scenarioId: 'scenario-standard',
      name: 'Standard BAFO',
      description: 'Price and scope asks with governance improvement',
      leversActivated: ['price', 'scope', 'governance'],
      asks,
      risks,
      expectedOutcome: 'counter' as BafoScenarioOutcome,
      estimatedTotalImpact: '7-11% aggregate value improvement',
      confidenceLevel: 'medium',
    },
  ];

  const recommendations: BafoRecommendation[] = [
    {
      recommendationId: 'rec-price-scope-bundle',
      summary: 'Lead with price + scope asks bundled to reduce vendor friction',
      primaryLever: 'price',
      supportingLevers: ['scope', 'governance'],
      rationale: 'Bundled asks are harder to reject individually',
      urgency: 'next_session',
    },
  ];

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    stage: input.stage,
    generatedAt: '2026-04-26',
    opportunities,
    levers,
    risks,
    scenarios,
    recommendations,
    totalLeversActivated: levers.length,
    highPriorityAsks: asks.filter((a) => a.priority === 'high').length,
    estimatedAggregateImpact: '7-11% value improvement',
    modelVersion: '1.0',
  };
}
