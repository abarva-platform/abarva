export type ContradictionDetectionRuleId =
  | 'vendor_claim_vs_internal_evidence'
  | 'adoption_threshold_mismatch'
  | 'value_attribution_mismatch'
  | 'timeline_mismatch';

export type ContradictionDetectionCategory =
  | 'vendor_claim'
  | 'adoption'
  | 'value_attribution'
  | 'timeline';

export type ContradictionDetectionSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DetectionRule {
  id: ContradictionDetectionRuleId;
  label: string;
  category: ContradictionDetectionCategory;
  description: string;
  reviewPrompt: string;
  severity: ContradictionDetectionSeverity;
  priority: number;
  partyAAny: readonly string[];
  partyBAny: readonly string[];
  contradictionAny: readonly string[];
}

export const CONTRADICTION_DETECTION_RULES: readonly DetectionRule[] = [
  {
    id: 'vendor_claim_vs_internal_evidence',
    label: 'Vendor claim vs internal evidence',
    category: 'vendor_claim',
    description:
      'Flags vendor-side promises or business-case targets that materially exceed internally measured evidence.',
    reviewPrompt:
      'Confirm the internal evidence packet and decide whether the vendor claim remains only an asserted benchmark.',
    severity: 'high',
    priority: 90,
    partyAAny: ['vendor', 'promise', 'claim', 'business case', 'target'],
    partyBAny: ['actual', 'delivered', 'internal', 'measured', 'shortfall', 'evidence'],
    contradictionAny: ['cannot both', 'promised', 'measured', 'target', 'shortfall'],
  },
  {
    id: 'adoption_threshold_mismatch',
    label: 'Adoption threshold mismatch',
    category: 'adoption',
    description:
      'Flags healthy-adoption narratives when active usage is materially below the stated breakeven or success threshold.',
    reviewPrompt:
      'Review adoption telemetry, the threshold source, and whether scale-up language should be constrained.',
    severity: 'high',
    priority: 85,
    partyAAny: ['adoption', 'scaling', 'healthy', 'continue scaling', 'good adoption'],
    partyBAny: ['active users', 'usage', 'breakeven', 'threshold', 'below'],
    contradictionAny: ['adoption', 'active-use', 'breakeven', 'threshold'],
  },
  {
    id: 'value_attribution_mismatch',
    label: 'Value attribution mismatch',
    category: 'value_attribution',
    description:
      'Flags realized-value claims that outrun internally attributed value, baselines, or attribution methodology.',
    reviewPrompt:
      'Attach the dated baseline and attribution method before allowing claimed value into ROI narration.',
    severity: 'medium',
    priority: 75,
    partyAAny: ['productivity', 'savings', 'return', 'hours', 'value'],
    partyBAny: ['attributed', 'baseline', 'attribution', 'measured', 'internal'],
    contradictionAny: ['realized value', 'attribution', 'baseline', 'measured gain', 'vendor benchmark'],
  },
  {
    id: 'timeline_mismatch',
    label: 'Timeline mismatch',
    category: 'timeline',
    description:
      'Flags external or optimistic delivery timelines that conflict with planning medians, program plans, or evidence-resolved dates.',
    reviewPrompt:
      'Reconcile the commitment date against internal planning evidence before it is used in program planning.',
    severity: 'critical',
    priority: 95,
    partyAAny: ['day', 'timeline', 'implementation', 'deadline', 'rotation'],
    partyBAny: ['median', 'planning', 'slips', 'readiness', 'timeline', 'internal evidence'],
    contradictionAny: ['same implementation', 'planned', 'deadline', 'timeline', 'readiness'],
  },
] as const;

export const DETECTION_RULES_BY_ID: ReadonlyMap<ContradictionDetectionRuleId, DetectionRule> = new Map(
  CONTRADICTION_DETECTION_RULES.map((rule) => [rule.id, rule]),
);

