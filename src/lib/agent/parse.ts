// ─────────────────────────────────────────────────────────────────────────────
// Parsers for structured confirmation blocks emitted by agent turns.
// Each agent mode appends a self-contained <block>{json}</block> after a
// plain-language confirmation; the server detects + strips the block and
// triggers the corresponding mutation.
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedUserIntent {
  name: string;
  title: string;
  organization: string;
  role: string;
  cxo_function: string;
  primary_focus: string;
}

export function parseUserReadyBlock(text: string): ParsedUserIntent | null {
  const m = text.match(/<user_ready>([\s\S]*?)<\/user_ready>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    const required = ['name', 'title', 'organization', 'role', 'cxo_function', 'primary_focus'];
    if (required.some((k) => !p[k])) return null;
    return p as ParsedUserIntent;
  } catch {
    return null;
  }
}

export function stripUserReadyBlock(text: string): string {
  return text.replace(/<user_ready>[\s\S]*?<\/user_ready>/g, '').trim();
}

export interface ParsedEngagementIntent {
  name: string;
  sponsor_graph_node_id: string;
  sponsor_creation_needed: boolean;
  sponsor_payload?: {
    name: string;
    title: string;
    organization: string;
    role: string;
    cxo_function: string;
    primary_focus: string;
  };
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string;
}

export function parseEngagementReadyBlock(text: string): ParsedEngagementIntent | null {
  const m = text.match(/<engagement_ready>([\s\S]*?)<\/engagement_ready>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    const required = ['name', 'sponsor_graph_node_id', 'industry_code', 'function_code', 'objective_code', 'topic_code'];
    if (required.some((k) => !p[k])) return null;
    return p as ParsedEngagementIntent;
  } catch {
    return null;
  }
}

export function stripEngagementReadyBlock(text: string): string {
  return text.replace(/<engagement_ready>[\s\S]*?<\/engagement_ready>/g, '').trim();
}

export interface ParsedGateApproval {
  phase: number;
  approval_text: string;
  summary: string;
}

export function parseGateApprovalBlock(text: string): ParsedGateApproval | null {
  const m = text.match(/<gate_approval>([\s\S]*?)<\/gate_approval>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    if (typeof p.phase !== 'number' || !p.approval_text || !p.summary) return null;
    return p as ParsedGateApproval;
  } catch {
    return null;
  }
}

export function stripGateApprovalBlock(text: string): string {
  return text.replace(/<gate_approval>[\s\S]*?<\/gate_approval>/g, '').trim();
}

export interface ParsedDecision {
  summary: string;
  rationale: string;
  decision_maker: string;
  impact: string;
}

export function parseDecisionBlocks(text: string): ParsedDecision[] {
  const matches = [...text.matchAll(/<decision_logged>([\s\S]*?)<\/decision_logged>/g)];
  const out: ParsedDecision[] = [];
  for (const m of matches) {
    try {
      const p = JSON.parse(m[1].trim());
      if (p.summary && p.rationale && p.decision_maker && p.impact) out.push(p as ParsedDecision);
    } catch {
      // skip malformed block
    }
  }
  return out;
}

export function stripDecisionBlocks(text: string): string {
  return text.replace(/<decision_logged>[\s\S]*?<\/decision_logged>/g, '').trim();
}

export interface ParsedActualMetrics {
  items: Array<{ metric: string; actual_value: string; measurement_date?: string; source?: string }>;
}

export function parseActualMetricsBlock(text: string): ParsedActualMetrics | null {
  const m = text.match(/<actual_metrics>([\s\S]*?)<\/actual_metrics>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    if (!Array.isArray(p.items)) return null;
    return p as ParsedActualMetrics;
  } catch {
    return null;
  }
}

export function stripActualMetricsBlock(text: string): string {
  return text.replace(/<actual_metrics>[\s\S]*?<\/actual_metrics>/g, '').trim();
}

export interface ParsedOutcomeFeeProposal {
  total_baseline_cost_usd: number;
  total_actual_cost_usd: number;
  total_savings_usd: number;
  fee_percentage: number;
  fee_amount_usd: number;
  rationale?: string;
}

export function parseOutcomeFeeBlock(text: string): ParsedOutcomeFeeProposal | null {
  const m = text.match(/<outcome_fee_proposal>([\s\S]*?)<\/outcome_fee_proposal>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    const required = [
      'total_baseline_cost_usd',
      'total_actual_cost_usd',
      'total_savings_usd',
      'fee_percentage',
      'fee_amount_usd',
    ];
    if (required.some((k) => typeof p[k] !== 'number')) return null;
    return p as ParsedOutcomeFeeProposal;
  } catch {
    return null;
  }
}

export function stripOutcomeFeeBlock(text: string): string {
  return text.replace(/<outcome_fee_proposal>[\s\S]*?<\/outcome_fee_proposal>/g, '').trim();
}
