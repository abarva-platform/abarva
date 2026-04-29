// agent-retrieval.ts
//
// Corpus-backed retrieval functions for the /api/chat/agent route.
//
// Replaces the freestanding src/lib/agent/stage-playbooks.ts and
// src/lib/agent/service-category-playbooks.ts files.  All playbook
// content now lives in the sourcing pattern corpus (seed-patterns-sourcing.ts),
// making it available to the intelligence layer, the reasoning runtime, and
// the agent prompt in one consistent place.
//
// Retrieval approach: synchronous in-memory lookup against the source-controlled
// sourcing corpus. No network, no vector search. Pattern bodies are indexed by
// ID at module load, and category matching uses keyword specificity so generic
// terms such as "cloud" do not shadow more specific category phrases.
//
// Naming convention for the corpus maps:
//   STAGE_PATTERN_MAP    — stage label → pattern ID
//   CATEGORY_KEYWORD_MAP — keyword list → pattern ID
//
// CATEGORY_KEYWORD_MAP covers the event keywords that the agent route can
// currently infer from Source event names and types. It is a routing table, not
// the full sourcing-corpus count.
//   5  legacy service-type patterns  (PAT-SRC-020 – PAT-SRC-024)
//   corpus category patterns         (PAT-SRC-CAT-* series)

import SOURCING_PATTERNS from './seed-patterns-sourcing';

// ── Stage → pattern ID map ────────────────────────────────────────────────────
//
// Keys must match the exact stage label strings used in the Source tracker UI
// (same contract as the old STAGE_PLAYBOOKS record in stage-playbooks.ts).
//
// Stage → hosting pattern:
//   Plan        → PAT-SRC-013  (dedicated stage doctrine pattern)
//   RFI         → PAT-SRC-014  (dedicated stage doctrine pattern)
//   Shortlist   → PAT-SRC-015  (dedicated stage doctrine pattern)
//   RFP         → PAT-SRC-016  (dedicated stage doctrine pattern)
//   Q&A         → PAT-SRC-017  (dedicated stage doctrine pattern)
//   Initial-Bid → PAT-SRC-018  (dedicated stage doctrine pattern)
//   BAFO        → PAT-SRC-001  (body extended with "Stage doctrine — BAFO")
//   Selection   → PAT-SRC-011  (body extended with "Stage doctrine — Selection")
//   Award       → PAT-SRC-012  (body extended with "Stage doctrine — Award")
//   Onboard     → PAT-SRC-019  (dedicated stage doctrine pattern)

const STAGE_PATTERN_MAP: Record<string, string> = {
  Plan:           'PAT-SRC-013',
  RFI:            'PAT-SRC-014',
  Shortlist:      'PAT-SRC-015',
  RFP:            'PAT-SRC-016',
  'Q&A':          'PAT-SRC-017',
  'Initial-Bid':  'PAT-SRC-018',
  BAFO:           'PAT-SRC-001',
  Selection:      'PAT-SRC-011',
  Award:          'PAT-SRC-012',
  Onboard:        'PAT-SRC-019',
};

// ── Category keyword → pattern ID map ────────────────────────────────────────
//
// AMS is listed first because its name is short enough to be a substring of
// other strings (e.g. "managed services") and should match before generic terms.
//
// Legacy service-type patterns (PAT-SRC-020 – PAT-SRC-024):
//   AMS            → PAT-SRC-020
//   SaaS           → PAT-SRC-021
//   Infrastructure → PAT-SRC-022
//   Implementation → PAT-SRC-023
//   Consulting     → PAT-SRC-024
//
// Corpus category patterns (PAT-SRC-CAT-* series):
//   CRM            → PAT-SRC-CAT-CRM-001
//   ERP            → PAT-SRC-CAT-ERP-001
//   HCM            → PAT-SRC-CAT-HCM-001
//   ITSM           → PAT-SRC-CAT-ITSM-001
//   EPM / FP&A     → PAT-SRC-CAT-EPM-001
//   CMS            → PAT-SRC-CAT-CMS-001
//   Collaboration  → PAT-SRC-CAT-COMM-001
//   Video Conf     → PAT-SRC-CAT-COMM-002
//   Team Chat      → PAT-SRC-CAT-COMM-003
//   CDP            → PAT-SRC-CAT-CDP-001
//   CDW            → PAT-SRC-CAT-CDW-001
//   Lakehouse      → PAT-SRC-CAT-LAKE-001
//   MDM            → PAT-SRC-CAT-MDM-001
//   Data Fabric    → PAT-SRC-CAT-FAB-001
//   ETL/ELT        → PAT-SRC-CAT-ETL-001
//   Rev Intel      → PAT-SRC-CAT-REV-001
//   BI             → PAT-SRC-CAT-BI-001
//   LLM / GenAI    → PAT-SRC-CAT-LLM-001
//   AI Agents      → PAT-SRC-CAT-AGENT-001
//   Vector DB      → PAT-SRC-CAT-VEC-001
//   MLOps          → PAT-SRC-CAT-MLOPS-001
//   Code/DevOps    → PAT-SRC-CAT-CODE-001
//   IAM            → PAT-SRC-CAT-IAM-001
//   IGA            → PAT-SRC-CAT-IGA-001
//   PAM            → PAT-SRC-CAT-PAM-001
//   SASE/SSE       → PAT-SRC-CAT-SASE-001
//   SIEM           → PAT-SRC-CAT-SIEM-001
//   EDR/XDR        → PAT-SRC-CAT-EDR-001
//   CNAPP/CSPM     → PAT-SRC-CAT-CSP-001
//   FinOps         → PAT-SRC-CAT-FINOPS-001
//   Observability  → PAT-SRC-CAT-OBS-001
//   ITAM           → PAT-SRC-CAT-ITAM-001
//   SAM            → PAT-SRC-CAT-SAM-001
//   ESM            → PAT-SRC-CAT-ESM-001
//   BPM            → PAT-SRC-CAT-BPM-001
//   Legal Ops      → PAT-SRC-CAT-LEGAL-001
//   Procurement    → PAT-SRC-CAT-PROCURE-001
//   CLM            → PAT-SRC-CAT-CLM-001
//   AP Automation  → PAT-SRC-CAT-AP-001
//   TMS            → PAT-SRC-CAT-TMS-001
//   HR Tech        → PAT-SRC-CAT-HRTECH-001
//   Payroll        → PAT-SRC-CAT-PAYROLL-001

const CATEGORY_KEYWORD_MAP: Array<{ patternId: string; keywords: string[] }> = [
  // ── Legacy service-type patterns ─────────────────────────────────────────────
  {
    patternId: 'PAT-SRC-020',
    keywords: [
      'ams',
      'application managed service',
      'managed service',
      'application management',
    ],
  },
  {
    patternId: 'PAT-SRC-021',
    keywords: [
      'saas',
      'software as a service',
      'platform',
      'license',
      'licence',
      'subscription',
      'cloud software',
    ],
  },
  {
    patternId: 'PAT-SRC-022',
    keywords: [
      'infrastructure',
      'cloud',
      'hosting',
      'iaas',
      'paas',
      'data centre',
      'datacenter',
      'network',
    ],
  },
  {
    patternId: 'PAT-SRC-023',
    keywords: [
      'implementation',
      'integration',
      'delivery',
      'si',
      'systems integrator',
      'build',
      'deployment',
    ],
  },
  {
    patternId: 'PAT-SRC-024',
    keywords: [
      'consulting',
      'advisory',
      'strategy',
      'assessment',
      'review',
    ],
  },

  // ── Corpus category patterns (PAT-SRC-CAT-* series) ──────────────────────────

  // CRM — Enterprise CRM Platform Sourcing Playbook
  {
    patternId: 'PAT-SRC-CAT-CRM-001',
    keywords: [
      'crm',
      'customer relationship management',
      'sales force automation',
      'salesforce',
      'dynamics crm',
      'sales cloud',
      'opportunity management',
    ],
  },

  // ERP — Cloud ERP and Financial Systems Sourcing
  {
    patternId: 'PAT-SRC-CAT-ERP-001',
    keywords: [
      'erp',
      'enterprise resource planning',
      'cloud erp',
      'financial system',
      'general ledger',
      's4hana',
      'oracle erp',
    ],
  },

  // HCM — Human Capital Management Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-HCM-001',
    keywords: [
      'hcm',
      'human capital management',
      'human resources platform',
      'hris',
      'workday',
      'people platform',
      'talent management',
    ],
  },

  // ITSM — IT Service Management Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-ITSM-001',
    keywords: [
      'itsm',
      'it service management',
      'servicenow',
      'service desk',
      'incident management',
      'change management platform',
      'itil platform',
    ],
  },

  // EPM — Enterprise Performance Management and FP&A Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-EPM-001',
    keywords: [
      'epm',
      'enterprise performance management',
      'fp&a',
      'financial planning and analysis',
      'budgeting platform',
      'planning and forecasting',
      'consolidation platform',
    ],
  },

  // CMS — CMS and Headless Content Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-CMS-001',
    keywords: [
      'cms',
      'content management system',
      'headless cms',
      'web content management',
      'digital experience platform',
      'dxp',
      'content platform',
    ],
  },

  // Collaboration — Collaboration and Productivity Suite Sourcing
  {
    patternId: 'PAT-SRC-CAT-COMM-001',
    keywords: [
      'collaboration suite',
      'productivity suite',
      'microsoft 365',
      'google workspace',
      'office 365',
      'email and collaboration',
      'workplace productivity',
    ],
  },

  // Video Conferencing — Video Conferencing Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-COMM-002',
    keywords: [
      'video conferencing',
      'video meetings',
      'zoom',
      'webex',
      'teams meetings',
      'virtual meetings',
      'online meetings platform',
    ],
  },

  // Team Chat — Enterprise Messaging and Team Chat Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-COMM-003',
    keywords: [
      'team chat',
      'enterprise messaging',
      'slack',
      'instant messaging platform',
      'workplace chat',
      'team communication',
      'messaging platform',
    ],
  },

  // CDP — Customer Data Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-CDP-001',
    keywords: [
      'cdp',
      'customer data platform',
      'customer profile',
      'real-time profile',
      'unified customer data',
      'identity resolution',
      'customer 360',
    ],
  },

  // CDW — Cloud Data Warehouse Sourcing
  {
    patternId: 'PAT-SRC-CAT-CDW-001',
    keywords: [
      'data warehouse',
      'cloud data warehouse',
      'cdw',
      'snowflake',
      'bigquery',
      'redshift',
      'analytical warehouse',
    ],
  },

  // Lakehouse — Lakehouse and Data Lake Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-LAKE-001',
    keywords: [
      'lakehouse',
      'data lake',
      'databricks',
      'delta lake',
      'data lake platform',
      'object storage analytics',
      'open table format',
    ],
  },

  // MDM — Master Data Management Sourcing
  {
    patternId: 'PAT-SRC-CAT-MDM-001',
    keywords: [
      'mdm',
      'master data management',
      'product master data',
      'customer master data',
      'data stewardship',
      'golden record',
      'reference data management',
    ],
  },

  // Data Fabric — Data Fabric Governance Layer Sourcing
  {
    patternId: 'PAT-SRC-CAT-FAB-001',
    keywords: [
      'data fabric',
      'data governance platform',
      'data catalog',
      'metadata management',
      'data observability',
      'data mesh',
      'data quality platform',
    ],
  },

  // ETL/ELT — ETL/ELT and Data Integration Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-ETL-001',
    keywords: [
      'etl',
      'elt',
      'data integration',
      'data pipeline',
      'data ingestion',
      'fivetran',
      'informatica',
    ],
  },

  // Revenue Intelligence — Revenue Intelligence Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-REV-001',
    keywords: [
      'revenue intelligence',
      'conversation intelligence',
      'sales analytics',
      'deal intelligence',
      'gong',
      'clari',
      'revenue forecasting platform',
    ],
  },

  // BI — Governed Business Intelligence Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-BI-001',
    keywords: [
      'business intelligence',
      'bi platform',
      'tableau',
      'power bi',
      'looker',
      'analytics platform',
      'reporting platform',
    ],
  },

  // LLM / GenAI — Enterprise LLM and Generative AI Model Access Sourcing
  {
    patternId: 'PAT-SRC-CAT-LLM-001',
    keywords: [
      'llm',
      'large language model',
      'generative ai',
      'genai',
      'foundation model',
      'ai model api',
      'openai',
    ],
  },

  // AI Agents — Enterprise AI Agent Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-AGENT-001',
    keywords: [
      'ai agent',
      'agentic platform',
      'autonomous agent',
      'ai orchestration',
      'agent framework',
      'multi-agent',
      'ai workflow automation',
    ],
  },

  // Vector DB — Vector Database and Retrieval Infrastructure Sourcing
  {
    patternId: 'PAT-SRC-CAT-VEC-001',
    keywords: [
      'vector database',
      'vector search',
      'embedding store',
      'semantic search infrastructure',
      'pinecone',
      'weaviate',
      'retrieval augmented generation',
    ],
  },

  // MLOps — MLOps and Model Lifecycle Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-MLOPS-001',
    keywords: [
      'mlops',
      'model lifecycle',
      'ml platform',
      'machine learning operations',
      'model registry',
      'ml pipeline',
      'feature store',
    ],
  },

  // Code / DevOps — Enterprise Code Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-CODE-001',
    keywords: [
      'devops platform',
      'source code management',
      'scm',
      'github enterprise',
      'gitlab',
      'ci/cd platform',
      'ai coding assistant',
    ],
  },

  // IAM — Workforce IAM Sourcing
  {
    patternId: 'PAT-SRC-CAT-IAM-001',
    keywords: [
      'iam',
      'identity and access management',
      'sso',
      'single sign-on',
      'mfa',
      'conditional access',
      'identity provider',
    ],
  },

  // IGA — Identity Governance Sourcing
  {
    patternId: 'PAT-SRC-CAT-IGA-001',
    keywords: [
      'iga',
      'identity governance',
      'access review',
      'access certification',
      'entitlement management',
      'role management',
      'lifecycle governance',
    ],
  },

  // PAM — Privileged Access Management Sourcing
  {
    patternId: 'PAT-SRC-CAT-PAM-001',
    keywords: [
      'pam',
      'privileged access management',
      'privileged account',
      'vaulting',
      'just-in-time access',
      'session recording',
      'non-human identity',
    ],
  },

  // SASE/SSE — SASE and SSE Sourcing
  {
    patternId: 'PAT-SRC-CAT-SASE-001',
    keywords: [
      'sase',
      'sse',
      'ztna',
      'zero trust network access',
      'secure web gateway',
      'swg',
      'casb',
    ],
  },

  // SIEM — SIEM, Security Analytics, and Log Management Sourcing
  {
    patternId: 'PAT-SRC-CAT-SIEM-001',
    keywords: [
      'siem',
      'security information and event management',
      'log management',
      'security analytics',
      'splunk',
      'microsoft sentinel',
      'threat detection platform',
    ],
  },

  // EDR/XDR — EDR, XDR, and Endpoint Security Sourcing
  {
    patternId: 'PAT-SRC-CAT-EDR-001',
    keywords: [
      'edr',
      'xdr',
      'endpoint detection and response',
      'endpoint security',
      'crowdstrike',
      'sentinelone',
      'extended detection and response',
    ],
  },

  // CNAPP/CSPM — Cloud Security Posture, CNAPP, CSPM, CWPP, and CIEM Sourcing
  {
    patternId: 'PAT-SRC-CAT-CSP-001',
    keywords: [
      'cnapp',
      'cspm',
      'cloud security posture',
      'cwpp',
      'ciem',
      'cloud workload protection',
      'cloud native application protection',
    ],
  },

  // FinOps — FinOps and Cloud Cost Management Platform Sourcing
  {
    patternId: 'PAT-SRC-CAT-FINOPS-001',
    keywords: [
      'finops',
      'cloud cost management',
      'cloud cost optimization',
      'cloud spend visibility',
      'cloud financial management',
      'cost anomaly',
      'showback chargeback',
    ],
  },

  // Observability — Observability, APM, Logs, Metrics, and Tracing Sourcing
  {
    patternId: 'PAT-SRC-CAT-OBS-001',
    keywords: [
      'observability',
      'apm',
      'application performance monitoring',
      'distributed tracing',
      'log aggregation',
      'datadog',
      'new relic',
    ],
  },

  // ITAM — IT Asset Management, Discovery, Inventory, and CMDB Sourcing
  {
    patternId: 'PAT-SRC-CAT-ITAM-001',
    keywords: [
      'itam',
      'it asset management',
      'asset discovery',
      'cmdb',
      'configuration management database',
      'hardware inventory',
      'software inventory',
    ],
  },

  // SAM — Software Asset Management, License Optimization, and SaaS Management Sourcing
  {
    patternId: 'PAT-SRC-CAT-SAM-001',
    keywords: [
      'sam',
      'software asset management',
      'license optimization',
      'saas management',
      'license compliance',
      'software spend optimization',
      'shadow it discovery',
    ],
  },

  // ESM — Enterprise Service Management and ITSM-Adjacent Workflow Sourcing
  {
    patternId: 'PAT-SRC-CAT-ESM-001',
    keywords: [
      'esm',
      'enterprise service management',
      'shared services platform',
      'hr service delivery',
      'employee service portal',
      'cross-department service',
      'service catalog',
    ],
  },

  // BPM — Business Process Management and Workflow Orchestration Sourcing
  {
    patternId: 'PAT-SRC-CAT-BPM-001',
    keywords: [
      'bpm',
      'business process management',
      'workflow orchestration',
      'process automation',
      'low code workflow',
      'robotic process automation',
      'rpa',
    ],
  },

  // Legal Ops — Legal Operations, Matter Management, E-Billing, Spend, and CLM Adjacency Sourcing
  {
    patternId: 'PAT-SRC-CAT-LEGAL-001',
    keywords: [
      'legal operations',
      'matter management',
      'legal spend management',
      'e-billing legal',
      'legal hold',
      'outside counsel management',
      'legal tech',
    ],
  },

  // Procurement Suite — Source-to-Pay Procurement Suite and Orchestration Sourcing
  {
    patternId: 'PAT-SRC-CAT-PROCURE-001',
    keywords: [
      'source-to-pay',
      's2p',
      'procure-to-pay',
      'p2p',
      'procurement platform',
      'supplier management',
      'coupa',
    ],
  },

  // CLM — Contract Lifecycle Management Sourcing
  {
    patternId: 'PAT-SRC-CAT-CLM-001',
    keywords: [
      'clm',
      'contract lifecycle management',
      'contract management platform',
      'contract repository',
      'contract authoring',
      'contract analytics',
      'supplier contract',
    ],
  },

  // AP Automation — Accounts Payable Automation and Invoice-to-Pay Sourcing
  {
    patternId: 'PAT-SRC-CAT-AP-001',
    keywords: [
      'accounts payable automation',
      'ap automation',
      'invoice processing',
      'invoice-to-pay',
      'e-invoicing',
      'purchase order matching',
      'three-way match',
    ],
  },

  // TMS — Treasury Management System and Treasury Workstation Sourcing
  {
    patternId: 'PAT-SRC-CAT-TMS-001',
    keywords: [
      'treasury management system',
      'tms',
      'treasury workstation',
      'cash management platform',
      'liquidity management',
      'fx risk management',
      'debt management platform',
    ],
  },

  // HR Tech — HR Technology Suite, HRIS, and HCM-Adjacent Sourcing
  {
    patternId: 'PAT-SRC-CAT-HRTECH-001',
    keywords: [
      'hr technology',
      'hrtech',
      'hr suite',
      'hris',
      'hr information system',
      'people operations platform',
      'hr platform consolidation',
    ],
  },

  // Payroll — Payroll, Global Payroll, and EOR-Adjacent Payroll Sourcing
  {
    patternId: 'PAT-SRC-CAT-PAYROLL-001',
    keywords: [
      'payroll',
      'global payroll',
      'payroll platform',
      'employer of record',
      'eor payroll',
      'payroll consolidation',
      'multi-country payroll',
    ],
  },
];

// ── Pattern lookup helpers ────────────────────────────────────────────────────

/**
 * Build a map from pattern ID → body at module load time so repeated
 * agent calls are O(1) lookups rather than O(n) scans.
 */
const PATTERN_BODY_MAP: Map<string, string> = new Map(
  SOURCING_PATTERNS.map((p) => [p.id, p.body]),
);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the corpus-backed stage doctrine for the given stage label,
 * formatted for injection into the agent system prompt.
 *
 * Returns null when stage is absent or unrecognised.
 *
 * @param stage  Stage label string, e.g. 'BAFO', 'Plan', 'Initial-Bid'.
 *               Accepts null/undefined for call-site convenience.
 */
export function retrieveStageContext(stage: string | null | undefined): string | null {
  if (!stage) return null;
  const patternId = STAGE_PATTERN_MAP[stage];
  if (!patternId) return null;
  const body = PATTERN_BODY_MAP.get(patternId);
  if (!body) return null;
  return body;
}

/**
 * Returns the corpus-backed service-category playbook for the given event
 * name and optional event type string, formatted for injection into the
 * agent system prompt.
 *
 * Keyword matching is case-insensitive substring search, same contract as
 * the old getCategoryPlaybook function.  AMS keywords are checked first.
 *
 * Returns null when no category matches.
 *
 * @param eventName  Source event name, e.g. 'AMS Vendor Consolidation 2026'.
 * @param eventType  Optional event type string, e.g. 'managed-services'.
 */
export function retrieveCategoryContext(
  eventName: string,
  eventType?: string,
): string | null {
  const haystack = [
    eventName,
    eventType ?? '',
  ].join(' ');
  const normalizedHaystack = haystack
    .toLowerCase()
    .replace(/[-_/]+/g, ' ');

  let bestMatch: { patternId: string; keywordLength: number } | null = null;

  for (const { patternId, keywords } of CATEGORY_KEYWORD_MAP) {
    for (const kw of keywords) {
      const normalizedKeyword = kw.toLowerCase().replace(/[-_/]+/g, ' ');
      if (
        normalizedHaystack.includes(normalizedKeyword) &&
        (!bestMatch || normalizedKeyword.length > bestMatch.keywordLength)
      ) {
        bestMatch = {
          patternId,
          keywordLength: normalizedKeyword.length,
        };
      }
    }
  }

  return bestMatch ? PATTERN_BODY_MAP.get(bestMatch.patternId) ?? null : null;
}
