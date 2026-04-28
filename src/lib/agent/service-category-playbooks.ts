// service-category-playbooks.ts
//
// Service category knowledge library for the Sentinel agent.
// Each playbook block provides expert-level procurement context injected into
// the system prompt when the active source event matches a known category.
//
// Usage: getCategoryPlaybook(eventName, eventType?) returns the matching
// playbook string, or null when no keyword matches.

// ── Playbook definitions ──────────────────────────────────────────────────────

export const CATEGORY_PLAYBOOKS: Record<string, string> = {

  ams: `
AMS (Application Managed Services) — Procurement Playbook

AMS is a long-term engagement where a vendor takes operational responsibility for running, maintaining, and evolving applications. Scope typically covers: incident management (P1 <1hr, P2 <4hr, P3 <24hr response SLAs), change request process and backlog ownership, enhancement pipeline governance, tooling and access management, knowledge transfer obligations.

Evaluation dimensions: offshore/onshore mix and location risk, tooling compatibility with client stack, reference customers in same industry, SLA penalty structure and credit caps, minimum commitment terms (typically 3–5 years), exit assistance obligations.

Red flags: vague scope definitions that allow scope creep charges, uncapped T&M change clauses, weak transition-out provisions (should be 6–12 months minimum), SLA credits that don't reflect actual business loss, no benchmarking rights.

Contract terms to negotiate hard: minimum notice period for key resource changes (90 days), benchmarking rights every 2 years, open book pricing model, service credit caps (10–15% of annual fees), exit assistance at no cost, IP ownership of client-funded enhancements.

Pricing benchmarks: AMS contracts typically 15–40% of application development cost per year. Offshore-heavy models: 12–18%. Nearshore-balanced: 20–28%. Premium onshore-led: 30–40%. Volume discounts kick in at >$5M ACV.
`.trim(),

  saas: `
SaaS — Procurement Playbook

SaaS procurement key dimensions: data residency and sovereignty requirements, user provisioning and SSO integration, API access and rate limits, renewal escalator caps (negotiate max 3–5% annual), data portability on exit (insist on full export rights), security certifications required (SOC-2 Type II minimum, ISO 27001 preferred).

Negotiation leverage: multi-year commits (2–3yr) for 15–25% discount, user volume commitments, additional module bundling.

Red flags: auto-renewal clauses without adequate notice windows (require 90-day notice minimum), vague data deletion timelines post-offboarding (insist on 30-day confirmed deletion), unclear AI/ML training data rights (require explicit opt-out of model training on client data).

Contract terms to negotiate hard: data portability in open formats at any time, DPA and GDPR/CCPA schedules, SLA uptime credits tied to actual business impact, right to audit security certifications annually, escrow provisions for source code if vendor is sub-scale.
`.trim(),

  infrastructure: `
Infrastructure (IaaS/PaaS/Cloud) — Procurement Playbook

IaaS/PaaS procurement key dimensions: committed use discounts vs on-demand (1yr: ~20–37%, 3yr: ~45–55% savings), egress cost exposure (often underestimated by 3–5x — model worst-case before signing), multi-cloud risk and portability, SLA uptime tiers (99.9% = ~8.7hr/yr downtime vs 99.99% = ~52min/yr — quantify business cost of each), DR/BCP provisions, data sovereignty and residency controls, security and compliance certifications (FedRAMP, ISO 27001, SOC-2), FinOps governance requirements.

Red flags: egress fees buried in pricing schedules, lock-in via proprietary APIs with no migration tooling, SLA credits capped at monthly spend (not proportional to business loss), no right to audit billing calculations.

Contract terms to negotiate hard: committed use discount with flex-up rights, egress fee caps or waiver for competitive migrations, FinOps reporting and cost anomaly alerting as baseline service, DPA and data residency schedules, exit migration assistance obligations.
`.trim(),

  implementation: `
Implementation / Systems Integration (SI) — Procurement Playbook

SI engagements key dimensions: fixed-price vs T&M trade-offs (fixed-price preferred for well-defined scope — reduces client risk; T&M appropriate for exploratory phases with clear governance), milestone structure and payment tied to acceptance, detailed acceptance criteria in SOW (not just delivery of artefacts but demonstrated functionality), IP ownership of custom code (insist on client ownership of all bespoke deliverables), warranty period (minimum 90 days post go-live), staffing approval rights for key roles, right to reject named resources, subcontractor disclosure requirements.

Red flags: vague acceptance criteria that leave pass/fail in vendor hands, payment milestones tied to delivery not acceptance, no key-person clauses for critical resources, broad subcontracting rights without client approval, no warranty on defects post go-live.

Contract terms to negotiate hard: change control process with quantified impact assessment before approval, liquidated damages for critical milestone slippage, escrow of all source code and configuration, knowledge transfer and documentation obligations, right to insource or re-bid post-completion without restriction.
`.trim(),

  consulting: `
Consulting / Advisory — Procurement Playbook

SOW-based consulting key dimensions: deliverable definition is critical — output-based not time-based (specify what documents, frameworks, or decisions will be produced, not just hours spent), rate benchmarking by grade (Partner/Director: $350–600/hr; Manager: $200–350/hr; Analyst: $100–200/hr for tier-1 firms), right-to-audit timesheets for T&M engagements, IP ownership of all work product (insist on full assignment, not licence), conflict of interest disclosure (especially where the firm also advises vendors), confidentiality scope, non-solicitation clauses (both directions).

Red flags: broad T&M engagements without milestone checkpoints, rate cards that allow grade substitution without client consent, vague deliverables that enable scope expansion, IP licence (not assignment) for work product, no obligation to disclose competing client relationships.

Contract terms to negotiate hard: fixed-fee or capped T&M with monthly not-to-exceed, explicit deliverable acceptance criteria with revision rounds, IP full assignment for all bespoke work product, conflict of interest disclosure obligations, 12-month non-solicitation on key client staff.
`.trim(),

};

// ── Keyword map ───────────────────────────────────────────────────────────────

const KEYWORD_MAP: Array<{ key: string; keywords: string[] }> = [
  {
    key: "ams",
    keywords: [
      "ams",
      "application managed service",
      "managed service",
      "application management",
    ],
  },
  {
    key: "saas",
    keywords: [
      "saas",
      "software as a service",
      "platform",
      "license",
      "licence",
      "subscription",
      "crm",
      "erp",
      "cloud software",
    ],
  },
  {
    key: "infrastructure",
    keywords: [
      "infrastructure",
      "cloud",
      "hosting",
      "iaas",
      "paas",
      "data centre",
      "datacenter",
      "network",
    ],
  },
  {
    key: "implementation",
    keywords: [
      "implementation",
      "integration",
      "delivery",
      "si",
      "systems integrator",
      "build",
      "deployment",
    ],
  },
  {
    key: "consulting",
    keywords: [
      "consulting",
      "advisory",
      "strategy",
      "assessment",
      "review",
    ],
  },
];

// ── Lookup function ───────────────────────────────────────────────────────────

/**
 * Returns the matching service-category playbook text for a given event name
 * and optional event type. Keyword matching is case-insensitive and uses
 * substring (includes) not exact match.
 *
 * AMS gets priority: its keywords are checked first because it is the highest-
 * value category and its name is short enough to be a substring of others.
 *
 * @param eventName  - The source event name, e.g. "AMS Vendor Consolidation 2026"
 * @param eventType  - Optional event type string, e.g. "managed-services"
 * @returns The playbook string or null if no category matched.
 */
export function getCategoryPlaybook(
  eventName: string,
  eventType?: string,
): string | null {
  const haystack = [
    eventName.toLowerCase(),
    eventType ? eventType.toLowerCase() : "",
  ].join(" ");

  for (const { key, keywords } of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        return CATEGORY_PLAYBOOKS[key] ?? null;
      }
    }
  }

  return null;
}
