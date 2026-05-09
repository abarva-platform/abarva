// demo-context.ts
//
// Shared fallback demo context injected into agent system prompts.
// Bridges the gap between shell fixture data (T3-H01, T3-H03, APX-CDP-2026,
// etc.) and the LLM calls that have no knowledge of AbarVa-specific naming
// or the current Apex Retail demo state.
//
// Rules:
//   - Treat persisted DB rows, page-local program context, broker bundles, and
//     context-broker receipts as more current than this fallback block.
//   - Update here when fixture data changes (phase advances, gate clears, etc.)
//   - Do NOT import React or any component code — this is pure TypeScript.

// ── Product context ─────────────────────────────────────────────────────────
// Explains the AbarVa platform and agent roles to the LLM.

export const ABARVA_PRODUCT_CONTEXT = `
AbarVa is an AI program management platform. It guides enterprises through a 7-phase AI program lifecycle:
  P0 Origination → P1 Discovery → P2 Synthesis → P3 Solution / Program Design → P4 Execution Roadmap → P5 Approval / Mobilization → P6 Tower Handoff

Four specialist agents operate the platform:
  Nexus    — program orchestration (Programs surface). Runs workshops, tracks gates, surfaces blockers.
  Sentinel — intelligence library (Intelligence surface). Validates and curates AI patterns for programs.
  Atlas    — portfolio + Tower surface. Monitors pressures, outcomes, and cross-program signals.
  Steward  — governance and setup (Setup surface). Manages connectors, users, and policy compliance.

Hard gates require explicit approval before a phase advances: P1 entry (Discovery), P3 entry (Design), P5 entry (Activate).
Soft gates allow the next phase to open but flag gaps. Evidence coverage (0–100%) measures readiness.
`.trim();

// ── Apex Retail demo tenant context ─────────────────────────────────────────
// Fallback state of the demo tenant as of May 9 2026.

export const APEX_RETAIL_DEMO_CONTEXT = `
DEMO TENANT: Apex Retail Group (locked)

PROGRAMS IN FLIGHT (6 total):
Authoritative rule: if a persisted Strategic Move row, page context, or broker receipt conflicts with this fallback list, trust the persisted/current context.

1. APX-CDP-2026 | Apex Retail CDP Activation | P3 Design | FLAGSHIP
   - Design gate cleared Apr 27 2026 (all 5 criteria met, evidence 100%)
   - Execution Roadmap gate (P3→P4) is the next milestone — currently 2 of 5 criteria met
   - Open Execution Roadmap gate blockers: Vendor C integration contract (unsigned), privacy architecture sign-off, roadmap scoping
   - Architecture sprint is active. Vendor C selected as managed CDP layer via AMS BAFO — reduces in-house build scope ~40%.
   - Patterns in use: T3-H01 Ambient AI in Retail, T3-H03 Unified Loyalty Intelligence (personalization layer)

2. Contact Center AI Routing | P3 Design | CXO DEMO MOVE
   - Persisted Strategic Move for Apex Retail; P0-P2 artifacts are completed and P3 Design gate/workspace is open.
   - Current executive question: whether AI routing design has enough operational, technology, evidence, and change-readiness proof to continue.
   - Use Move/page context for exact phase, sponsor, evidence, deliverable, and gate state before relying on this fallback summary.

3. APX-SAP-2026 | Store Associate Productivity AI | P1 Discovery
   - Early discovery phase. Field workflows still being mapped.

4. APX-LPM-2026 | Loyalty Platform Modernization | P3 Design | active
   - Architecture sprint underway. Pattern: T3-H03 Unified Loyalty Intelligence.

5. APX-MRC-2025 | Merchandise Replenishment AI | P3 Design | IDLE 9 days
   - Sponsor re-engagement required before Q3 cadence review.

6. APX-DFV2-2025 | Demand Forecasting v2 | P6 Tower Handoff | STEADY STATE
   - Live since Nov 2025. Forecast accuracy ahead of target. Restricted financial benefit exists and must be summarized qualitatively unless finance visibility is allowed.

INTELLIGENCE PATTERNS (shell library):
- T3-H01 | Ambient AI in Retail        | T3 Use-case | VALIDATED  | Used by 4 programs incl. APX-CDP-2026
- T3-H03 | Unified Loyalty Intelligence | T3 Use-case | IN REVIEW  | 64% evidence; 2 active programs; promotion expected post Q2
- T1-F01 | AI Program Foundations       | T1 Craft    | VALIDATED  | Cross-program governance baseline
- T1-F02 | Responsible AI Deployment    | T1 Craft    | CANDIDATE  | Emerging — not yet validated
- T2-C03 | Rules-Based Recommendations  | T2 Use-case | DEPRECATED | Superseded by T3-H01 / T3-H03

ACTIVE TOWER PRESSURES:
- AI Cloud Spend | HIGH severity | exact actual-vs-budget values restricted
  CDP personalization layer is a top LLM inference driver (+18% spike on deployment).
  Highest-leverage action: negotiate rate card with primary provider for material run-rate recovery.
- Vendor Risk | MEDIUM severity | AMS BAFO — Vendor C selected for APX-CDP-2026 CDP data layer
  Integration contract is unsigned. Required criterion for the P3→P4 Execution Roadmap gate.

SOURCE EVENT:
- AMS Vendor Consolidation 2026 | 10-stage tracker | Current stage: BAFO (Stage 7)
  Vendor C selected as managed CDP layer for APX-CDP-2026.
  Vendor B had SOC-2 attestation gap (still open, not on critical path).
  Linked program: APX-CDP-2026 P3 Design.
`.trim();

// ── Combined block for system prompt injection ───────────────────────────────
// Append this to any agent system prompt to give it full platform + demo awareness.
//
// Surface 1 PR2.5: legacy unconditional block kept for the routes that still
// import it (most still do). New routes should prefer `getTenantSystemBlock()`
// below, which scopes the Apex Retail demo context to the Apex tenant only —
// non-Apex tenants get only the general platform context, avoiding the
// confusing cross-tenant references Anand spotted during a Meridian walkthrough.

export const AGENT_DEMO_SYSTEM_BLOCK = `

--- PLATFORM AND DEMO CONTEXT ---
${ABARVA_PRODUCT_CONTEXT}

${APEX_RETAIL_DEMO_CONTEXT}
--- END CONTEXT ---
`.trimEnd();

const PLATFORM_ONLY_BLOCK = `

--- PLATFORM CONTEXT ---
${ABARVA_PRODUCT_CONTEXT}
--- END CONTEXT ---
`.trimEnd();

/**
 * Active-client → demo block resolver. The Apex Retail tenant gets the
 * full demo block (rich program/source-event context); other tenants
 * get just the general platform context. This stops Steward and Nexus
 * from referencing Apex programs in conversations about Meridian /
 * Arcturus / etc.
 *
 * `clientKey` matches the values returned by `getActiveClientRow().key`
 * (see `src/lib/active-client.ts`). Pass `null` when the request is
 * unauthenticated; we default to platform-only context.
 */
export function getTenantSystemBlock(
  clientKey: string | null | undefined,
): string {
  // Apex Retail is the canonical demo tenant — keep the rich block.
  // Accept both the app ClientKey ('apexretail', no dash) and the
  // inventory-substrate key ('apex-retail', with dash) so the fallback
  // path in the agent route works regardless of which key was passed.
  if (clientKey === 'apexretail' || clientKey === 'apex-retail') return AGENT_DEMO_SYSTEM_BLOCK;
  // Everything else gets the platform context only. As we build out
  // tenant-specific demo data for Meridian / Arcturus / etc., this is
  // the seam to switch on.
  return PLATFORM_ONLY_BLOCK;
}
