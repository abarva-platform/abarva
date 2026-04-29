import type { PatternSeed, SourceBasisRef } from './seed-types';

const CLOUDFLARE_PUBLIC_SOURCES: SourceBasisRef[] = [
  {
    type: 'public-disclosure',
    label: 'Cloudflare Global Network',
    url: 'https://www.cloudflare.com/network/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Enterprise Solutions',
    url: 'https://www.cloudflare.com/enterprise/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare One SASE',
    url: 'https://www.cloudflare.com/sase/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Web Application Firewall',
    url: 'https://www.cloudflare.com/application-services/products/waf/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare DDoS Protection',
    url: 'https://www.cloudflare.com/ddos/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Magic Transit docs',
    url: 'https://developers.cloudflare.com/magic-transit/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Network Interconnect docs',
    url: 'https://developers.cloudflare.com/network-interconnect/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Plans',
    url: 'https://www.cloudflare.com/plans/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Magic Transit bandwidth measurement',
    url: 'https://developers.cloudflare.com/magic-transit/reference/bandwidth-measurement/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Self-Serve Subscription Agreement',
    url: 'https://www.cloudflare.com/terms/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Data Processing Addendum',
    url: 'https://www.cloudflare.com/cloudflare-customer-dpa/',
    asOf: '2026-04-29',
  },
  {
    type: 'public-disclosure',
    label: 'Cloudflare Trust Hub',
    url: 'https://www.cloudflare.com/trust-hub/',
    asOf: '2026-04-29',
  },
];

const CLOUDFLARE_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Cloudflare quote, contract, traffic, seat, log, support, and implementation evidence',
  note:
    'Public Cloudflare materials describe product scope, architecture, selected list-price mechanisms, public terms, and trust resources, but do not establish enterprise net price, private discounts, committed usage, support concessions, negotiated SLA remedies, or buyer-specific traffic economics.',
};

export const PAT_SRC_VEN_CLOUDFLARE_001: PatternSeed = {
  id: 'PAT-SRC-VEN-CLOUDFLARE-001',
  slug: 'cloudflare-connectivity-security-edge-platform-sourcing-profile',
  title: 'Cloudflare Connectivity, Security, and Edge Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Cloudflare sourcing is strongest when the buyer treats the platform as a traffic, security, identity, network, developer, and compliance control plane rather than a CDN or DDoS line item.',
  applicability:
    'Apply when sourcing, renewing, expanding, or benchmarking Cloudflare for application delivery, WAF, bot/DDoS defense, SASE or Zero Trust, Magic Transit, Network Interconnect, edge compute, DNS, or multi-cloud connectivity decisions.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-29',
  instanceCount: 0,
  sourceDocuments: CLOUDFLARE_PUBLIC_SOURCES.map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'PCI-DSS-if-cardholder-data',
    'HIPAA-if-PHI',
    'DORA-if-regulated-financial-entity',
    'Data-localization-if-region-specific-inspection-required',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CON-004', 'PAT-SRC-CON-005'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'security_identity',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Cloudflare',
      tier: 'enterprise',
      positioning:
        'Enterprise connectivity cloud vendor spanning application security and performance, SASE and Zero Trust, network services, developer platform services, DNS, DDoS defense, WAF, private interconnect, and edge compute primitives.',
      strengths: [
        'Public product documentation across global network, WAF, DDoS, SASE, Magic Transit, Network Interconnect, plans, terms, DPA, and trust resources',
        'Single-network positioning for application, workforce, WAN, network, and developer-platform use cases',
        'Private connectivity options through Cloudflare Network Interconnect and enterprise-only network services such as Magic Transit',
      ],
      cautions: [
        'Scope must separate DNS, CDN, WAF, bot management, DDoS, Zero Trust seats, Magic Transit bandwidth, interconnect, Workers, logs, support, and professional services',
        'Public plan and product pages do not prove buyer-specific enterprise net price, discount, support concession, committed capacity, or renewal terms',
        'Traffic steering, TLS inspection, logging, data localization, identity integration, and origin connectivity requirements must be verified with architecture and security owners before award',
      ],
      sourceBasis: CLOUDFLARE_PUBLIC_SOURCES,
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public Cloudflare plan and add-on anchors only',
      model: 'hybrid',
      metric: 'Plan, add-on, seat, request, storage, bandwidth, clean-traffic, support, and contract-specific usage dimensions',
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[7], CLOUDFLARE_PUBLIC_SOURCES[8]],
      confidence: 0.72,
      notes:
        'Use public Cloudflare plans and Magic Transit clean-bandwidth measurement documentation to understand pricing mechanisms and usage units. Do not infer enterprise net price, discount, included capacity, renewal cap, support terms, or cross-product bundle economics without quote or contract evidence.',
    },
    {
      label: 'Enterprise Cloudflare commercial model',
      model: 'hybrid',
      metric: 'Private quote, order form, package scope, clean bandwidth, Zero Trust seats, Workers usage, support tier, SLA remedies, interconnect, log retention, professional services, and renewal terms',
      sourceBasis: [CLOUDFLARE_BUYER_DATA_GAP],
      confidence: 0.12,
      notes:
        'Founder data gap: populate only from buyer invoices, final order forms, Cloudflare or reseller quotes, signed enterprise terms, approved benchmark submissions, or contract exhibits.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Scope, traffic, and service boundary',
      buyerPosition:
        'Attach a service schedule that separates each Cloudflare zone, account, product, hostname, traffic class, Magic Transit prefix, interconnect, Zero Trust seat pool, Workers entitlement, logging feed, support tier, and professional-service deliverable.',
      fallbackPosition:
        'If the final schedule cannot be completed before award, make schedule completion and traffic-baseline approval a hard mobilization gate with no unapproved auto-expansion.',
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[0], CLOUDFLARE_PUBLIC_SOURCES[1], CLOUDFLARE_PUBLIC_SOURCES[7], CLOUDFLARE_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Security, privacy, data localization, and audit evidence',
      buyerPosition:
        'Map DPA, trust evidence, certification scope, TLS inspection, DLP/CASB use, log payload handling, data-localization requirements, subprocessors, and customer control obligations to the purchased Cloudflare services.',
      walkawayTriggers: [
        'Regulated data path is unknown or cannot be mapped to Cloudflare services and customer-owned controls',
        'TLS inspection, log retention, or DLP payload handling is required but lacks security, privacy, and legal signoff',
        'Trust, DPA, or compliance evidence cannot be matched to the service actually being purchased',
      ],
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[2], CLOUDFLARE_PUBLIC_SOURCES[10], CLOUDFLARE_PUBLIC_SOURCES[11]],
    },
    {
      clauseArea: 'Resilience, SLA, routing, and exit dependency',
      buyerPosition:
        'Define uptime, incident response, DDoS response, tunnel health, BGP/route advertisement, failover, rollback, DNS transfer, certificate/key handling, data export, and transition obligations for the exact architecture.',
      fallbackPosition:
        'At minimum, require an architecture runbook, traffic cutover plan, route rollback plan, incident escalation path, log export path, and exit test before production migration.',
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[4], CLOUDFLARE_PUBLIC_SOURCES[5], CLOUDFLARE_PUBLIC_SOURCES[6], CLOUDFLARE_PUBLIC_SOURCES[9]],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Traffic-backed platform bundle normalization',
      whenToUse:
        'Use when Cloudflare is proposed as a consolidated application security, performance, Zero Trust, network, and developer-platform vendor rather than a single-product purchase.',
      buyerAsk:
        'Require a normalized workbook for zones, hostnames, requests, clean bandwidth, attack traffic treatment, WAF and bot features, Magic Transit prefixes, Zero Trust seats, Workers usage, log retention, support, SLAs, and renewal rules.',
      tradeoffs: [
        'Consolidation can simplify architecture and operations, but it increases platform dependency unless scope, exit, logs, DNS, certificates, and routing rollback are explicit.',
      ],
      evidenceBasis: [CLOUDFLARE_PUBLIC_SOURCES[0], CLOUDFLARE_PUBLIC_SOURCES[2], CLOUDFLARE_PUBLIC_SOURCES[8], CLOUDFLARE_BUYER_DATA_GAP],
    },
    {
      lever: 'Architecture proof before commercial expansion',
      whenToUse:
        'Use before expanding from CDN or WAF into Zero Trust, SASE, Magic Transit, Network Interconnect, Workers, or data-localization scope.',
      buyerAsk:
        'Trade expansion only for completed identity integration proof, tunnel or interconnect test, route health evidence, logging and SIEM path, privacy review, incident runbook, and rollback acceptance.',
      tradeoffs: [
        'Proof work can slow BAFO, but it reduces the risk of buying a broad platform package that the network, identity, or security teams cannot operate cleanly.',
      ],
      evidenceBasis: [CLOUDFLARE_PUBLIC_SOURCES[5], CLOUDFLARE_PUBLIC_SOURCES[6], CLOUDFLARE_PUBLIC_SOURCES[10], CLOUDFLARE_BUYER_DATA_GAP],
    },
  ],
  riskFactors: [
    {
      id: 'cloudflare-platform-scope-blur',
      label: 'Platform scope blur',
      severity: 'high',
      detectionSignals: [
        'Proposal uses one platform label while the buyer has not separated application security, DNS, CDN, DDoS, SASE, Magic Transit, Network Interconnect, Workers, logging, and support scope',
        'Business case assumes tool consolidation without a product-by-product owner, migration plan, or exit dependency map',
      ],
      mitigations: ['Build a service schedule', 'Separate traffic classes and owners', 'Require architecture signoff before BAFO'],
      contractualRemedies: ['Scope schedule', 'Migration acceptance gate', 'Exit assistance', 'Renewal and downsizing language'],
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[0], CLOUDFLARE_PUBLIC_SOURCES[1], CLOUDFLARE_BUYER_DATA_GAP],
    },
    {
      id: 'cloudflare-traffic-and-usage-baseline-gap',
      label: 'Traffic and usage baseline gap',
      severity: 'high',
      detectionSignals: [
        'Commercial model references requests, bandwidth, clean traffic, seats, Workers usage, logs, or add-ons without buyer telemetry',
        'Attack traffic, bot traffic, cached traffic, origin fetch, egress, and clean Magic Transit bandwidth are not modeled separately',
      ],
      mitigations: ['Collect pre-award traffic baseline', 'Model sensitivity cases', 'Separate public list mechanisms from private quote economics'],
      contractualRemedies: ['Usage reporting', 'Price-unit schedule', 'Overage notice', 'Renewal protection'],
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[7], CLOUDFLARE_PUBLIC_SOURCES[8], CLOUDFLARE_BUYER_DATA_GAP],
    },
    {
      id: 'cloudflare-control-plane-and-data-path-risk',
      label: 'Control-plane and data-path risk',
      severity: 'high',
      detectionSignals: [
        'Identity, device posture, TLS inspection, DLP, CASB, DNS, BGP, GRE/IPsec, CNI, or logging design is unresolved at award',
        'Security review treats Cloudflare trust resources as sufficient without mapping customer responsibilities and service-specific data flows',
      ],
      mitigations: ['Run architecture proof', 'Map data paths', 'Assign route and identity owners', 'Verify logging and incident operations'],
      contractualRemedies: ['Security exhibit', 'DPA review', 'Incident escalation', 'Transition and rollback plan'],
      sourceBasis: [CLOUDFLARE_PUBLIC_SOURCES[2], CLOUDFLARE_PUBLIC_SOURCES[5], CLOUDFLARE_PUBLIC_SOURCES[6], CLOUDFLARE_PUBLIC_SOURCES[10]],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Raise outsourcing, operational resilience, audit evidence, incident reporting, route rollback, data-location, exit, and concentration-risk scrutiny when Cloudflare protects regulated financial applications or networks.',
      regulatoryRefs: ['DORA where applicable to EU financial entities'],
      affectedStages: ['RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm whether PHI could appear in requests, logs, headers, cookies, uploads, Zero Trust inspection, support artifacts, or edge compute before approving Cloudflare service scope.',
      additionalRequirements: ['PHI boundary decision', 'HIPAA/BAA legal review if applicable', 'Logging minimization and access-control evidence'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate procurement channel, compliance scope, public-sector authorization requirements, logging, data localization, incident support, and routing ownership before production cutover.',
      regulatoryRefs: ['FedRAMP or local public-sector authorization where applicable'],
      affectedStages: ['Scope', 'BAFO', 'Contracting'],
    },
    {
      industry: 'retail_cpg',
      modifier:
        'Model seasonal traffic, bot pressure, checkout protection, DNS change windows, origin resilience, image/video delivery, and promotion-day incident support before treating Cloudflare as only a WAF or CDN renewal.',
      affectedStages: ['Scope', 'RFP', 'BAFO'],
    },
  ],
  body: `## Summary
Cloudflare should be sourced as a connectivity, security, and edge platform decision, not as a narrow CDN renewal. Public Cloudflare materials describe a platform that spans application security and performance, SASE and Zero Trust, network services, developer platform services, DNS, DDoS defense, WAF, private connectivity, and edge execution. That breadth is the sourcing opportunity and the sourcing risk. A buyer can simplify parts of the stack if the same global network, policy model, and operating team can cover public applications, employees, private networks, APIs, bots, DDoS events, and edge workloads. The same buyer can also create opaque dependency if commercial scope, data path, route ownership, logging, identity integration, certificate control, and exit mechanics are not documented before award.

## Where Cloudflare fits
Use this profile when Cloudflare is an incumbent, challenger, or expansion candidate for public websites, APIs, application security, bot mitigation, DDoS protection, DNS, Zero Trust access, secure web gateway, SASE, Magic Transit, Network Interconnect, Workers, Pages, images, video, or multi-cloud origin connectivity. The pattern is especially useful when a team wants to move from one Cloudflare product into a larger package. A WAF renewal that expands into bot management, Zero Trust, Magic Transit, CNI, or Workers is no longer a simple security add-on. It becomes an architecture and operating-model decision touching network engineering, IAM, security operations, platform engineering, privacy, legal, finance, and application owners.

Public sources provide several reliable anchors. Cloudflare describes a global network that runs services across data centers and interconnects with many networks. Its public WAF page describes request inspection, managed and custom rulesets, rate limiting, exposed credential detection, content upload scanning, and machine-learning-supported threat detection. Its DDoS page describes protection across applications, TCP/UDP applications, networks, and data centers, with Magic Transit for layer 3 and 4 network protection. Cloudflare One public material positions the SASE platform around one control plane, data plane, and infrastructure layer. Cloudflare Magic Transit docs describe an enterprise-only network security and performance service for on-premises, cloud-hosted, and hybrid networks. Cloudflare Network Interconnect docs describe direct private connectivity to Cloudflare instead of using the public Internet. These claims are product-scope evidence, not buyer-specific value evidence.

## Evidence to collect
Start with traffic and ownership. The buyer needs zones, domains, hostnames, applications, APIs, origins, DNS records, certificates, WAF policies, bot posture, DDoS history, cache behavior, bypass rules, logs, SIEM destinations, support tickets, current plan, account structure, and product entitlements. For network services, collect prefixes, ASNs, BGP responsibilities, GRE or IPsec tunnel requirements, CNI locations, cloud connectivity, failover expectations, maximum segment size constraints, health checks, and rollback steps. For Zero Trust, collect identity providers, device posture signals, private application inventory, user counts, contractor access, SWG use cases, CASB integrations, DLP profiles, TLS inspection posture, browser isolation needs, and data localization constraints.

Then separate public mechanisms from private economics. Cloudflare public plan pages and product docs can identify product families, self-serve plan anchors, selected add-ons, enterprise positioning, and measurement concepts such as Magic Transit clean-bandwidth measurement. They do not prove the buyer's enterprise net price, private discount, included capacity, support concession, committed usage, renewal cap, or cross-product bundle economics. Keep numeric enterprise benchmark fields blank until invoices, order forms, final quotes, reseller proposals, approved benchmark data, or signed contract exhibits exist.

## Negotiation posture
The strongest buyer posture is a traffic-backed architecture workbook. Require Cloudflare and any reseller to map each product to a measurable unit, owner, data path, control objective, and exit dependency. The workbook should distinguish clean traffic from attack traffic, cached traffic from origin fetch, seats from devices, Workers usage from application traffic, log retention from SIEM export, and private connectivity from public Internet routing. If Cloudflare proposes a broader platform consolidation, the buyer should trade expansion only for transparent price units, support scope, incident response, renewal rules, data-processing terms, SLA remedies, route rollback, and transition assistance.

For security and privacy, use public DPA, terms, and Trust Hub resources as starting evidence, not as automatic approval. The buyer still has to map the purchased services to personal data, regulated data, logs, headers, cookies, uploaded content, TLS inspection, DLP payload handling, support access, subprocessors, data localization, and customer-owned controls. If PHI, payment data, public-sector workloads, or regulated financial services are in scope, legal, privacy, risk, and security owners should approve the data path before award.

## Contradictions and failure modes
Vendor claim: one platform will reduce complexity. Detection: require a product-by-product scope schedule, operating owner map, migration path, route rollback, and exit plan. Vendor claim: DDoS or WAF protection is simple to activate. Detection: test DNS cutover, origin shielding, WAF exceptions, bot false positives, incident escalation, logging, and rollback before production. Vendor claim: SASE consolidation can replace legacy tools. Detection: prove identity integration, device posture, private application access, SWG policy, CASB/DLP use, user experience, and support workflows with real user cohorts.

The common failure mode is buying Cloudflare as a brand-level platform while managing it as disconnected technical features. The second failure is pricing from public plan pages while ignoring enterprise scope, traffic shape, logs, clean-bandwidth measurement, support, Workers usage, add-ons, and renewal mechanics. The third failure is treating trust resources as a substitute for buyer-specific data-path review. Cloudflare can be a credible strategic platform, but the sourcing file should prove exactly what traffic, users, applications, data, routes, logs, and controls will depend on it.`,
};
