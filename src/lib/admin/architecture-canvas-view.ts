// ── ARCH5: Architecture Canvas view-model builder ────────────────────────────
// Pure TypeScript: no React, no file I/O, no Date.now, no Math.random.
// Deterministic. Powers the workflow-canvas refresh of the Admin Architecture page.

export type ArchitecturePlaneId =
  | 'app-plane'
  | 'agent-plane'
  | 'context-plane'
  | 'knowledge-plane'
  | 'data-plane'
  | 'model-gateway-plane'
  | 'tool-plane'
  | 'governance-plane'
  | 'deployment-plane';

export interface ArchitecturePlane {
  id: ArchitecturePlaneId;
  name: string;
  description: string;
  responsibilities: string[];
  builtNow: boolean;
  category: 'control' | 'data' | 'agent' | 'gateway' | 'governance';
}

export interface ArchitectureFlowStep {
  stepId: string;
  label: string;
  description: string;
}

export interface ArchitectureBuiltDeferredItem {
  id: string;
  label: string;
  status: 'built' | 'partial' | 'deferred';
  detail: string;
}

export interface ArchitectureNextAction {
  actionId: string;
  label: string;
  rationale: string;
}

export interface ArchitecturePlaneSummary {
  name: string;
  description: string;
  responsibilities: string[];
}

export interface ArchitectureCanvasViewModel {
  executiveBrief: {
    headline: string;
    summary: string;
    asOfDate: string;
  };
  planes: ArchitecturePlane[];
  requestFlow: {
    title: string;
    steps: ArchitectureFlowStep[];
  };
  dataFlow: {
    title: string;
    steps: ArchitectureFlowStep[];
  };
  controlPlaneModel: {
    saasControlPlane: ArchitecturePlaneSummary;
    privateDataPlane: ArchitecturePlaneSummary;
    boundary: string;
  };
  azureReference: {
    headline: string;
    targetServices: string[];
    notes: string;
  };
  modelGatewayBoundary: {
    gateway: { name: string; description: string };
    toolRegistry: { name: string; description: string };
    rule: string;
  };
  agentMissionRuntime: {
    headline: string;
    description: string;
    components: string[];
  };
  builtVsDeferred: ArchitectureBuiltDeferredItem[];
  nextActions: ArchitectureNextAction[];
  generatedAt: string;
  caveat: string;
}

const PLANES: ArchitecturePlane[] = [
  {
    id: 'app-plane',
    name: 'App Plane',
    description: 'Programs, Source, Intelligence, Tower, Admin pages',
    responsibilities: [
      'Page routing and layout',
      'Surface composition for each pillar',
      'Maestro shell and navigation',
    ],
    builtNow: true,
    category: 'control',
  },
  {
    id: 'agent-plane',
    name: 'Agent Plane',
    description: 'Nexus, Sentinel, Atlas, Steward briefings, missions, validation',
    responsibilities: [
      'Anchor agent briefings',
      'Mission orchestration and validation',
      'Multi-agent composition',
    ],
    builtNow: true,
    category: 'agent',
  },
  {
    id: 'context-plane',
    name: 'Context Plane',
    description: 'Page-level context bundles, agent context assembly, source-of-truth timestamps',
    responsibilities: [
      'Per-page deterministic context bundles',
      'Source-of-truth timestamping',
      'Agent input contract enforcement',
    ],
    builtNow: true,
    category: 'control',
  },
  {
    id: 'knowledge-plane',
    name: 'Knowledge / Evidence Plane',
    description: 'Pattern library, scorecard, value ledger, evidence chips',
    responsibilities: [
      'Pattern coverage and reuse',
      'Value outcome ledger',
      'Evidence traceability',
    ],
    builtNow: true,
    category: 'data',
  },
  {
    id: 'data-plane',
    name: 'Data Plane',
    description: 'Drizzle ORM, Postgres, deterministic seeds, client multi-tenancy',
    responsibilities: [
      'Drizzle schema and queries',
      'Deterministic seed datasets',
      'Tenant isolation boundary',
    ],
    builtNow: true,
    category: 'data',
  },
  {
    id: 'model-gateway-plane',
    name: 'Model Gateway Plane',
    description: 'Centralised LLM access; provider-agnostic; deferred to v2',
    responsibilities: [
      'Provider rotation and failover',
      'Audit, redaction, cost control',
      'Single funnel for all model calls',
    ],
    builtNow: false,
    category: 'gateway',
  },
  {
    id: 'tool-plane',
    name: 'Tool Plane',
    description: 'Tool registry, function-call boundary; deferred to v2',
    responsibilities: [
      'Whitelisted tool registry',
      'Schema enforcement',
      'Tool invocation audit',
    ],
    builtNow: false,
    category: 'gateway',
  },
  {
    id: 'governance-plane',
    name: 'Governance / Audit Plane',
    description: 'Production readiness manifest, build-waves audit, hygiene gate, change-log',
    responsibilities: [
      'Production readiness manifest',
      'Build-wave audit and hygiene gate',
      'Change-log and decision audit',
    ],
    builtNow: true,
    category: 'governance',
  },
  {
    id: 'deployment-plane',
    name: 'Deployment Plane',
    description: 'Vercel today; Azure target; private data plane separation',
    responsibilities: [
      'Vercel SaaS plane today',
      'Azure private data plane target',
      'Plane separation and boundary contracts',
    ],
    builtNow: true,
    category: 'governance',
  },
];

const REQUEST_FLOW_STEPS: ArchitectureFlowStep[] = [
  {
    stepId: 'request',
    label: 'Request',
    description: 'User opens a page or triggers an action.',
  },
  {
    stepId: 'context',
    label: 'Context',
    description:
      'Context plane assembles deterministic bundle: events, decisions, evidence, gates, source-of-truth timestamps.',
  },
  {
    stepId: 'agent',
    label: 'Agent',
    description:
      'Anchor agent (Nexus/Sentinel/Atlas/Steward) reads the bundle and decides what to surface.',
  },
  {
    stepId: 'output',
    label: 'Output',
    description: 'Page renders deterministic read model. Caveats made explicit. No fabrication.',
  },
];

const DATA_FLOW_STEPS: ArchitectureFlowStep[] = [
  {
    stepId: 'data',
    label: 'Data',
    description: 'Drizzle/Postgres seeded data; client multi-tenancy boundary enforced.',
  },
  {
    stepId: 'evidence',
    label: 'Evidence',
    description: 'Patterns, scorecards, value ledger transform raw data into traceable evidence.',
  },
  {
    stepId: 'usability',
    label: 'Usability',
    description:
      'Agent assembles evidence into actionable read models with explicit gaps and recommended next actions.',
  },
];

const BUILT_VS_DEFERRED: ArchitectureBuiltDeferredItem[] = [
  {
    id: 'core-app-routing',
    label: 'Core app routing (Programs, Source, Intelligence, Tower, Admin)',
    status: 'built',
    detail: 'All canonical surfaces have routes.',
  },
  {
    id: 'agent-context-assembly',
    label: 'Agent context assembly + multi-agent briefings',
    status: 'built',
    detail: 'Deterministic per-page context bundles ship today.',
  },
  {
    id: 'source-commercial-ui',
    label: 'Source commercial intelligence UI',
    status: 'built',
    detail: 'Wave 14–16 commercial story is live.',
  },
  {
    id: 'production-readiness-manifest',
    label: 'Production readiness manifest + governance',
    status: 'built',
    detail: 'Single canonical readiness JSON.',
  },
  {
    id: 'model-gateway',
    label: 'Centralised model gateway',
    status: 'deferred',
    detail: 'All model calls today go through provider SDKs directly. To be migrated.',
  },
  {
    id: 'tool-registry',
    label: 'Tool registry boundary',
    status: 'deferred',
    detail: 'Agent tool calls have no central registry yet.',
  },
  {
    id: 'private-data-plane-azure',
    label: 'Private data plane on Azure',
    status: 'partial',
    detail: 'Architecture and reference documented; production deployment to follow.',
  },
  {
    id: 'live-vendor-ingestion',
    label: 'Live vendor response ingestion',
    status: 'deferred',
    detail: 'Today the platform is seed-backed. Live ingestion will follow.',
  },
];

const NEXT_ACTIONS: ArchitectureNextAction[] = [
  {
    actionId: 'arch-next-001',
    label: 'Define model gateway contract and migration plan',
    rationale:
      'Centralised gateway is the precondition for multi-provider support and audit.',
  },
  {
    actionId: 'arch-next-002',
    label: 'Stand up Azure private data plane reference deployment',
    rationale:
      'Validate the private data plane story end-to-end before customer pilots.',
  },
  {
    actionId: 'arch-next-003',
    label: 'Document tool registry contract',
    rationale:
      'Even before implementation, contract clarity de-risks plane separation.',
  },
  {
    actionId: 'arch-next-004',
    label: 'Add cross-plane audit trail validator',
    rationale: 'Auditability is the cornerstone of the governance plane.',
  },
];

export function buildArchitectureCanvasView(): ArchitectureCanvasViewModel {
  return {
    executiveBrief: {
      headline:
        'AbarVa is a calm intelligence layer. Models, context, and tools coordinate inside a SaaS Control Plane while customer data stays in a Private Data Plane.',
      summary:
        'The platform is composed of nine planes. Application, agent, and context logic runs in the SaaS control plane. Customer evidence, knowledge, and data live in the private data plane (Azure target). All model calls traverse a gateway; all tool calls traverse a registry. Agent missions are deterministic, audited, and seed-backed today; live ingestion arrives in later waves.',
      asOfDate: '2026-04-26',
    },
    planes: PLANES,
    requestFlow: {
      title: 'Request flow',
      steps: REQUEST_FLOW_STEPS,
    },
    dataFlow: {
      title: 'Data flow',
      steps: DATA_FLOW_STEPS,
    },
    controlPlaneModel: {
      saasControlPlane: {
        name: 'SaaS Control Plane',
        description:
          'AbarVa application, agent, context, and governance planes. Stateless app code; no customer evidence stored here.',
        responsibilities: [
          'App routing',
          'Agent orchestration',
          'Page assembly',
          'Manifest governance',
        ],
      },
      privateDataPlane: {
        name: 'Private Data Plane',
        description:
          'Customer-tenant data: evidence, knowledge, decisions, scorecards, value ledger, audit. Lives in tenant Azure subscription (target).',
        responsibilities: [
          'Tenant evidence storage',
          'Decision and gate audit',
          'Scorecard governance',
          'Source-of-truth records',
        ],
      },
      boundary:
        'The boundary is contract-first: SaaS planes call typed read-models; data plane never trusts client input. All cross-plane calls are auditable.',
    },
    azureReference: {
      headline: 'Azure target for the private data plane',
      targetServices: [
        'Azure Container Apps',
        'Azure Database for Postgres',
        'Azure Storage (private endpoints)',
        'Azure Key Vault',
        'Azure OpenAI (via gateway, deferred)',
        'Azure Monitor / Audit Logs',
      ],
      notes:
        'AbarVa is deployable today on Vercel for the SaaS plane. The private data plane is designed for Azure deployment with private endpoints; reference architecture documented in DES/ARCH series.',
    },
    modelGatewayBoundary: {
      gateway: {
        name: 'Model Gateway',
        description:
          'All LLM calls funnel through one gateway. Provider rotation, audit, redaction, and cost control happen here. Deferred to a later wave.',
      },
      toolRegistry: {
        name: 'Tool Registry',
        description:
          'All agent tool calls traverse a registry. Whitelisting, schema enforcement, and audit happen here. Deferred.',
      },
      rule: 'Rule: no agent calls a model or tool directly. The gateway and registry are the only paths.',
    },
    agentMissionRuntime: {
      headline: 'Agent Mission Runtime',
      description:
        'Deterministic mission orchestration. Agents build briefings from context bundles, propose missions, and report results back into the manifest.',
      components: [
        'Mission Queue',
        'Agent Brief Builder',
        'Mission Validator',
        'Mission Reporter',
        'Multi-Agent Briefing Composer',
      ],
    },
    builtVsDeferred: BUILT_VS_DEFERRED,
    nextActions: NEXT_ACTIONS,
    generatedAt: '2026-04-26',
    caveat:
      'Architecture canvas reflects current implementation and explicit deferred items. Some planes (model gateway, tool registry) are intentionally deferred. The Azure private data plane is documented as target architecture; deployment path is in roadmap.',
  };
}
