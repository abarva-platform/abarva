import type {
  KnowledgeDimensionNarrativeSummary,
  KnowledgeHomeInsightSummary,
} from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

export const MERIDIAN_CLAUDE_HOME_INSIGHTS = {
  summary_title:
    "Meridian Health: An Integrated Care and Health-Plan Enterprise Building the Governed Foundation for AI at Scale",
  executive_summary:
    "Meridian Health is an integrated delivery network and health plan headquartered in Sacramento, California, serving members and patients across Northern California, Central California, and Nevada. Its operating context spans clinical operations, health-plan operations, finance and actuarial, contact center and member experience, quality, and enterprise data and analytics — each carrying represented executive ownership by role, not yet confirmed by name. The current-state estate is real and substantial: Epic's clinical and analytics modules, a claims administration platform, eligibility and benefits, a knowledge base, and a wide fragmented reporting layer of on-prem SQL Server marts, Tableau, SAS, and Power BI. That breadth is also the constraint — analytics run on-premise and fragmented, with much of the capacity consumed by maintenance and ad hoc reporting rather than net-new delivery.\n\nThe strategic implication is that no AI use case, from member-service Agent Assist to payment integrity, can scale safely until a governed data spine exists. Today there is no certified medallion architecture, no patient/member identity spine in place, and no formal data governance operating model — these are target-state needs, not current production. Leadership should prioritize the governed lakehouse foundation as the enabling bet before advancing individual use cases, and the CDAO should certify data-product ownership and baselines as the first deliverable of a data governance workshop. This is planning-grade synthetic context for demonstration, not client production evidence.",
  strategic_priorities: [
    "Prioritize the governed clinical + claims lakehouse foundation as the enabling bet that unlocks every downstream use case, not a single contact-center initiative.",
    "Establish a formal data governance operating model — stewardship, semantic ownership, quality gates, and PHI controls — before any AI use case moves from discovery to production.",
    "Certify a patient/member identity spine so clinical, claims, pharmacy, and member-service data can be trusted across use cases.",
    "Baseline the metrics that value depends on (analytics maintenance share, use-case readiness) before Tower can claim any realized outcome.",
    "Validate transcript, telephony, and API/integration readiness for CRM, claims, eligibility, and knowledge before Agent Assist advances to architecture design.",
  ],
  top_insights: [
    {
      title: "Real operating breadth, fragmented analytics core",
      what_nexus_sees:
        "Six enterprise functions and 116 application records are represented, but analytics sit on-prem across SQL Server marts, Tableau, SAS, and Power BI, with capacity consumed by maintenance.",
      why_it_matters:
        "Breadth without a governed spine means AI ambition outruns the data foundation it depends on.",
      evidence_strength: "Strong",
      related_dimensions: [
        "Applications & Systems",
        "Data Assets & Integrations",
        "Business Functions",
      ],
      next_action:
        "Map current reporting estate against target lakehouse scope in a discovery workshop.",
      module_handoff:
        "Knowledge frames the estate; Intelligence reasons about modernization sequencing.",
    },
    {
      title: "The lakehouse foundation is the enabling bet",
      what_nexus_sees:
        "A named Databricks/AWS clinical + claims lakehouse program carries a $58M budget and $93M expected value, in mobilize phase, but medallion certification and identity spine remain open.",
      why_it_matters:
        "This is the single dependency that unlocks cost transparency, payment integrity, quality, and member-service use cases together.",
      evidence_strength: "Medium",
      related_dimensions: [
        "Programs & Initiatives",
        "Data Assets & Integrations",
        "Infrastructure & Platforms",
      ],
      next_action:
        "Confirm gate criteria, data-owner signoff, and baseline evidence for the lakehouse program.",
      module_handoff:
        "Moves phase-gates the foundation program once baselines are set.",
    },
    {
      title: "Governance and identity gaps block production",
      what_nexus_sees:
        "High-severity open controls include no certified medallion architecture, no patient/member identity spine, no formal data governance, and no AI audit trail evidence.",
      why_it_matters:
        "Without these controls in place, no use case touching PHI can move to production, regardless of its business case.",
      evidence_strength: "Strong",
      related_dimensions: [
        "Risks & Controls",
        "Data Assets & Integrations",
        "Metrics & Outcomes",
      ],
      next_action:
        "Stand up a data governance operating model and assign control owners by name.",
      module_handoff:
        "Intelligence weighs readiness and risk; Moves sequences remediation.",
    },
    {
      title: "Agent Assist is one worked example, not the premise",
      what_nexus_sees:
        "Call center optimization depends on contact center transcript/telephony, CRM, claims, and Power BI — the same identity and claims data that grounds payment integrity and cost transparency.",
      why_it_matters:
        "The context layer serves the whole enterprise; multiple use cases draw on the same governed spine.",
      evidence_strength: "Medium",
      related_dimensions: [
        "AI & Automation Use Cases",
        "Business Functions",
        "Data Assets & Integrations",
      ],
      next_action:
        "Validate transcript governance and CRM/claims API readiness before committing to architecture.",
      module_handoff:
        "Knowledge keeps the use case in discovery until dependencies are validated.",
    },
    {
      title: "Value is a hypothesis until baselined",
      what_nexus_sees:
        "Metric records exist (analytics maintenance share, per-program baseline readiness) but all are marked baseline_required with no certified actuals.",
      why_it_matters:
        "Expected-value figures cannot be treated as realized savings until baselines and outcome evidence exist.",
      evidence_strength: "Partial",
      related_dimensions: [
        "Metrics & Outcomes",
        "IT Budget, Spend & Value",
        "Programs & Initiatives",
      ],
      next_action:
        "Baseline maintenance share and per-program readiness before any value claim.",
      module_handoff: "Tower can only claim value once actuals are captured.",
    },
  ],
  enterprise_context_map: [
    {
      from: "Meridian Health",
      relation: "operates",
      to: "Clinical, health-plan, finance, and analytics functions",
    },
    {
      from: "Contact Center and Member Experience",
      relation: "depends on",
      to: "CRM, claims, and knowledge base",
      caveat: "Transcript and telephony governance not yet validated",
    },
    {
      from: "Claims administration platform",
      relation: "feeds",
      to: "Payment integrity and cost transparency programs",
    },
    {
      from: "Epic Clarity and Caboodle",
      relation: "extend to",
      to: "Unified clinical + claims lakehouse",
      caveat: "Medallion architecture not certified",
    },
    {
      from: "On-prem SQL Server, Tableau, SAS, Power BI",
      relation: "targeted for consolidation into",
      to: "Governed lakehouse on AWS + Databricks",
      caveat: "AWS/Databricks is target-state, not current production",
    },
    {
      from: "Governed data foundation",
      relation: "enables",
      to: "AI / LLM automation use cases",
      caveat: "No formal data governance operating model in place",
    },
    {
      from: "Patient/member identity spine",
      relation: "required by",
      to: "All cross-domain use cases",
      caveat: "Identity spine not yet in place",
    },
    {
      from: "Lakehouse foundation program",
      relation: "blocked by",
      to: "Open high-severity controls",
      caveat: "Data-owner signoff and gate criteria pending",
    },
    {
      from: "Metric baselines",
      relation: "required before",
      to: "Tower value realization claims",
      caveat: "All metrics marked baseline_required",
    },
  ],
  readiness_matrix: [
    {
      dimension: "Enterprise Profile",
      readiness: "Strong",
      story:
        "Sacramento-based integrated delivery network and health plan with clear mission and multi-state service area is well represented.",
    },
    {
      dimension: "Business Functions",
      readiness: "Strong",
      story:
        "Six functions with represented executive ownership by role; named owners still to be confirmed.",
    },
    {
      dimension: "Applications & Systems",
      readiness: "Partial",
      story:
        "Rich current-state estate is captured, but AWS and Databricks remain target-state and not certified production.",
    },
    {
      dimension: "Data Assets & Integrations",
      readiness: "Gap",
      story:
        "Lakehouse assets are framed as target-state; identity spine, medallion, and data owners are unconfirmed.",
    },
    {
      dimension: "Risks & Controls",
      readiness: "Gap",
      story:
        "High-severity governance, identity, and audit controls are open and block production use.",
    },
    {
      dimension: "Metrics & Outcomes",
      readiness: "Partial",
      story:
        "Metric definitions exist but every baseline is required, so no value can yet be realized.",
    },
    {
      dimension: "Relationships",
      readiness: "Not validated",
      story:
        "Cross-domain links are candidate-only; no validated relationships are present in this context.",
    },
  ],
  evidence_heatmap: [
    {
      dimension: "Enterprise Profile",
      evidence_coverage: "High",
      confidence: "Medium",
      caveat:
        "Revenue, employee, and footprint facts are synthetic planning-grade, not audited.",
    },
    {
      dimension: "Applications & Systems",
      evidence_coverage: "High",
      confidence: "Medium",
      caveat: "Estate is represented; AWS/Databricks is target-state only.",
    },
    {
      dimension: "Data Assets & Integrations",
      evidence_coverage: "Medium",
      confidence: "Low",
      caveat:
        "Assets are target-state framing; owners marked to confirm in workshop.",
    },
    {
      dimension: "Risks & Controls",
      evidence_coverage: "High",
      confidence: "Medium",
      caveat: "Controls are open with workshop evidence required to close.",
    },
    {
      dimension: "Metrics & Outcomes",
      evidence_coverage: "Medium",
      confidence: "Low",
      caveat: "All baselines required; no actuals captured.",
    },
    {
      dimension: "Relationships",
      evidence_coverage: "Low",
      confidence: "Low",
      caveat: "No validated relationships present; treat links as hypotheses.",
    },
  ],
  top_gaps: [
    {
      gap: "No patient/member identity spine in place",
      why_it_matters:
        "Without a trusted identity spine, clinical, claims, pharmacy, and member-service data cannot be joined for any cross-domain use case.",
      source_dimension: "Data Assets & Integrations",
      evidence_requested:
        "Confirmed identity resolution approach and data owner",
      suggested_workshop_owner: "CDAO",
      module_impacted: "Intelligence",
    },
    {
      gap: "No formal data governance operating model",
      why_it_matters:
        "Stewardship, semantic ownership, and quality gates are prerequisites for safe AI on PHI-bearing data.",
      source_dimension: "Risks & Controls",
      evidence_requested:
        "Documented governance operating model with named control owners",
      suggested_workshop_owner: "CDAO",
      module_impacted: "Knowledge",
    },
    {
      gap: "No certified medallion architecture",
      why_it_matters:
        "Uncertified data-product layers mean no trustworthy foundation for automation or reporting.",
      source_dimension: "Data Assets & Integrations",
      evidence_requested: "Bronze/silver/gold certification evidence",
      suggested_workshop_owner: "CDIO",
      module_impacted: "Moves",
    },
    {
      gap: "Metric baselines not established",
      why_it_matters:
        "Expected-value figures cannot be treated as realized value until baselines and actuals exist.",
      source_dimension: "Metrics & Outcomes",
      evidence_requested:
        "Baseline values for maintenance share and per-program readiness",
      suggested_workshop_owner: "CFO",
      module_impacted: "Tower",
    },
  ],
  module_readiness: [
    {
      module: "Knowledge",
      readiness:
        "Active and source-backed across nine represented domains for discovery and framing.",
      next_best_action:
        "Frame the estate, gaps, and use-case dependencies for a data governance workshop.",
    },
    {
      module: "Intelligence",
      readiness:
        "Ready to reason about sequencing and readiness once relationships and identity spine are validated.",
      next_best_action:
        "Weigh the lakehouse foundation against individual use cases as the enabling bet.",
    },
    {
      module: "Moves",
      readiness:
        "Not yet — candidate programs need baselines and gate criteria before phase-gating.",
      next_best_action:
        "Convert the lakehouse foundation program into phase-gated execution once owners and baselines are confirmed.",
    },
    {
      module: "Source",
      readiness:
        "Vendor names represented but no contract economics or SLAs loaded.",
      next_best_action:
        "Load contract terms for Epic, Microsoft, AWS, Databricks, and analytics vendors before sourcing analysis.",
    },
    {
      module: "Tower",
      readiness:
        "Not yet — no baselines or actuals exist to support value claims.",
      next_best_action:
        "Baseline priority metrics before any realized-value reporting.",
    },
  ],
  safe_claims: [
    "Meridian is an integrated delivery network and health plan serving Northern California, Central California, and Nevada from Sacramento.",
    "The current-state estate includes Epic clinical/analytics modules, claims, eligibility, a knowledge base, and fragmented on-prem reporting tools.",
    "A governed lakehouse on AWS + Databricks with medallion architecture is the target-state direction, not current production.",
    "High-severity governance, identity, and audit controls are open and must close before production AI use.",
    "This context is safe for discovery and framing, not for production approval or realized-value claims.",
    "This is synthetic Meridian-style demo context, not real Meridian production data.",
    "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
    "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
    "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
  ],
  do_not_claim: [
    "Do not claim real Meridian production data was loaded.",
    "Do not claim AWS or Databricks is certified current production for this tenant.",
    "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
    "Do not claim PHI-bearing transcripts have been ingested or approved.",
    "Do not treat candidate or generated relationship records as approved active tenant truth.",
    "Do not treat candidate or generated graph records as approved active tenant truth.",
  ],
  visual_blocks: [
    {
      type: "context_strength_snapshot",
      title: "Where Meridian's Context Is Strong and Where It Is Thin",
      executive_message:
        "Enterprise, function, and system context are well represented, but the data foundation, governance, and relationships that AI depends on are gaps.",
      why_it_matters:
        "It tells leadership exactly which dimensions are ready to reason on today versus which need workshop evidence first.",
      data: {
        rows: [
          {
            dimension: "Enterprise Profile",
            readiness: "Strong",
            note: "Integrated delivery network and health plan, multi-state footprint",
          },
          {
            dimension: "Applications & Systems",
            readiness: "Partial",
            note: "Rich estate; AWS/Databricks target-state only",
          },
          {
            dimension: "Data Assets & Integrations",
            readiness: "Gap",
            note: "Identity spine and medallion not in place",
          },
          {
            dimension: "Risks & Controls",
            readiness: "Gap",
            note: "Governance and audit controls open",
          },
          {
            dimension: "Relationships",
            readiness: "Not validated",
            note: "Candidate-only links",
          },
        ],
      },
      evidence_refs: [
        "meridian-health:current-universal:00_enterprise_profile.csv:2",
        "meridian-health:current-universal:04_applications_systems.csv:5",
        "meridian-health:current-universal:11_risks_controls.csv:3",
      ],
      caveats: [
        "Planning-grade synthetic context, not client production evidence.",
      ],
      renderer_hint: "matrix",
      display_priority: 1,
    },
    {
      type: "what_more_context_unlocks",
      title: "What Closing the Foundation Gaps Unlocks",
      executive_message:
        "A governed identity spine, medallion architecture, and governance model together unlock every downstream use case, not just one.",
      why_it_matters:
        "It reframes foundation investment as an enterprise-wide enabler rather than a cost tied to a single initiative.",
      data: {
        rows: [
          {
            if_closed: "Patient/member identity spine",
            unlocks:
              "Cross-domain use cases across clinical, claims, pharmacy, and member service",
          },
          {
            if_closed: "Formal data governance operating model",
            unlocks:
              "Safe AI on PHI-bearing data with audit controls and human-in-the-loop",
          },
          {
            if_closed: "Certified medallion architecture",
            unlocks:
              "Trustworthy data products for cost transparency, payment integrity, and quality",
          },
        ],
      },
      evidence_refs: [
        "meridian-health:current-universal:05_data_assets_integrations.csv:5",
        "meridian-health:current-universal:11_risks_controls.csv:6",
      ],
      caveats: [
        "Unlocks are hypotheses until workshop evidence closes the underlying gaps.",
      ],
      renderer_hint: "card_list",
      display_priority: 2,
    },
    {
      type: "evidence_gap_requests",
      title: "Evidence Requests That Strengthen Every Future Use Case",
      executive_message:
        "Four high-leverage evidence requests would move Meridian from framing to production-ready foundations.",
      why_it_matters:
        "Each closed gap strengthens the shared context layer for all use cases, not just Agent Assist.",
      data: {
        rows: [
          {
            gap: "Identity spine",
            owner: "CDAO",
            module: "Intelligence",
          },
          {
            gap: "Governance operating model",
            owner: "CDAO",
            module: "Knowledge",
          },
          {
            gap: "Medallion certification",
            owner: "CDIO",
            module: "Moves",
          },
          {
            gap: "Metric baselines",
            owner: "CFO",
            module: "Tower",
          },
        ],
      },
      evidence_refs: [
        "meridian-health:current-universal:11_risks_controls.csv:2",
        "meridian-health:current-universal:14_metrics_outcomes.csv:2",
      ],
      caveats: ["Owners are role titles, not confirmed named individuals."],
      renderer_hint: "table",
      display_priority: 3,
    },
    {
      type: "module_next_actions",
      title: "What Each Module Should Do Next",
      executive_message:
        "Knowledge and Intelligence are ready to work now; Moves, Source, and Tower activate once baselines and contracts arrive.",
      why_it_matters:
        "It sequences module engagement so effort matches the evidence actually available today.",
      data: {
        rows: [
          {
            module: "Knowledge",
            action:
              "Frame estate, gaps, and dependencies for a governance workshop",
          },
          {
            module: "Intelligence",
            action:
              "Reason on foundation-first sequencing once relationships validated",
          },
          {
            module: "Moves",
            action:
              "Phase-gate the lakehouse program after baselines confirmed",
          },
          {
            module: "Source",
            action: "Load vendor contract economics before sourcing analysis",
          },
          {
            module: "Tower",
            action: "Baseline metrics before any value claim",
          },
        ],
      },
      evidence_refs: [
        "meridian-health:current-universal:09_programs_initiatives.csv:9",
        "meridian-health:current-universal:07_vendors_contracts.csv:2",
      ],
      caveats: [
        "Module runtime behavior is unchanged; this is planning context only.",
      ],
      renderer_hint: "strip",
      display_priority: 4,
    },
  ],
  tenant_key: "meridian-health",
  tenant_name: "Meridian Health",
  source_context_hash:
    "sha256:8aff19ece549adc4268a9bdeb5625076b2fbb18314149b5c6530d57f5af014b2",
  evidence_refs_used: [
    "meridian-enterprise-profile",
    "meridian-member-service-context",
    "meridian-current-analytics-estate",
    "meridian-agent-assist-use-case",
    "meridian-risk-control-context",
    "meridian-metrics-baseline-context",
  ],
  relationship_edges_used: [
    "rel-member-service-to-contact-center",
    "rel-member-service-to-claims",
    "rel-member-service-to-eligibility",
    "rel-agent-assist-to-analytics-foundation",
    "rel-agent-assist-to-phi-controls",
  ],
  context_gap_ids_used: [
    "gap-transcript-governance",
    "gap-api-readiness",
    "gap-kpi-baselines",
    "gap-aws-databricks-production-readiness",
  ],
  generated_by: "claude",
  generated_model: "claude-opus-4-8",
  generated_at: "2026-07-16T13:50:14.269Z",
  validation_status: "passed",
  validation_errors: [],
} satisfies KnowledgeHomeInsightSummary;

export const MERIDIAN_CLAUDE_DIMENSION_NARRATIVES = [
  {
    dimension_key: "00_enterprise_profile",
    dimension_name: "Enterprise Profile",
    summary_title:
      "An integrated delivery network and health plan modernizing its data core",
    executive_summary:
      "Meridian is a healthcare enterprise combining clinical delivery, health-plan operations, finance, and analytics, headquartered in Sacramento with service areas across Northern California, Central California, and Nevada. It serves patients, members, providers, and employer groups, and its stated ambition is a governed data foundation that makes automation and cost outcomes reliable. That dual provider-and-payer complexity is exactly why transformation is hard: clinical, claims, and financial data must be harmonized before AI can scale safely. The organization should validate leadership, revenue, and footprint facts through a client profile answer material before treating them as confirmed. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Meridian is an integrated delivery network and health plan operating across Sacramento, Northern and Central California, and Nevada",
      "Customer segments span patients, members, providers, employer groups, and clinical and health-plan operations leaders",
      "Its stated mission and vision center on access, quality, affordability, and a governed clinical, claims, pharmacy, and financial data foundation",
    ],
    why_it_matters:
      "The provider-plus-payer operating model defines the transformation agenda: reliable automation depends on harmonizing clinical, claims, and financial data that today sit apart.",
    questions_supported: [
      "Meridian can use this dimension to frame the scale and shape of its transformation agenda, grounded in the confirmed provider-and-payer operating model and named service areas.",
    ],
    current_caveats: [
      "Revenue, employee count, exact production footprint, and named leadership are not confirmed and must be validated by a client answer material before being treated as fact.",
    ],
    next_validation_actions: [
      "Confirm leadership by name, revenue, employee count, and production footprint through a client profile answer material in the discovery workshop before displaying them as facts.",
    ],
    module_usage: [
      "Knowledge explains the enterprise shape and its evidence boundaries",
      "Intelligence uses the profile to frame where AI investment focus should concentrate",
    ],
    data_tab_intro:
      "These records describe Meridian as an integrated delivery network and health plan with its stated mission, service areas, and customer segments — note that quantitative facts like revenue remain to be confirmed.",
    relationships_tab_intro:
      "Cross-domain relationships for this dimension are not yet validated, so treat any link between the profile and other domains as a hypothesis, not a confirmed dependency.",
    gaps_tab_intro:
      "The biggest gap is unconfirmed leadership, revenue, and footprint detail; closing it lets the profile be cited as fact rather than planning assumption.",
    evidence_tab_intro:
      "This profile is backed by a synthetic PHI-free planning-grade context pack, useful for framing but not for asserting audited enterprise facts.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-00_enterprise_profile-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:008a7de9424e11b8ca5321bc783a350a33d3f94557c8fcfd422df506824bc783",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "01_business_functions",
    dimension_name: "Business Functions",
    summary_title:
      "Transformation reaches across clinical, plan, finance, and experience functions",
    executive_summary:
      "Meridian's business context shows that transformation touches every core function, not one contact center. Clinical Operations, Health Plan Operations, Finance and Actuarial, Quality and Provider Performance, Contact Center and Member Experience, Enterprise Data and Analytics, and Technology Platform and Security each carry represented executive ownership by role. The operating-model implication is that AI-led change happens where these functions share data — claims, eligibility, and clinical reporting. The CDAO and functional leaders should confirm which functions own which decisions in a governance workshop before use cases advance. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Seven-plus functions are represented, including Clinical Operations, Health Plan Operations, Finance and Actuarial, and Contact Center and Member Experience",
      "Executive ownership is represented by role (CDAO, CMO, CFO, Chief Health Plan Officer, Chief Experience Officer, CDIO), not by named individuals",
      "Function capabilities range from prior authorization and claims operations to payment integrity, care gap analytics, and next-best-action workflows",
    ],
    why_it_matters:
      "Because transformation spans functions that share member service, claims, and eligibility data, operating-model change must be coordinated across owners rather than run inside a single team.",
    questions_supported: [
      "Meridian can use this dimension to decide which functions must co-own an AI initiative, based on the represented capabilities and executive ownership by role.",
    ],
    current_caveats: [
      "Executive owners are role titles, not confirmed named individuals, and cross-function decision rights are not yet validated.",
    ],
    next_validation_actions: [
      "Confirm named function owners and decision rights in a governance workshop before any use case moves from discovery into design.",
    ],
    module_usage: [
      "Knowledge maps which functions and capabilities are in scope",
      "Moves sequences function-level operating-model change once ownership is confirmed",
    ],
    data_tab_intro:
      "These records list Meridian's core business functions with their represented executive owner role and business capabilities — look for where functions share claims or member data.",
    relationships_tab_intro:
      "Function-to-function and function-to-system links are not yet validated, so treat cross-function dependencies here as candidate hypotheses.",
    gaps_tab_intro:
      "The key gap is that owners are role titles, not named accountable individuals — closing it is what lets decision rights be assigned.",
    evidence_tab_intro:
      "Function records come from a synthetic planning-grade pack; use them to frame scope, not to assert confirmed organizational structure.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-01_business_functions-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:4868a084cc94b5ea9e62ae5ed96b9dc58332ad40d6748977922cd95c12d6b2e2",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "02_org_ownership",
    dimension_name: "Org Ownership",
    summary_title:
      "Ownership is represented by role, not yet confirmed by name",
    executive_summary:
      "Meridian's decision, control, and funding ownership is visible only through function-level role titles today — CDAO, CFO, CMO, Chief Health Plan Officer, and CDIO among them. No named accountable owners, RACI, or governance operating model is in place. That matters because AI at scale requires accountable owners for data products, controls, and value measurement. The organization should certify named ownership and decision rights as an early workshop deliverable. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Ownership appears as executive role titles attached to functions, not confirmed named individuals",
      "Data product owners are marked owner_to_confirm_in_workshop across data assets",
      "No formal data governance operating model, stewardship, or quality-gate ownership is represented",
    ],
    why_it_matters:
      "Without named, accountable owners for data products, controls, and metrics, no AI use case can be approved for production or credited with realized value.",
    questions_supported: [
      "Meridian can use this dimension to decide who must be named as accountable owner before any data product or use case advances, given that ownership is currently role-level only.",
    ],
    current_caveats: [
      "Named owners, RACI, and a governance operating model are not evidenced; ownership is representational only.",
    ],
    next_validation_actions: [
      "Certify data-product and control ownership by name in a governance workshop as the first discovery-phase deliverable.",
    ],
    module_usage: [
      "Knowledge surfaces where ownership is represented versus confirmed",
      "Tower cannot attribute outcomes until accountable owners are named",
    ],
    data_tab_intro:
      "These records show ownership expressed as executive role titles and unconfirmed data-owner placeholders — look for where accountability is still unassigned.",
    relationships_tab_intro:
      "Ownership-to-asset relationships are not validated, so no line of accountability here should be treated as confirmed.",
    gaps_tab_intro:
      "The single biggest gap is the absence of named, accountable owners and a governance operating model — the prerequisite for any production approval.",
    evidence_tab_intro:
      "Ownership is inferred from synthetic role-level context; treat it as a starting map for a governance workshop, not a confirmed org chart.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-02_org_ownership-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:63af7aa545e00baf81621b66388c4351373e13fc0a4ba523548a6ab5b0bf9450",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "03_workforce_roles",
    dimension_name: "Workforce Roles",
    summary_title:
      "Workforce-role evidence is not yet loaded for this dimension",
    executive_summary:
      "Meridian's transformation will change how supervisors, knowledge stewards, analysts, and member-service agents work, but no workforce-role records are represented in this context. What exists are function-level capabilities that imply roles, not confirmed workforce structure or headcount. Because AI adoption succeeds or fails on frontline roles and change readiness, the organization should capture role inventories and adoption owners in discovery. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "No dedicated workforce-role records are represented in this context pack",
      "Function capabilities imply roles such as contact-center agents, supervisors, knowledge stewards, and analytics staff",
      "Analytics resourcing is described only at the aggregate level of maintenance versus net-new capacity",
    ],
    why_it_matters:
      "AI-led change depends on which frontline and analytics roles adopt new workflows, and none of that role structure is yet evidenced.",
    questions_supported: [
      "This dimension cannot yet inform workforce or adoption decisions — no role inventory, headcount, or change-readiness evidence is loaded.",
    ],
    current_caveats: [
      "Workforce roles, headcount, and change-readiness signals are not present and must be gathered in discovery.",
    ],
    next_validation_actions: [
      "Capture a role inventory and named adoption owners for affected functions during the discovery workshop.",
    ],
    module_usage: [
      "Knowledge flags workforce-role evidence as a gap to close",
      "Moves uses role and adoption data to plan change once captured",
    ],
    data_tab_intro:
      "No workforce-role records are represented here; what you see are function capabilities that only imply the roles involved.",
    relationships_tab_intro:
      "There are no validated workforce relationships in this dimension, so any role-to-function link is inference only.",
    gaps_tab_intro:
      "The defining gap is the absence of any role inventory or change-readiness evidence — essential before planning adoption.",
    evidence_tab_intro:
      "This dimension has no dedicated synthetic records; treat workforce-role questions as open discovery items.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-03_workforce_roles-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:de7921ad56d31da19e6bde6801d34794add924eaac68958f1a2b867190bd232d",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "04_applications_systems",
    dimension_name: "Applications & Systems",
    summary_title:
      "A critical Epic and legacy-reporting estate feeding fragmented analytics",
    executive_summary:
      "Meridian runs a critical current-state estate: Epic Hyperspace, Epic Clarity, and Epic Caboodle for clinical and analytics, a claims administration platform, an eligibility and benefits platform, a CRM member case management system, a knowledge base, and a contact center platform. Reporting sits on On-prem SQL Server reporting marts with Tableau, SAS, and Power BI, plus DB2 and Netezza-style integration warehouses where applicable. Several assets are flagged fragmented current-state or extend-to-lakehouse, which makes modernization a dependency, not a detail. AWS and Databricks are target-state direction only, not certified current production. The CDIO and CDAO should validate integration readiness for CRM, claims, eligibility, and Epic-derived data in a discovery workshop. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Epic Hyperspace, Epic Clarity, and Epic Caboodle are critical clinical and analytics systems, with Epic Clarity flagged extend-to-lakehouse",
      "On-prem SQL Server reporting marts are flagged fragmented current-state; Tableau, SAS, and Power BI form the current reporting estate",
      "Claims administration and eligibility platforms, CRM, contact center, and knowledge base are current-core member-service and health-plan systems",
      "AWS and Databricks appear only as target-state direction, not certified current production",
    ],
    why_it_matters:
      "The fragmented reporting estate and dependence on Epic-derived data mean modernization and integration readiness are prerequisites before any AI use case can rely on trustworthy inputs.",
    questions_supported: [
      "Meridian can use this dimension to decide whether a use case like Agent Assist stays in discovery or moves to architecture design, based on whether CRM, claims, eligibility, and knowledge-base integration is validated.",
    ],
    current_caveats: [
      "API and integration readiness for CRM, claims, eligibility, knowledge, and Epic-derived data is not validated; AWS and Databricks are target-state, not current production.",
    ],
    next_validation_actions: [
      "Validate integration and API readiness for CRM, claims, eligibility, knowledge base, and Epic Clarity/Caboodle-derived data in a technical discovery workshop.",
    ],
    module_usage: [
      "Knowledge inventories the current estate and its lifecycle flags",
      "Source uses system and vendor context for modernization scope once contracts are added",
    ],
    data_tab_intro:
      "These are Meridian's current clinical, claims, eligibility, CRM, and reporting systems, each tagged with a lifecycle state — watch for the fragmented current-state and extend-to-lakehouse flags.",
    relationships_tab_intro:
      "System-to-data and system-to-function links are not yet validated, so treat integration dependencies here as candidate, not confirmed.",
    gaps_tab_intro:
      "The biggest gap is unvalidated integration readiness across CRM, claims, eligibility, knowledge base, and Epic-derived data — the constraint on moving any use case forward.",
    evidence_tab_intro:
      "System records come from a synthetic planning-grade pack; use them to frame the estate, not to assert certified production or target-state readiness.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-04_applications_systems-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:a7fc0193001201ad9908f6b321301704746ce53f88d51188ca9b68f42988dbd5",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "05_data_assets_integrations",
    dimension_name: "Data Assets & Integrations",
    summary_title:
      "A target lakehouse designed but not yet a governed data spine",
    executive_summary:
      "Meridian's data assets describe an intended unified clinical and claims lakehouse spanning EMR clinical, claims, pharmacy, patient/member identity, and a longitudinal patient view, alongside a governed AI foundation for prior authorization, coding, and utilization management. Today these sit against fragmented marts fed by Epic Clarity and Epic Caboodle, On-prem SQL Server reporting marts, DB2 and Netezza-style warehouses, Tableau, and SAS. Critically, no patient/member identity spine, certified medallion architecture, or governance operating model is in place — every data owner is still to be confirmed. Before AI scales safely, the CDAO should establish identity, medallion certification, and Unity Catalog-style governance. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Target data products span a unified clinical + claims lakehouse across EMR clinical, claims, pharmacy, patient/member identity, and longitudinal patient view",
      "Current analytics are fragmented across Epic Clarity, Epic Caboodle, SQL Server reporting marts, DB2/Netezza-style warehouses, Tableau, and SAS",
      "Every data asset lists dataOwner as owner_to_confirm_in_workshop and no certified medallion or governance model is present",
      "A future governed lakehouse with Unity Catalog-style governance and PHI controls is target-state, not current production",
    ],
    why_it_matters:
      "AI cannot scale safely until a patient/member identity spine, medallion-certified data products, and a governance operating model replace today's fragmented marts.",
    questions_supported: [
      "Meridian can use this dimension to decide whether to prioritize building the identity spine and medallion layers first, given that no certified data foundation exists today.",
    ],
    current_caveats: [
      "No patient/member identity spine, certified medallion architecture, or data governance operating model is loaded; data owners are unconfirmed.",
    ],
    next_validation_actions: [
      "Have the CDAO confirm data-product owners and define identity-spine, medallion, and Unity Catalog-style governance requirements in a data governance workshop.",
    ],
    module_usage: [
      "Knowledge shows the gap between target data products and current fragmented marts",
      "Moves phases the lakehouse and governance build once owners and baselines are set",
    ],
    data_tab_intro:
      "These records describe target lakehouse data products against today's fragmented Epic-, SQL Server-, and SAS-based marts — note that every data owner is still to be confirmed.",
    relationships_tab_intro:
      "Data-asset relationships are not yet validated, so treat any link between a target data product and a source system as a hypothesis.",
    gaps_tab_intro:
      "The biggest gap is the absence of a patient/member identity spine and certified medallion architecture — the foundation AI depends on.",
    evidence_tab_intro:
      "Data assets are synthetic planning-grade descriptions of intended products; use them to frame the target state, not to claim a built data spine.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-05_data_assets_integrations-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:2abb783f740beeb055db4759c1f48149766eaaf02ceace96688f06fb59eeec75",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "06_infrastructure_platforms",
    dimension_name: "Infrastructure & Platforms",
    summary_title:
      "The target AWS and Databricks foundation is direction, not proof",
    executive_summary:
      "Meridian's intended platform foundation is an AWS and Databricks lakehouse with medallion architecture, but no platform, network, or security foundation evidence is represented. The current estate remains on-premise and mixed-hosting across clinical and reporting systems. This is the transformation's foundational dependency: AI-led change cannot proceed without a validated landing zone, network and security controls, and medallion certification. The CDIO should validate the platform build state before use cases assume it exists. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Target foundation is an AWS and Databricks lakehouse with medallion architecture",
      "No platform, network, or security foundation evidence is represented as current production",
      "Current systems are described as on-premise and current-mixed hosting",
    ],
    why_it_matters:
      "Every downstream AI use case assumes a platform foundation that is not yet evidenced, making landing-zone and control validation the gating dependency.",
    questions_supported: [
      "Meridian can use this dimension to decide whether the platform foundation must be built and validated before use cases proceed, given that AWS/Databricks readiness is target-state only.",
    ],
    current_caveats: [
      "AWS and Databricks are aspiration, not certified current production; no medallion, network, or security foundation evidence is loaded.",
    ],
    next_validation_actions: [
      "Have the CDIO validate landing-zone, network, security, and medallion build state before any use case assumes the foundation exists.",
    ],
    module_usage: [
      "Knowledge distinguishes target-state foundation from current on-prem estate",
      "Moves sequences the foundation build as a gating dependency",
    ],
    data_tab_intro:
      "There are no certified platform records here; the AWS and Databricks foundation appears as target-state direction against a current on-prem, mixed-hosting estate.",
    relationships_tab_intro:
      "Platform relationships are not validated, so treat any dependency between the target foundation and use cases as unconfirmed.",
    gaps_tab_intro:
      "The defining gap is the absence of any platform, network, security, or medallion foundation evidence — the prerequisite for scaling AI.",
    evidence_tab_intro:
      "Platform direction is synthetic and planning-grade; do not read AWS or Databricks as certified current production.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-06_infrastructure_platforms-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:d4a3b35107fa9ac660fd7d9a15d2e9eca88a99a50faac2f836862d9df470aeca",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "07_vendors_contracts",
    dimension_name: "Vendors & Contracts",
    summary_title: "Key vendors named, but no contract economics or SLAs yet",
    executive_summary:
      "Meridian's vendor landscape is represented — Epic, Microsoft, Tableau, SAS, Amazon Web Services, Databricks, and an outsourced analytics managed services provider — spanning its clinical, reporting, cloud, and analytics estate. But no contract terms, SLAs, renewal dates, or spend figures are attached to these vendors. Source can help with sourcing scope and contract optimization only once that commercial evidence is added. The organization should gather contract economics and SLAs before any sourcing decision. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Represented vendors include Epic, Microsoft, Tableau, SAS, Amazon Web Services, Databricks, and an outsourced analytics managed services provider",
      "Vendors map to clinical, reporting, cloud, and analytics functions, with Epic tied to Clinical Platforms",
      "No contract terms, SLAs, renewal dates, or commercial economics are represented (11 duplicate vendor names present)",
    ],
    why_it_matters:
      "Sourcing and contract-optimization decisions require commercial evidence that is not yet present, so the vendor list is a scope map, not a negotiating position.",
    questions_supported: [
      "Meridian can use this dimension to decide which vendors are in scope for a sourcing review, though it cannot yet answer which contracts to renegotiate — no contract economics or SLA evidence is loaded.",
    ],
    current_caveats: [
      "No contract values, SLAs, renewal timing, or realized savings are represented; duplicate vendor names need reconciliation.",
    ],
    next_validation_actions: [
      "Gather contract terms, SLAs, renewal dates, and spend for each named vendor before any sourcing or optimization decision.",
    ],
    module_usage: [
      "Knowledge maps the vendor landscape and its evidence gaps",
      "Source drives sourcing scope and contract optimization once commercial evidence is added",
    ],
    data_tab_intro:
      "These records name Meridian's key clinical, cloud, and analytics vendors — note that no contract terms, SLAs, or spend are attached and some vendor names are duplicated.",
    relationships_tab_intro:
      "Vendor-to-system and vendor-to-contract relationships are not validated, so treat any link here as a candidate mapping.",
    gaps_tab_intro:
      "The biggest gap is the total absence of contract economics and SLAs — the evidence Source needs before optimization is possible.",
    evidence_tab_intro:
      "Vendor records are synthetic planning-grade names without commercial detail; use them to scope, not to negotiate.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-07_vendors_contracts-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:544571944fac64ad3b4d7d80db01c7f0018c23f6c0da99b25a2f249992642d3b",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "08_it_budget_spend_value",
    dimension_name: "IT Budget, Spend & Value",
    summary_title:
      "A technology budget signal exists, but value remains hypothesis",
    executive_summary:
      "Meridian carries a represented technology budget of roughly $1.28B and one named program — the Databricks AWS clinical + claims lakehouse foundation — with a $58M budget and $93M expected value. These are planning figures, not audited spend or realized savings. The distinction matters: expected value is a hypothesis until adoption, control evidence, and an accountable owner exist. Finance and the CDAO should baseline actual spend and outcomes before any value is claimed. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "A represented technology budget of approximately $1.28B is associated with the enterprise profile",
      "The Databricks AWS lakehouse foundation program carries a $58M budget and $93M expected value",
      "Value claims explicitly require adoption, control evidence, and an accountable operating owner",
    ],
    why_it_matters:
      "Budget and expected-value figures can frame the investment case but cannot be treated as realized value until baselines, adoption, and owners are proven.",
    questions_supported: [
      "Meridian can use the named lakehouse program's $58M budget and $93M expected value to frame a value hypothesis, but cannot claim realized ROI — no measured actuals or baselines are loaded.",
    ],
    current_caveats: [
      "Budget and expected-value figures are planning-grade; no audited spend, baselines, or realized savings are represented.",
    ],
    next_validation_actions: [
      "Have Finance and the CDAO baseline actual technology spend and outcome metrics before any value is framed as realized.",
    ],
    module_usage: [
      "Intelligence frames spend as an investment hypothesis",
      "Tower measures realized value only once baselines and actuals exist",
    ],
    data_tab_intro:
      "These records show a represented $1.28B technology budget and a named lakehouse program with budget and expected value — read expected value as a hypothesis, not a result.",
    relationships_tab_intro:
      "Spend-to-program and spend-to-outcome links are not validated, so treat the value chain here as unconfirmed.",
    gaps_tab_intro:
      "The biggest gap is the absence of audited actuals and baselines — without them expected value cannot become realized value.",
    evidence_tab_intro:
      "Budget figures are synthetic planning-grade signals; use them to frame investment, not to claim measured ROI.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-08_it_budget_spend_value-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:9272fbf02b444f65e4d56d4f2e96ecacde6a47ad855647369037af6237ec2923",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "09_programs_initiatives",
    dimension_name: "Programs & Initiatives",
    summary_title:
      "A portfolio of candidate moves plus one mobilizing foundation program",
    executive_summary:
      "Meridian's initiative portfolio spans a unified clinical + claims lakehouse, a governed AI/LLM data foundation, call center optimization, provider quality and performance, end-to-end cost transparency, payment integrity, and automated close — most flagged as candidate moves in P0/P1 evidence framing. Only the Databricks AWS lakehouse foundation is represented as mobilizing and on track. The distinction between candidate ideas and a mobilizing program is the transformation triage. Business sponsors and the CDAO should confirm evidence owners, baselines, and gate criteria before candidates advance. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Most initiatives — lakehouse, governed AI foundation, call center optimization, provider quality, cost transparency, payment integrity, automated close — are candidate moves in P0/P1 evidence framing",
      "Each candidate move needs confirmed evidence owner, baseline, gate criteria, and missing artifacts",
      "The Databricks AWS clinical + claims lakehouse foundation is represented as mobilizing and on track, sponsored by the Chief Data Officer",
    ],
    why_it_matters:
      "Separating candidate ideas from the one mobilizing foundation program lets leadership focus discovery effort where evidence and sequencing actually support execution.",
    questions_supported: [
      "Meridian can use this dimension to decide which initiatives are real transformation candidates versus ideas, based on their candidate-move status and dependency lists.",
    ],
    current_caveats: [
      "Most programs lack confirmed owners, baselines, and gate criteria; expected outcomes are marked baseline_required.",
    ],
    next_validation_actions: [
      "Have business sponsors and the CDAO confirm evidence owner, baseline, and gate criteria for each candidate move before it advances.",
    ],
    module_usage: [
      "Knowledge separates candidate ideas from mobilizing programs",
      "Moves converts selected programs into phase-gated execution once baselined",
    ],
    data_tab_intro:
      "These records list transformation initiatives with their scope, phase, and dependencies — note which are candidate moves versus the one mobilizing lakehouse foundation program.",
    relationships_tab_intro:
      "Program-to-system dependencies are listed but not validated, so treat them as candidate links pending workshop confirmation.",
    gaps_tab_intro:
      "The biggest gap is that most programs lack confirmed owners, baselines, and gate criteria — the difference between an idea and an executable move.",
    evidence_tab_intro:
      "Program records are synthetic planning-grade candidates; use them to triage the portfolio, not to assert active execution.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-09_programs_initiatives-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:75511800b1ebc52edd61656793253a7063de694394ccc0105a6d1afe8609aaf0",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "10_ai_automation_use_cases",
    dimension_name: "AI & Automation Use Cases",
    summary_title:
      "Agent Assist and adjacent use cases sit in discovery, awaiting data readiness",
    executive_summary:
      "Meridian's AI use cases — member service Agent Assist as one worked example, alongside prior authorization, coding, and utilization management automation — depend on the same governed clinical, claims, eligibility, and knowledge data the enterprise is still assembling. These are discovery-stage candidates, not production-ready deployments. What separates a ready use case from a hypothesis is validated data, integration, and control evidence. The CDAO and function owners should confirm which use cases have the data spine and governance to advance. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "AI use cases include member service Agent Assist plus prior authorization, coding, and utilization management automation",
      "All depend on governed clinical, claims, eligibility, knowledge base, and transcript data that is not yet validated",
      "Transcript and call-recording governance and PHI controls are not confirmed for any use case",
    ],
    why_it_matters:
      "Use cases are ready for discovery framing but cannot advance to design or production until their underlying data, integration, and control evidence is validated.",
    questions_supported: [
      "Meridian can use this dimension to decide which use cases are ready for discovery versus which need more evidence, based on whether their claims, eligibility, knowledge, and transcript governance is validated.",
    ],
    current_caveats: [
      "No use case has validated transcript/call-recording governance, PHI controls, or human-in-the-loop and audit controls confirmed.",
    ],
    next_validation_actions: [
      "Have the CDAO and function owners confirm data, integration, and control readiness — including transcript governance and PHI controls — before any use case moves beyond discovery.",
    ],
    module_usage: [
      "Knowledge shows use-case readiness against data and control gaps",
      "Intelligence reasons about which use cases to prioritize for discovery",
    ],
    data_tab_intro:
      "These records describe candidate AI use cases and their data dependencies — Agent Assist is one worked example among prior authorization, coding, and utilization management.",
    relationships_tab_intro:
      "Use-case-to-data and use-case-to-system links are not validated, so treat every dependency as a candidate hypothesis.",
    gaps_tab_intro:
      "The biggest gap is unvalidated transcript governance and PHI controls — the barrier between discovery framing and production approval.",
    evidence_tab_intro:
      "Use-case records are synthetic planning-grade candidates; use them for discovery framing, not production commitment.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-10_ai_automation_use_cases-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:bcc61a6811184902622b5389b69a886fe138f9feab44b76dc951f054298cf1c7",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "11_risks_controls",
    dimension_name: "Risks & Controls",
    summary_title: "High-severity foundation and governance risks are all open",
    executive_summary:
      "Meridian's risk register is dominated by high-severity, open controls tied to the data foundation: no certified medallion architecture, no patient/member identity spine, unproven claims and pharmacy harmonization, an AWS/Databricks foundation not ready, no formal data governance, no certified business layer, no AI audit trail evidence, and unloaded data quality rules. These are exactly the controls that must be governed before any production use, and none is yet closed. The control owners and CDAO should define evidence to close each risk in a governance workshop. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "High-severity open risks include no certified medallion architecture, no patient/member identity spine, and unproven claims/pharmacy harmonization",
      "Governance risks span no formal data governance, no certified business layer, no AI audit trail evidence, and data quality rules not yet evidenced",
      "Every control is marked open with evidence required to close, owned at the Operations level",
    ],
    why_it_matters:
      "These open, high-severity controls — including AI audit trail and PHI-relevant governance — must be closed before any AI use case can be approved for production.",
    questions_supported: [
      "Meridian can use this dimension to decide what must be governed before production use, based on the specific open, high-severity controls and their evidence-to-close requirements.",
    ],
    current_caveats: [
      "All represented controls are open; human-in-the-loop, audit controls, and PHI governance evidence are not yet provided.",
    ],
    next_validation_actions: [
      "Have control owners and the CDAO define and supply evidence to close each high-severity control — starting with identity spine, medallion, and AI audit trail — in a governance workshop.",
    ],
    module_usage: [
      "Knowledge surfaces the open control register and evidence needs",
      "Intelligence weighs risk exposure against use-case readiness",
    ],
    data_tab_intro:
      "These records list high-severity open controls across the data foundation and AI governance — each carries an explicit evidence-required-to-close note.",
    relationships_tab_intro:
      "Risk-to-program and risk-to-system links are not validated, so treat control coverage mappings as candidate, not confirmed.",
    gaps_tab_intro:
      "The biggest gap is that every foundation and governance control is still open — no production use can proceed until they close.",
    evidence_tab_intro:
      "Risk records are synthetic planning-grade entries; use them to plan a governance agenda, not to assert current control posture.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-11_risks_controls-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:73af9078996aea8f36b6a07e19cc0cab60ba6470e0e6ad084cf353a0ce26425a",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "12_relationships",
    dimension_name: "Relationships",
    summary_title: "Cross-domain relationships are not yet validated",
    executive_summary:
      "Meridian's context carries rich domain records but no validated cross-domain relationships — all 85 candidate relationship records were skipped as specific source gap. The connective links between systems, data, programs, and risks are not yet confirmed. This matters because decision-grade reasoning depends on trusted links, such as which systems feed which data products and which risks block which programs. The CDAO should prioritize validating these relationships in a workshop. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "No validated relationships are present; all candidate relationship records were skipped as specific source gap",
      "Relationship coverage is reported at zero across the context",
      "Domain records exist but the links between them are not yet confirmed",
    ],
    why_it_matters:
      "Without validated links between systems, data, programs, and risks, cross-domain dependencies cannot be trusted for decision-making.",
    questions_supported: [
      "This dimension cannot yet inform any cross-domain dependency decision — no validated relationships are loaded.",
    ],
    current_caveats: [
      "Relationship coverage is zero; treat every implied link between domains as a hypothesis, not a confirmed dependency.",
    ],
    next_validation_actions: [
      "Have the CDAO prioritize validating key system-to-data, program-to-dependency, and risk-to-program relationships in a discovery workshop.",
    ],
    module_usage: [
      "Knowledge flags the relationship layer as the priority gap",
      "Intelligence cannot reason across domains until links are validated",
    ],
    data_tab_intro:
      "No validated relationship records exist here; the candidate links were skipped for missing evidence.",
    relationships_tab_intro:
      "Cross-domain relationships are not yet validated, so treat any link across systems, data, programs, or risks as a hypothesis, not a confirmed dependency.",
    gaps_tab_intro:
      "The single biggest gap is that relationship coverage is zero — validating links is the highest-leverage next step for cross-domain reasoning.",
    evidence_tab_intro:
      "There is no relationship evidence in this pack; cross-domain dependencies must be established in workshop before they can be trusted.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-12_relationships-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:861a4c4319eed36ce1f26742c26d442d82a977539da217f52ce0e37f7c94c007",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "13_evidence_sources",
    dimension_name: "Evidence Sources",
    summary_title:
      "All context traces to a synthetic, PHI-free planning-grade pack",
    executive_summary:
      "Meridian's entire context traces to a repo-generated current-state pack classified as synthetic, PHI-free, and planning-grade, manifest-gated for loading. It is explicitly not real production data, and it carries documented known gaps around medallion, governance, and platform foundation. That provenance defines how the context can be used: strong enough for discovery and framing, insufficient for production approval or realized-value claims. The organization should replace it with client evidence answer material during discovery. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "All records trace to a repo-generated current-state pack classified synthetic_demo_phi_free_planning_grade",
      "The source is manifest-gated for loading and dated 2026-07-09",
      "Documented known gaps cover medallion certification, governance operating model, and platform foundation",
    ],
    why_it_matters:
      "Because every record is synthetic planning-grade, the context is safe for discovery and framing but not sufficient for production approval or realized-value claims.",
    questions_supported: [
      "Meridian can use this dimension to confirm what kind of evidence backs its context — synthetic planning-grade — and therefore what claims are and are not defensible.",
    ],
    current_caveats: [
      "No client production evidence, PHI-bearing data, or audited artifacts are present; the pack is synthetic and planning-grade only.",
    ],
    next_validation_actions: [
      "Replace synthetic records with client-provided evidence answer material, per domain, during the discovery phase.",
    ],
    module_usage: [
      "Knowledge documents provenance and evidence boundaries",
      "Source and Tower require stronger evidence before commercial or value claims",
    ],
    data_tab_intro:
      "These records identify the synthetic, PHI-free, manifest-gated current-state pack behind all context — note the documented known-gaps list.",
    relationships_tab_intro:
      "Evidence-source relationships are marked missing, so provenance links are described, not validated.",
    gaps_tab_intro:
      "The defining boundary is that all evidence is synthetic planning-grade — closing it means substituting real client evidence.",
    evidence_tab_intro:
      "This is the provenance record itself: a synthetic planning-grade pack suitable for discovery framing, not production or value claims.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-13_evidence_sources-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:6c0f2919c630c6ba9f1c488677c35c111c7233b82f3162329470e23d3fe9100b",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "14_metrics_outcomes",
    dimension_name: "Metrics & Outcomes",
    summary_title:
      "Metrics are defined, but no baselines exist to measure value",
    executive_summary:
      "Meridian's metrics define what should be measured — analytics maintenance share versus net-new capacity, medallion certification status, governance operating model status, and baseline readiness for each candidate program. But these are definitions and readiness checks, not baselined actuals, and every owner is a synthetic data steward. Before Tower can claim value, each metric needs a real baseline and accountable owner. Finance, the CDAO, and program sponsors should baseline these metrics in discovery. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Metrics include analytics maintenance share, net-new analytics capacity share, medallion certification status, and governance operating model status",
      "Program-level baseline-readiness metrics exist for lakehouse, governed AI foundation, call center optimization, and provider quality",
      "All metrics are owned by a synthetic data steward with no baselined actuals",
    ],
    why_it_matters:
      "Value realization requires baselined metrics with accountable owners, and today only definitions and readiness checks exist — no actuals to measure against.",
    questions_supported: [
      "Meridian can use this dimension to decide which metrics must be baselined before value can be claimed, based on the defined-but-unbaselined metric set.",
    ],
    current_caveats: [
      "No baselined actuals or accountable business owners exist; metrics are definitions and readiness checks only.",
    ],
    next_validation_actions: [
      "Have Finance, the CDAO, and program sponsors establish real baselines and named owners for each metric before Tower attributes any value.",
    ],
    module_usage: [
      "Knowledge shows which metrics are defined versus baselined",
      "Tower claims realized value only once baselines and owners exist",
    ],
    data_tab_intro:
      "These records define what Meridian intends to measure — capacity, certification, governance, and program readiness — but carry no baselined actuals.",
    relationships_tab_intro:
      "Metric-to-program and metric-to-outcome links are not validated, so treat the measurement chain as unconfirmed.",
    gaps_tab_intro:
      "The biggest gap is the absence of baselines and named owners — the prerequisite for any value claim.",
    evidence_tab_intro:
      "Metric records are synthetic planning-grade definitions; use them to plan measurement, not to assert results.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-14_metrics_outcomes-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:26c808fe0fda71bfcde432574d73b02ee30bbce8dc55c9eaf9d925cd8875ddfd",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "15_industry_context_patterns",
    dimension_name: "Industry Context & Patterns",
    summary_title:
      "A recognizable integrated-delivery-and-payer transformation pattern",
    executive_summary:
      "Meridian reflects a familiar healthcare pattern: an integrated delivery network with health-plan complexity, running Epic for clinical care and legacy marts for analytics, aspiring toward a governed cloud lakehouse. Its challenges — fragmented reporting, no identity spine, unproven data governance — are characteristic of the sector, not unique failures. Recognizing the pattern helps leadership benchmark sequencing: foundation and governance before AI at scale. No dedicated industry-benchmark records are loaded, so comparisons should be validated against client peers in discovery. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Meridian fits an integrated-delivery-network-plus-payer profile with Kaiser/Humana-style payer complexity",
      "Its Epic-plus-legacy-marts estate and cloud-lakehouse aspiration are common healthcare modernization patterns",
      "No dedicated industry-benchmark or peer-comparison records are represented in this context",
    ],
    why_it_matters:
      "Recognizing the sector pattern lets leadership sequence transformation the way peers do — foundation and governance before scaled AI — rather than treating each gap as unique.",
    questions_supported: [
      "Meridian can use this dimension to frame its transformation against a recognizable healthcare pattern, though it cannot cite peer benchmarks — no benchmark records are loaded.",
    ],
    current_caveats: [
      "No industry-benchmark or peer-comparison evidence is represented; pattern framing is qualitative only.",
    ],
    next_validation_actions: [
      "Validate the pattern and sequencing against named client peers or benchmarks during discovery.",
    ],
    module_usage: [
      "Knowledge frames the sector pattern qualitatively",
      "Intelligence uses the pattern to inform sequencing options",
    ],
    data_tab_intro:
      "There are no dedicated benchmark records here; the industry pattern is inferred from Meridian's profile and estate.",
    relationships_tab_intro:
      "No validated relationships link this dimension to peer data, so pattern framing is qualitative, not evidenced.",
    gaps_tab_intro:
      "The gap is the absence of any peer-benchmark evidence — needed before comparative claims can be made.",
    evidence_tab_intro:
      "Industry framing is qualitative inference from synthetic context, not backed by benchmark data.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-15_industry_context_patterns-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:748f2dae54a85aa34fa4837f2b590376af34a336bff73461a2563d7447c7ae35",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "16_expert_lenses",
    dimension_name: "Expert Lenses",
    summary_title:
      "Advisory lenses apply, but no dedicated lens evidence is loaded",
    executive_summary:
      "Meridian's context supports several expert lenses — data governance, cloud platform, health-plan operations, clinical informatics, and value realization — because the underlying domain records touch all of them. But no dedicated expert-lens records are represented; the lenses are analytical viewpoints, not yet evidenced evidence. Applying these lenses helps structure discovery: governance and platform experts should shape the foundation, operations and clinical experts the use cases. The workshop stakeholders should confirm which lenses lead each decision. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Domain records support data governance, cloud platform, health-plan operations, clinical informatics, and value-realization lenses",
      "No dedicated expert-lens records are represented in this context",
      "Lenses are analytical viewpoints derived from other domains, not standalone evidence",
    ],
    why_it_matters:
      "Applying the right expert lens to each decision — governance to the foundation, clinical to use cases — structures discovery, but the lenses are viewpoints, not yet evidenced facts.",
    questions_supported: [
      "Meridian can use this dimension to decide which advisory lenses should lead each transformation decision, drawn from the domains actually represented.",
    ],
    current_caveats: [
      "No standalone expert-lens evidence is loaded; lenses are derived viewpoints, not independent records.",
    ],
    next_validation_actions: [
      "Have workshop stakeholders confirm which expert lens owns each foundation, governance, and use-case decision during discovery.",
    ],
    module_usage: [
      "Knowledge frames applicable expert viewpoints",
      "Intelligence applies lenses to structure options",
    ],
    data_tab_intro:
      "No dedicated expert-lens records exist; the lenses shown are viewpoints inferred from other domains.",
    relationships_tab_intro:
      "There are no validated lens relationships, so lens-to-decision mappings are analytical, not evidenced.",
    gaps_tab_intro:
      "The gap is that lenses are derived, not loaded — assigning lens ownership is a discovery task.",
    evidence_tab_intro:
      "Expert lenses are analytical framing over synthetic context, not standalone evidence records.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-16_expert_lenses-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:11015fe200764bb51304aa5a6b94178b695560c8d996004c9603965e6856be04",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "17_managed_services_scope",
    dimension_name: "Managed Services Scope",
    summary_title:
      "An outsourced analytics provider is named, without scope terms",
    executive_summary:
      "Meridian's context names an outsourced analytics managed services provider among its vendors, indicating that some analytics delivery is already externally supported. But no managed-services scope, SLAs, service boundaries, or commercial terms are represented. This matters because managed-services scope shapes both cost and where accountability sits for the data foundation. The organization should capture scope, SLAs, and boundaries before any sourcing or operating-model decision. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "An outsourced analytics managed services provider is represented among the vendor set",
      "No managed-services scope, SLAs, service boundaries, or commercial terms are represented",
      "Managed-services accountability for analytics delivery is implied but not detailed",
    ],
    why_it_matters:
      "Managed-services scope determines cost and where accountability for analytics delivery sits, and none of that detail is yet evidenced.",
    questions_supported: [
      "Meridian can use this dimension to note that analytics managed services exist, but cannot yet answer what is in scope — no service-boundary or SLA evidence is loaded.",
    ],
    current_caveats: [
      "No managed-services scope, SLA, or commercial-term evidence is represented for the analytics provider.",
    ],
    next_validation_actions: [
      "Capture managed-services scope, SLAs, and service boundaries for the analytics provider before any sourcing or operating-model decision.",
    ],
    module_usage: [
      "Knowledge flags the managed-services relationship and its evidence gap",
      "Source scopes managed-services optimization once terms are added",
    ],
    data_tab_intro:
      "The only managed-services signal here is a named analytics provider; no scope, SLA, or service-boundary detail is attached.",
    relationships_tab_intro:
      "No validated managed-services relationships exist, so the provider's role is implied, not confirmed.",
    gaps_tab_intro:
      "The gap is the absence of any scope or SLA detail — needed before sourcing or accountability decisions.",
    evidence_tab_intro:
      "Managed-services context is a synthetic vendor mention only; treat scope as an open discovery item.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-17_managed_services_scope-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:9a5bb0f72965fd70364d0e42f660c03ac7ae4a8da1a9343aba3f81758558c1e7",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
  {
    dimension_key: "18_operational_process_evidence",
    dimension_name: "Operational Process Evidence",
    summary_title:
      "Process capabilities are described, but operational evidence is thin",
    executive_summary:
      "Meridian's operational processes are visible only through function capabilities — prior authorization, utilization management, claims operations, call handling, next-best-action workflows, and close automation. There is no process-level evidence: no volumes, cycle times, handoffs, or workflow documentation. This matters because AI and automation value depends on the actual shape of these processes, not just their names. The function owners should capture operational process evidence in discovery before automation is scoped. This is planning-grade synthetic context for demonstration, not client production evidence.",
    what_nexus_knows: [
      "Processes are implied by function capabilities such as prior authorization, claims operations, call handling, and close automation",
      "No process volumes, cycle times, handoffs, or workflow documentation is represented",
      "Analytics operations are described only at the maintenance-versus-net-new capacity level",
    ],
    why_it_matters:
      "Automation value depends on the real shape of processes — volumes, cycle times, handoffs — and only capability names are evidenced today.",
    questions_supported: [
      "This dimension can identify which processes are candidates for automation by capability, but cannot yet size the opportunity — no process volume or cycle-time evidence is loaded.",
    ],
    current_caveats: [
      "No operational process metrics, workflow documentation, or handoff evidence is represented.",
    ],
    next_validation_actions: [
      "Have function owners capture process volumes, cycle times, and workflow documentation for automation-candidate processes during discovery.",
    ],
    module_usage: [
      "Knowledge maps processes by capability and flags the evidence gap",
      "Moves scopes automation once process evidence is captured",
    ],
    data_tab_intro:
      "Process detail here is limited to function capability names; no volumes, cycle times, or workflow documentation are present.",
    relationships_tab_intro:
      "No validated process relationships exist, so process-to-system and process-to-use-case links are inference only.",
    gaps_tab_intro:
      "The biggest gap is the absence of operational process metrics — needed to size any automation opportunity.",
    evidence_tab_intro:
      "Process evidence is synthetic and capability-level only; treat volumes and cycle times as open discovery items.",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_demo_claims: [
      "This is synthetic Meridian-style demo context, not real Meridian production data.",
      "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
      "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
      "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
    ],
    do_not_claim: [
      "Do not claim real Meridian production data was loaded.",
      "Do not claim AWS or Databricks is certified current production for this tenant.",
      "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
      "Do not claim PHI-bearing transcripts have been ingested or approved.",
      "Do not treat candidate or generated graph rows as approved active tenant truth.",
    ],
    evidence_refs_used: [
      "meridian-enterprise-profile",
      "meridian-member-service-context",
      "meridian-current-analytics-estate",
      "meridian-agent-assist-use-case",
      "meridian-risk-control-context",
      "meridian-metrics-baseline-context",
    ],
    source_fact_ids_used: [
      "fact-18_operational_process_evidence-meridian",
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
    context_gap_ids_used: ["gap-validation-needed"],
    source_context_hash:
      "sha256:6c5ac65037101304ffda91cf2797bb044ee8b86643f7383abb2d4bce4cf6e212",
    generated_by: "claude",
    generated_model: "claude-opus-4-8",
    generated_at: "2026-07-16T13:50:14.269Z",
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  },
] satisfies KnowledgeDimensionNarrativeSummary[];
