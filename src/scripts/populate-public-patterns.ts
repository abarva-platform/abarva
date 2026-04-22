// Populate Pinecone public-patterns namespace from engagement_topics plus
// supplemental classifier-only pattern records.
//
// Why: the classifier (spec §2.3) does vector match against the
// public-patterns namespace as Stage 2. Without vectors, Beat 4 of the
// demo returns empty matches even when the pattern exists in the catalog.
// This script embeds each pattern's title + tagline + canonical shape
// using OpenAI text-embedding-3-large (1024d) and upserts into Pinecone.
//
// Idempotent via vector id = topic_key. Re-runs replace existing vectors.
//
// Usage:  npx tsx src/scripts/populate-public-patterns.ts

import { createClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* env missing — rely on shell */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PINECONE_KEY = process.env.PINECONE_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX ?? 'nexus-knowledge';
const NAMESPACE = 'public-patterns';
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 1024;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase creds'); process.exit(1);
}
if (!PINECONE_KEY) { console.error('Missing PINECONE_API_KEY'); process.exit(1); }
if (!OPENAI_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const pc = new Pinecone({ apiKey: PINECONE_KEY });
const openai = new OpenAI({ apiKey: OPENAI_KEY });

interface TopicRow {
  topic_key: string;
  title: string;
  tagline: string | null;
  industries: string[] | null;
  key_patterns: string[] | null;
  canonical_shape_json: Record<string, unknown> | null;
  promotion_state: string | null;
  deployment_count: number | null;
  successful_deployment_count: number | null;
}

interface SupplementalPattern {
  pattern_key: string;
  title: string;
  summary: string;
  industries: string[];
  function_code: string;
  archetype:
    | 'strategic_transformation'
    | 'workflow_automation'
    | 'platform_modernization'
    | 'ai_product_enablement'
    | 'operational_optimization';
  typical_outcomes: string[];
  vendor_examples: string[];
  failure_modes: string[];
}

type PatternRecord =
  | {
      kind: 'topic';
      pattern_key: string;
      title: string;
      tagline: string;
      industries: string[];
      archetype: string;
      deployment_count: number;
      successful_deployment_count: number;
      text: string;
      metadata: Record<string, string | number | boolean | string[]>;
    }
  | {
      kind: 'supplemental';
      pattern_key: string;
      title: string;
      tagline: string;
      industries: string[];
      archetype: string;
      deployment_count: number;
      successful_deployment_count: number;
      text: string;
      metadata: Record<string, string | number | boolean | string[]>;
    };

const SUPPLEMENTAL_PATTERNS: SupplementalPattern[] = [
  {
    pattern_key: 'finserv_wealth_advisor_copilot',
    title: 'Wealth Advisor Copilot',
    summary: 'Advisor-facing copilot for proposal prep, meeting recap, follow-up drafting, and suitability-aware research pull-through across wealth-management workflows.',
    industries: ['FINSERV'],
    function_code: 'FRONT_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['20-30% advisor prep-time reduction', 'faster follow-up turnaround', 'better CRM hygiene'],
    vendor_examples: ['Microsoft Copilot', 'Salesforce Financial Services Cloud', 'Claude Enterprise'],
    failure_modes: ['meeting notes never reach CRM', 'suitability disclaimers added manually', 'pilot loved by top advisors but ignored by the middle cohort'],
  },
  {
    pattern_key: 'finserv_client_portfolio_analytics',
    title: 'Client Portfolio Analytics Modernization',
    summary: 'Unified advisor and portfolio-analytics layer for household segmentation, next-best-action, and portfolio-review preparation.',
    industries: ['FINSERV'],
    function_code: 'FRONT_OFFICE',
    archetype: 'platform_modernization',
    typical_outcomes: ['higher advisor capacity', 'faster review-cycle preparation', 'improved household penetration'],
    vendor_examples: ['Snowflake', 'Databricks', 'Salesforce FSC'],
    failure_modes: ['analytics rebuilt without household data unification', 'advisor desktop unchanged so adoption stalls', 'attribution story does not survive finance review'],
  },
  {
    pattern_key: 'finserv_proposal_generation_automation',
    title: 'Proposal Generation Automation',
    summary: 'Automate client proposal and IPS drafting with governed templates, benchmark pull-through, and approval controls for wealth and private-bank teams.',
    industries: ['FINSERV'],
    function_code: 'FRONT_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['proposal cycle time down 40%+', 'fewer manual drafting errors', 'higher proposal throughput per RM'],
    vendor_examples: ['Seismic', 'Microsoft Copilot', 'Claude Enterprise'],
    failure_modes: ['template logic fragmented by region', 'legal redlines still manual', 'output quality drops when benchmark data is stale'],
  },
  {
    pattern_key: 'finserv_kyc_automation',
    title: 'KYC and Client Onboarding Automation',
    summary: 'Automate onboarding document collection, KYC review routing, exception handling, and client-status transparency across front and middle office.',
    industries: ['FINSERV'],
    function_code: 'MIDDLE_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['faster onboarding cycle time', 'lower manual rework', 'better compliance traceability'],
    vendor_examples: ['Fenergo', 'MuleSoft', 'ServiceNow'],
    failure_modes: ['exception queues remain email-based', 'document-quality issues shift downstream', 'compliance review still serializes the process'],
  },
  {
    pattern_key: 'finserv_marketing_rule_compliance',
    title: 'Marketing Rule Compliance Automation',
    summary: 'Pre-clear and monitor advisor marketing materials against disclosure and recordkeeping rules without turning the review queue into a bottleneck.',
    industries: ['FINSERV'],
    function_code: 'FRONT_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['faster marketing review SLAs', 'lower compliance backlog', 'better archive completeness'],
    vendor_examples: ['Proofpoint', 'Seismic', 'Smarsh'],
    failure_modes: ['faster routing but no policy simplification', 'archive captured after the fact', 'compliance overrides become the real workflow'],
  },
  {
    pattern_key: 'finserv_investment_research_summarization',
    title: 'Investment Research Summarization',
    summary: 'Structured summarization of earnings calls, filings, sector notes, and house views for research and PM teams with clear source attribution.',
    industries: ['FINSERV'],
    function_code: 'MIDDLE_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['analyst time reclaimed for higher-value work', 'faster internal brief turnaround', 'more consistent note structure'],
    vendor_examples: ['Hebbia', 'AlphaSense', 'Claude Enterprise'],
    failure_modes: ['source citations disappear in downstream notes', 'consumer AI sneaks into sensitive workflows', 'output tone good but thesis quality weak'],
  },
  {
    pattern_key: 'finserv_esg_signal_extraction',
    title: 'ESG Signal Extraction',
    summary: 'Extract, structure, and compare ESG-related disclosures and controversy signals across issuer sets for research and stewardship workflows.',
    industries: ['FINSERV'],
    function_code: 'MIDDLE_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['faster issuer comparison', 'less manual document review', 'better auditability of research claims'],
    vendor_examples: ['Databricks', 'Snowflake', 'AlphaSense'],
    failure_modes: ['taxonomy disagreements sink trust', 'coverage expands before quality stabilizes', 'signals are extracted but never wired into workflow decisions'],
  },
  {
    pattern_key: 'finserv_analyst_note_drafting',
    title: 'Analyst Note Drafting',
    summary: 'Draft internal analyst notes and morning-brief commentary from structured research inputs while preserving citation traceability and house-view controls.',
    industries: ['FINSERV'],
    function_code: 'MIDDLE_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['faster note production', 'more consistent internal brief quality', 'better reuse of research inputs'],
    vendor_examples: ['Claude Enterprise', 'OpenAI', 'Hebbia'],
    failure_modes: ['generated prose outruns analyst conviction', 'citation traceability breaks under editing', 'output sounds polished but misses the actual investment call'],
  },
  {
    pattern_key: 'healthcare_claims_denial_reduction',
    title: 'Claims Denial Reduction',
    summary: 'Reduce avoidable denials using reason-code analysis, workflow redesign, and targeted automation across revenue cycle operations.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'BACK_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['lower initial denial rate', 'faster appeals resolution', 'higher net collections'],
    vendor_examples: ['Waystar', 'AKASA', 'Epic'],
    failure_modes: ['denial root causes never separate from symptoms', 'appeals productivity rises but write-offs stay flat', 'payer-specific variation ignored'],
  },
  {
    pattern_key: 'healthcare_prior_auth_automation',
    title: 'Prior Authorization Automation',
    summary: 'Automate prior-auth intake, packet completion, payer routing, and specialty-level exception handling to reduce manual back-and-forth.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['faster prior-auth turnaround', 'lower staff effort per request', 'better specialty throughput'],
    vendor_examples: ['Cohere Health', 'Epic', 'Availity'],
    failure_modes: ['payer channels still rely on fax and portal fallback', 'workflow changes outpace specialty adoption', 'automation logic fails on exception-heavy cases'],
  },
  {
    pattern_key: 'healthcare_charge_capture_optimization',
    title: 'Charge Capture Optimization',
    summary: 'Improve charge capture completeness and coding-quality handoff across clinical documentation and revenue-cycle operations.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'BACK_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['higher capture completeness', 'lower missed-charge leakage', 'better coder productivity'],
    vendor_examples: ['3M', 'Epic', 'Optum'],
    failure_modes: ['documentation improves without DRG value capture', 'service-line variation overwhelms the model', 'clinician workflow burden rises'],
  },
  {
    pattern_key: 'healthcare_coding_assistance',
    title: 'Coding Assistance Automation',
    summary: 'Support inpatient and ambulatory coding with assisted recommendations, exception routing, and audit-ready evidence capture.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['higher coder throughput', 'lower rework', 'more consistent coding quality'],
    vendor_examples: ['3M 360 Encompass', 'Epic', 'Oracle Health'],
    failure_modes: ['productivity gain hides quality drift', 'audit trail too thin for compliance', 'coders bypass recommendations entirely'],
  },
  {
    pattern_key: 'healthcare_ambient_scribe_rollout',
    title: 'Ambient Scribe Rollout',
    summary: 'Deploy ambient clinical documentation with regional operating-model alignment, governance, and provider adoption support.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'FRONT_OFFICE',
    archetype: 'ai_product_enablement',
    typical_outcomes: ['provider time saved', 'better note completion speed', 'reduced burnout pressure'],
    vendor_examples: ['Abridge', 'Nuance DAX', 'Nabla'],
    failure_modes: ['regional overlap persists after strategy is set', 'adoption measured without documentation-quality baseline', 'privacy review lags actual usage'],
  },
  {
    pattern_key: 'healthcare_clinical_decision_support_ai',
    title: 'Clinical Decision Support AI',
    summary: 'Embed AI-assisted decision support into clinician workflows with clear safety boundaries, review triggers, and usage telemetry.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'FRONT_OFFICE',
    archetype: 'ai_product_enablement',
    typical_outcomes: ['faster evidence access', 'better protocol adherence', 'reduced manual synthesis time'],
    vendor_examples: ['Epic', 'Tempus', 'NVIDIA AI Enterprise'],
    failure_modes: ['clinical confidence never forms because recommendations lack provenance', 'research-only tools bleed into care delivery', 'review governance slows clinician trust'],
  },
  {
    pattern_key: 'healthcare_patient_access_chatbot',
    title: 'Patient Access Chatbot',
    summary: 'Automate patient access workflows such as scheduling, FAQ resolution, and intake support across digital and contact-center channels.',
    industries: ['HEALTHCARE_IDN'],
    function_code: 'FRONT_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['higher self-service resolution', 'lower call-center load', 'faster scheduling throughput'],
    vendor_examples: ['Salesforce Health Cloud', 'Microsoft Copilot', 'Nuance'],
    failure_modes: ['deflection rises but downstream completion falls', 'handoff to humans is too brittle', 'policy answers drift faster than governance'],
  },
  {
    pattern_key: 'retail_demand_forecasting_modernization',
    title: 'Demand Forecasting Modernization',
    summary: 'Modernize SKU-store-week forecasting with stronger data foundations, model operations, and merchant/planner workflow integration.',
    industries: ['RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'platform_modernization',
    typical_outcomes: ['higher forecast accuracy', 'fewer stockouts', 'better inventory turns'],
    vendor_examples: ['o9 Solutions', 'Snowflake', 'NVIDIA AI Enterprise'],
    failure_modes: ['forecasting model improves but planning workflow does not', 'merchant overrides erase the gain', 'data readiness gaps break trust at scale'],
  },
  {
    pattern_key: 'retail_inventory_optimization',
    title: 'Inventory Optimization',
    summary: 'Optimize allocation, replenishment, and markdown decisions using inventory-aware analytics and exception management.',
    industries: ['RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['lower excess inventory', 'fewer stockouts', 'higher gross margin through better allocation'],
    vendor_examples: ['Blue Yonder', 'RELEX', 'Snowflake'],
    failure_modes: ['store constraints ignored in the model', 'inventory actions too slow for the recommendation cycle', 'allocation logic fights merchant intuition'],
  },
  {
    pattern_key: 'retail_markdown_optimization',
    title: 'Markdown Optimization',
    summary: 'Improve markdown timing and depth decisions with AI-assisted demand, margin, and sell-through analytics.',
    industries: ['RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'operational_optimization',
    typical_outcomes: ['lower markdown leakage', 'better sell-through timing', 'higher realized margin'],
    vendor_examples: ['Blue Yonder', 'o9 Solutions', 'Databricks'],
    failure_modes: ['pricing governance overrides the model too often', 'markdowns optimize margin but hurt conversion', 'category differences are flattened away'],
  },
  {
    pattern_key: 'retail_store_associate_productivity',
    title: 'Store Associate Productivity',
    summary: 'Redesign frontline workflows and deploy AI-assisted task support for store associates, managers, and district leaders.',
    industries: ['RETAIL'],
    function_code: 'FRONT_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['more task time returned to the floor', 'faster issue resolution', 'better same-store sales support'],
    vendor_examples: ['Microsoft Copilot', 'ServiceNow', 'Salesforce'],
    failure_modes: ['workflow baseline too weak to prove value', 'training effort exceeds the product gain', 'local-store variations break the standard playbook'],
  },
  {
    pattern_key: 'retail_contact_center_deflection',
    title: 'Retail Contact Center Deflection',
    summary: 'Deflect routine retail customer-service contacts and augment agents with AI-assisted summaries, guidance, and next-best action.',
    industries: ['RETAIL'],
    function_code: 'FRONT_OFFICE',
    archetype: 'ai_product_enablement',
    typical_outcomes: ['higher deflection rate', 'lower handle time', 'better CSAT stability during scale'],
    vendor_examples: ['Salesforce Commerce Cloud', 'Glia', 'Observe.AI'],
    failure_modes: ['deflection rises while escalation quality falls', 'language coverage lags rollout', 'agent-assist stack overlaps instead of consolidates'],
  },
  {
    pattern_key: 'cross_procurement_automation',
    title: 'Procurement Automation',
    summary: 'Automate intake, contract routing, PO support, and vendor-request workflows to reduce manual handoffs in procurement operations.',
    industries: ['GENERAL', 'HEALTHCARE_IDN', 'FINSERV', 'RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['faster procurement cycle time', 'lower manual follow-up work', 'better policy adherence'],
    vendor_examples: ['ServiceNow', 'Coupa', 'SAP'],
    failure_modes: ['exception routing remains email-driven', 'intake automation stops at the first handoff', 'policy complexity outruns the workflow logic'],
  },
  {
    pattern_key: 'cross_close_process_acceleration',
    title: 'Close Process Acceleration',
    summary: 'Accelerate monthly and quarterly close through reconciliations support, journal-workflow automation, and finance exception management.',
    industries: ['GENERAL', 'FINSERV', 'RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['shorter close cycle', 'fewer reconciliation exceptions', 'better finance capacity for analysis'],
    vendor_examples: ['BlackLine', 'SAP', 'Oracle'],
    failure_modes: ['reconciliation quality slips while speed rises', 'ownership unclear across controllership and FP&A', 'automation never reaches the messy long-tail processes'],
  },
  {
    pattern_key: 'cross_hr_helpdesk_ai',
    title: 'HR Helpdesk AI',
    summary: 'Deploy an AI-assisted HR support layer for policy questions, ticket triage, case summarization, and employee self-service.',
    industries: ['GENERAL', 'HEALTHCARE_IDN', 'FINSERV', 'RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['higher self-service resolution', 'lower HR ticket backlog', 'faster case handling'],
    vendor_examples: ['ServiceNow', 'Workday', 'Moveworks'],
    failure_modes: ['policy answers go stale quickly', 'self-service rises but case completion does not', 'sensitive cases fall into the wrong automation path'],
  },
  {
    pattern_key: 'cross_it_service_desk_ai',
    title: 'IT Service Desk AI',
    summary: 'Automate IT intake, knowledge retrieval, routing, and case summarization while preserving escalation discipline for complex incidents.',
    industries: ['GENERAL', 'HEALTHCARE_IDN', 'FINSERV', 'RETAIL'],
    function_code: 'BACK_OFFICE',
    archetype: 'workflow_automation',
    typical_outcomes: ['lower ticket resolution time', 'higher deflection of routine requests', 'better service-desk productivity'],
    vendor_examples: ['ServiceNow', 'Moveworks', 'Microsoft Copilot'],
    failure_modes: ['knowledge base quality too weak for automation', 'handoff to human support is brittle', 'ticket backlog shifts instead of shrinking'],
  },
];

function buildTopicText(t: TopicRow): string {
  const shape = (t.canonical_shape_json ?? {}) as Record<string, unknown>;
  const archetype = (shape.archetype as string | undefined) ?? 'unspecified';
  const modules = Array.isArray(shape.modules)
    ? (shape.modules as Array<{ name: string; phase: number }>).map((m) => m.name).join(', ')
    : '';
  return [
    t.title,
    t.tagline ?? '',
    `archetype: ${archetype}`,
    `industries: ${(t.industries ?? []).join(', ')}`,
    `patterns: ${(t.key_patterns ?? []).join(', ')}`,
    modules ? `modules: ${modules}` : '',
    `deployed ${t.deployment_count ?? 0} times · ${t.successful_deployment_count ?? 0} successful`,
  ].filter(Boolean).join(' · ');
}

function buildSupplementalText(pattern: SupplementalPattern): string {
  return [
    pattern.title,
    pattern.summary,
    `archetype: ${pattern.archetype}`,
    `industries: ${pattern.industries.join(', ')}`,
    `function: ${pattern.function_code}`,
    `typical outcomes: ${pattern.typical_outcomes.join(' · ')}`,
    `vendor examples: ${pattern.vendor_examples.join(', ')}`,
    `failure modes: ${pattern.failure_modes.join(' · ')}`,
  ].filter(Boolean).join(' · ');
}

function toPatternRecords(rows: TopicRow[]): PatternRecord[] {
  const records: PatternRecord[] = rows.map((row) => {
    const shape = (row.canonical_shape_json ?? {}) as Record<string, unknown>;
    const archetype = (shape.archetype as string | undefined) ?? 'unspecified';
    const text = buildTopicText(row);
    return {
      kind: 'topic',
      pattern_key: row.topic_key,
      title: row.title,
      tagline: row.tagline ?? '',
      industries: row.industries ?? [],
      archetype,
      deployment_count: row.deployment_count ?? 0,
      successful_deployment_count: row.successful_deployment_count ?? 0,
      text,
      metadata: {
        pattern_key: row.topic_key,
        title: row.title,
        tagline: row.tagline ?? '',
        archetype,
        industries: row.industries ?? [],
        promotion_state: row.promotion_state ?? 'draft',
        deployment_count: row.deployment_count ?? 0,
        successful_deployment_count: row.successful_deployment_count ?? 0,
        text: text.slice(0, 1000),
      },
    };
  });

  for (const pattern of SUPPLEMENTAL_PATTERNS) {
    const text = buildSupplementalText(pattern);
    records.push({
      kind: 'supplemental',
      pattern_key: pattern.pattern_key,
      title: pattern.title,
      tagline: pattern.summary,
      industries: pattern.industries,
      archetype: pattern.archetype,
      deployment_count: 0,
      successful_deployment_count: 0,
      text,
      metadata: {
        pattern_key: pattern.pattern_key,
        title: pattern.title,
        tagline: pattern.summary,
        archetype: pattern.archetype,
        industries: pattern.industries,
        function_code: pattern.function_code,
        vendor_examples: pattern.vendor_examples,
        failure_modes: pattern.failure_modes,
        promotion_state: 'catalog_only',
        deployment_count: 0,
        successful_deployment_count: 0,
        text: text.slice(0, 1000),
      },
    });
  }

  const deduped = new Map<string, PatternRecord>();
  for (const record of records) deduped.set(record.pattern_key, record);
  return [...deduped.values()];
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: EMBED_MODEL, input: text, dimensions: EMBED_DIMS });
  return res.data[0]!.embedding;
}

async function main() {
  console.log('─── Populate Pinecone public-patterns ───');

  const { data, error } = await sb
    .from('engagement_topics')
    .select('topic_key, title, tagline, industries, key_patterns, canonical_shape_json, promotion_state, deployment_count, successful_deployment_count');
  if (error) throw error;
  const rows = (data as TopicRow[] | null) ?? [];
  const records = toPatternRecords(rows);
  console.log(`✓ ${rows.length} engagement topics + ${SUPPLEMENTAL_PATTERNS.length} supplemental patterns → ${records.length} records to embed`);

  const index = pc.index(INDEX_NAME).namespace(NAMESPACE);
  const vectors: Array<{ id: string; values: number[]; metadata: Record<string, string | number | boolean | string[]>; sparseValues?: undefined }> = [];
  let embedded = 0;

  for (const row of records) {
    const text = row.text;
    const values = await embed(text);
    vectors.push({
      id: row.pattern_key,
      values,
      metadata: row.metadata,
    });
    embedded += 1;
    if (embedded % 10 === 0) console.log(`  embedded ${embedded}/${records.length}`);
  }

  console.log(`✓ ${vectors.length} vectors generated · upserting to Pinecone`);

  // Upsert · Pinecone SDK v7 signature matches the pattern in
  // scripts/knowledge/embedding.ts: index.upsert({ records: [...] })
  // where each record is { id, values, metadata }.
  for (let i = 0; i < vectors.length; i += 50) {
    const batch = vectors.slice(i, i + 50);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (index as any).upsert({ records: batch });
    console.log(`  batch ${Math.floor(i / 50) + 1} · ${batch.length} vectors`);
  }

  // Verify
  const stats = await pc.index(INDEX_NAME).describeIndexStats();
  const nsCount = stats.namespaces?.[NAMESPACE]?.recordCount ?? 0;
  console.log(`✓ namespace ${NAMESPACE} now has ${nsCount} vectors`);
  console.log(`─── Done ───`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
