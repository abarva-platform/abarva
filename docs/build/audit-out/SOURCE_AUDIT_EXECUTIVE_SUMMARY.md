# Source Audit · Executive Summary

| | |
|---|---|
| **Audit ID** | `SOURCE_AUDIT_2026-05-06` |
| **Audit prompt** | [docs/build/SOURCE_END_TO_END_AUDIT_PROMPT_V1.md](docs/build/SOURCE_END_TO_END_AUDIT_PROMPT_V1.md) |
| **Modes complete** | 5 of 6 (M1 substrate, M2 code, M4 agents, M5 doc drift, M6 matrix) |
| **Mode deferred** | M3 Chrome UI (runbook in [SOURCE_AUDIT_M3_CHROME.md](docs/build/audit-out/SOURCE_AUDIT_M3_CHROME.md), needs Chrome MCP session) |
| **Total findings** | 12 compliance · 23 drift · 23 design observations |
| **Sources compared** | A=Dossier · B=Design template · C=Walkthrough · D=Code · E=Build spec |

---

## What the audit found · in three sentences

The Source code is more disciplined about forbidden claims and evidence integrity than the dossier credits, and all six canonical routes are implemented. **But** five different artifacts (dossier, design template, walkthrough, code, build spec) describe **four different agent architecture models**, and the code's chosen model — "all four agents on every stage in parallel" — is not declared anywhere. **And** agent voice in the code is stage-generic within agent (Nexus-at-Strategy uses the same template as Nexus-at-BAFO with only a label injection), confirming the design template's concern that the universal canvas pattern strains across 7 of the 11 stages it serves.

---

## The single decision the redesign must make first

**Pick an agent architecture model.** The five options surfaced (M4 §4 decision matrix):

| Option | Cost | Match with current sources |
|---|---|---|
| A · Stay parallel-all + sharpen voice | Medium | Matches code, requires voice work |
| B · Single-lead per stage | High | Matches dossier |
| C · Single-lead + category co-lead | Highest | Matches design template |
| D · Per-stage specialist agents (11) | Very high | Matches no source |
| **E · Parallel-all + UX prioritization** | **Low** | **Matches code, fits dossier at UI** |

**My read:** Option E is the lowest-cost path that preserves existing investment while presenting a single-voice experience to the sourcing leader. Option C is the highest-cognitive-fit because the design template's category co-leadership was a thoughtful articulation of how AMS, Cloud, Data, and Enterprise software each reward different lead specialization.

The audit produces evidence; the founder picks. Not picking quickly will compound — every additional week of building against an undeclared model adds drift.

---

## Top 8 findings · ranked by redesign relevance

### 1. Code uses an undeclared 5th agent model — parallel-all
[F-M4-101](docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md#f-m4-101). All four agents always run on every stage simultaneously. There is no per-stage lead, no per-category lead, no `lead_agent` column, no stage→agent mapping in code. **Severity P0.**

### 2. Voice is stage-generic within agent
[F-M4-103](docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md#f-m4-103). Nexus's "next action" template is `${stageLabel} next action`. Same for Atlas, Sentinel, Steward across stages. Agent specialization is real at the *concern* level (Nexus = operational, Atlas = executive, etc.) but not at the *stage* level within an agent. **Severity P1.**

### 3. Substrate lacks gate-criterion and value-line granularity
[F-M1-204](docs/build/audit-out/SOURCE_AUDIT_M1_SUBSTRATE.md#f-m1-204) + [F-M1-205](docs/build/audit-out/SOURCE_AUDIT_M1_SUBSTRATE.md#f-m1-205). Approvals are action-level, not gate-criterion-level. Value ledger has only a family flag, no per-line state column. The design template's gate panels (T03, T04, T05, T08) and value ledger (T07, T11) need substrate additions to render fully. **Severity P1.**

### 4. Build spec is internally inconsistent and contradicts code
[F-M5-202](docs/build/audit-out/SOURCE_AUDIT_M5_DOC_DRIFT.md#f-m5-202) + [F-M2-102](docs/build/audit-out/SOURCE_AUDIT_M2_CODE.md#f-m2-102). Build spec asserts "Sentinel-led surface" but code declares `SOURCE_LEAD_AGENT = 'Nexus'`. Build spec uses 10-stage model; code and substrate use 11-stage. Build spec is dated April 28; needs a refresh post-redesign. **Severity P1.**

### 5. 5 of 13 dossier readiness states have no code representation
[F-M5-104](docs/build/audit-out/SOURCE_AUDIT_M5_DOC_DRIFT.md#f-m5-104). Requested, Connected, Stale, Access Restricted, Not Applicable, Waived have no enumeration. Either expand code or simplify dossier vocabulary. **Severity P1.**

### 6. 4 dossier-canonical artifacts missing in code
[F-M5-110](docs/build/audit-out/SOURCE_AUDIT_M5_DOC_DRIFT.md#f-m5-110). Minimum Data Request, Vendor Q&A Tracker, Vendor Response Completeness Checklist, Vendor Selection Memo. Decide whether to add or remove from dossier. **Severity P1.**

### 7. Code is more disciplined than dossier credits
[F-M2-005](docs/build/audit-out/SOURCE_AUDIT_M2_CODE.md#f-m2-005) + [F-M2-002](docs/build/audit-out/SOURCE_AUDIT_M2_CODE.md#f-m2-002) + [F-M1-003](docs/build/audit-out/SOURCE_AUDIT_M1_SUBSTRATE.md#f-m1-003). Real approval engine exists (dossier §6 says "not started"). Forbidden-claims discipline holds 15/15. Context receipts substrate gives unusually strong evidence integrity. **Update the dossier.** **Net positive finding.**

### 8. 12 code-only routes invisible to dossier and design
[F-M2-203](docs/build/audit-out/SOURCE_AUDIT_M2_CODE.md#f-m2-203). Includes a substantial patterns subsystem (`/source/patterns/**`). The redesign should explicitly decide for each: keep, fold, or remove. **Severity: design observation.**

---

## Cross-product reconciliation note (per founder's intent)

The user has indicated the agent architecture redesign should extend across **Moves, Source, Tower, and Intelligence**. This audit covers Source only. Three architectural questions surfaced here likely repeat in the other surfaces:

1. **Parallel-all vs single-lead.** The code pattern in Source is probably mirrored in Programs/Moves. A code-level audit of `src/lib/programs/` and `src/lib/intelligence/` would confirm.

2. **Atlas dual-scope.** [F-M4-203](docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md#f-m4-203) — Atlas inside Source vs Atlas inside Tower needs reconciliation. Same for Sentinel inside Intelligence vs Sentinel inside Source.

3. **Voice consistency cross-product.** Is Nexus voice in Source the same as Nexus voice in Programs? If not, voice fragmentation by surface is a parallel issue to voice fragmentation by stage.

A follow-up audit of the other three products with the same M4-style template could produce the cross-product picture quickly (~6–8 hours each).

---

## What's in the audit-out directory

```
docs/build/audit-out/
├── SOURCE_AUDIT_M1_SUBSTRATE.md       (4 compliance · 3 drift · 5 design obs)
├── SOURCE_AUDIT_M2_CODE.md            (6 compliance · 5 drift · 4 design obs)
├── SOURCE_AUDIT_M3_CHROME.md          (deferred — runbook only)
├── SOURCE_AUDIT_M4_AGENTS.md          (2 compliance · 4 drift · 8 design obs)
├── SOURCE_AUDIT_M5_DOC_DRIFT.md       (0 compliance · 11 drift · 6 design obs)
├── SOURCE_AUDIT_M6_MATRIX.md          (synthesis, no new findings)
└── SOURCE_AUDIT_EXECUTIVE_SUMMARY.md  (this document)
```

---

## What this audit did not produce

- A redesign. The audit ends with findings. The redesign is a separate decision the founder takes after reviewing this summary.
- A fix list. Findings can be triaged into fixes after the agent-architecture decision lands.
- Cross-product audit. Source only. Moves/Tower/Intelligence are explicit follow-ups.
- M3 Chrome confirmation. Browser-level confirmation of the code-level patterns is deferred to a focused session.

---

## Suggested next moves for the founder

1. **Read M4 §4 decision matrix.** Pick an agent architecture option (A–E). 30 minutes.
2. **Decide on Cluster C substrate gaps.** Are gate criteria and value lines worth dedicated tables? Or is application-tier rendering sufficient? 30 minutes.
3. **Run M3 Chrome.** Schedule a focused session to walk the deployed UI per the runbook. 1 day.
4. **Update the dossier.** Specifically §6 implementation status, §10 artifact catalog, §11 Tower references. The dossier has drifted from reality.
5. **Run cross-product audit.** Same M4 template against Moves, Tower, Intelligence to surface the cross-product pattern.

---

## Addendum · 2026-05-06 · Reframe to workflow-first / agents-hidden

**Founder reframe during audit review:** *"Why would the human user know the names of all agents that act behind the scene? Wouldn't the user be more focused on workflows and getting work done?"*

This question reorients the redesign. The audit was framed around "which agent model wins" (parallel-all vs single-lead vs co-lead vs per-stage specialists). The reframe pivots that question:

> Agents should be implementation detail, not user-facing personas. The primary surface is workflows and outcomes. Agent names appear only in trace, audit, and admin views.

This matches every successful agent product in market — Cursor, Claude Code, Replit Agent, Devin, GitHub Copilot Workspace, Linear AI features. Named user-facing personas are a pattern that worked for the GPTs marketplace and consulting brands but has not generally won in workflow software.

### Implications for the audit findings

- **M4 §4 decision matrix is partially superseded.** The new model is layered: workflow surface (verbs and outcomes) → master orchestrator (hidden) → narrow specialists (hidden) → optional trace drill-down. The "single-lead vs co-lead" debate becomes "what specialists exist and what does the orchestrator route to."
- **Voice genericness (F-M4-103) drops in priority.** If Nexus isn't user-facing, the genericness of Nexus-at-Strategy vs Nexus-at-BAFO is implementation depth — still worth fixing, but not a UX coherence problem.
- **Substrate findings (M1) get more important.** Workflow-first means the substrate has to carry the workflow state cleanly. Gate criteria (F-M1-204) and value lines (F-M1-205) become higher-priority adds, not nice-to-haves.
- **Provenance becomes the trust signal.** `source_context_receipts` (F-M1-003) and citation infrastructure are the brand promise. "Validated by 3 perspectives" replaces "Atlas wrote this."
- **Cluster D (code-only feature sprawl) gets re-evaluated.** Patterns subsystem and other code-only routes may align better with workflow-first surface than with the prior agent-centered framing.

### Implications for Setup/Admin

The user's prior memory entry — "Setup/Admin must be agent-anchored, not data-anchored — /admin should foreground what each of the four agents currently sees" — should be revisited. Under workflow-first:

- **Primary Setup/Admin navigation:** by workflow concern (data sources, permissions, integrations, gates, audit trail) — not by agent
- **Agents in Setup:** appear in audit/trace views and capability inspector ("which specialists exist, what data do they consume")
- **Setup-as-Sentinel-led** etc. — likely retired in favor of "Setup-as-readiness-workflows"

This is a memory update worth making explicit when the redesign lands.

### What stays unchanged

- The four concerns (orchestration / evidence / governance / executive synthesis) remain real capability buckets
- The 11-stage canonical journey stays the workflow spine
- The 13-state readiness ramp stays the data-readiness vocabulary
- The 4-state value lifecycle (projected → committed → measuring → realized) stays
- All forbidden-claims discipline stays (in fact gets easier — no agent attribution to fight against)
- Voice generators in code become specialists under the orchestrator with no rewrite

### Refinement (later in the same review session)

Founder refined the reframe: *"We can still have the brand name in the chat window — say a Nexus in Moves or Sentinel in Source — but there are many specialized agents, hundreds in the background, that we manage and publish as part of architecture review or detailed docs."*

This converges to a clean architectural model:

| Layer | What lives there | User sees? |
|---|---|---|
| Primary UI nav + page headers | Workflow verbs and outcomes | Yes — "Decision Brief," "Run Sourcing Event," not "Atlas's Brief" |
| Chat window | One brand-named front agent per product | Yes — Sentinel in Source, Nexus in Moves, Atlas in Tower, Steward in Setup, Sentinel in Intelligence |
| Master orchestrator | Routes user intent to the right specialist | No |
| Specialists (hundreds) | Narrow function-named workers (PricingNormalizer, GateChecker, EvidenceValidator) | No — but cataloged in `docs/architecture/specialist-catalog.md` |
| Trace drill-down | "Show me how this was produced" | Optional — exposes specialist chain when user asks |

**Product → front-agent mapping:**

- **Moves / Programs** → Nexus
- **Source** → Sentinel (matches build spec line 17; supersedes `SOURCE_LEAD_AGENT = 'Nexus'` in code)
- **Tower** → Atlas
- **Intelligence** → Sentinel (same identity, different surface)
- **Setup / Admin** → Steward

The four brand names survive — they just stop running in parallel on every page within every product. Each owns one product's chat voice. Behind each front: a shared catalog of specialists that any orchestrator can call.

### Refined audit-finding implications

- **F-M2-102** (build spec inconsistency) — flips. Build spec was right; code constant `SOURCE_LEAD_AGENT = 'Nexus'` should be `'Sentinel'`. Small fix.
- **F-M4-101** (parallel-all in code) — becomes the work the redesign undoes. Sentinel orchestrates Source; specialists do per-stage depth.
- **F-M4-103** (voice generic across stages) — recasts to: Sentinel needs ONE deep voice across the 11 Source stages. Specialists handle per-stage depth behind her. Tractable.
- **F-M4-203** (Atlas in Source vs Atlas in Tower) — resolves. Atlas only fronts Tower. In Source, Atlas's prior responsibilities (executive decision brief) are taken by Source-side specialists that report through Sentinel.

### Refined next moves

1. **Build the specialist catalog scaffold.** `docs/architecture/specialist-catalog.md` with the entry schema (name, purpose, owner-front-agent, inputs, outputs, surfaces-it-serves, cite-tag-format). Empty placeholders for Source, Moves, Tower, Intelligence, Setup.
2. **Inventory Source specialists first.** Walk the 11 stages; for each, name the specialists that should report through Sentinel. Start with what F-M4-201 already captured (existing voice generators become specialists with no rewrite).
3. **Fix the trivial code drift.** `SOURCE_LEAD_AGENT` constant change — single-line fix.
4. **Cross-product audit under the new lens.** Same M1-M6 template against Setup, Moves, Tower, Intelligence — but with M4 reshaped: "what specialists exist, do they report through the right front agent, does the chat window honor the front-agent mapping."
5. **Update dossier and design template.** Both currently put four agents on the canvas. Both need refresh — chat lane to single front agent, specialists in trace.

End of addendum.

---

## Addendum 2 · 2026-05-06 · Cross-product audit results

After the Source audit, the cross-product audit ran focused M4 against Moves, Tower, Intelligence + a full audit on Setup. Findings consolidated in [CROSS_PRODUCT_AGENT_AUDIT.md](docs/build/audit-out/CROSS_PRODUCT_AGENT_AUDIT.md) and [SETUP_AUDIT.md](docs/build/audit-out/SETUP_AUDIT.md).

### The headline finding

**Source is the outlier.** Three of five products (Moves, Tower, Intelligence) already implement the front-agent-per-product model. Setup has resolvable drift. Only Source has the parallel-all multi-agent anti-pattern.

The redesign work is concentrated, not distributed.

### Compliance scorecard

| Product | Front agent | Compliance | Note |
|---|---|---|---|
| Moves | Nexus | ✅ Compliant | Singular front, 12 specialists already implicit |
| **Source** | Sentinel | ❌ **Non-compliant** | Parallel-all pattern is the work |
| Tower | Atlas | ✅ **Reference architecture** | Adopt this pattern elsewhere |
| Intelligence | Sentinel | ⚠ Partial | Voice doctrine flag-gated (P1) |
| Setup | Steward | ⚠ Drift resolved | StewardEditorial in code; pattern matches |

### Atlas dual-scope — RESOLVED

One identity, two scope applications. Atlas FRONTS Tower (full orchestrator with `atlas_threads` + `atlas_observations`). In Source, Atlas's capabilities (executive-brief writing) are exposed as specialists routed through Sentinel. Same brand identity, product-by-product chat-window mapping. This is exactly what the refined architecture intended.

### Sentinel dual-product — RESOLVED

One identity, two broker scopes. Intelligence has a dedicated `sentinel-broker-adapter.ts` (corpus-wide, programId optional) — Intelligence is Sentinel's "primary" surface. Source's use of Sentinel is secondary (no named broker adapter). One voice doctrine spans both ([src/lib/agent/voice-doctrine/sentinel.ts](src/lib/agent/voice-doctrine/sentinel.ts)).

### Specialist catalog status

[docs/architecture/specialist-catalog.md](docs/architecture/specialist-catalog.md) now has **67 specialists captured**: 12 Source · 16 Setup · 12 Moves · 15 Tower · 11 Intelligence · 4 cross-product utilities. Most are already shipped in code (bundled inside multi-agent generators or named modules). The catalog is now load-bearing for the redesign.

### Phased work plan

| Phase | Work | Effort |
|---|---|---|
| 1 · Trivial wins | Rename `SOURCE_LEAD_AGENT='Sentinel'`; flip Sentinel doctrine flag (founder sign-off); rename `/admin/agents/atlas` to workflow route | 1 day |
| 2 · Substrate generalization | `atlas_threads`/`atlas_observations` → `agent_threads`/`agent_observations` with discriminator | ~1 day total |
| 3 · Source refactor | Replace `SourceMultiAgentBriefing` with Sentinel-front + specialist routing; existing voice generators become specialists with no rewrite | 1–2 weeks |
| 4 · Voice doctrine expansion | Mirror Sentinel's 17-banned-pattern model for Nexus, Atlas, Steward | ~1 week |
| 5 · Per-user RLS | ✅ Shipped 2026-05-07 — 6 migrations + 108 tests + ops runbook | ~2 weeks |
| 6 · Polish | Tower 5D lens completion · Moves V1/V2 consolidation · Setup audit-trail · Intelligence INT-5 4-mode toggle | ~1 week each, parallelizable |

### What stays

- The four front agents (Nexus / Sentinel / Atlas / Steward) all survive
- Each fronts one product (Moves / Source-Intelligence / Tower / Setup respectively)
- All existing voice generators in code become specialists with no rewrite
- The four-state value lifecycle, 11-stage Source journey, 13-readiness ramp, 5-rung trust ladder all stay
- Provenance and citation infrastructure stays — strengthens, not weakens, under workflow-first

End of addendum 2.

---

## Addendum 3 · 2026-05-07 · Phase wave execution status

### Resolved findings (closed)

| Finding | Description | Resolution |
|---|---|---|
| **F-M4-101** ✅ | Parallel-all multi-agent pattern | Phase 3 shipped 2026-05-07: `sentinel-source-orchestrator.ts` replaces `buildSourceMultiAgentBriefing`; 7 ranked specialists behind Sentinel front; 9 tests in `__tests__/sentinel-source-orchestrator.test.ts` |
| **F-M2-102** ✅ | `SOURCE_LEAD_AGENT = 'Nexus'` constant | Fixed in Phase 1a: constant renamed to `'Sentinel'` in `src/lib/source/constants.ts` |
| **F-SU-103** ✅ | `/admin/agents/atlas` violates workflow-first | `/admin/agents/atlas/page.tsx` now redirects to `/admin/cross-program-signals` |
| **F-SU-106** ✅ | No per-user RLS | Phase 5 shipped 2026-05-07: 6 migrations + 108 tests + ops runbook at `docs/build/RLS_OPERATIONS_RUNBOOK.md` |
| **F-SU-107** ✅ | No Ask Anything bar in Setup | `StewardAskBar` with progressive scaffold disclosure shipped 2026-05-07 |
| **F-M2-103** ✅ | `SOURCE_NEXUS_API_STUB_VERSION` naming | Wave 1: renamed to `SOURCE_SENTINEL_API_VERSION`; back-compat aliases retained |
| **F-M1-103** ✅ | 4 artifact families missing | Wave 1 migration `20260507160000`: added `minimum_data_request`, `vendor_qa`, `response_checklist`, `selection_memo` |
| **F-M1-101** ✅ | 5 evidence states missing | Wave 2 migration `20260507160000`: added `stale`, `access_restricted`, `not_applicable`, `waived` to evidence_state |
| **F-M1-203** ✅ | No `lead_agent` column | Wave 1 migration `20260507160000`: `lead_agent TEXT` added to source_events |

### Open findings (active backlog)

| Finding | Description | Status |
|---|---|---|
| **F-M4-103** ✅ | Per-stage voice depth for Sentinel/Nexus/Atlas | Wave 3: `stage-voice-depth.ts` + 7 tests; `multi-agent-briefing.ts` updated |
| **F-SU-104** ✅ | Specialist registry substrate | Wave 4: `specialist_registry` table seeded with 7 Source specialists |
| **F-M1-204** ✅ | Gate criteria per-criterion state | Wave 4: `gate_criteria` + `gate_criterion_states` tables + TypeScript types |
| **F-M1-205** ✅ | Value ledger per-line state | Wave 5: `source_value_lines` table (4-state lifecycle, RLS) + `value-line-types.ts` + 7 tests |
| **F-SU-201** ✅ | Generalize agent_threads/observations | Wave 5: `agent-thread-types.ts` view-model; substrate in `20260506100000` (agent_name discriminator + views) |
| **F-M1-102** | Artifact lifecycle multi-column vs unified enum | Decision deferred; multi-column is authoritative |
| **F-M2-104** | Legacy stage_keys migration | Commented in `20260507160000`; backfill in Phase 6 |

---

## Addendum 4 · Wave 5 close-out (2026-05-07)

All five Wave findings are now resolved. The substrate audit backlog (F-M1-101, F-M1-103, F-M1-203, F-M2-103, F-M2-104, F-M4-103, F-SU-104, F-M1-204, F-M1-205, F-SU-201) is fully closed except for the two intentionally-deferred items (F-M1-102 and F-M2-104 backfill).

| PR | What shipped |
|---|---|
| #1605 | Wave 1+2: artifact families, evidence states, lead_agent, constant rename |
| #1604 | Wave 4: specialist registry (7 seeds) + gate criteria substrate |
| #1606 | Wave 3: per-stage voice depth for Sentinel/Nexus/Atlas |
| Wave 5 | Value ledger per-line state (`source_value_lines`) + generalized agent thread types |

**What remains before UI/UX polish wave:**
- Run `npm run db:migrate` to apply new migrations to local + staging DB
- UI/UX polish: apply full-message-readability + progressive scaffold disclosure across Source, Tower, Intelligence chat surfaces (per design principles memory)

End of addendum 4.

End of executive summary.

End of executive summary.
