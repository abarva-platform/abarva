import 'server-only';

// Intelligence v3 · live page-data builder.
//
// Reads the active tenant via getActiveClientRow → fetches the tenant's
// AI Initiatives (and supporting goals / categories) → composes the
// IntelligenceV3PageData shape the v3 page renders. Falls back to the
// First Capital fixture when no active client / no initiatives loaded.

import { getActiveClientRow } from '@/lib/active-client';
import {
  getAIInitiativesPageData,
  STATUS_LABELS,
  STAGE_LABELS,
  formatUsd,
  type AIInitiative,
  type AIBusinessGoal,
} from '@/lib/admin/ai-initiatives/queries';
import type {
  IntelligenceV3PageData,
  LayerColumn,
  LayerKey,
  MoveCard,
  PressureCard,
} from '@/components/intelligence-v3/types';
import { FIRST_CAPITAL_DEMO } from '@/components/intelligence-v3/demo-data';

// ---------------------------------------------------------------------
// Industry mapping
// ---------------------------------------------------------------------
//
// industry_code values come from the clients table. Map to the
// human-readable label that the "INDUSTRY" substrate card displays.
// Unmapped codes fall through to a generic "Cross-industry" label.

const INDUSTRY_LABELS: Record<string, string> = {
  banking: 'Banking',
  financial_services: 'Banking',
  retail: 'Retail',
  retail_omnichannel: 'Retail',
  healthcare: 'Healthcare',
  health_system: 'Healthcare',
};

function industryLabel(code: string | null): string {
  if (!code) return 'Cross-industry';
  const k = code.toLowerCase();
  return INDUSTRY_LABELS[k] ?? code;
}

// ---------------------------------------------------------------------
// AI trajectory copy (per industry, until segment 23 is wired)
// ---------------------------------------------------------------------

const AI_TRAJECTORY_BY_INDUSTRY: Record<
  string,
  { headline: string; body: string }
> = {
  Banking: {
    headline: 'AI trajectory · regional banking',
    body: '80% of programs are front-office. Middle-office decisioning underweight. SR 11-7 governance bar tightening.',
  },
  Retail: {
    headline: 'AI trajectory · omnichannel retail',
    body: 'Demand forecasting + personalization scaled; agentic operations early. Cost-to-serve pressure rising.',
  },
  Healthcare: {
    headline: 'AI trajectory · health systems',
    body: 'Clinical documentation + risk stratification scaled. Revenue-cycle AI mid-deployment. HIPAA + CMS bar tightening on ambient + agentic AI.',
  },
};

function aiTrajectoryFor(industry: string): { headline: string; body: string } {
  return (
    AI_TRAJECTORY_BY_INDUSTRY[industry] ?? {
      headline: 'AI trajectory · cross-industry',
      body: 'Mix of LLM productivity, agentic ops, and predictive ML. Foundation maturing; governance bar rising.',
    }
  );
}

// ---------------------------------------------------------------------
// Pressure cards · top 3 by status urgency
// ---------------------------------------------------------------------

const STATUS_URGENCY: Record<string, number> = {
  stalled: 100,
  cost_overrun: 90,
  duplication_risk: 85,
  value_lag: 70,
  adoption_gap: 60,
  foundation_phase: 40,
  in_move: 30,
  healthy: 10,
};

function statusToSeverity(flag: string): PressureCard['severity'] {
  const urgency = STATUS_URGENCY[flag] ?? 0;
  if (urgency >= 80) return 'HIGH';
  if (urgency >= 50) return 'MEDIUM';
  return 'WATCH';
}

function buildPressureCards(
  initiatives: ReadonlyArray<AIInitiative>,
): ReadonlyArray<PressureCard> {
  const ranked = [...initiatives].sort(
    (a, b) =>
      (STATUS_URGENCY[b.statusFlag] ?? 0) - (STATUS_URGENCY[a.statusFlag] ?? 0),
  );
  const top3 = ranked.slice(0, 3);
  return top3.map((i) => ({
    severity: statusToSeverity(i.statusFlag),
    title: `${i.displayId} · ${i.name}`,
    body: `${STATUS_LABELS[i.statusFlag]} · ${i.statusSummary}`,
  }));
}

// ---------------------------------------------------------------------
// Art of the Possible · 3 office layers
// ---------------------------------------------------------------------
//
// Map AI categories to office layers. The mapping is intentionally
// pragmatic; refine when the founder's preferred mapping settles.

const CATEGORY_TO_LAYER: Record<string, LayerKey> = {
  // Front office — customer-facing or knowledge-worker productivity
  'CAT-01': 'experience', // LLM Productivity
  'CAT-03': 'experience', // Agentic Operations (often customer-facing)
  'CAT-07': 'experience', // Customer-Facing AI

  // Middle office — decisioning, risk, compliance
  'CAT-05': 'decision', // Predictive ML
  'CAT-08': 'decision', // Compliance & Governance AI

  // Back office — ERP, infra, dev tooling
  'CAT-02': 'operations', // Developer & IT SDLC AI
  'CAT-04': 'operations', // ERP & Domain Agents
  'CAT-06': 'operations', // AI Infrastructure & FinOps
};

const LAYER_DEFS: ReadonlyArray<{
  key: LayerKey;
  name: string;
  parenthetical: string;
  gating: string;
}> = [
  {
    key: 'experience',
    name: 'Experience Layer',
    parenthetical: 'Front Office',
    gating: 'Customer experience reshaped',
  },
  {
    key: 'decision',
    name: 'Decision Layer',
    parenthetical: 'Middle Office',
    gating: 'Decisions get faster, evidence-grounded',
  },
  {
    key: 'operations',
    name: 'Operations Layer',
    parenthetical: 'Back Office',
    gating: 'Operations approach lower marginal cost',
  },
];

function buildLayers(
  initiatives: ReadonlyArray<AIInitiative>,
): ReadonlyArray<LayerColumn> {
  const byLayer: Record<LayerKey, AIInitiative[]> = {
    experience: [],
    decision: [],
    operations: [],
  };
  for (const initiative of initiatives) {
    const layer = CATEGORY_TO_LAYER[initiative.primaryCategoryId] ?? 'decision';
    byLayer[layer].push(initiative);
  }
  // Pick the layer with the most initiatives as the focused one
  // (proxy for "where this tenant is investing most heavily today").
  const focusedLayer = (Object.keys(byLayer) as LayerKey[]).reduce(
    (best, key) => (byLayer[key].length > byLayer[best].length ? key : best),
    'decision' as LayerKey,
  );

  return LAYER_DEFS.map((def) => ({
    ...def,
    focused: def.key === focusedLayer,
    moves: byLayer[def.key].map((i): MoveCard => ({
      id: i.initiativeId,
      name: i.name,
      rationale: layerRationale(i),
      surfaceState: i.alignedCallout ? 'surfaced-in-thread' : undefined,
    })),
  }));
}

function layerRationale(i: AIInitiative): string {
  if (i.alignedCallout) return 'Aligned bet ⭐';
  if (i.statusFlag === 'stalled') return 'Stalled · needs decision';
  if (i.statusFlag === 'value_lag') return 'Value lag · review';
  if (i.statusFlag === 'duplication_risk') return 'Duplication risk';
  if (i.statusFlag === 'foundation_phase') return 'Foundation phase';
  if (i.statusFlag === 'healthy') return 'Healthy · scaled';
  return STATUS_LABELS[i.statusFlag];
}

// ---------------------------------------------------------------------
// Sentinel opener (initiative-grounded)
// ---------------------------------------------------------------------

function buildSentinelOpener(
  tenantName: string,
  initiatives: ReadonlyArray<AIInitiative>,
): string {
  const top3 = [...initiatives]
    .sort(
      (a, b) =>
        (STATUS_URGENCY[b.statusFlag] ?? 0) - (STATUS_URGENCY[a.statusFlag] ?? 0),
    )
    .slice(0, 3);
  if (top3.length === 0) {
    return `Substrate is loading for ${tenantName}. Once initiatives are bound, three matter-most callouts surface here. Ask me anything you see on this page.`;
  }
  const lead = top3
    .map((i) => `${i.displayId} ${i.name.toLowerCase()}`)
    .join(', ');
  return `Three things matter for ${tenantName} today: ${lead}. Ask me anything you see on this page.`;
}

// ---------------------------------------------------------------------
// What we can't yet see (substrate gaps)
// ---------------------------------------------------------------------

function buildWhatWeCantSee(
  initiatives: ReadonlyArray<AIInitiative>,
): ReadonlyArray<string> {
  // Stand-in: name the gaps honestly when we have no peer benchmarks
  // or scenario-library coverage attached. When real coverage data is
  // wired through the broker, these become per-tenant computed.
  const gaps: string[] = [];
  if (initiatives.every((i) => !i.measuredValueUsd)) {
    gaps.push('Realized value attribution');
  }
  gaps.push('Peer NIM / cost-to-serve benchmarks');
  gaps.push('Quarterly KPI variance depth');
  return gaps.slice(0, 3);
}

// ---------------------------------------------------------------------
// Three substrates panel
// ---------------------------------------------------------------------

function buildThreeSubstrates(
  initiatives: ReadonlyArray<AIInitiative>,
  goals: ReadonlyArray<AIBusinessGoal>,
): IntelligenceV3PageData['substrate'] {
  // tenantLoaded = a rough fraction-of-23-segments proxy. Until the
  // segment 15-23 substrate is fully wired, we count the substrate
  // types that *do* have rows for this tenant. Initiatives + goals +
  // (KPIs / notes / decisions / vendors / scenarios computed in a
  // future pass when we add a coverage query). For now: cap at goals
  // + initiative-derived presence.
  const tenantLoaded = Math.min(
    23,
    (initiatives.length > 0 ? 7 : 0) + // initiatives, KPIs, notes, decisions, vendors, scenarios, business goals
      (goals.length > 0 ? 0 : 0), // already counted above
  );
  return {
    tenantLoaded,
    tenantTotal: 23,
    corpus: { failureModes: 10, patternRecords: 17, researchAnchors: 30 },
  };
}

// ---------------------------------------------------------------------
// Stats from initiatives
// ---------------------------------------------------------------------

function buildStats(
  initiatives: ReadonlyArray<AIInitiative>,
): IntelligenceV3PageData['stats'] {
  return {
    patterns: initiatives.length,
    contradictions: initiatives.filter(
      (i) =>
        i.statusFlag === 'stalled' ||
        i.statusFlag === 'duplication_risk' ||
        i.statusFlag === 'cost_overrun',
    ).length,
    syntheses: initiatives.filter((i) => i.alignedCallout).length,
  };
}

// ---------------------------------------------------------------------
// Conversation context — initiative-grounded thread label
// ---------------------------------------------------------------------

function buildConversationContext(
  initiatives: ReadonlyArray<AIInitiative>,
): IntelligenceV3PageData['conversationContext'] {
  const aligned = initiatives.find((i) => i.alignedCallout);
  if (aligned) {
    return {
      activeThread: `${aligned.displayId} ${aligned.name} review`,
      layerFocus: layerLabel(CATEGORY_TO_LAYER[aligned.primaryCategoryId] ?? 'decision'),
    };
  }
  return {
    activeThread: 'Portfolio review',
    layerFocus: 'Decision Layer',
  };
}

function layerLabel(key: LayerKey): string {
  const def = LAYER_DEFS.find((d) => d.key === key);
  return def ? def.name : 'Decision Layer';
}

// ---------------------------------------------------------------------
// Top-level builder
// ---------------------------------------------------------------------

export interface BuildResult {
  data: IntelligenceV3PageData;
  /** True when real DB data is bound; false for the demo fallback. */
  isLiveBound: boolean;
}

export async function buildIntelligenceV3PageData(): Promise<BuildResult> {
  const clientRow = await getActiveClientRow().catch(() => null);
  if (!clientRow) {
    return { data: FIRST_CAPITAL_DEMO, isLiveBound: false };
  }

  const page = await getAIInitiativesPageData(clientRow.id).catch(() => null);
  if (!page || page.initiatives.length === 0) {
    // Real tenant context but no initiatives — keep tenant name + industry
    // honest while reusing the demo content for the rest. This avoids
    // showing a blank page and matches the "pre-load" experience.
    return {
      data: {
        ...FIRST_CAPITAL_DEMO,
        tenantName: clientRow.name,
        industry: industryLabel(clientRow.industry_code),
        sentinelOpener: `Substrate is loading for ${clientRow.name}. Once initiatives are bound, what-matters-most surfaces here.`,
      },
      isLiveBound: false,
    };
  }

  const industry = industryLabel(clientRow.industry_code);
  return {
    data: {
      tenantName: clientRow.name,
      industry,
      refreshedLabel: 'just now',
      stats: buildStats(page.initiatives),
      substrate: buildThreeSubstrates(page.initiatives, page.goals),
      aiTrajectory: aiTrajectoryFor(industry),
      pressureCards: buildPressureCards(page.initiatives),
      conversationContext: buildConversationContext(page.initiatives),
      artOfThePossible: buildLayers(page.initiatives),
      whatWeCantSee: buildWhatWeCantSee(page.initiatives),
      sentinelOpener: buildSentinelOpener(clientRow.name, page.initiatives),
      conversation: [],
    },
    isLiveBound: true,
  };
}

// Re-exports for callers that need them inline (page header / etc.).
export { formatUsd, STATUS_LABELS, STAGE_LABELS };
