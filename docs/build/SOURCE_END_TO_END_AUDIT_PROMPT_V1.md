# Source End-to-End Audit Prompt · v1

| | |
|---|---|
| **Doc ID** | `SOURCE_AUDIT_PROMPT_2026-05-06` |
| **Status** | Ready to dispatch |
| **Audit purpose** | Produce evidence to inform a slight-to-substantial redesign of the Source module end-to-end, with three deliverable buckets per mode: compliance, drift, design observations |
| **Audit type** | Read-only · multi-modal · 4 sources of truth · 6 modes · ~58–71 hours total |
| **Decision boundary** | This audit ends with findings. Recommendations live in the gap register. Actual fixes are a separate decision, taken AFTER cross-reference matrix lands |

---

## 1 · Hard scope rules — read these every time you start a mode

1. **Read-only.** No PRs touching `src/`. No migrations. No schema changes. No edits to the Source code, Source seeds, or substrate tables. If you encounter a tempting fix, log it in the gap register and move on.
2. **No fixes-while-auditing.** This was the failure mode of the Knowledge Layer audit — auditing and fixing at the same time corrupted the findings. Resist.
3. **Evidence over assertion.** Every finding cites a file path with line number, a screenshot path, a substrate query result, or a direct quote from one of the four sources. No "I think this is broken" — only "here's the line, here's the source it violates."
4. **Question first, defect second.** When reality differs from a source, the default is "log as question for reconciliation." Only escalate to defect when the violation is unambiguous (e.g., forbidden claim visible in deployed UI, or a vocabulary term outright misspelled).
5. **Apex Retail is the canonical baseline.** All findings are anchored against Apex Retail. The other 4 demo tenants get a thin sweep at the end of M3 for vocabulary-only drift. Do not fail the audit on tenants that lack data.
6. **No spawn agents to do the audit work.** The audit is the human-in-the-loop deliverable. You may use Explore for narrow lookups, but the synthesis is yours, in the main session.
7. **Incremental reporting.** Each mode produces its output doc and gap-register entries as it completes. Do not wait for all six modes before reporting Mode 1.
8. **Hold-fire on decisions.** No fix decisions until M6 cross-reference matrix is produced. Findings can pile up; the matrix tells us which ones are load-bearing.

---

## 2 · The four sources of truth — read all four; treat as parallel

The audit treats each source as an independent claim about what Source should be. Where they agree, that is canonical. Where they diverge, that is a finding.

| Source | Path / location | What it claims |
|---|---|---|
| **A · Dossier v1** | `/Users/anand/Downloads/AbarVa_Source_IT_Sourcing_Product_Requirements_Design_Dossier_v1.md` | Product requirements, agent model, 11 stages, 6 routes, 13 readiness states, 13 artifacts, 15 forbidden claims, implementation status as of v1.0 |
| **B · Design template** | `/Users/anand/Downloads/Moves (2)/Source End-to-End.html` + `source-tokens.css` | 14 page-level templates in 3 waves with concrete UI, tokens, agent placement, and visible discipline (v2 substrate flags, evidence states, three-choices+custom) |
| **C · Walkthrough prototype** | `/Users/anand/Downloads/AMS-Out Walkthrough _ standalone.html` | 6-scene interactive prototype demonstrating AMS-Out 2026 from creation to value realization. Canonical happy-path reference |
| **D · Implementation** | Current branch · `src/app/source/**`, `lib/source/**`, `lib/programs/transformers.ts`, substrate tables; deployed at `nexus-vert-kappa.vercel.app` | What was actually built. The audit's primary subject |

**Source priority for divergence:**
- 3-of-4 agreement → canonical
- B + C agree, A or D differs → A may be stale; D may be drift; log as question
- D differs from A + B + C → execution gap; investigate
- All four diverge → architectural drift; flag for reconciliation, not fix

---

## 3 · Pre-detected drift — start here, do not re-discover

Five drifts were detected during digestion. Audit treats these as starting hypotheses. Verify each, log evidence, escalate or close.

### 3.1 Tower references pulled from Source (Source B v0.3 footnote)
- **Source B says:** *"Sentinel and Steward observe; the cross-event 'Tower' surface is not designed yet and is not referenced in this file."*
- **Source A §11 says:** Source rolls up to Control Tower (Atlas-led portfolio view).
- **Audit task:** Verify in code (D) whether Source still emits Tower-bound signals or whether Tower references have been removed. If still present, flag as stale-against-design. If absent, flag dossier §11 as superseded.

### 3.2 Agent co-leadership at category level (Source B T02)
- **Source B says:** Cloud & Infra = "Lead: Sentinel & Atlas," Data & Analytics = "Lead: Steward & Sentinel," Enterprise Software = "Lead: Atlas," AMS = "Lead: Nexus."
- **Source A says:** One lead agent per stage (Nexus on 7, Steward on 2, Atlas on 2).
- **Audit task:** This is a fundamental architectural fork. Verify which model code (D) implements. Capture as a design observation regardless of code state — the dossier and design themselves disagree about whether agent leadership is per-stage or per-category.

### 3.3 Design tokens diverge from locked design system (memory)
- **Source B uses:** `#f5f1eb` bg, Fraunces serif, Inter body, JetBrains Mono.
- **Memory says:** AbarVa Design System v2 LOCKED — `#F8F7F4` bg, Georgia serif normal weight, DM Sans body. No changes without approval.
- **Audit task:** Inspect deployed UI (D) — which token set is rendering? If Fraunces/Inter are live, design system memory is stale and needs an update. If Georgia/DM Sans are live, the design template will need migration. Log as question requiring founder ruling, not defect.

### 3.4 Universal canvas T03 governs 7 of 11 steps — genericness risk
- **Source B says:** T03 universal canvas is the shell for steps 1, 2, 3, 4, 7, 9, 10. Same shell, different payload.
- **Audit task:** This concentrates the genericness risk in one component. M4 must verify that the editorial Nexus produces at Strategy actually differs from the editorial Nexus produces at BAFO. If it doesn't, that is the strongest evidence for the agent-decomposition argument (per-step specialists or per-stage editorial sharpening).

### 3.5 v2 substrate flag stamped on T03, T07, T11 (Source B footnote)
- **Source B says:** Confidence bands and value posture explicitly stamped "v2 PENDING SUBSTRATE."
- **Audit task:** M1 substrate audit must verify (a) the v2 substrate work is *not* implied as live in deployed UI, and (b) where the v2 substrate would land in the data model. This is positive discipline in the design — verify code respects it.

---

## 4 · The six audit modes

Each mode produces three deliverables: **compliance findings** (does code match the source), **drift findings** (where reality has moved past the source), and **design observations** (where the source's own choices show strain regardless of implementation).

### M1 · Substrate audit · 12–15 hours
**Question:** Does the substrate hold the data the dossier and design assume?

**Anchor points:**
- Dossier §8 field-level binding (16 canonical fields → substrate columns)
- Dossier §7 stage-by-stage data requirements (~80 field presence checks)
- Dossier §9 UI element to data source matrix (11 elements with seed + real source)
- Design B v0.3 footnote: confidence bands "v2 PENDING SUBSTRATE"

**Tasks:**
1. For Apex Retail tenant, query substrate for each canonical field. Mark Present / Empty / Missing-table.
2. For each of the 11 stages, list which required data fields exist in substrate, which are seeded, which are derived, which are absent.
3. For each of the 13 readiness states, verify substrate can distinguish them (state column, enum, derivation).
4. For each of the 10 artifact states, verify substrate can distinguish them.
5. For each of the 4 value states (projected/committed/measuring/realized), verify substrate carries the gating evidence (measurement owner + evidence link for `realized`).
6. Verify v2 substrate scope is identifiable in code — what tables, what migrations, what columns are flagged "v2"?

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M1_SUBSTRATE.md` — 3 sections: compliance / drift / design observations
- Gap register entries with substrate path + missing field

### M2 · Code-path audit · 14–16 hours
**Question:** Does the code implement the agent boundaries, route layout, and forbidden-claims discipline that the dossier and design template specify?

**Anchor points:**
- Dossier §6 implementation status table (19 capabilities)
- Dossier §3 forbidden claims (15 prohibitions, code-level grep)
- Design B routes: `/source`, `/source/events`, `/source/events/[id]`, `/source/events/[id]/scorecard`, `/source/events/[id]/artifacts/[artifactId]`, `/source/events/[id]/vendors/[vendorId]`, `/source/value`
- Memory: knowledge-layer broker boundary — app tier MUST NOT directly import EnterpriseDataRoom / broker / vector / graph

**Tasks:**
1. Map all `src/app/source/**` route files to the design template's 14 templates. Identify which templates have route implementations, which don't.
2. Grep for forbidden patterns: `live telemetry`, `realized` without measurement owner, `usable evidence` applied to `Loaded`/`Uploaded`, `final selection` automation, `production ready` claims.
3. Verify broker boundary: no `src/app/source/**` file imports broker/vector/graph directly. All goes through `AgentContextBroker` contract.
4. Verify agent leadership in code:
   - For each step, who is the lead agent referenced in the route handler and in the editorial generator?
   - Per-stage single lead (matches dossier) or per-category co-lead (matches design B)?
5. Verify transformer rule: `lib/programs/transformers.ts` exists, API routes return view-model types not DB types (per memory).
6. Verify `/source/events/[id]/vendors/[vendorId]` route — is it implemented? It's in design B T10 but not in dossier's 6 canonical routes.

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M2_CODE.md`
- Gap register entries with file:line citations

### M3 · Chrome UI deployed audit · 8–10 hours
**Question:** Does the deployed app at `nexus-vert-kappa.vercel.app` honor the design template, dossier vocabulary, and forbidden claims at the pixel level?

**Anchor points:**
- Source B 14 templates as visual reference
- Source C walkthrough as canonical happy path
- Dossier §13.1 nine universal page acceptance criteria (×6 routes = 54 assertions)
- Dossier §3 forbidden claims (visible-in-UI check)

**Tasks (run via Chrome MCP, log in as Apex client `apex@…` / `Demo2026!`):**
1. Walk the 6 canonical routes for Apex Retail. At each stop:
   - Screenshot the page
   - Capture page text via `read_page`
   - Compare to corresponding design B template — note vocabulary drift, missing UI elements, extra UI elements
2. For T03 (universal canvas) — visit it at 7 different stages (Strategy, Scope, RFP, Responses, BAFO, Selection Readiness, Transition). Capture the agent editorial at each stop. Compare for genericness — does the same agent sound different at different stages?
3. Compare the deployed AMS-Out 2026 event flow against the Source C walkthrough scene-by-scene.
4. Forbidden-claims sweep: search rendered DOM for any of the 15 prohibitions (live telemetry, realized without evidence, usable for loaded, etc.).
5. Vocabulary integrity sweep: agent names spelled correctly, stage names match canonical 11, readiness state labels in canonical 13.
6. Thin sweep on Arcturus, Meridian, and admin tenants — vocabulary-only check. Log breakage but do not fail-flag tenants without data.

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M3_CHROME.md`
- `docs/build/audit-out/screenshots/m3/*.png` (organized by route)
- Gap register entries with screenshot reference

### M4 · Agent behavior + architecture audit · 10–12 hours
**Question:** Does the four-agent model (Nexus / Sentinel / Steward / Atlas) hold up at the level of editorial voice and ownership boundaries — and where does it strain?

**This is the most important mode for the redesign.**

**Anchor points:**
- Dossier §2.1 four agents with exact roles
- Design B agent placement per template (with category co-leadership pattern)
- Memory: Atlas inside Source vs Atlas inside Tower
- The three end-state lattice: stay-4-and-sharpen / 4-plus-specialists / per-stage-agents

**Tasks:**
1. **Genericness test on T03.** For each of the 7 steps T03 governs, capture (from code or deployed UI):
   - The agent's opening editorial bubble
   - The three suggested choices
   - The context-used statement
   - Compare across steps. Score 1–5: how much does Nexus-at-Strategy differ from Nexus-at-BAFO? If below 3 on average, flag as evidence for granularity.
2. **Handoff seam test.** Step 5 (Steward-led Evaluation) sits between two Nexus-led steps. Capture how the agent handoff is rendered:
   - Does the user see a clean "Steward takes over here" moment, or just a label change?
   - Does the editorial voice actually shift?
3. **Atlas dual-scope test.** Verify if Atlas voice in Source (Step 8 Decision Brief, Step 11 Value Realization) is distinguishable from any Tower-Atlas surface that exists. Capture as a single agent with dual scope or two agents sharing a name.
4. **Sentinel/Steward overlap test.** Both touch confidence/citations. Capture three places where they overlap (artifact review, evidence ledger, gate sign-off). Note where the boundary feels clean and where it feels muddy.
5. **Persona-vs-agent math.** 13 personas, 4 agents. For 5 representative personas (CFO, CISO, Sourcing Lead, Sponsor, Lead Engineer), pick a route and assess: does the agent voice serve their decision frame, or feel mismatched?
6. **Co-leadership test.** Per design B, Cloud & Infra has Sentinel + Atlas as co-leads. Verify if code has any concept of co-leadership or if it falls back to single-lead. If single-lead in code, capture the gap.

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md` — extra-rich design observations section
- Optional: `docs/build/audit-out/SOURCE_AUDIT_M4_AGENT_VOICE_SAMPLES.md` (raw editorial captures)
- Gap register entries — but design observations should be the dominant bucket here

### M5 · Documentation drift · 8–10 hours
**Question:** Where do the four sources disagree about basic facts, and which one is right?

**Anchor points:** all four sources, every major decision in each.

**Tasks:**
1. **Vocabulary table.** Build a 5-column matrix: term × dossier-spelling × design-spelling × walkthrough-spelling × code-spelling. Highlight every mismatch.
2. **Stage names matrix.** 11 stages × 4 sources. Verify all match.
3. **Readiness states matrix.** 13 states × 4 sources.
4. **Artifact codes matrix.** Dossier uses descriptive names; design B uses `dNN_short_name`. Code uses what?
5. **Route paths matrix.** 6 dossier routes + design B's `/vendors/[vendorId]` + any code-only routes.
6. **Persona list matrix.** 13 personas across sources — same names, same definitions?

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M5_DOC_DRIFT.md` (heavy on tables)
- One unified glossary as appendix

### M6 · Cross-reference matrix · 6–8 hours
**Question:** Of all findings from M1–M5, which cluster together, which are load-bearing for the redesign, and which are noise?

**This is the synthesis mode. Do not start until M1–M5 are complete.**

**Tasks:**
1. Pull every finding from M1–M5's three buckets (compliance / drift / design observations).
2. Build a cluster matrix: rows = findings, columns = (mode, bucket, severity, redesign-relevance, supersession-status, suggested fix scope).
3. Identify load-bearing clusters — findings that, if fixed in isolation, would not move the redesign forward. Findings that cluster have leverage.
4. Surface the architectural reconciliations needed:
   - Tower in or out of Source?
   - Agent leadership per-stage or per-category?
   - Design tokens — which set is canonical?
   - Substrate v2 — what's the scope?
5. Produce one executive summary suitable for founder review: 2 pages, ranked list of architectural decisions to make, evidence per decision.

**Deliverables:**
- `docs/build/audit-out/SOURCE_AUDIT_M6_MATRIX.md`
- `docs/build/audit-out/SOURCE_AUDIT_EXECUTIVE_SUMMARY.md`
- Unified gap register: `docs/build/audit-out/SOURCE_AUDIT_GAP_REGISTER.md` (compiled from all modes)

---

## 5 · Output structure

All audit outputs live under `docs/build/audit-out/`. Structure:

```
docs/build/audit-out/
├── SOURCE_AUDIT_M1_SUBSTRATE.md
├── SOURCE_AUDIT_M2_CODE.md
├── SOURCE_AUDIT_M3_CHROME.md
├── SOURCE_AUDIT_M4_AGENTS.md
├── SOURCE_AUDIT_M4_AGENT_VOICE_SAMPLES.md  (optional)
├── SOURCE_AUDIT_M5_DOC_DRIFT.md
├── SOURCE_AUDIT_M6_MATRIX.md
├── SOURCE_AUDIT_EXECUTIVE_SUMMARY.md
├── SOURCE_AUDIT_GAP_REGISTER.md
└── screenshots/
    └── m3/*.png
```

**Per-mode doc structure (template):**

```markdown
# Source Audit · M[N] · [Mode name]

| Field | Value |
|---|---|
| Mode | M[N] · [name] |
| Status | Complete / In progress / Blocked |
| Hours spent | X |
| Findings count | C compliance · D drift · O design observations |
| Critical findings | [list] |

## 1 · Compliance findings
[Each finding: ID, source violated, evidence (file:line / screenshot / query), severity, suggested resolution]

## 2 · Drift findings
[Reality has moved past the source. Same structure.]

## 3 · Design observations
[Where source itself shows strain. Same structure but recommendation field is "design question to resolve" not "fix to apply."]

## 4 · Open questions for reconciliation
[Things that aren't findings but block progress.]
```

**Per-finding structure (template, lives in gap register):**

```markdown
### F-[mode]-[NNN] · [short title]
- **Source violated:** A / B / C / D
- **Evidence:** [file:line / screenshot path / query result]
- **Bucket:** Compliance / Drift / Design observation
- **Severity:** P0 / P1 / P2 / P3
- **Redesign relevance:** Load-bearing / Adjacent / Noise
- **Recommended treatment:** [Fix / Reconcile / Document / Defer]
```

---

## 6 · Supersession protocol

When the audit detects something in code that contradicts a source, do not assume the source is right. Apply this decision tree:

1. **Three-of-four agreement.** Code aligns with B + C, contradicts A. → A is likely stale. Log as drift; A needs update.
2. **B + C agree, code differs.** Likely execution gap. Log as compliance finding.
3. **Only A says it; B and C don't mention it.** A is likely superseded. Log as supersession; do not flag code as defective.
4. **All four diverge.** Architectural drift. Flag for founder reconciliation in M6.
5. **Memory says X, sources don't.** Memory may be stale. Verify source state; update memory if so.

For ambiguous cases, default to logging as question. Do not assert.

---

## 7 · Acceptance criteria

The audit is complete when all of the following are true:

1. All six modes have produced their primary deliverable in `docs/build/audit-out/`.
2. The gap register contains every finding from every mode, deduplicated and clustered.
3. The cross-reference matrix has assigned redesign-relevance to every finding.
4. The executive summary identifies the architectural reconciliations needed for the redesign.
5. No code changes were made under `src/`, `lib/`, or `prisma/`.
6. No PRs were opened by the audit.
7. The chrome screenshots exist on disk and are referenced in M3.
8. Every finding cites evidence (file:line, screenshot, or query).

---

## 8 · Time budget and pacing

| Mode | Target hours | Calendar (1 throughput) |
|---|---|---|
| M1 Substrate | 12–15 | 2 days |
| M2 Code-path | 14–16 | 2 days |
| M3 Chrome | 8–10 | 1.5 days |
| M4 Agent | 10–12 | 1.5 days |
| M5 Doc drift | 8–10 | 1 day |
| M6 Matrix | 6–8 | 1 day |
| **Total** | **58–71** | **~9 working days** |

M3 (Chrome) can run in parallel with M1 (substrate) since they touch different layers. M2 (code) blocks M4 (agent) at the agent-leadership-in-code task. M6 blocks on M1–M5 complete.

If running across multiple sessions, hand off via the gap register state and last-mode-completed marker.

---

## 9 · What this audit is NOT for

- **Not for fixing.** Findings are findings. Fixes happen after the founder reviews M6 and decides scope of redesign.
- **Not a code review.** The audit doesn't grade code quality, just whether code matches sources.
- **Not a security review.** Run `/security-review` separately if needed.
- **Not multi-tenant validation.** Apex Retail is canonical; other tenants get vocabulary sweeps only.
- **Not a substrate v2 spec.** The audit identifies where v2 substrate is needed, not what v2 substrate should be.

---

## 10 · Dispatcher's note

When dispatching this audit to a session:

- Confirm worktree is clean and on a branch dedicated to the audit (e.g. `claude/source-audit-mNN`).
- Confirm Chrome MCP is available for M3.
- Confirm the four source files are accessible at the paths in §2.
- Confirm the auditor knows the supersession protocol (§6) and the acceptance criteria (§7).
- For each mode, dispatch with the mode's section as a self-contained prompt; do not require the auditor to re-read this whole file.

End of audit prompt v1.
