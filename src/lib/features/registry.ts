// Feature-flag registry · A3 (backlog 2026-05-14)
//
// Canonical contract for what ships to all tenants vs what's pinned per
// client. Avoids the "rolling a feature to one pilot tenant first" branch
// hell that ad-hoc tenant gates produce.
//
// Two flag policies:
//
//   - `platform` — default ON for every tenant. The norm. Most features
//     ship this way. Tenants can be excluded individually via the
//     `excludeTenants` allowlist for staged rollback.
//
//   - `tenant`   — default OFF for every tenant. Opt-in per tenant via
//     the `includeTenants` allowlist. Use for tenant-bespoke pilots,
//     beta-tester previews, or staged rollouts that start with one.
//
// The flag set is intentionally static (not a remote feature-flag
// service) for the pilot phase. When we outgrow this — most likely
// when the second paid pilot needs different on/off configurations —
// swap the body of `isFeatureEnabled` for a remote lookup against
// Statsig, LaunchDarkly, or Configcat. The signature stays.
//
// References:
//   - docs/BACKLOG-2026-05-14.md  A3 row
//   - src/lib/auth/tenancy.ts     TenancyCtx
//   - src/lib/client-config.ts    ClientKey

import type { ClientKey } from "@/lib/client-config";

/**
 * Two flag policies. See file-header comment.
 */
export type FeatureFlagPolicy = "platform" | "tenant";

export interface FeatureFlagDefinition {
  /** Stable identifier. Snake-case. Used at every call site. */
  readonly key: FeatureFlagKey;
  /** Short human-readable summary. Surfaced in any future flag-UI. */
  readonly summary: string;
  /** Default-on (platform) or default-off (tenant). See header. */
  readonly policy: FeatureFlagPolicy;
  /**
   * Platform flags: tenants explicitly *excluded* from the rollout. Use to
   * stage a rollback for one tenant without flipping the global default.
   */
  readonly excludeTenants?: ReadonlyArray<ClientKey>;
  /**
   * Tenant flags: tenants explicitly *included* in the rollout. The
   * default for everyone else is off.
   */
  readonly includeTenants?: ReadonlyArray<ClientKey>;
}

/**
 * Canonical set of feature keys. Extend here when adding a new flag.
 * Using a literal union (rather than `string`) so every call site is
 * compile-time-checked.
 */
export type FeatureFlagKey =
  // Reserved for the first real feature gates. Keep at least one
  // platform-default and one tenant-default entry so the policy
  // distinction is exercised in tests.
  | "intelligence_brief_v4"
  | "first_capital_substrate_overlay"
  | "retrieval_azure_search"
  | "scb_shared_engine_home"
  | "scb_shared_engine_intelligence"
  | "scb_shared_engine_source"
  | "scb_shared_engine_moves"
  | "scb_shared_engine_tower"
  | "graph_neo4j_enabled"
  | "tower_synthesis_apex_demo_fixture"
  | "discovery_intake_v2"
  | "moves_orchestrated_deliverables"
  | "moves_workforce_economics"
  | "moves_decision_storytelling"
  | "workspace_explorer_source"
  | "workspace_explorer_moves"
  | "source_simple_front"
  | "source_strategy_auto_draft"
  | "source_strategy_at_p0"
  | "source_analytics"
  | "context_corpus_explorer_enabled"
  | "source_reasoning_spine"
  | "home_know_llm_synthesis"
  | "home_know_claude_synthesis"
  | "deliverable_structured_exhibits"
  | "deliverable_quality_contract"
  | "intelligence_companion_canvas"
  | "tower_cxo_claude_story_blocks"
  | "moves_phase_workspace_v2"
  | "moves_pattern_assembly"
  | "moves_ava_chat_hardening"
  | "moves_finder_shell_v1"
  | "moves_approvals_overview_v1"
  | "tower_command_center_v2"
  | "moves_pricing_engine"
  | "moves_governed_roadmap_downloads"
  | "home_knowledge_vnext"
  | "moves_extended_intake_fields_v1"
  | "moves_classify_fast_lane_v1"
  | "moves_risk_tier_scoring_v1"
  | "moves_solution_pattern_gate_v1";

export const FEATURE_FLAGS: ReadonlyArray<FeatureFlagDefinition> = [
  {
    key: "moves_governed_roadmap_downloads",
    summary:
      "2026-07-25: The P4 execution roadmap emits a governed structured-output block (validated + prose⇄structure consistency-checked), which is turned into ONE RoadmapPresentationContract and persisted with an immutable synchronization record (content hash, contract/schema/renderer versions, lineage, run id, supersession). Editable PPTX, editable DOCX and an HTML preview are then served from the SAME persisted contract via the governed download route — never regenerated independently — with tenant-scoped, non-enumerating refusals and restricted contract/provenance access. When off, roadmap generation and existing downloads behave byte-for-byte as before. Tenant opt-in; default off; Meridian first. Env: ABARVA_FEATURE_MOVES_GOVERNED_ROADMAP_DOWNLOADS_TENANTS.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "tower_cxo_claude_story_blocks",
    summary:
      "Tower CXO story blocks: uses audited Claude to synthesize the executive story and visual-spec contract from the deterministic TowerContextPack. AbarVa still owns facts, values, claim gates, and rendering; Claude only writes validated CIO/CFO business wording and exhibit intent. Tenant opt-in; Meridian first. Env allowlist: ABARVA_FEATURE_TOWER_CXO_CLAUDE_STORY_BLOCKS_TENANTS.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_ava_chat_hardening",
    summary:
      "2026-09-05: Nexus/aVa chat inside Moves phase workspaces is grounded by a deterministic MovesAvaChatPacket (checklist, gate criteria, evidence gaps, feed-forward, approved-inputs-pack presence, Source/Tower keyword awareness) instead of a blank prompt, and every answer is post-hoc scanned for banned language (Claude-deflection, internal-ID leaks, workflow-bypass claims). Phase-grounded and workflow-safe by design: Moves aVa never approves or advances a gate, never claims a promotion happened, and stays narrower than Intelligence. Promoted to platform default after module-contract/routing guard verification; use excludeTenants only for emergency rollback. Env: ABARVA_FEATURE_MOVES_AVA_CHAT_HARDENING_TENANTS.",
    policy: "platform",
    excludeTenants: [],
  },
  {
    key: "moves_pattern_assembly",
    summary:
      "Moves phase workspace: AbarVa assembles candidate solution options/tradeoffs/risks via Claude (audited egress) from a governed packet, then validates each item (evidence_backed / needs_confirmation / not_allowed). Claude never invents baselines, value, evidence, readiness, or approvals — the validator labels any unbacked number needs_confirmation and any overreach not_allowed; on error it falls back to the deterministic feed-forward. Requires moves_phase_workspace_v2 + ANTHROPIC_API_KEY. Tenant opt-in; default off. Lakeshore proved first (2026-07-08); SkyHarbor added 2026-07-08 for cross-tenant proof (not overfit to Lakeshore's Legal Contract Intake use case). Env: ABARVA_FEATURE_MOVES_PATTERN_ASSEMBLY_TENANTS.",
    policy: "tenant",
    includeTenants: ["lakeshore", "skyharbor"],
  },
  {
    key: "moves_finder_shell_v1",
    summary:
      "2026-07-20: Finder-style visual rebuild of the Moves phase-workspace rail (MovePhaseExplorer) — grouped icon rail (Phases group, then Workspace group), collapse/expand to an icon-only rail, a soft-blue selection tint on the active row, connector-line tree styling, an amber 'AI-draft not yet final' dot on phase rows with a pending authoritative draft, and an amber blocked-reason subtitle under a blocked phase row. Purely presentational chrome — binds only to the same phase-tally/gate props the current rail already receives; no new data fetching, no schema or API changes. When off, the rail renders byte-for-byte identical to the existing MovePhaseExplorer. Cross-tenant proof: Lakeshore, SkyHarbor, Meridian, First Capital all live-verified 2026-07-21 (rail, two-column Steps, collapse toggle, Origination visual pass) with zero regressions. Promoted to default-on for all tenants 2026-07-21 (owner: 'I need to see the new shell') — legacy MovePhaseExplorerLegacy/flag-off branches kept as the rollback path for a ~1-week soak before removal. Env: ABARVA_FEATURE_MOVES_FINDER_SHELL_V1_TENANTS (now an exclude-list if ever needed).",
    policy: "platform",
    excludeTenants: [],
  },
  {
    key: "moves_approvals_overview_v1",
    summary:
      "2026-07-21: cross-phase Approvals overview inside the Moves phase workspace (MovesPhaseStandaloneClient) — a read-only list, one row per phase, built entirely from the existing getMovePhaseTallies() output (met/total gate criteria, done/current/upcoming state) already threaded through the component as the phaseTallies prop. Approver column is a static 'Sponsor' label (the current constant GATE_RULES approverRole in governance.ts) — no per-role rows, no requires_revalidation state, no new fetch or API route. 'Review & approve' reuses the existing per-phase navigation (the rail's phase Link hrefs, or the local substep jump for the phase already open). Gates the rail's 'Approvals' link: when off, that link behaves byte-for-byte as before (jumps straight to the current phase's approve substep); when on, it opens this overview instead. Closes out MOVES-UI-001 Phase 5 (MOVES-UI-002). Cross-tenant proof: Lakeshore, SkyHarbor, Meridian, First Capital all live-verified 2026-07-21. Promoted to default-on for all tenants 2026-07-21, same rationale as moves_finder_shell_v1. Env: ABARVA_FEATURE_MOVES_APPROVALS_OVERVIEW_V1_TENANTS (now an exclude-list if ever needed).",
    policy: "platform",
    excludeTenants: [],
  },
  {
    key: "tower_command_center_v2",
    summary:
      "2026-07-23: the rebuilt Tower Command Center — a density and interaction rebuild of the six Tower tabs (Command Center, Value Proof, Decision Lanes, AI Portfolio, Evidence, Recommended Actions) against the approved design at docs/design/tower/command-center-2026-07-23/tower-command-center-design.html. /tower is now the Command Center for the product; the previous Tower surface is no longer a runtime fallback, and /tower/legacy redirects to /tower. /tower/command remains a permanent alias that redirects to /tower. Every string and number is read from the governed cio_tower.mart_* read models via loadTowerMartCommandView(); the design file's banking mock dataset ships only as a typed test fixture. Five presentation fields the mart does not persist yet (usage-supported, claimable, blocked, evidence maturity, proof level) are derived in src/lib/tower/command-center/derive.ts and unit-tested — Tower read models own every value; Claude calculates nothing here. Command Center aVa is mounted through the governed Tower chat path and was demo-tenant live-proven on 2026-07-23. Dense AI portfolio handling: bubble matrices show only the top 10 initiatives for the current filter while preserving the full filtered list and total counts; candidate pipeline also caps at top 10. ROLLBACK: revert the Tower Command Center release via PR/ACA deploy; do not expose the retired Tower page as a flag-off product fallback.",
    policy: "platform",
    excludeTenants: [],
  },
  {
    key: "moves_phase_workspace_v2",
    summary:
      "Adds the phase-workspace guidance panel to every Moves phase page: for the current phase, a catalog-driven 'How to complete this phase' + 'Sessions and templates for this phase' pair (from the governed phase-template catalog, keyed on the phase). Purely additive and presentational. Move-scoped data only; no fabricated numbers. Promoted to platform default after Lakeshore and SkyHarbor proof (2026-07-10); use excludeTenants only for emergency rollback.",
    policy: "platform",
  },
  {
    key: "intelligence_companion_canvas",
    summary:
      "[Superseded by the v2 reconcile — kept OFF] Earlier answer-only-streaming + v3 SentinelChat companion-canvas experiment. It stripped the right-canvas tabs, which conflicts with the live IntelligenceV2Surface (which parses the canvas out of those tabs). The shipped reconcile instead enriches v2's existing canvas via the tabbed-response DATA RICHNESS mandate. Leave OFF (includeTenants empty) until true-streaming is re-scoped to keep the tabs. Env: ABARVA_FEATURE_INTELLIGENCE_COMPANION_CANVAS_ENABLED_TENANTS.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "home_know_claude_synthesis",
    summary:
      "Optional consultant-grade Claude text synthesis for Home KNOW dimension dossiers. AbarVa still builds the bounded dossier, artifacts, citations, gaps, and tenant fence; Claude only writes the user-facing prose and deterministic composer remains the fallback. Env controls: HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED, HOME_KNOW_CLAUDE_OUTPUT_MODE=text, HOME_KNOW_CLAUDE_MODEL, HOME_KNOW_CLAUDE_TIMEOUT_MS, HOME_KNOW_CLAUDE_MAX_TOKENS.",
    policy: "tenant",
    includeTenants: ["skyharbor", "lakeshore"],
  },
  {
    key: "home_know_llm_synthesis",
    summary:
      "Phrase-only Claude Opus synthesis for Home KNOW prose. Retrieval, facts, gaps, tables, charts, citations, and contracts stay deterministic; the LLM only rewrites the lead prose from supplied facts/gaps and falls back to templates on validation failure. Tenant opt-in; SkyHarbor only for proof. Env allowlist: ABARVA_FEATURE_HOME_KNOW_LLM_SYNTHESIS_TENANTS.",
    policy: "tenant",
    includeTenants: ["skyharbor"],
  },
  {
    key: "deliverable_structured_exhibits",
    summary:
      "Generate the structured exhibit models (ArchitectureModel) for architecture deliverables via the governed generation pass, and render the profile's renderer (premium HTML architecture) instead of prose. Default OFF; tenant opt-in. Falls back to prose on any error. Same governed pipeline for every tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "deliverable_quality_contract",
    summary:
      "Enforce the Deliverable Quality Contract at persistence: a non-client_ready artifact is quarantined as an internal draft rather than served as client-ready. Default OFF (observe-only — the gate always runs and records the state); flip per tenant to enforce, then platform-default once proven.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "context_corpus_explorer_enabled",
    summary:
      "Replaces the /intelligence page with the Context & Corpus Explorer S1 shell: Sentinel rail + 5 tabs (Insights, Explore, Change Log, Coverage & Trust, Corpus). Default OFF — V3 page remains for all tenants until flag is set. Tenant opt-in via includeTenants or ABARVA_FEATURE_CONTEXT_CORPUS_EXPLORER_ENABLED_TENANTS env var.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_simple_front",
    summary:
      "Enables the Source Start Here simple front: one calm per-stage screen with up to three evidence asks, one write-document action, and one next-step line. Tenant opt-in; First Capital/FS Demo is enrolled after live shell parity review.",
    policy: "tenant",
    includeTenants: ["arcturus"],
  },
  {
    key: "workspace_explorer_source",
    summary:
      "Enables the Source Workspace Explorer surfacing layer: a read-only file/deliverable explorer over existing Source artifact and canvas substrate rows. Tenant opt-in; First Capital/FS Demo is enrolled with the Source simple front.",
    policy: "tenant",
    includeTenants: ["arcturus"],
  },
  {
    key: "workspace_explorer_moves",
    summary:
      "Enables the Moves Workspace Explorer surfacing layer over program attachments, generated artifacts, and deliverables for all tenants. This is read-only/governed surfacing over existing Move data; it does not archive or migrate old Moves. Promoted to platform default after Lakeshore and SkyHarbor proof (2026-07-10); use excludeTenants only for emergency rollback.",
    policy: "platform",
  },
  {
    key: "source_strategy_auto_draft",
    summary:
      "On entering the Strategy stage with no strategy memo yet, auto-runs the governed Draft-with-Sentinel generation once (so the memo appears from the validated P0 facts without a manual click). Reuses the proven, persisted, gap-flagged generation path; the human still confirms archetype/value and the sponsor still endorses. Tenant opt-in; default off so the manual draft stays the norm until proven per tenant. Lakeshore enrolled 2026-07-06 for live proof of the strategy-stage kill.",
    policy: "tenant",
    includeTenants: ["lakeshore"],
  },
  {
    key: "source_strategy_at_p0",
    summary:
      "Folds Strategy into P0 origination: on intake approval the event advances straight to Scope and the three GATE-STRATEGY criteria are waived with an audit reason (the strategy is set and endorsed at the P0 approval, which the sponsor co-signs). The Strategy stage is shown done on the rail rather than presented as a separate to-do page. Tenant opt-in; default off so the standard Strategy stage remains the norm until proven per tenant. Lakeshore enrolled 2026-07-06 for live proof of the strategy-stage kill.",
    policy: "tenant",
    includeTenants: ["lakeshore"],
  },
  {
    key: "source_analytics",
    summary:
      "Master switch for the Source value-analytics layer — the deterministic fact model (source_event_facts) → value-lever evaluators → value-type waterfall, and the intelligence surfaced on the stage canvas. Platform default ON as of 2026-07-19: every resolved Source tenant renders the redesigned analytics shell/home instead of the retired universal canvas, with honestly-marked sample/model intelligence where live facts are still incomplete. Use excludeTenants only for emergency rollback.",
    policy: "platform",
  },
  {
    key: "moves_orchestrated_deliverables",
    summary:
      "Author Move board-grade deliverables through the Deliverable Intelligence Orchestrator (governed multi-pass Claude authoring) instead of the deterministic template renderer. Quality/plan gates enforced; falls back to the deterministic deck when the gate blocks. SkyHarbor proved first for live board-grade validation; Lakeshore added 2026-07-08 for cross-tenant proof (not overfit to SkyHarbor's use case). Other tenants remain opt-in.",
    policy: "tenant",
    includeTenants: ["skyharbor", "lakeshore"],
  },
  {
    key: "moves_workforce_economics",
    summary:
      "Attach the Workforce Economics 'estimate-twice' view (traditional people-only vs AI-native people+agents, with the cost/timeline/headcount delta and the productivity gain) to the Move board-grade Costed Business-Case Pack. The estimate-twice is DERIVED from the kernel's own effort skeleton (headcount × duration × rate-card), so the traditional figure reconciles to the kernel investment — no parallel estimate path. Default OFF; tenant opt-in. Flag off = byte-identical (the engine is not called and no workforce field is attached). Honesty discipline preserved: planning ranges, conservative agent-capacity haircut, NOT a quote. Lakeshore enrolled 2026-07-08 for first live proof (phase workspace already strong there). Env allowlist: ABARVA_FEATURE_MOVES_WORKFORCE_ECONOMICS_TENANTS.",
    policy: "tenant",
    includeTenants: ["lakeshore"],
  },
  {
    key: "moves_decision_storytelling",
    summary:
      "Render Move deliverables as an exhibit-led executive deck (decision-storytelling pipeline: MoveDecisionModel → Story Director → Visual Director → deck) from the SAME governed generation, instead of the prose HTML. Falls back to prose on any error. Tenant opt-in; default off until live-proven per tenant. Lakeshore enrolled 2026-07-08 for first live proof. Env allowlist: ABARVA_FEATURE_MOVES_DECISION_STORYTELLING_TENANTS.",
    policy: "tenant",
    includeTenants: ["lakeshore"],
  },
  {
    key: "discovery_intake_v2",
    summary:
      "Discovery Intake — persist DiscoveryShape (P0 Originate) and DiscoveryPlan (P1 Charter) to engagements.charter JSONB and wire the enhanced capture. Tenant opt-in; default off for staged rollout.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_extended_intake_fields_v1",
    summary:
      "P0 Originate: add Business Segment, Front/Middle/Back Office lens, Care Type, a quant/qual value-hypothesis split, a Complexity Tier tag, and a Stakeholders field to the intake scaffold, mirroring a client's grounded-fact intake model (segment = the tenant's real org structure; office lens, care type, and tier are analytical, not org-chart facts). Persisted via the same charter-JSONB seam as discovery_intake_v2, not via P0_CAPTURE_SECTIONS, so it never touches gate evaluation or the P1+ phase workspace for tenants without the flag. Tenant opt-in; default off. Flag off = byte-identical P0 (same 10 fields, same step count).",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_classify_fast_lane_v1",
    summary:
      "Governance: lets a Move tagged complexity tier 'straightforward' (captured via moves_extended_intake_fields_v1) advance directly from P1 Charter to P5 Mobilize & Handoff, skipping P2 Discover/P3 Design/P4 Business Case, via a single named-owner decision gate. Deliberately a SEPARATE flag from moves_extended_intake_fields_v1 — a tenant can capture the tier tag without the gate engine acting on it. Off by default; off = findGateRule(1,5) still returns null exactly as before, so every other transition and every other tenant is byte-identical. On only changes behavior for a Move that is BOTH tagged 'straightforward' AND whose tenant has this flag — every other (fromPhase,toPhase) pair is unaffected regardless.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_risk_tier_scoring_v1",
    summary:
      "Adds a 'Risk Assessment' workspace entry point to P2 Discover & Diagnose AND P3 Design Future State (same pattern as moves_pricing_engine's P4 'Cost & Effort' entry point — a new top-level rail view, not a change to the shared phase-capture flow). Captures the D1-D5 structural-risk dimensions and E1-E8 usage escalators, scores them via the additive risk-tiering model (dimension 5-20 + escalator 0-4 each -> Unknown/Low/Moderate/High/Critical band), and surfaces the Governance Council routing signal (any escalator triggered routes regardless of numeric band). Available on both P2 (starts) and P3 (finalize, once Build Origin/Integration Impact/Human Oversight are actually decided by the solution design) per the target model's own framing. Persisted via an isolated charter-JSONB seam, not phase-capture-contract.ts, so tenants without the flag see zero change. Off by default.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_solution_pattern_gate_v1",
    summary:
      "Adds a 'Solutioning' workspace entry point to P3 Design Future State — the 5-pattern platform-fit gate (Build on the Platform / Point Automation / Embedded in a Licensed Product / Native to the Core Clinical System / New Third-Party Platform). Captured as a named owner's explicit classification with a rationale, not an auto-derived score — the source model's own calculation formula (from Discovery answers) isn't available, so this doesn't invent one, consistent with how Complexity Tier is handled. Persisted via an isolated charter-JSONB seam. Does NOT yet wire a governance.ts gate consequence for non-Platform patterns (Check-coverage/Challenge-by-default routing is surfaced as UI context only in this pass) — see the release record. Off by default.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "intelligence_brief_v4",
    summary:
      "V4 Intelligence Brief layout with binding patterns, decision actions, and the move-cascade panel. Default-on platform-wide after PRs #1923 + #1932.",
    policy: "platform",
  },
  {
    key: "first_capital_substrate_overlay",
    summary:
      "First-Capital-only substrate overlay during pilot tuning. Opt-in per tenant. Default off everywhere else.",
    policy: "tenant",
    includeTenants: ["arcturus"],
  },
  {
    key: "retrieval_azure_search",
    summary:
      "Route AgentContextBroker tenant-context retrieval through Azure AI Search (tenant-context-v1) instead of pgvector. Platform-scope intent — staged via tenant allowlist so production cutover happens tenant-by-tenant. Default off everywhere.",
    policy: "tenant",
    // includeTenants intentionally empty — flip on per tenant during
    // cutover. When parity is proven across the roster, swap to
    // `platform` policy with the inverse `excludeTenants` for rollback.
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_home",
    summary:
      "Shared Context Brain on Home: allow Ava/Consilium outputs to drive Home decision-support summaries only after pack readiness and parity proof pass. Default OFF; tenant opt-in only through the W6.1 exposure gate.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_intelligence",
    summary:
      "Shared Context Brain: ground the Intelligence ask in the Consilium expert faculty (router summons expert(s); their authored benchmarks/AI-plays/hedges are injected into synthesis; contributing experts surfaced). Default OFF; tenant opt-in only through the W6.1 exposure gate after pack readiness and parity proof pass.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_source",
    summary:
      "Shared Context Brain on the Source synthesis path: ground sourcing-event synthesis in the Consilium expert(s) for the event (e.g. AMS vendor consolidation → IT Outsourcing & Managed Services expert). Default OFF; tenant opt-in. Wired in /api/source/synthesis; flag off = byte-identical. NOTE on flip: include the flag in the synthesis cache key, or clear the source synthesis cache, when flipping per tenant (current cache key does not vary by flag).",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_moves",
    summary:
      "Shared Context Brain on the Moves/Programs synthesis path: ground program-state synthesis in the Consilium expert(s) for the program subject (industry-fenced via the active client key). Default OFF; tenant opt-in. Wired in /api/programs/synthesis; flag off = byte-identical. NOTE on flip: include the flag in the synthesis cache key, or clear the programs synthesis cache, when flipping per tenant (current cache key does not vary by flag).",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_tower",
    summary:
      "Shared Context Brain on Tower. Default OFF. Tower now renders through the shared aVa/Atlas AgentDock shell and posts live portfolio questions to the server answer path; this flag controls expert grounding on that server path.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_reasoning_spine",
    summary:
      "Run the Source reasoning spine (Analysis + Recommendation stages) on the generate path and CAPTURE a validated Reasoning Envelope as generation metadata. Default OFF; fully guarded (validate-or-fallback) so flag-off generation is byte-identical to today. Rendering the envelope into the deliverable prose is a separate slice. Tenant opt-in.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "tower_synthesis_apex_demo_fixture",
    summary:
      "Tower synthesis route may use the Apex Retail demo fixture as portfolio input. Tenant-gated to apexretail only — closes the Atlas P0 cross-tenant leak where the Apex fixture was the silent default for every tenant. Default ON for apexretail.",
    policy: "tenant",
    includeTenants: ["apexretail"],
  },
  {
    key: "home_knowledge_vnext",
    summary:
      "Home / Knowledge vNext shell (Brief · Explore · Relationships · Evidence & Gaps) built against the merged Phase 3C-2D consumption contracts. Default OFF — the shell lives behind an admin-only preview route (/knowledge-preview) that serves contract-valid fixture packs; this flag exists to enable a pilot tenant later, once the real HTTP consumption endpoints are published. Flag off = never activated for any tenant user; admin preview does not depend on it. No legacy Home/V6/V7/SkyHarbor data is consumed.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_pricing_engine",
    summary:
      "Attaches the P4 'Cost & Effort' workspace entry point (the 5-step estimate wizard wired to the independent pricing_* schema + PR4 effort engine, brief §9) to the Moves phase workspace. Default OFF — this is a NEW Move-facing surface built across an 8-PR sequence (PR2-PR7); the underlying pricing_* tables/engine are real and tested, but the workspace has not yet been live-proven with a real tenant. Flip on per tenant via includeTenants once a pilot tenant is ready to validate the wizard end-to-end. Flag off = the rail entry point does not render at all (no dead-code call site exposed).",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "graph_neo4j_enabled",
    summary:
      "Enables Neo4j-backed graph traversal. Default OFF — Postgres enterprise_graph_* tables are the source of truth. Re-enable per the AZLAB Neo4j re-introduction plan if/when that runs.",
    // Modelled as a `tenant`-policy flag so the global default is OFF.
    // (Platform policy means default ON; we need the opposite.) Flip on
    // per tenant via `includeTenants` only when a controlled lab decides
    // to re-introduce Neo4j; in production the flag stays empty.
    policy: "tenant",
    includeTenants: [],
  },
];

const FEATURE_FLAG_INDEX: ReadonlyMap<FeatureFlagKey, FeatureFlagDefinition> =
  new Map(FEATURE_FLAGS.map((flag) => [flag.key, flag] as const));

export function getFeatureFlagDefinition(
  key: FeatureFlagKey,
): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_INDEX.get(key);
}

export function listFeatureFlags(): ReadonlyArray<FeatureFlagDefinition> {
  return FEATURE_FLAGS;
}
