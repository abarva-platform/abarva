import fs from 'node:fs';
import path from 'node:path';

export type LakeshoreAgentName = 'Sentinel' | 'Nexus' | 'Atlas' | 'Steward';

export interface LakeshoreCorpusSource {
  readonly id: string;
  readonly label: string;
  readonly sourcePath: string;
  readonly availability: 'available' | 'blocked_pending_pr';
  readonly blockedBy?: string;
  readonly sourceType: 'loaded_tenant_bundle' | 'pattern_pack' | 'research_spec' | 'operating_model';
  readonly applicability: readonly string[];
  readonly provenanceRule: string;
}

export interface LakeshoreAgentGroundingRule {
  readonly agent: LakeshoreAgentName;
  readonly allowedSources: readonly string[];
  readonly useFor: readonly string[];
  readonly mustSay: readonly string[];
  readonly mustNotSay: readonly string[];
  readonly evalPrompts: readonly string[];
}

export interface LakeshoreCorpusActivationPlan {
  readonly tenantKey: 'lakeshore';
  readonly brokerKey: 'lakeshore-holdings';
  readonly generatedAt: string;
  readonly cxoLogins: readonly {
    readonly email: string;
    readonly persona: string;
    readonly title: string;
    readonly requiredMetadata: {
      readonly clientId: 'lakeshore';
      readonly tenantKey: 'lakeshore-holdings';
      readonly role: 'maestro' | 'admin';
    };
  }[];
  readonly sources: readonly LakeshoreCorpusSource[];
  readonly agentGrounding: readonly LakeshoreAgentGroundingRule[];
  readonly activationSteps: readonly string[];
  readonly hallucinationControls: readonly string[];
}

export const LAKESHORE_CORPUS_SOURCES: readonly LakeshoreCorpusSource[] = [
  {
    id: 'lakeshore-loaded-tenant-bundle',
    label: 'Lakeshore loaded tenant bundle',
    sourcePath: 'docs/build/lakeshore/loaded/manifest.json',
    availability: 'available',
    sourceType: 'loaded_tenant_bundle',
    applicability: [
      'Holdco and opco org structure',
      'Application and ERP estate',
      'Vendor contracts and generated contract documents',
      'Kyriba rollout',
      'Financial KPIs',
      'Compliance, incidents, DORA, AI tooling, and integration topology',
    ],
    provenanceRule: 'Use as tenant-specific truth only after the governed load ledger shows parsed/committed rows for Lakeshore.',
  },
  {
    id: 'lakeshore-governed-load-ledger',
    label: 'Lakeshore governed load rehearsal ledger',
    sourcePath: 'docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-dry-run-latest.json',
    availability: 'blocked_pending_pr',
    blockedBy: 'PR #2997 - governed load rehearsal',
    sourceType: 'operating_model',
    applicability: [
      'Operator proof of parser coverage',
      'Quarantine proof',
      'Dry-run evidence before live commit',
    ],
    provenanceRule: 'Use to explain loader readiness; do not treat dry-run chunks as committed live tenant evidence.',
  },
  {
    id: 'finance-cfo-ai-pattern-pack',
    label: 'Lakeshore CFO and finance AI activation supplement',
    sourcePath: 'docs/build/lakeshore/agent-grounding/LAKESHORE_FINANCE_CFO_AGENT_PACK_2026-06-04.md',
    availability: 'available',
    sourceType: 'pattern_pack',
    applicability: [
      'CFO value realization',
      'Treasury and FP&A AI use cases',
      'Finance controls and governance',
    ],
    provenanceRule: 'Use as reusable pattern guidance; tenant-specific answers must cite loaded Lakeshore finance rows or say the tenant data is not committed yet.',
  },
  {
    id: 'kyriba-success-platform',
    label: 'Lakeshore Kyriba rollout success activation supplement',
    sourcePath: 'docs/build/lakeshore/agent-grounding/LAKESHORE_KYRIBA_SUCCESS_AGENT_PACK_2026-06-04.md',
    availability: 'available',
    sourceType: 'pattern_pack',
    applicability: [
      'Kyriba value scorecard',
      'Treasury rollout gates',
      'SI implementation risk',
      'Cash, FX, liquidity, and working-capital outcomes',
    ],
    provenanceRule: 'Use for Kyriba rollout reasoning only with explicit distinction between playbook pattern and Lakeshore contract/program evidence.',
  },
  {
    id: 'moves-rate-card-engine',
    label: 'Moves rate-card ingestion and estimate engine',
    sourcePath: 'docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md',
    availability: 'available',
    sourceType: 'research_spec',
    applicability: [
      'Delivery effort costing',
      'SI/vendor estimate calibration',
      'Geo and sourcing-mode cost ranges',
    ],
    provenanceRule: 'Use for planning-range estimates; never present researched benchmark fallbacks as client-specific negotiated rates.',
  },
  {
    id: 'modernization-pattern-pack',
    label: 'Modernization pattern pack and industry profiles',
    sourcePath: 'docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md',
    availability: 'available',
    sourceType: 'research_spec',
    applicability: [
      'Lakebridge-style analyzer inventory intake',
      '7R modernization disposition',
      'Databricks migration planning',
      'RFP scorecard and divergence report',
    ],
    provenanceRule: 'Use to reason over Lakeshore app/data-estate rows; do not claim AbarVa scans or converts code.',
  },
  {
    id: 'modernization-industry-profiles',
    label: 'Modernization industry profiles',
    sourcePath: 'docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md',
    availability: 'available',
    sourceType: 'pattern_pack',
    applicability: [
      'Retail / DTC transfer to Forge & Field',
      'Airline/supply-chain transfer to Northline',
      'Healthcare governance parallels where useful',
    ],
    provenanceRule: 'Use as industry overlay; explicitly label transfer analogies and avoid treating them as Lakeshore facts.',
  },
];

export const LAKESHORE_AGENT_GROUNDING: readonly LakeshoreAgentGroundingRule[] = [
  {
    agent: 'Sentinel',
    allowedSources: [
      'lakeshore-loaded-tenant-bundle',
      'lakeshore-governed-load-ledger',
      'modernization-pattern-pack',
      'modernization-industry-profiles',
      'kyriba-success-platform',
    ],
    useFor: [
      'Grounded Q&A over Lakeshore org, app, vendor, program, KPI, risk, and document evidence',
      'Contradiction checks between tenant evidence and reusable pattern claims',
      'Evidence-limit language when data is dry-run or missing',
    ],
    mustSay: [
      'Whether an answer is based on loaded Lakeshore evidence, reusable pattern guidance, or both',
      'Which evidence family supports the claim',
    ],
    mustNotSay: [
      'That dry-run data is committed live tenant data',
      'That AbarVa has scanned real Morgan Street, HAVI, tms, Continental, or Stanley data',
    ],
    evalPrompts: [
      'What evidence supports the Kyriba rollout risks for Lakeshore, and what is still only a pattern assumption?',
      'Which opco has the highest integration-risk exposure, and what loaded files support that answer?',
      'Where might the modernization pattern pack overstate what Lakeshore evidence currently proves?',
    ],
  },
  {
    agent: 'Nexus',
    allowedSources: [
      'lakeshore-loaded-tenant-bundle',
      'kyriba-success-platform',
      'moves-rate-card-engine',
      'modernization-pattern-pack',
    ],
    useFor: [
      'Kyriba Move setup, phase gates, value scorecard, SI delivery risk, and executive action plan',
      'Modernization Move planning using Lakebridge-style inventory intake',
      'Rate-card-informed estimate ranges',
    ],
    mustSay: [
      'Which phase/gate depends on tenant evidence not yet committed',
      'Whether cost is benchmark fallback, client-specific rate card, or planning range',
    ],
    mustNotSay: [
      'That approvals were completed inside Home or Intelligence',
      'That estimates are fixed-price commitments without a loaded rate card and approved scope',
    ],
    evalPrompts: [
      'Build a Kyriba Move for Lakeshore and show the first three gates with evidence required.',
      'Estimate the modernization effort for Northline analytics migration using planning-range language.',
      'Which SI contract terms should Daniel review before approving the next Kyriba phase?',
    ],
  },
  {
    agent: 'Atlas',
    allowedSources: [
      'lakeshore-loaded-tenant-bundle',
      'finance-cfo-ai-pattern-pack',
      'moves-rate-card-engine',
      'modernization-pattern-pack',
    ],
    useFor: [
      'Portfolio value, risk, and investment exposure across holdco and four opcos',
      'CFO-ready value-realization rollups',
      'Tower views of initiatives, vendors, apps, and KPI movement',
    ],
    mustSay: [
      'Which numbers come from Lakeshore uploaded rows versus reusable benchmarks',
      'Where rollups are incomplete because live commit/embedding is not done yet',
    ],
    mustNotSay: [
      'That dry-run ledger rows are live Tower telemetry',
      'That benchmark values are realized savings',
    ],
    evalPrompts: [
      'Show Daniel the portfolio risks across Kyriba, modernization, and vendor renewals.',
      'Which opcos have the most value-at-risk and which loaded data supports the ranking?',
      'What should not appear in the value ledger until live commit and embeddings complete?',
    ],
  },
  {
    agent: 'Steward',
    allowedSources: [
      'lakeshore-loaded-tenant-bundle',
      'lakeshore-governed-load-ledger',
      'finance-cfo-ai-pattern-pack',
      'kyriba-success-platform',
      'modernization-pattern-pack',
    ],
    useFor: [
      'Setup/Data Loads readiness',
      'Template and evidence governance',
      'Quarantine, approval, and commit-control explanations',
      'Client-admin next action routing',
    ],
    mustSay: [
      'Which workflow step is next: dry-run, live commit, embedding, Data Trust verification, or approval',
      'That Clerk users require admin provisioning and cannot be guessed by the app',
    ],
    mustNotSay: [
      'That users exist in Clerk until provisioning has actually run',
      'That live data is available before the data-plane commit and Data Trust verification pass',
    ],
    evalPrompts: [
      'What is the next safe action to move Lakeshore from dry-run to committed context?',
      'Which files should be given to the client for one-time offline review?',
      'What quarantine and approval controls are active before Lakeshore data becomes agent-available?',
    ],
  },
];

export function buildLakeshoreCorpusActivationPlan(args?: { generatedAt?: string }): LakeshoreCorpusActivationPlan {
  return {
    tenantKey: 'lakeshore',
    brokerKey: 'lakeshore-holdings',
    generatedAt: args?.generatedAt ?? new Date().toISOString(),
    cxoLogins: [
      {
        email: 'cio@lakeshore-holdings.example.com',
        persona: 'Meera Rao',
        title: 'Global Chief Information Officer',
        requiredMetadata: { clientId: 'lakeshore', tenantKey: 'lakeshore-holdings', role: 'maestro' },
      },
      {
        email: 'cfo@lakeshore-holdings.example.com',
        persona: 'Daniel Whitaker',
        title: 'Chief Financial Officer and Treasury Sponsor',
        requiredMetadata: { clientId: 'lakeshore', tenantKey: 'lakeshore-holdings', role: 'maestro' },
      },
    ],
    sources: LAKESHORE_CORPUS_SOURCES,
    agentGrounding: LAKESHORE_AGENT_GROUNDING,
    activationSteps: [
      'Preview the two Lakeshore CXO users with `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only`.',
      'Provision the two Lakeshore CXO users through Clerk with tenant-locked public metadata after secrets are available.',
      'Merge and run the governed load rehearsal commit path once Lakeshore client_id and private data-plane routing are available.',
      'Run `npm run embed:pending-chunks -- --tenant lakeshore` after context chunks are committed.',
      'Verify `/admin/data-trust` for Lakeshore record counts, coverage, last-loaded dates, and audit trail.',
      'Run the Sentinel/Nexus/Atlas/Steward eval prompts in this plan and fail any answer that omits provenance or overclaims dry-run evidence.',
    ],
    hallucinationControls: [
      'No answer may treat reusable pattern packs as tenant facts unless a Lakeshore-loaded source supports the claim.',
      'Dry-run evidence can explain readiness, not live customer state.',
      'Every agent response should label source basis: loaded tenant evidence, reusable pattern guidance, researched benchmark, or missing data.',
      'Cost and effort outputs stay planning-range unless a tenant-specific rate card has been committed.',
      'If asked about real Morgan Street/HAVI/tms/Continental/Stanley operations, agents must say Lakeshore is synthetic and analogous, not real-client data.',
    ],
  };
}

export function assertLakeshoreCorpusSourcesExist(rootDir: string): string[] {
  const missing = LAKESHORE_CORPUS_SOURCES
    .filter((source) => source.availability === 'available')
    .map((source) => source.sourcePath)
    .filter((sourcePath) => !fs.existsSync(path.join(rootDir, sourcePath)));
  return missing;
}

export function pendingLakeshoreCorpusSources(): readonly LakeshoreCorpusSource[] {
  return LAKESHORE_CORPUS_SOURCES.filter((source) => source.availability !== 'available');
}
