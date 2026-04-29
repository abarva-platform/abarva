import type { PatternSeed, SourceBasisRef } from './seed-types';

const AS_OF = '2026-04-29';

const GITLAB_ULTIMATE: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab Ultimate overview',
  url: 'https://about.gitlab.com/pricing/ultimate/',
  asOf: AS_OF,
  note: 'Public GitLab page describing Ultimate as available for SaaS and self-managed deployment options with advanced security, compliance, portfolio, value-stream, support, and agentic AI capabilities.',
};

const GITLAB_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab pricing page',
  url: 'https://about.gitlab.com/pricing/',
  asOf: AS_OF,
  note: 'Public GitLab pricing page showing plan boundaries, custom-pricing posture for Ultimate, GitLab.com compute and storage plan attributes, Duo credit messaging, and add-on categories.',
};

const GITLAB_DEDICATED: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab Dedicated documentation',
  url: 'https://docs.gitlab.com/subscriptions/gitlab_dedicated/',
  asOf: AS_OF,
  note: 'Official docs describing Dedicated as a fully isolated, GitLab-hosted, AWS-region-based single-tenant SaaS offering on the Ultimate tier, including security, compliance, feature availability, and service-level notes.',
};

const GITLAB_DEDICATED_DATA_RESIDENCY: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab Dedicated data residency and high availability',
  url: 'https://docs.gitlab.com/administration/dedicated/create_instance/data_residency_high_availability/',
  asOf: AS_OF,
  note: 'Official docs for Dedicated region selection, primary/secondary/backup region roles, dedicated AWS account isolation, and high-availability architecture.',
};

const GITLAB_DEDICATED_DR: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab Dedicated disaster recovery',
  url: 'https://docs.gitlab.com/administration/dedicated/disaster_recovery/',
  asOf: AS_OF,
  note: 'Official docs describing Dedicated disaster recovery prerequisites, RTO/RPO objectives, Geo replication, backup cadence, retention, and limitations.',
};

const GITLAB_SEAT_MANAGEMENT: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab manage seats documentation',
  url: 'https://docs.gitlab.com/subscriptions/manage_seats/',
  asOf: AS_OF,
  note: 'Official docs defining billable users, non-billable user criteria, seat usage review, and controls to reduce overage risk across GitLab.com, Self-Managed, and Dedicated.',
};

const GITLAB_SECURITY: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab security and Trust Center page',
  url: 'https://about.gitlab.com/security/',
  asOf: AS_OF,
  note: 'Public GitLab security page linking Trust Center documents and summarizing GitLab security, legal/privacy, availability, DevSecOps, compliance, and software supply-chain resources.',
};

const GITLAB_SUBSCRIPTION_AGREEMENT: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitLab Subscription Agreement',
  url: 'https://handbook.gitlab.com/handbook/legal/subscription-agreement/',
  asOf: AS_OF,
  note: 'Public legal terms covering GitLab Dedicated restrictions, hosting responsibility, customer connectivity responsibilities, scheduled and unscheduled maintenance, BYOK risk allocation, and SLA remedy language.',
};

const GITLAB_PROFILE_STAGES = [
  {
    id: 'Scope',
    label: 'Deployment and control scope',
    order: 1,
    description:
      'Decide whether the sourcing event is for GitLab.com Ultimate, Self-Managed Ultimate, GitLab Dedicated, or a migration between those operating models; define regulated data, user populations, CI/CD workloads, integrations, and control owners.',
  },
  {
    id: 'MarketScan',
    label: 'Platform and incumbent scan',
    order: 2,
    description:
      'Compare GitLab against incumbent SCM, CI/CD, DevSecOps, security-scanning, artifact, planning, and compliance tooling while separating platform consolidation value from hosting and operating-model requirements.',
  },
  {
    id: 'RFP',
    label: 'Evidence-backed technical proof',
    order: 3,
    description:
      'Require scripted proof for source-code management, CI/CD, runner strategy, security findings, compliance controls, identity, audit, data residency, migration, and disaster-recovery assumptions.',
  },
  {
    id: 'BAFO',
    label: 'Commercial and risk normalization',
    order: 4,
    description:
      'Normalize users, guests, service accounts, compute, storage, runner model, Duo credits or AI usage, support, Dedicated infrastructure assumptions, professional services, renewal terms, and exit obligations before BAFO.',
  },
  {
    id: 'Contracting',
    label: 'Contracting and operating handoff',
    order: 5,
    description:
      'Convert the selected model into order-form entitlements, region choices, SLA and maintenance treatment, support/escalation paths, security artifacts, data-processing terms, BYOK posture, migration acceptance, and operational runbooks.',
  },
];

export const SOURCING_VENDOR_GITLAB_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-GITLAB-001',
    slug: 'gitlab-ultimate-dedicated-sourcing-profile',
    title: 'GitLab Ultimate and Dedicated Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'GitLab Ultimate and Dedicated sourcing should be treated as a DevSecOps operating-model decision, not a simple developer-seat renewal, because plan tier, hosting model, security controls, CI/CD economics, seat counting, data residency, DR, AI usage, and exit obligations change the buyer risk profile.',
    applicability:
      'Apply when evaluating GitLab Ultimate, GitLab Dedicated, GitLab.com-to-Dedicated migration, Self-Managed-to-Dedicated migration, enterprise DevSecOps consolidation, security/compliance feature expansion, or a renewal where CI/CD, application security, software supply chain, governance, or regulated-data requirements are material.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex-ven-gitlab',
    createdAt: AS_OF,
    instanceCount: 0,
    sourceDocuments: [
      'https://about.gitlab.com/pricing/ultimate/',
      'https://about.gitlab.com/pricing/',
      'https://docs.gitlab.com/subscriptions/gitlab_dedicated/',
      'https://docs.gitlab.com/administration/dedicated/create_instance/data_residency_high_availability/',
      'https://docs.gitlab.com/administration/dedicated/disaster_recovery/',
      'https://docs.gitlab.com/subscriptions/manage_seats/',
      'https://about.gitlab.com/security/',
      'https://handbook.gitlab.com/handbook/legal/subscription-agreement/',
    ],
    regulatoryChips: ['GDPR-if-personal-data', 'SOC-2-review', 'ISO-27001-review', 'DORA-if-regulated-financial-entity', 'HIPAA-if-PHI'],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-PRC-SAAS-001', 'PAT-SRC-CON-004'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: GITLAB_PROFILE_STAGES,
    perStageGateCriteria: {
      Scope: [
        {
          id: 'gitlab-scope-hosting-model',
          stageId: 'Scope',
          gateType: 'hard',
          description: 'The buying team has selected a candidate hosting model or explicitly kept GitLab.com, Self-Managed, and Dedicated in scope with different risk treatments.',
          evaluationHint: 'Look for a written decision record covering data residency, infrastructure control, operational responsibility, access path, CI/CD workload location, and security-assurance needs.',
        },
      ],
      RFP: [
        {
          id: 'gitlab-rfp-scripted-devsecops-proof',
          stageId: 'RFP',
          gateType: 'hard',
          description: 'The RFP includes buyer-authored proof scripts for source control, CI/CD, application security, compliance, audit, identity, migration, and failure recovery.',
          evaluationHint: 'Passing evidence should include screenshots, exported reports, configuration extracts, runner assumptions, and named limitations for the proposed GitLab operating model.',
        },
      ],
      BAFO: [
        {
          id: 'gitlab-bafo-commercial-normalization',
          stageId: 'BAFO',
          gateType: 'hard',
          description: 'The BAFO model separates licensed users, non-billable users, guests, service accounts, compute, storage, support, AI/Duo consumption, Dedicated infrastructure, migration, and renewal mechanics.',
          evaluationHint: 'The model must not rely on a single blended platform price without showing the drivers that can change run-rate economics.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      Scope: [
        {
          id: 'gitlab-control-scope-memo',
          label: 'GitLab deployment and control scope memo',
          stageId: 'Scope',
          requirement: 'required',
          gateType: 'hard',
          description: 'One memo naming deployment option, regions, regulated data, identity, runner, integration, audit, security-assurance, and ownership assumptions.',
        },
      ],
      Contracting: [
        {
          id: 'gitlab-entitlement-and-ops-exhibit',
          label: 'GitLab entitlement and operations exhibit',
          stageId: 'Contracting',
          requirement: 'required',
          gateType: 'hard',
          description: 'Order-form exhibit that decomposes tier, offering, users, add-ons, regions, maintenance, SLA, DR, support, security artifacts, migration obligations, and exit terms.',
        },
      ],
    },
    vendorLandscape: [
      {
        vendorName: 'GitLab Ultimate',
        tier: 'enterprise',
        positioning:
          'Enterprise GitLab tier for organizations seeking a broader DevSecOps platform with advanced security, compliance, portfolio, value-stream, support, and AI-adjacent capabilities across supported deployment options.',
        strengths: ['Public Ultimate feature positioning', 'SaaS and self-managed deployment options', 'Security and compliance feature orientation'],
        cautions: [
          'Public pages should not be used to infer private net pricing, discount ranges, renewal caps, migration credits, or buyer-specific support concessions.',
          'GitLab.com plan attributes such as compute minutes or storage limits should not be applied to Dedicated or Self-Managed without confirming the current offering documentation and order form.',
        ],
        sourceBasis: [GITLAB_ULTIMATE, GITLAB_PRICING, GITLAB_SEAT_MANAGEMENT],
      },
      {
        vendorName: 'GitLab Dedicated',
        tier: 'enterprise',
        positioning:
          'Single-tenant SaaS option on the Ultimate tier for buyers that want GitLab hosted and maintained by GitLab in a selected AWS region with isolation, data-residency control, high availability, and disaster-recovery constructs.',
        strengths: ['Single-tenant isolation posture', 'AWS region choice and data-residency controls', 'GitLab-managed operations with Dedicated-specific documentation'],
        cautions: [
          'Dedicated has documented feature exceptions and operational constraints, including feature-flag limits and some unavailable AI, Pages, operational, and server-access capabilities.',
          'Region choices, BYOK posture, recovery objectives, maintenance windows, and customer connectivity responsibilities must be confirmed before signature.',
        ],
        sourceBasis: [GITLAB_DEDICATED, GITLAB_DEDICATED_DATA_RESIDENCY, GITLAB_DEDICATED_DR, GITLAB_SUBSCRIPTION_AGREEMENT],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public GitLab commercial anchors only',
        model: 'hybrid',
        metric: 'Tier, offering, billable users, guest treatment, compute or runner model, storage, AI/Duo usage or credits, support, Dedicated infrastructure assumptions, migration services, and renewal baseline',
        sourceBasis: [GITLAB_PRICING, GITLAB_ULTIMATE, GITLAB_SEAT_MANAGEMENT, GITLAB_DEDICATED],
        confidence: 0.61,
        notes:
          'Use public pages to identify plan boundaries, public add-on categories, seat-count concepts, and custom-pricing posture. Do not populate private net price, discount, renewal uplift, Dedicated infrastructure fee, reseller margin, migration credit, or AI consumption commitment without buyer-specific quote evidence.',
      },
      {
        label: 'Dedicated resilience and region evidence',
        model: 'unknown',
        metric: 'Primary, secondary, and backup regions; disaster-recovery eligibility; RTO/RPO objectives; backup cadence; service-level exclusions; maintenance assumptions; BYOK posture',
        sourceBasis: [GITLAB_DEDICATED_DATA_RESIDENCY, GITLAB_DEDICATED_DR, GITLAB_DEDICATED, GITLAB_SUBSCRIPTION_AGREEMENT],
        confidence: 0.74,
        notes:
          'Treat resilience and region choices as sourcing economics because they affect risk, onboarding, operating commitments, and potential exit/migration effort even when no public line-item price is available.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Offering, tier, and entitlement decomposition',
        buyerPosition:
          'Attach a schedule identifying GitLab.com Ultimate, Self-Managed Ultimate, or Dedicated; billable users; Ultimate guest assumptions; administrators and service accounts; add-ons; support; AI/Duo usage treatment; compute or runner model; storage; and renewal baseline.',
        fallbackPosition:
          'If the quote is bundled, require a non-pricing operational exhibit that still decomposes entitlement drivers and renewal mechanics.',
        walkawayTriggers: ['A blended order form cannot be mapped to users, add-ons, hosting model, support, renewal baseline, and operational responsibilities.'],
        sourceBasis: [GITLAB_PRICING, GITLAB_SEAT_MANAGEMENT, GITLAB_ULTIMATE],
      },
      {
        clauseArea: 'Dedicated region, resilience, and maintenance commitments',
        buyerPosition:
          'For Dedicated, document primary, secondary, and backup regions; permanent region-choice implications; DR eligibility; RTO/RPO objectives; scheduled and unscheduled maintenance treatment; service-level exclusions; and customer connectivity obligations.',
        fallbackPosition:
          'If final region selection is not ready, preserve a pre-signature gating exhibit and do not treat Dedicated as approved for regulated workloads until region, DR, and access-path evidence is complete.',
        walkawayTriggers: ['Dedicated is approved without written region, DR, maintenance, SLA, and connectivity assumptions.'],
        sourceBasis: [GITLAB_DEDICATED_DATA_RESIDENCY, GITLAB_DEDICATED_DR, GITLAB_DEDICATED, GITLAB_SUBSCRIPTION_AGREEMENT],
      },
      {
        clauseArea: 'Security, privacy, audit, and AI control evidence',
        buyerPosition:
          'Require current Trust Center artifacts, DPA or privacy review, subprocessor and access-control review, AI/Duo feature and data-use assessment, feature-exception inventory for Dedicated, audit-log access expectations, and security incident notification handling.',
        fallbackPosition:
          'If sensitive artifacts require portal access or NDA, record the artifact names and approval owner rather than copying private documents into the sourcing record.',
        walkawayTriggers: ['Security approval relies on marketing claims without artifact review or documented exceptions.'],
        sourceBasis: [GITLAB_SECURITY, GITLAB_DEDICATED, GITLAB_SUBSCRIPTION_AGREEMENT],
      },
      {
        clauseArea: 'Migration, BYOK, and exit responsibilities',
        buyerPosition:
          'Define migration acceptance, repository and artifact export, runner transition, identity cutover, customer-managed encryption-key risk, termination export obligations, and transition-assistance commitments before commercial award.',
        fallbackPosition:
          'If full migration planning is not complete, separate subscription award from production cutover and preserve delayed expansion or exit rights tied to acceptance evidence.',
        walkawayTriggers: ['The buyer accepts Dedicated or Ultimate expansion without repository, runner, artifact, identity, key-management, and exit evidence.'],
        sourceBasis: [GITLAB_SUBSCRIPTION_AGREEMENT, GITLAB_DEDICATED, GITLAB_DEDICATED_DR],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Deployment-model fork before price negotiation',
        whenToUse: 'Use when stakeholders compare GitLab.com, Self-Managed, and Dedicated as if they are interchangeable license options.',
        buyerAsk:
          'Force separate scorecards for hosting responsibility, region control, identity, CI/CD runner model, security artifacts, feature exceptions, DR, maintenance, and exit work before discussing term length or expansion.',
        tradeoffs: ['The fork can slow commercial momentum, but it avoids accepting a cheaper or preferred model that fails the control environment.'],
        evidenceBasis: [GITLAB_ULTIMATE, GITLAB_DEDICATED, GITLAB_DEDICATED_DATA_RESIDENCY],
      },
      {
        lever: 'Seat and role hygiene exchange',
        whenToUse: 'Use before renewal or expansion when billable users, guests, administrators, inherited members, service accounts, and blocked or deactivated users may change the subscription baseline.',
        buyerAsk:
          'Condition renewal baseline on a current seat export, guest-role policy, restricted-access settings, administrator/service-account treatment, and quarterly or annual overage handling.',
        tradeoffs: ['Tighter access controls may require governance work with engineering teams, but they reduce avoidable overage and audit disputes.'],
        evidenceBasis: [GITLAB_SEAT_MANAGEMENT],
      },
      {
        lever: 'Resilience proof before Dedicated premium',
        whenToUse: 'Use when Dedicated is justified by compliance, isolation, data residency, or availability but the buyer has not tested region, backup, failover, and maintenance assumptions.',
        buyerAsk:
          'Require region matrix, DR objective acknowledgment, backup and retention evidence, maintenance-window plan, service-level exclusions, connectivity design, and incident escalation path.',
        tradeoffs: ['More detailed resilience proof may expose constraints early, which is preferable to discovering them after migration.'],
        evidenceBasis: [GITLAB_DEDICATED_DR, GITLAB_DEDICATED_DATA_RESIDENCY, GITLAB_SUBSCRIPTION_AGREEMENT],
      },
      {
        lever: 'AI/Duo and feature-exception carveout',
        whenToUse: 'Use when the business case includes GitLab Duo Agent Platform, AI productivity, vulnerability workflows, or Dedicated feature parity claims.',
        buyerAsk:
          'Separate included credits or AI usage, add-on credits, data-use review, model-risk review, Dedicated AI exceptions, disabled feature flags, and success metrics from the base platform price.',
        tradeoffs: ['A carveout can reduce headline transformation claims, but it makes AI cost, eligibility, and control evidence auditable.'],
        evidenceBasis: [GITLAB_PRICING, GITLAB_ULTIMATE, GITLAB_DEDICATED],
      },
    ],
    riskFactors: [
      {
        id: 'gitlab-ultimate-dedicated-hosting-conflation',
        label: 'Ultimate tier and Dedicated hosting model are conflated',
        severity: 'high',
        detectionSignals: [
          'The business case cites Ultimate features while contract review assumes Dedicated isolation, or vice versa.',
          'GitLab.com plan limits, self-managed controls, and Dedicated operating responsibilities appear in one undifferentiated requirement set.',
        ],
        mitigations: ['Create separate hosting-model scorecards', 'Require a signed control-scope memo before RFP scoring', 'Map every required control to the proposed offering'],
        contractualRemedies: ['Offering-specific entitlement schedule', 'Control responsibility matrix', 'Migration and acceptance exhibit'],
        sourceBasis: [GITLAB_ULTIMATE, GITLAB_DEDICATED, GITLAB_DEDICATED_DATA_RESIDENCY],
      },
      {
        id: 'gitlab-seat-overage-and-guest-policy-risk',
        label: 'Seat overage and guest-policy risk',
        severity: 'medium',
        detectionSignals: [
          'Renewal baseline is calculated from stale users or an incomplete namespace/group view.',
          'Guest, administrator, service-account, inherited-member, or blocked-user treatment is not documented.',
        ],
        mitigations: ['Run seat hygiene before renewal', 'Implement restricted access where appropriate', 'Document non-billable criteria and review cadence'],
        contractualRemedies: ['Seat baseline exhibit', 'Overage notification process', 'Quarterly or annual reconciliation review'],
        sourceBasis: [GITLAB_SEAT_MANAGEMENT, GITLAB_PRICING],
      },
      {
        id: 'gitlab-dedicated-region-and-dr-assumption-risk',
        label: 'Dedicated region and DR assumptions are not decision-grade',
        severity: 'high',
        detectionSignals: [
          'A regulated workload is approved before primary, secondary, and backup region choices are documented.',
          'RTO, RPO, backup cadence, maintenance windows, and service-level exclusions are absent from the sourcing record.',
        ],
        mitigations: ['Require region and DR matrix', 'Review recovery objectives and exclusions', 'Assign owner for connectivity, failover, and backup evidence'],
        contractualRemedies: ['Region exhibit', 'DR acknowledgment', 'Maintenance and incident escalation schedule'],
        sourceBasis: [GITLAB_DEDICATED_DATA_RESIDENCY, GITLAB_DEDICATED_DR, GITLAB_SUBSCRIPTION_AGREEMENT],
      },
      {
        id: 'gitlab-ai-and-feature-parity-overstatement',
        label: 'AI or feature-parity claims outrun public exceptions',
        severity: 'medium',
        detectionSignals: [
          'The proposal assumes all Duo, experimental, beta, or feature-flagged capabilities work the same way on Dedicated.',
          'AI usage economics, credit treatment, data-use review, and success metrics are not separated from the base platform decision.',
        ],
        mitigations: ['Inventory AI and feature exceptions', 'Separate AI economics from base subscription', 'Require control review for data use and model-risk posture'],
        contractualRemedies: ['AI feature schedule', 'Usage and credits exhibit', 'Feature-exception acknowledgment'],
        sourceBasis: [GITLAB_PRICING, GITLAB_ULTIMATE, GITLAB_DEDICATED],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Raise third-party risk, operational resilience, data-location, exit, audit, identity, disaster-recovery, and concentration-risk review before approving Dedicated or a broad DevSecOps consolidation.',
        regulatoryRefs: ['DORA where applicable to EU financial entities'],
        affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'healthcare',
        modifier:
          'Treat source code, CI logs, secrets, issue content, and artifacts as possible regulated-data adjacencies if PHI can appear in repositories, pipelines, tickets, or test fixtures.',
        additionalRequirements: ['PHI boundary assessment', 'BAA posture review if PHI is in scope', 'Secrets and artifact-retention controls'],
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Require formal data-residency, sovereignty, accessibility, security-assurance, procurement-channel, and records-retention review before relying on generic enterprise SaaS terms.',
        additionalRequirements: ['Approved region matrix', 'Trust Center artifact review', 'Records and export requirements'],
        affectedStages: ['Scope', 'BAFO', 'Contracting'],
      },
    ],
    body: `## Summary
GitLab Ultimate and GitLab Dedicated sourcing is a DevSecOps operating-model decision, not a narrow developer-tool purchase. The buyer is choosing how source code, CI/CD, application security, software supply-chain evidence, issue and merge-request workflow, portfolio visibility, audit evidence, and potentially AI-assisted development will be governed. GitLab's public Ultimate page positions the tier around advanced security, security risk mitigation, compliance, portfolio management, value stream management, priority support, and agentic AI capabilities. GitLab's public Dedicated documentation positions Dedicated as an Ultimate-tier, single-tenant SaaS offering hosted and maintained by GitLab, fully isolated, deployed in a selected AWS region, and supplied with high availability, disaster recovery, and enterprise-grade security measures. Those claims are useful sourcing anchors, but they do not establish buyer-specific price, discount, renewal cap, migration credit, support concession, or regulatory approval.

## When to apply
Use this pattern for GitLab Ultimate selection, Ultimate renewal, Dedicated evaluation, Self-Managed-to-Dedicated migration, GitLab.com-to-Dedicated migration, consolidation from separate SCM, CI/CD, security-scanning, planning, or compliance tools, or a platform expansion where security and governance features materially change the contract. It also applies when a buyer wants GitLab to support regulated engineering workloads, evidence-heavy software supply-chain controls, or a program that depends on audit logs, vulnerability management, policy enforcement, runner governance, and repository exportability. Do not use it as a generic code-hosting pattern if the buyer only needs a small team repository with no enterprise security, compliance, CI/CD, residency, or renewal-risk dimension.

## Category boundary
In scope: GitLab Ultimate tier selection, GitLab.com versus Self-Managed versus Dedicated deployment model, Dedicated primary and secondary region choices, backup region assumptions, high availability, disaster recovery, SSO, OIDC, SAML, SCIM where available, IP allowlists, PrivateLink, runners, compute or CI minutes where relevant, storage, AI/Duo usage and credits, security scanning, compliance workflows, vulnerability reporting, audit evidence, Trust Center artifacts, DPA/privacy review, support, maintenance windows, migration, BYOK, and exit obligations. Out of scope: generic DevOps strategy without a GitLab transaction, standalone professional services not tied to the GitLab award, and private commercial benchmark claims unless the buyer has approved quote or invoice evidence.

## Lifecycle and gates
The scope gate should force a deployment-model fork. GitLab.com Ultimate, Self-Managed Ultimate, and GitLab Dedicated can all carry GitLab branding, but they distribute operating responsibility, region control, feature availability, access paths, and evidence obligations differently. The market-scan gate should compare GitLab to the incumbent stack by function: source control, CI/CD, artifact and package handling, security scanning, compliance reporting, portfolio visibility, and developer experience. The RFP gate should require scripted proof using buyer repositories and pipelines, not only product demonstrations. Test merge approvals, protected branches, runner isolation, artifact retention, vulnerability workflows, SBOM or dependency evidence where required, identity provisioning, audit logs, and export paths.

The BAFO gate should separate commercial drivers. Billable users, Ultimate guest treatment, administrators, service accounts, inherited membership, compute or runner economics, storage, support, Duo credits or AI usage, Dedicated infrastructure assumptions, migration assistance, and renewal terms should be visible as separate drivers. GitLab's public pricing pages can orient plan boundaries and public add-on categories, but Ultimate and Dedicated enterprise economics still require a current quote. The contract gate should close entitlement schedule, data-processing review, security artifacts, Dedicated region choices, service-level treatment, maintenance windows, BYOK risk allocation, migration acceptance, and exit obligations.

## Dedicated-specific diligence
Dedicated deserves a separate control review. Official docs say the environment runs in a dedicated AWS account isolated from other tenants and GitLab.com, with region choices for primary deployment, disaster recovery, and backups. Those region choices are not just technical preferences; they drive residency, latency, recovery, and compliance posture. Dedicated disaster recovery requires a configured primary and secondary region to receive the full documented recovery objectives. Public docs describe an eight-hour-or-less RTO to the secondary region and a maximum four-hour RPO depending on backup timing, but the buyer should still validate workload criticality, exclusions, test evidence, and incident communication. The public Dedicated docs also list unavailable or constrained features, including some AI capabilities, disabled feature flags, some Pages limitations, operational constraints, and functions requiring server access. A buyer should not assume feature parity without a feature-exception register.

## Pricing and contract notes
Use public GitLab sources only as orientation. Public pages may show plan boundaries, custom-pricing posture, included or add-on categories, and current public statements about users, compute, storage, or credits, but they do not prove private net pricing, negotiated discounts, renewal uplift, reseller margin, Dedicated infrastructure fees, migration credits, or support concessions. The sourcing model should keep all numeric private economics blank unless the buyer has current quote, invoice, reseller, or benchmark evidence.

Contracting should emphasize offering-specific entitlements, seat baseline, overage review, support and escalation, data-processing terms, Trust Center artifact review, AI/Duo data-use posture, feature exceptions, Dedicated region and DR exhibit, maintenance treatment, BYOK risk allocation, repository/artifact export, transition assistance, and termination obligations. If regulated financial data, PHI, public-sector records, export-controlled material, or sensitive source code is in scope, legal, security, privacy, and architecture owners should approve the control memo before award.

## Failure modes
The first failure is conflating Ultimate tier value with Dedicated hosting control. A buyer may cite Ultimate security and compliance features while assuming Dedicated isolation or region control that is not in the selected offering. The second failure is negotiating a blended platform price while ignoring seat hygiene, CI/CD usage, storage, AI credits, support, and migration. The third failure is treating Dedicated as a managed escape from operating risk while overlooking customer responsibilities for connectivity, region selection, key management, feature exceptions, acceptance testing, and exit. The fourth failure is accepting AI productivity claims without separating included credits, add-on usage, data handling, model-risk review, and Dedicated feature availability. A sourcing team should convert each of these into evidence gates before signing, because after migration the switching cost is carried in repositories, pipelines, policies, artifacts, identity, developer habits, and compliance evidence.`
  },
];
