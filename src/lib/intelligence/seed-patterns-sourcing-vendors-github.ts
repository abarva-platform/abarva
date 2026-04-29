import type { PatternSeed, SourceBasisRef } from './seed-types';

const AS_OF = '2026-04-29';

const GITHUB_ENTERPRISE_OVERVIEW: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Enterprise overview',
  url: 'https://github.com/enterprise',
  asOf: AS_OF,
  note: 'Public GitHub page describing GitHub Enterprise Cloud, GitHub Enterprise Server, security capabilities, data flexibility, and sales-led enterprise purchasing context.',
};

const GITHUB_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub pricing',
  url: 'https://github.com/pricing',
  asOf: AS_OF,
  note: 'Public GitHub pricing page showing Enterprise list-price anchors, included Actions minutes and Packages storage, feature comparison, and add-on links.',
};

const GITHUB_PLANS_DOCS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub plans documentation',
  url: 'https://docs.github.com/enterprise-cloud@latest/get-started/learning-about-github/githubs-plans',
  asOf: AS_OF,
  note: 'GitHub Docs page describing Enterprise deployment options, SAML SSO, SCIM, Enterprise Support, 50,000 Actions minutes, 50 GB Packages storage, 99.9% monthly uptime SLA, and enterprise account controls.',
};

const GITHUB_ENTERPRISE_CLOUD_DOCS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'About GitHub Enterprise Cloud',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-github-enterprise-cloud',
  asOf: AS_OF,
  note: 'GitHub Enterprise Cloud docs describing SAML, additional Actions minutes, verified-domain email restrictions, private Pages, managed users, repository rulesets, compliance reports, enterprise accounts, and data residency regions.',
};

const GITHUB_DATA_RESIDENCY: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Enterprise Cloud data residency',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/getting-started-with-data-residency-for-github-enterprise-cloud',
  asOf: AS_OF,
  note: 'GitHub Docs data residency setup page noting GHE.com trial, Enterprise Managed Users, purchase paths, migration tooling, and GHE.com migration considerations.',
};

const GITHUB_DATA_RESIDENCY_FEATURES: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Feature overview for GitHub Enterprise Cloud with data residency',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency',
  asOf: AS_OF,
  note: 'GitHub Docs feature-overview page describing data residency differences, unavailable managed-user features, URL differences, API endpoint differences, and GitHub Actions marketplace constraints.',
};

const GITHUB_ENTERPRISE_SERVER: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'About GitHub Enterprise Server',
  url: 'https://docs.github.com/en/enterprise-server@3.19/admin/overview/about-github-enterprise-server',
  asOf: AS_OF,
  note: 'GitHub Docs page describing GitHub Enterprise Server as self-hosted, governed by buyer infrastructure and security controls, and potentially relevant where compliance or control requires self-hosting.',
};

const GITHUB_SERVER_RELEASES: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Enterprise Server releases',
  url: 'https://docs.github.com/en/enterprise-server/admin/all-releases',
  asOf: AS_OF,
  note: 'GitHub Docs release page stating GitHub supports at least the four most recent GHES feature releases and listing release and closing-down dates.',
};

const GITHUB_SUPPORT: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Support documentation',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/support',
  asOf: AS_OF,
  note: 'GitHub Support docs describing support levels, paid-product email support, and Premium Support as a supplemental option with 24/7 email and callback support and SLA where included.',
};

const GITHUB_PREMIUM_SUPPORT: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'About GitHub Premium Support',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/support/learning-about-github-support/about-github-premium-support',
  asOf: AS_OF,
  note: 'GitHub Premium Support docs describing support entitlements, hours of operation, and initial response-time SLAs by priority and plan.',
};

const GITHUB_ADVANCED_SECURITY_PLANS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Advanced Security plans and pricing',
  url: 'https://github.com/security/plans',
  asOf: AS_OF,
  note: 'Public GitHub security plans page listing GitHub Secret Protection and GitHub Code Security add-ons and public active-committer price anchors.',
};

const GITHUB_ADVANCED_SECURITY_BILLING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Advanced Security license billing',
  url: 'https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security',
  asOf: AS_OF,
  note: 'GitHub billing docs explaining active committer measurement, public-repository availability, private/GHE.com/GHES license requirements, metered billing, and budget controls.',
};

const GITHUB_COPILOT_USAGE_BILLING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Usage-based billing for GitHub Copilot organizations and enterprises',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises',
  asOf: AS_OF,
  note: 'GitHub Docs page stating Copilot Business and Enterprise move to AI Credit usage-based billing on June 1, 2026, with pooled credits, additional usage policies, and budget controls.',
};

const GITHUB_COPILOT_MODELS_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Models and pricing for GitHub Copilot',
  url: 'https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing',
  asOf: AS_OF,
  note: 'GitHub Docs reference explaining token-based Copilot model pricing and conversion to GitHub AI Credits.',
};

const GITHUB_COPILOT_PLANS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GitHub Copilot plans and pricing',
  url: 'https://github.com/features/copilot/plans',
  asOf: AS_OF,
  note: 'Public Copilot plans page describing Copilot Enterprise integration with GitHub.com, administrator controls, and published data-retention defaults for Business and Enterprise customers.',
};

const GITHUB_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific GitHub Enterprise quote, renewal, discount, add-on, migration, support, and usage evidence',
  note:
    'Public GitHub pages can establish list-price anchors, entitlement mechanics, billing mechanisms, and control options. They do not prove buyer-specific net price, private discount, renewal cap, concession, migration credit, reseller margin, or negotiated support commitment.',
};

export const SOURCING_VENDOR_GITHUB_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-GITHUB-001',
    slug: 'github-enterprise-sourcing-profile',
    title: 'Deep GitHub Enterprise Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'GitHub Enterprise sourcing should evaluate the developer platform as a governed software-delivery control plane, not just a source-code seat purchase, because deployment model, identity, Actions usage, security add-ons, Copilot consumption, data residency, support, and migration obligations drive the real enterprise risk and cost profile.',
    applicability:
      'Apply when sourcing, renewing, expanding, consolidating, or benchmarking GitHub Enterprise Cloud, GitHub Enterprise Server, GitHub Enterprise Cloud with data residency, GitHub Advanced Security, GitHub Copilot Business or Enterprise, GitHub Actions, Packages, Codespaces, or Premium Support for enterprise software delivery.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex-ven-github',
    createdAt: AS_OF,
    instanceCount: 0,
    sourceDocuments: [
      'https://github.com/enterprise',
      'https://github.com/pricing',
      'https://docs.github.com/enterprise-cloud@latest/get-started/learning-about-github/githubs-plans',
      'https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-github-enterprise-cloud',
      'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/getting-started-with-data-residency-for-github-enterprise-cloud',
      'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency',
      'https://docs.github.com/en/enterprise-server@3.19/admin/overview/about-github-enterprise-server',
      'https://docs.github.com/en/enterprise-server/admin/all-releases',
      'https://docs.github.com/en/enterprise-cloud@latest/support',
      'https://docs.github.com/en/enterprise-cloud@latest/support/learning-about-github-support/about-github-premium-support',
      'https://github.com/security/plans',
      'https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security',
      'https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises',
      'https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing',
      'https://github.com/features/copilot/plans',
    ],
    regulatoryChips: [
      'GDPR-if-personal-data',
      'HIPAA-if-PHI',
      'FedRAMP-if-public-sector',
      'DORA-if-regulated-financial-entity',
      'Data-residency-if-regional-code-control-required',
      'Export-control-if-restricted-source-code',
    ],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-AGENT-001', 'PAT-SRC-PRC-SAAS-001', 'PAT-SRC-PROC-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    vendorLandscape: [
      {
        vendorName: 'GitHub Enterprise Cloud',
        tier: 'enterprise',
        positioning:
          'Cloud-hosted GitHub Enterprise option with enterprise account governance, SAML and SCIM controls, additional Actions and Packages entitlements, compliance reports, repository rulesets, managed-user options, and optional data residency on GHE.com where supported.',
        strengths: [
          'Broad developer adoption and native collaboration workflow',
          'Publicly documented enterprise identity, governance, audit, and policy controls',
          'Cloud path to latest GitHub.com features including Copilot-related capabilities where available',
        ],
        cautions: [
          'Data residency and managed-user choices can change feature behavior, URL patterns, API endpoints, and integration assumptions',
          'Public Enterprise list pricing is not buyer-specific net price or renewal protection',
          'Actions, Copilot, Codespaces, security add-ons, storage, support, and integrations must be modeled separately from base seats',
        ],
        sourceBasis: [GITHUB_ENTERPRISE_OVERVIEW, GITHUB_PRICING, GITHUB_ENTERPRISE_CLOUD_DOCS, GITHUB_DATA_RESIDENCY_FEATURES],
      },
      {
        vendorName: 'GitHub Enterprise Server',
        tier: 'enterprise',
        positioning:
          'Self-hosted GitHub Enterprise deployment option for organizations that need infrastructure control, buyer-governed security controls, or self-hosted source-code management, with feature delivery and upgrade cadence governed through GHES releases.',
        strengths: ['Buyer-controlled infrastructure boundary', 'Self-hosted deployment option', 'Optional features for Actions, Code Security, Secret Protection, GitHub Connect, and Packages'],
        cautions: [
          'Buyer owns infrastructure, backup, monitoring, network, IAM, upgrade, and operating controls',
          'GitHub documents support for at least the four most recent feature releases, so upgrade governance is a procurement and operations requirement',
          'Some latest GitHub.com and Copilot capabilities may favor Enterprise Cloud or data-residency paths rather than GHES',
        ],
        sourceBasis: [GITHUB_ENTERPRISE_SERVER, GITHUB_SERVER_RELEASES, GITHUB_PLANS_DOCS],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public GitHub Enterprise seat and included-usage anchors',
        model: 'subscription',
        metric: 'Enterprise user seat, included Actions minutes, Packages storage, support level, deployment option, and enterprise account entitlements',
        currency: 'USD',
        sourceBasis: [GITHUB_PRICING, GITHUB_PLANS_DOCS, GITHUB_ENTERPRISE_OVERVIEW],
        confidence: 0.76,
        notes:
          'Use public list-price and included-usage pages only as orientation. Validate enterprise net price, annual or monthly billing, seat counting, renewal uplift, add-on bundling, Azure billing path, and support entitlements against the buyer quote and order form.',
      },
      {
        label: 'Advanced Security public add-on anchors',
        model: 'hybrid',
        metric: 'Active committer count, enabled repositories, Secret Protection, Code Security, public versus private or GHE.com/GHES repository scope',
        currency: 'USD',
        sourceBasis: [GITHUB_ADVANCED_SECURITY_PLANS, GITHUB_ADVANCED_SECURITY_BILLING],
        confidence: 0.82,
        notes:
          'Public pages list GitHub Secret Protection and GitHub Code Security active-committer price anchors and explain license measurement. Do not infer bundle discounts, committed-license treatment, or private repository enablement scope without buyer-specific evidence.',
      },
      {
        label: 'Copilot Business and Enterprise usage-based billing readiness',
        model: 'usage-based',
        metric: 'Assigned Copilot licenses, pooled AI Credits, model token consumption, additional-usage policy, budgets, and enabled AI features',
        currency: 'USD',
        sourceBasis: [GITHUB_COPILOT_USAGE_BILLING, GITHUB_COPILOT_MODELS_PRICING, GITHUB_COPILOT_PLANS],
        confidence: 0.79,
        notes:
          'GitHub states organization and enterprise Copilot usage-based billing starts June 1, 2026. Treat adoption and cost forecasts as uncertain until buyer telemetry shows actual Chat, CLI, cloud agent, Spaces, Spark, third-party agent, and model-token usage.',
      },
      {
        label: 'Buyer-specific enterprise economics',
        model: 'hybrid',
        metric: 'Net seat price, renewal cap, add-on concessions, support plan, migration services, reseller margin, enterprise agreement term, and usage forecast',
        sourceBasis: [GITHUB_BUYER_DATA_GAP],
        confidence: 0.14,
        notes:
          'Founder data gap: populate only from buyer invoices, renewal notices, quotes, signed order forms, reseller proposals, Azure subscription billing evidence, or approved benchmark submissions.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Enterprise entitlement and deployment-model schedule',
        buyerPosition:
          'Attach an entitlement schedule separating GitHub Enterprise Cloud, GitHub Enterprise Server, GHE.com data residency, organizations, managed users, base seats, guest or collaborator assumptions, Actions, Packages, Codespaces, Advanced Security, Copilot, Premium Support, and migration services.',
        fallbackPosition:
          'If the vendor or reseller cannot decompose the transaction, require a binding order-form exhibit that states deployment option, seat metric, included usage, add-ons, data residency scope, support level, renewal baseline, and product substitution rights.',
        walkawayTriggers: ['Order form cannot be reconciled to deployment model, seat population, included usage, add-ons, and renewal mechanics.'],
        sourceBasis: [GITHUB_ENTERPRISE_OVERVIEW, GITHUB_PRICING, GITHUB_PLANS_DOCS, GITHUB_BUYER_DATA_GAP],
      },
      {
        clauseArea: 'Identity, data residency, and integration controls',
        buyerPosition:
          'Require the sourcing record to document SAML, SCIM, Enterprise Managed Users, personal-account versus managed-user choice, data residency region, GHE.com URL/API differences, marketplace/action compatibility, audit-log access, IP allow-list needs, and compliance-report access before award.',
        fallbackPosition:
          'If final identity or residency design is not approved, preserve phased rollout, integration testing, and termination or adjustment rights for blockers that appear during migration or tenant setup.',
        walkawayTriggers: ['Data residency is promised without confirming managed-user implications, URL differences, API endpoint changes, and workflow compatibility.'],
        sourceBasis: [GITHUB_ENTERPRISE_CLOUD_DOCS, GITHUB_DATA_RESIDENCY, GITHUB_DATA_RESIDENCY_FEATURES],
      },
      {
        clauseArea: 'Usage-based AI and security add-on governance',
        buyerPosition:
          'Make Copilot and Advanced Security separate approval tracks with named owners, enabled repositories or organizations, budget controls, active-committer measurement, AI Credit policy, model-access policy, data-use posture, telemetry review cadence, and offboarding rules.',
        fallbackPosition:
          'If telemetry is immature, restrict initial rollout to pilot cohorts and repositories until actual usage, active-committer count, and value evidence are reviewed.',
        walkawayTriggers: ['Copilot, Secret Protection, or Code Security is bundled into the renewal without usage model, budget, repository scope, or owner accountability.'],
        sourceBasis: [GITHUB_ADVANCED_SECURITY_PLANS, GITHUB_ADVANCED_SECURITY_BILLING, GITHUB_COPILOT_USAGE_BILLING, GITHUB_COPILOT_PLANS],
      },
      {
        clauseArea: 'Support, SLA, and Enterprise Server upgrade obligations',
        buyerPosition:
          'Tie support entitlement, Premium Support priority response expectations, Enterprise Cloud uptime, GHES release support, backup, maintenance window, staging, and upgrade cadence to the buyer software-delivery criticality profile.',
        fallbackPosition:
          'If Premium Support or GHES operating obligations are not funded, classify the platform as standard-support risk and document escalation and recovery limitations before signature.',
        sourceBasis: [GITHUB_PLANS_DOCS, GITHUB_SUPPORT, GITHUB_PREMIUM_SUPPORT, GITHUB_SERVER_RELEASES, GITHUB_ENTERPRISE_SERVER],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Deployment model as commercial and risk leverage',
        whenToUse:
          'Use before committing to Enterprise Cloud, GHE.com data residency, or Enterprise Server when security, compliance, feature velocity, downtime tolerance, and integration compatibility are still contested.',
        buyerAsk:
          'Trade term length or seat expansion only for a documented deployment decision record, identity architecture, residency decision, migration plan, integration test plan, and support or upgrade obligations aligned to the chosen model.',
        tradeoffs: [
          'Cloud may improve feature velocity and reduce infrastructure operations, while GHES may improve buyer-controlled boundaries but increases operating, upgrade, and feature-lag governance.',
        ],
        evidenceBasis: [GITHUB_ENTERPRISE_CLOUD_DOCS, GITHUB_DATA_RESIDENCY_FEATURES, GITHUB_ENTERPRISE_SERVER, GITHUB_SERVER_RELEASES],
      },
      {
        lever: 'Seat and repository normalization before renewal',
        whenToUse:
          'Use when personal accounts, managed users, external collaborators, bot accounts, dormant users, multiple organizations, acquired teams, or private repository sprawl make the renewal population unclear.',
        buyerAsk:
          'Require a seat census, organization map, collaborator policy, managed-user decision, repository classification, add-on enablement inventory, and inactive-user cleanup before BAFO.',
        tradeoffs: ['Normalization can delay signature but prevents paying for ungoverned users, repositories, and security add-on scope.'],
        evidenceBasis: [GITHUB_PLANS_DOCS, GITHUB_ENTERPRISE_CLOUD_DOCS, GITHUB_ADVANCED_SECURITY_BILLING],
      },
      {
        lever: 'AI and security adoption exchange',
        whenToUse:
          'Use when GitHub proposes Copilot, Secret Protection, Code Security, or Premium Support as part of a broader Enterprise transaction.',
        buyerAsk:
          'Exchange expansion for budget controls, repository and user phasing, reporting, admin policy configuration, data-retention confirmation, active-committer forecast, and value-measurement checkpoints.',
        tradeoffs: ['Broad rollout may accelerate adoption, but unbounded AI usage and active-committer billing can outpace the business case.'],
        evidenceBasis: [GITHUB_COPILOT_USAGE_BILLING, GITHUB_COPILOT_MODELS_PRICING, GITHUB_ADVANCED_SECURITY_PLANS, GITHUB_ADVANCED_SECURITY_BILLING],
      },
    ],
    riskFactors: [
      {
        id: 'github-enterprise-scope-opacity',
        label: 'Enterprise scope opacity',
        severity: 'high',
        detectionSignals: [
          'Renewal combines Enterprise seats, Actions, Packages, Copilot, Advanced Security, Premium Support, and migration commitments into one commercial line',
          'Stakeholders cannot map organizations, repositories, collaborators, managed users, and add-ons to the order form',
        ],
        mitigations: ['Create an entitlement schedule', 'Normalize users and repositories', 'Separate base platform, AI, security, support, and usage economics'],
        contractualRemedies: ['Entitlement exhibit', 'Renewal baseline schedule', 'Product and add-on substitution language', 'Usage reporting covenant'],
        sourceBasis: [GITHUB_PRICING, GITHUB_PLANS_DOCS, GITHUB_BUYER_DATA_GAP],
      },
      {
        id: 'github-copilot-consumption-drift',
        label: 'Copilot consumption and model-cost drift',
        severity: 'high',
        detectionSignals: [
          'Copilot business case assumes flat per-seat cost after June 1, 2026 without modeling AI Credits, additional usage policy, model mix, or agentic workflows',
          'Developers can enable Chat, CLI, cloud agent, Spaces, Spark, or third-party coding agents without budget owner review',
        ],
        mitigations: ['Set enterprise, organization, cost-center, or user budgets', 'Pilot before broad rollout', 'Review model-token and feature telemetry monthly'],
        contractualRemedies: ['Usage reporting', 'Budget-control requirement', 'Pilot-to-scale approval gate', 'AI policy exhibit'],
        sourceBasis: [GITHUB_COPILOT_USAGE_BILLING, GITHUB_COPILOT_MODELS_PRICING, GITHUB_COPILOT_PLANS],
      },
      {
        id: 'github-advanced-security-committer-surprise',
        label: 'Advanced Security active-committer surprise',
        severity: 'medium',
        detectionSignals: [
          'Security add-ons are enabled broadly before measuring active committers over the documented lookback window',
          'Private, GHE.com, or GHES repository scope is assumed to be included because public repositories have free security features',
        ],
        mitigations: ['Forecast active committers by repository', 'Phase enablement', 'Use budget controls and repository-level reporting'],
        contractualRemedies: ['Repository enablement schedule', 'Committer-count review', 'Budget cap or approval gate'],
        sourceBasis: [GITHUB_ADVANCED_SECURITY_PLANS, GITHUB_ADVANCED_SECURITY_BILLING],
      },
      {
        id: 'github-data-residency-integration-breakage',
        label: 'Data residency integration breakage',
        severity: 'medium',
        detectionSignals: [
          'Migration plan assumes GitHub.com URLs, API endpoints, raw URLs, Actions Marketplace behavior, or personal-account workflows continue unchanged on GHE.com',
        ],
        mitigations: ['Run integration inventory', 'Test URL and API changes', 'Validate action dependencies and marketplace access before migration'],
        contractualRemedies: ['Migration acceptance gate', 'Integration remediation plan', 'Delayed expansion right'],
        sourceBasis: [GITHUB_DATA_RESIDENCY, GITHUB_DATA_RESIDENCY_FEATURES],
      },
      {
        id: 'github-enterprise-server-upgrade-debt',
        label: 'Enterprise Server upgrade debt',
        severity: 'medium',
        detectionSignals: [
          'GHES deployment is selected for control reasons but no upgrade cadence, staging environment, backup proof, or release-support owner exists',
          'Contract assumes GitHub.com feature parity without checking GHES release timing',
        ],
        mitigations: ['Name GHES platform owner', 'Fund staging and backup operations', 'Track supported release windows'],
        contractualRemedies: ['Upgrade plan', 'Support entitlement schedule', 'Operational acceptance criteria'],
        sourceBasis: [GITHUB_ENTERPRISE_SERVER, GITHUB_SERVER_RELEASES, GITHUB_SUPPORT],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Treat GitHub Enterprise as a software-delivery control plane that may hold source code, CI/CD workflows, secrets metadata, incident evidence, and deployment provenance for regulated services.',
        regulatoryRefs: ['DORA may apply depending on entity, jurisdiction, workload, and dependency classification'],
        additionalRequirements: ['Exit and resilience plan', 'Audit-log retention decision', 'Operational-risk owner signoff', 'Support and incident escalation mapping'],
      },
      {
        industry: 'healthcare',
        modifier:
          'Confirm whether PHI can appear in repositories, issues, logs, Actions artifacts, support tickets, Copilot prompts, or test data before allowing healthcare teams into production scope.',
        additionalRequirements: ['PHI boundary decision', 'BAA/HIPAA review if applicable', 'Copilot and support-data handling rules'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Validate procurement channel, government authorization posture, data residency, identity model, support path, audit evidence, source-code sensitivity, and export-control constraints before commitment.',
        affectedStages: ['MarketScan', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'manufacturing',
        modifier:
          'Map source-code, firmware, industrial software, supplier collaboration, IP segregation, and export-controlled repository boundaries before enabling external collaborators or Copilot pilots.',
        additionalRequirements: ['Supplier access rules', 'IP and export-control review', 'Repository classification and collaborator policy'],
      },
    ],
    body: `## Summary
GitHub Enterprise sourcing should be treated as a developer-platform governance decision, not as a simple source-code seat renewal. The public GitHub materials support a broad platform profile: GitHub Enterprise can be purchased as GitHub Enterprise Cloud or GitHub Enterprise Server, and GitHub's public pricing and documentation describe enterprise account governance, SAML single sign-on, SCIM provisioning, additional Actions minutes, Packages storage, internal and private repository controls, repository rules, audit and policy controls, managed-user options, a 99.9% monthly uptime SLA for Enterprise Cloud, and optional support, security, and AI add-ons. Those facts are useful anchors, but they do not prove the buyer's net price, discount, renewal cap, migration concession, reseller economics, or support commitments. AbarVa should keep public facts separate from quote-specific evidence.

## When to apply
Use this pattern for a new GitHub Enterprise selection, an Enterprise Cloud or Enterprise Server renewal, a consolidation of multiple organizations, an acquisition migration, a move to Enterprise Managed Users, a GHE.com data residency decision, or an expansion into GitHub Advanced Security, GitHub Copilot, Actions, Packages, Codespaces, or Premium Support. It is especially important when engineering leaders frame GitHub as already adopted and therefore noncompetitive. Incumbency may be true operationally, but sourcing still needs a clean record of who uses the platform, which repositories and organizations are in scope, where regulated code and workflow metadata reside, which add-ons are enabled, what usage is metered, and what support path exists during a release incident.

## Category boundary
The base platform boundary includes source-code hosting, pull requests, code review, issues, projects, repository rules, enterprise account governance, SAML and SCIM identity controls, audit and compliance evidence, Actions automation, Packages storage, and deployment-model choice. The adjacent add-on boundary includes GitHub Secret Protection, GitHub Code Security, Copilot Business or Enterprise, Premium Support, Codespaces, Git LFS, and potentially migration services or third-party marketplace integrations. Keep those boundaries separate in the commercial model. A base Enterprise seat list price is not a complete total cost view if Actions consumption, AI Credits, active-committer security billing, larger runners, storage, support tier, or integration remediation are material.

## Deployment decision
Run the first sourcing gate as a deployment decision. GitHub Enterprise Cloud may reduce infrastructure operations and gives access to GitHub.com feature velocity. GitHub Enterprise Cloud with data residency may help when code and data need regional storage, but official docs indicate GHE.com uses Enterprise Managed Users and can differ from GitHub.com in URLs, API endpoints, raw URLs, Actions marketplace assumptions, and some managed-user feature availability. GitHub Enterprise Server may be appropriate when the buyer needs self-hosted control and can operate the platform inside its own infrastructure, firewall, IAM, monitoring, VPN, backup, and maintenance regime. The tradeoff is that the buyer must govern upgrades and release support; GitHub documents support for at least the four most recent GHES feature releases. Do not let a compliance preference become an unfunded operations obligation.

## Commercial model
Build the cost workbook from five layers. First, base Enterprise seats and organization structure. Second, included and metered platform usage, including Actions minutes, Packages storage, Codespaces if used, and any runner or storage assumptions that appear in current billing evidence. Third, security add-ons, where public GitHub pages identify Secret Protection and Code Security as active-committer priced products and the billing docs explain how active and unique committers are measured. Fourth, Copilot, where GitHub says organization and enterprise plans move to AI Credit usage-based billing on June 1, 2026; code completions and next edit suggestions are not billed in AI Credits on paid plans, but Chat, CLI, cloud agent, Spaces, Spark, and third-party coding agents can consume credits. Fifth, support and migration, including Premium Support response commitments if purchased and any buyer-specific migration or advisory services. Use public pages to orient the model, then require invoices, quotes, order forms, usage exports, or approved benchmark evidence before publishing buyer economics.

## Evaluation rubric
Score fit across governance, developer experience, security, AI controls, integration, resilience, commercial transparency, and exit. Governance covers enterprise accounts, organization sprawl, managed-user strategy, SAML, SCIM, roles, repository rules, audit logs, IP allow lists, and offboarding. Developer experience covers pull request workflow, Actions reliability, Codespaces fit, packages, issue/project usage, and migration friction. Security covers secret scanning, push protection, code scanning, dependency controls, policy enforcement, and repository classification. AI controls cover Copilot access policy, model and preview governance, data retention posture, budget controls, and measured adoption. Integration covers API URLs, webhooks, apps, marketplace actions, identity provider, CI/CD targets, artifact systems, and developer tooling. Resilience covers uptime expectations, support entitlements, GHES backup and upgrade cadence, incident escalation, and exit or data export needs.

## Contradictions and failure modes
Vendor claim: GitHub Enterprise is already standardized, so procurement only needs to renew seats. Detection: ask for organization map, seat census, active repositories, external collaborators, managed-user decision, add-on inventory, Actions usage, Copilot license and credit policy, security active-committer forecast, support tier, and renewal baseline. Vendor claim: data residency solves regulated-source-code concerns. Detection: validate region, managed-user implications, URL and API changes, marketplace-action compatibility, audit evidence, and legal review. Vendor claim: Copilot or Advanced Security can be included without changing the business case. Detection: require AI Credit budgets, usage telemetry, active-committer counts, enabled repository scope, data-use posture, and pilot-to-scale criteria.

## Commercial outcome
The desired output is a controlled GitHub Enterprise buying record. It should state the chosen deployment model, identity architecture, data residency assumptions, organization and repository scope, seat and collaborator counts, add-on enablement, support entitlement, security and Copilot controls, usage-budget governance, migration responsibilities, and renewal protections. It should also preserve uncertainty. Public GitHub sources are strong for product mechanics and public list anchors; they are weak for buyer-specific concessions. Any claim about private pricing, discounting, migration credits, bespoke support, or renewal uplift should remain blank until the buyer has contractual evidence.`,
  },
];
