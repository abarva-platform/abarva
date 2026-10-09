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
  | "moves_solution_pattern_gate_v1"
  | "moves_capture_v2"
  | "moves_home_v2"
  | "moves_charter_basis_v1"
  | "moves_charter_assumptions_discover_v1"
  | "moves_capture_p0_v1"
  | "moves_capture_composition_v1"
  | "moves_workspace_v2"
  | "moves_capture_notes_v1"
  | "moves_capture_handoff_recap_v1"
  | "moves_charter_assumption_resolution_v1"
  | "moves_capture_phase_rollup_v1"
  | "moves_charter_standing_after_discover_v1"
  | "moves_step_pages_v3"
  | "moves_public_source_research";

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
      "2026-09-05: Nexus/aVa chat inside Moves phase workspaces can use a deterministic MovesAvaChatPacket (checklist, gate criteria, evidence gaps, feed-forward, approved-inputs-pack presence, Source/Tower keyword awareness) to ground model answers and suppress generic tenant context. Status, blocker, readiness, and phase-input draft modes have deterministic response paths; explicit evidence-summary questions use only phase-scoped approved evidence and return a cited, deterministic summary even when hardening is otherwise off. Other free-form responses remain model-generated from prompt guidance and are not post-hoc quality-gated. Tenant opt-in remains in force until signed-in tenant proof supports platform promotion. Env: ABARVA_FEATURE_MOVES_AVA_CHAT_HARDENING_TENANTS.",
    policy: "tenant",
    includeTenants: ["lakeshore", "meridian"],
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
      "2026-07-21: cross-phase Approvals overview inside the Moves phase workspace (MovesPhaseStandaloneClient) — a read-only list, one row per phase, built from the existing phase-tally output. Approval authority is the authenticated workspace user with gate-approval permission; listed sponsor contacts have no approval authority and may receive informational progress emails. No per-role approval rows or new API route. 'Review & approve' reuses existing per-phase navigation. The existing feature flag controls the overview presentation only.",
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
  {
    key: "moves_capture_v2",
    summary:
      "2026-10-04: Renders the redesigned 3-step phase capture (MovesCaptureFlow) for phases 1-5 in place of the contract-steps canvas — a journey strip, a 3-step bar, two to three questions per step, and a hand-off screen. Same canonical sections/keys, saves, structured editors, and gate; only the capture presentation changes. Enabled for the synthetic demo tenant for signed-in review; off for everyone else.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_step_pages_v3",
    summary:
      "2026-10-09: Renders Moves phase steps as the finalized step page template (five regions: step head, one next-action sentence with its count, a collapsed context line, grouped work rows, footer), one page per step declared in the phase workflow registry, with depth from the Move's change profile. First step: P3 Gate readiness, where gate checks, gate-document sign-off and the governed gate submission happen on one page through the existing build, sign-off and phase-gate-approval paths. Same capture keys, saves, documents and gate rules; only where and how the consultant acts changes. Requires moves_capture_v2. Enabled for the synthetic demo tenant for signed-in review; off for everyone else.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_public_source_research",
    summary:
      "2026-10-10: Governed public-source research for Moves deliverable builds. Before a build assembles its evidence, a research step asks the audited Anthropic egress path (workload moves_public_research, offline lane) to search and fetch PUBLIC web pages on client-neutral subjects - program rules, payment rules, published studies - from a brief that carries no client names, figures or client text. Each source is stored for that tenant and Move only, with its https URL, retrieval date and a verbatim excerpt of at most 300 characters, and stays pending until a consultant approves it; nothing unapproved is cited, and an outside source is never presented as a fact about the client. This release adds the storage contract (runs and sources tables, repository, governance manifest) and the research step: a flagged Moves build searches once per brief (reused for 14 days), stores what the API cited as pending sources, and reports 'N outside sources found, awaiting review'; a timeout, denial or unreadable answer is recorded and the build continues with no outside sources. Nothing is cited yet; the review queue and citation rules ship later under this same flag. Enabled for the synthetic demo tenant for signed-in review; off for everyone else.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_home_v2",
    summary:
      "2026-10-04: Renders the redesigned Moves Home portfolio landing (MovesHome) - human headline, a 'Waiting on you' triage (the specific ask per move, oldest first), an all-moves table with a six-dot phase rail, and the reconciled-with-client-inventory panel. Presentation only; reads the same portfolio + reconciliation, with value numbers from governed facts. Enabled for the synthetic demo tenant for signed-in review; off for everyone else.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_charter_basis_v1",
    summary:
      "2026-10-04: Relaxes the P1 Charter advance gate from a per-field approved-evidence lock to minimum-viable evidence. Each Charter field records a BASIS - approved evidence, a workspace-user assertion, or an assumption with an owner and a P2 validation plan - and an assertion or owned assumption is enough to advance without an upload. Unsupported fields stay visibly classified as assumptions (never shown as 'evidence covered') and carry into Discover to be validated. P2+ evidence gates are unchanged. Enabled for the synthetic demo tenant for signed-in review; the legacy approved-evidence lock stays in force elsewhere.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_capture_p0_v1",
    summary:
      "2026-10-04: Extends the redesigned 3-step phase capture (moves_capture_v2) to P0 Originate, which was mounted for phases 1-5 only and so stayed on the legacy finder-columns canvas. P0's eleven canonical inputs are already grouped into its three steps (Why now / The bet / Readiness) by the shared step-group contract, so this changes only which phases render that flow. The hand-off step carries P0's own gate control inline, using the same authorization check and the same required-evidence gate as the legacy canvas - P0 still cannot advance on intake answers alone. Requires moves_capture_v2 to also be enabled for the tenant; enabled for the synthetic demo tenant for signed-in review and off elsewhere.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_capture_handoff_recap_v1",
    summary:
      "2026-10-05: Makes the redesigned phase capture's hand-off recap reachable. The flow keeps the recap as view 3, but its footer spends its one forward control on the host's governed approve slot and nothing else calls into view 3, so the recap \u2014 which hosts the charter-basis rollup and the per-question basis marks \u2014 is deployed and renders nowhere. When on, the last step offers \"Review what you captured\", which opens the recap WITHOUT submitting; opened that way the recap does not claim the phase was submitted, and the governed approve control travels onto it so the decision still runs through the existing gate pipeline. No capture field, key, save, gate or evidence behaviour changes. Requires moves_capture_v2; off for every tenant. Env: ABARVA_FEATURE_MOVES_CAPTURE_HANDOFF_RECAP_V1_TENANTS.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_capture_composition_v1",
    summary:
      "2026-10-04: Composition-only polish for the redesigned phase capture. The workspace surface tabs move into the agent dock's workspace column so they sit with the content they switch, and the legacy stage head stops repeating the phase title, question, lede and progress card that the capture flow's own phase strip and step bar already state. The blocked-phase notice and the readiness-workbook actions keep rendering. No capture field, key, save, gate or evidence behaviour changes. Requires moves_capture_v2; enabled for the synthetic demo tenant for signed-in review and off elsewhere.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_workspace_v2",
    summary:
      "2026-10-07: Increment 1 of the Moves phase-workspace v2 shell. Consolidates the phase chrome into ONE slim phase rail (P0-P5 plus a non-interactive handoff-to-delivery marker) rendered by the capture flow, drops the stacked legacy gate stepper and the repeated stage head on the phase view, and de-emphasises the workspace-view row (Files / Intelligence / Approvals stay reachable as a secondary control, out of the primary phase-flow chrome). Within a phase the capture step bar becomes the v2 four-stage sub-step SPINE - CAPTURE steps (the phase's real step groups) then a GENERATE bridge, an OUTCOME step (the existing hand-off recap) and a GATE/attest step - in the v3 locked-light palette. The readiness-workbook download/upload/preview actions move off the per-step chrome onto the phase's gate step, in one consistent place for every phase. Presentation and arrangement only: the capture fields, structured inputs, saves/autosave, the gate/approve pipeline, evidence, approvals and the readiness workbook upload/accept are all unchanged, and the capture flow's view-state machine, resume, Continue-gating and recap reachability are untouched. Conjoined server-side with moves_capture_v2 (there is no capture flow to reshape without it) and subsumes the composition polish. Enrolled for the synthetic demo tenant for signed-in review; OFF elsewhere, and with it off the product renders exactly as today. Increments 2-3 (the OUTCOME findings surface and the charts layer) ship under this same flag.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_charter_assumptions_discover_v1",
    summary:
      "2026-10-05: Keeps the other half of the charter-basis promise. P1 tells the workspace user that a field answered from an assumption carries into Discover to be validated, but the recorded basis was read on phase 1 only, so P2 never showed it and the sentence named a handover the product did not perform. With this on, P2 Discover opens with the charter answers still standing on an assumption - each with the owner and the validation plan the person typed when they declared it. Read-only: it closes, edits and re-classifies nothing, adds no canonical field or key, and never renders a carried row in evidence wording. An answer edited after its basis was declared is excluded, because the stale plan was written about the previous wording. Requires moves_charter_basis_v1 to be meaningful; default OFF for every tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_capture_notes_v1",
    summary:
      "2026-10-04: Adds a governed fill-from-notes affordance to the Moves phase-capture dock. A workspace user pastes their own notes from a client conversation; a deterministic matcher (no model call) proposes which unanswered capture question each passage belongs to and shows the VERBATIM passage plus the words that earned the match. Propose -> review -> insert: nothing is written to a field until the person inserts that specific proposal. A note-derived fill is classified as a workspace assertion, never as approved evidence, and the panel never renders evidence-covered wording. Answered fields and structured (JSON) fields are skipped and reported as skipped, so a paste can neither overwrite captured work nor corrupt a structured value. Presentation and local state only; no new canonical field, table, or key. Enabled for the synthetic demo tenant for signed-in review; the dock is unchanged elsewhere.",
    policy: "tenant",
    includeTenants: ["meridian"],
  },
  {
    key: "moves_charter_assumption_resolution_v1",
    summary:
      "2026-10-05: Lets P2 Discover close a charter assumption it has validated. The phase already inherits the charter answers P1 left standing on an assumption (moves_charter_assumptions_discover_v1), each with an owner and the plan for validating it, but a person looking at one could not record what Discover found, so an assumption stayed open forever once declared. This adds the resolution data model and the resolution-aware read: an assumption resolved as confirmed, corrected, or superseded by approved evidence stops being listed as open and owed. A resolution is stored on the same capture-module row as the recorded basis under its own key, never nested inside it, and is pinned to the revision of the answer it was written about - edit the answer and the resolution no longer applies, the same rule the basis itself follows. A resolution is never rendered as approved evidence. The write path and its control are a later slice; with nothing writing one yet, on and off read identically today. Deliberately separate from moves_charter_assumptions_discover_v1 so a tenant can inherit the assumptions read-only without the resolve path. Default OFF for every tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_capture_phase_rollup_v1",
    summary:
      "2026-10-05: Lets the capture flow's phase strip say how much of a phase has been saved, for the five rows the screen cannot measure. The strip shows one row per phase, but the host holds live capture values only for the phase on screen, so every other row states a bare question count and a person stepping through the flow sees none of the work behind them. The rows needed to fix that are already loaded - the phase route reads every capture-module row for the Move and then discards all but the viewed phase - so this adds no read. An unmeasured row now states how many of its questions hold a SAVED ANSWER, under that word and no other. A saved answer is a persisted non-empty value; the viewed row's answered count additionally requires structured validity, evidence readiness, and on Charter a satisfied basis, so the saved count is strictly weaker and routinely larger. The two therefore never share a row and never share a noun, and a saved count never earns the completion tick - only a live measurement does, which is the invariant that removed an earlier row's claim to be fully answered when all of its questions were blank. Route-aware, because Design is the only phase whose question set depends on the confirmed solution route. Requires the redesigned capture flow to be on to render at all. Default OFF for every tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_charter_standing_after_discover_v1",
    summary:
      "2026-10-05: Carries the charter's unresolved assumptions past Discover. P1 lets a charter field be answered from an assumption with an owner and a validation plan, P2 inherits those assumptions and can record what Discover found, and both reads are scoped to their own phase - so from P3 onward a charter answer reads identically whether it was proved, assumed and never checked, or checked and found wrong. P3 routes a solution off that answer, P4 builds a business case on it and P5 mobilises against it. With this on, a phase after Discover can read two standings against a charter answer: unvalidated, where the assumption outlived Discover unresolved; and known-wrong, where Discover recorded a correction and the charter still carries the wording the correction was written about. The known-wrong standing is derived from the same revision pin the rest of the family uses - a correction stops reading the moment the answer is edited - not from a comparison this read invents. Read-only: it resolves, edits and re-classifies nothing, adds no canonical field or key, and never renders a standing in evidence wording. Requires moves_charter_assumption_resolution_v1, because without the resolution read a resolved assumption and a surviving one are indistinguishable and the surface would report work that was really done as work nobody did; it reports nothing rather than reporting that. P2 is excluded and stays with the carry-forward. The consuming surface is the capture flow's opening band on P3+, beside the P2 carry-forward band it mirrors. Default OFF for every tenant.",
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
