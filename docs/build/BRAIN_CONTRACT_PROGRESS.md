# Brain Contract — progress tracker

**This file is the single source of progress truth.** Update it in the SAME PR as each fix
(check the cells, link the PR, link the proof). Status legend: ⬜ not started · 🟡 in progress ·
🟥 red (gate fails) · 🟩 green (proven on the deployed app). "Proven" = matrix column green for
that tenant AND a signed-in screenshot in the HTML report.

Contract spec: `docs/build/BRAIN_CONTRACT.md` · Gate: `scripts/qa/tenant-matrix-gate.mjs` ·
Deep test: `scripts/qa/reality-crawl.mjs` → report `scripts/qa/reality-crawl-report.mjs`.
Surface doctrine: `docs/product/HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`.

---

## Locked top-line execution status

This section stays at the top. It is the founder-readable status view before the detailed
tenant matrix. Percentages are conservative and must move only when the matching proof state
moves. Do not mark work complete from design, merge, or deploy alone.

**Overall execution:** **63%**  
**Overall proof state:** in progress; not all-green on deployed app until the matrix and
reality crawl prove it for all five tenants.

| Phase / category | % | Current state | Next proof needed |
|---|--:|---|---|
| P0 · Product doctrine and surface boundaries | 100% | Home vs Intelligence doctrine is explicit and linked from this tracker. | Keep future PRs aligned to `HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`. |
| P1 · Home / Explorer KNOW mode | 80% | Backend/frontend KNOW path exists, but quality and all-tenant browser proof must stay current. | Re-run deployed matrix + reality crawl after each Home change. |
| P2 · Intelligence advisor mode | 55% | Shared engine, corpus, and ExpertPack pieces exist, but advisor quality and semantic binding are not yet proven to the desired consultant bar. | Run semantic/advisor quality bank and prove tenant-fact + corpus + expert separation. |
| P3 · Shared chat/thread experience | 70% | Shared Ava shell controls exist on main; GPT/Claude-like interaction and cross-surface consistency still need final proof. | Browser-prove multi-turn history, multi-line composer, clear-after-submit, and fixed composer across Home/Intelligence/Tower. |
| P4 · Typed exhibits and visual artifacts | 65% | Typed table/chart/graph plumbing exists, but exhibit correctness must remain source-owned and crawl-proven. | Table/chart/graph prompts pass reality crawl with non-fabricated artifacts. |
| P5 · Cross-surface decision continuity | 15% | Contract names the invariant; continuity gate is still the missing matrix column. | Add continuity proof from Context → Intelligence → Moves → Source → Tower. |
| P6 · Release/proof harness | 55% | Matrix and crawl harnesses exist; deployed reports must be regenerated after each candidate. | Attach fresh HTML report with screenshots and pass-rate deltas to each PR. |

### Percent rule

- `0%`: not started.
- `25%`: designed / contracted.
- `50%`: implemented locally with focused tests.
- `70%`: merged and deployable with targeted proof.
- `85%`: deployed and live API-proven.
- `100%`: browser-proven for all five tenants and reflected in the matrix below.

The top-line percentage is not a substitute for the tenant matrix. If the matrix is red, the
brain is not done.

---

## Conformance matrix (invariant × tenant)

Cells = current status on the **deployed** app. Keep this in sync with the live gate run.

| Invariant (column) | Apex | First Capital | SkyHarbor | Meridian | Lakeshore | PR |
|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 · substrate / `dims19` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; screenshot report pending |
| 2 · retrievable / `grounded` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; screenshot report pending |
| 3 · one engine / `experts` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; code assertion pending |
| 4 · one voice / `readable` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3886](https://github.com/abarva-platform/abarva/pull/3886) answer-safety deployed; shared threaded AvaAsk candidate pending browser proof |
| 5 · exhibits / `visual` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3894](https://github.com/abarva-platform/abarva/pull/3894) restored matrix-green visual plumbing; source-owned typed visual candidate in progress |
| 6 · continuity (to add) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 7 · honesty / `fence`+`noRawId` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3886](https://github.com/abarva-platform/abarva/pull/3886) answer-safety candidate; deployed proof pending |
| render / intel (pages) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; screenshot report pending |

> Seed values above are the *expected* starting state (dims rolled-up at 8, exhibits suppressed,
> grounding hedging). Replace with the real first gate run, then update as fixes land.

## Reality-crawl pass rates (the deep test)

Re-run `reality-crawl.mjs` + `reality-crawl-report.mjs` after each foundation fix; paste the
overall + the exhibit categories here, and link the HTML report.

| Run (date · SHA) | overall | table | chart | graph | grounded | report |
|---|--:|--:|--:|--:|--:|---|
| 2026-06-23 · `697670b40` · deployed crawl after #3904 | 190/290 | 47/50 | 30/50 | 32/40 | 42/100 data+strategy | `out/reality-crawl/summary.json` · Home KNOW deterministic visual pass improved charts/graphs; strategy and SkyHarbor remain below bar |
| 2026-06-23 · `803f34088` · deployed crawl after #3886/#3888 | 147/290 | 45/50 | 4/50 | 0/40 | 63/100 data+strategy | `out/reality-crawl/report.html` · 15 signed-in screenshots captured under `out/reality-crawl/shots/` |
| 2026-06-23 · `49ecc9564` · deployed crawl after #3895 | 150/290 | 45/50 | 9/50 | 5/40 | not separately promoted | `out/reality-crawl-49ecc956/report.html` · rolled back by #3896 because overall score worsened vs #3894 |
| 2026-06-23 · `94956a2c9` · deployed crawl after #3894 | 155/290 | 44/50 | 6/50 | 2/40 | not separately promoted | `out/reality-crawl-94956a2c/report.html` · current safer baseline restored by #3896 |
| 2026-06-23 · `497848f2` · deployed crawl after #3897 | 156/290 | 48/50 | 3/50 | 1/40 | 84/100 data+strategy | `out/reality-crawl-497848f2/report.html` · source-owned structured rows improved tables but charts/graphs remain the quality blocker |
| 2026-06-23 · `f0ae3083` · Apex smoke before visual-graph candidate | 31/58 | 10/10 | 0/10 | 0/8 | 12/20 data+strategy | `out/reality-crawl-smoke-apex/summary.json` · repaired harness captured real deployed answers |
| 2026-06-23 · `036693168` · tenant matrix only | 49/50 current columns | — | — | — | 5/5 | report blocked: `reality-crawl.mjs` + bank are open in PR #3881, not on `origin/main` |

---

## Step log (newest first)

Each landed step: what changed, the root cause it fixed, the PR, the gate/crawl delta, the report link.

- 2026-06-23 · Shared Ava conversation thread (PR pending): changes the canonical
  `AvaAsk` from a single latest-answer panel into a visible Q/A thread, clears
  the composer after submit, preserves multi-line prompts, and makes Intelligence
  v2 use the same shared component as Home instead of duplicating ask/render state.
  Root cause: the backend stored session turns, but the UI only kept one answer
  in state (`answer`/`agentAnswer`), so each new response replaced the prior
  visible turn. Gate/crawl delta: focused component tests pass 4/4 and scoped
  lint passes. Not marked green until deployed Home + Intelligence screenshots
  show multiple turns retained for all five tenants. Release record:
  `docs/releases/records/2026-06-23-shared-ava-thread.md`.
- 2026-06-23 · Home KNOW crawl-quality follow-up (PR pending): tightens Home KNOW mode
  selection so more factual visual/data/application/vendor/cloud/security questions route
  through deterministic read-model retrieval, keeps row-level citations ahead of coverage
  citations, adds honest record-distribution chart fallback when precise chart fields are
  missing, and returns a medium-confidence relationship graph from loaded edges instead of
  empty prose when a graph prompt does not match a narrower edge family. Root cause:
  deployed #3904 proved the backend visual path, but the 190/290 crawl still showed misses
  from query classification and overly narrow chart/graph source selection, especially on
  SkyHarbor. Gate/crawl delta: targeted Home KNOW unit tests pass 7/7; scoped lint passes.
  Not marked green until deployed app tenant matrix + reality crawl/report prove the lift.
  Release record: `docs/releases/records/2026-06-23-home-know-reality-crawl-quality.md`.
- 2026-06-23 · Home KNOW release-bar follow-up (PR pending): after #3910 deployed
  at ACA revision `ca-abarva-web-lab-eastus--m0d558394`, the signed-in reality
  crawl improved from the user-supplied 220/290 baseline to 236/290, but still
  failed the release bar. This follow-up fixes the three concentrated blockers:
  exact-value gap prose now scores as honest instead of fabricated, Home foreign
  tenant prompts are fenced against the signed-in tenant identity before the
  expert/general path can run, and Home packet read-model fetches run sequentially
  to avoid ACA/Postgres connection-pool spikes that produced blank SkyHarbor
  answers under crawl concurrency. Gate/crawl delta: scoped lint passes, Home KNOW
  tests pass 10/10, release check passes; repo-wide `tsc --noEmit` remains blocked
  by pre-existing missing declarations for `js-yaml`, Azure Document Intelligence,
  and `@axe-core/playwright`. Not marked green until merged, deployed, and the
  deployed reality crawl/report prove the lift from 236/290. Release record:
  `docs/releases/records/2026-06-23-home-know-release-bar-followup.md`.
- 2026-06-23 · Home KNOW backend seam candidate (PR pending): adds the shared
  `HomeKnowResponse` contract, `/api/home/know/ask`, SQL Home read-model views,
  expected-field gap metadata, server-owned intent classification, deterministic
  packet/table/chart/citation/gap assembly, backend safety validation, and the
  live `scripts/qa/home-know-data-gate.mjs` GO/NO-GO script. It also removes the
  first-cut Home hook from `/api/intelligence/ask`, so Home KNOW no longer rides
  through the Intelligence synthesis path. Root cause: Home was using the shared
  consultant/synthesis path and could blur KNOW vs DECIDE; the FE/BE seam needed
  a stable backend-owned contract before frontend work. Gate/crawl delta: targeted
  unit tests pass 6/6, scoped lint passes, release check passes; live data gate is
  blocked locally because DB env is unavailable and must run inside the private
  VNet. Not marked green until migration + live data gate + deployed tenant matrix
  + reality crawl screenshots prove all five tenants. Release record:
  `docs/releases/records/2026-06-23-home-know-mode-read-model.md`.
- 2026-06-23 · Visual source-selection candidate (PR pending): expands the canonical structured-fact retriever so
  visual application, vendor, initiative, value-at-stake, and dependency wording retrieves the existing
  Postgres-backed source rows instead of relying on model-emitted Markdown. Adds a deterministic application-count
  by function aggregate for chart-by-domain questions. Root cause: #3897 proved source-owned tables but chart/graph
  questions often missed the structured source rows entirely, so the renderer had nothing truthful to draw.
  Gate/crawl delta: targeted unit tests pass; not marked green until deployed app matrix + reality crawl prove the
  chart/graph lift across all five tenants. Release record:
  `docs/releases/records/2026-06-23-brain-contract-visual-source-selection.md`.
- 2026-06-23 · Home KNOW readability + matrix expert-probe alignment candidate (PR pending): after
  #3907 deployed at ACA revision `ca-abarva-web-lab-eastus--m90ba1a2c`, signed-in Apex browser
  proof showed Home and Intelligence keep two visible Ask Ava turns and clear the composer. The
  all-tenant matrix then proved render, Intelligence v2, 19 dimensions, grounded tenant citations,
  raw-ID blocking, and tenant fence for 5/5 tenants, but failed `readable`, `visual`, and `experts`.
  Root cause: Home KNOW prose was deterministic but too compressed for the consultant-readability
  gate, and the matrix was requiring experts from a Home KNOW lookup even though the Home backend
  contract blocks contributing experts. Candidate shapes Home KNOW prose as `Read:` / `Evidence:`
  and moves the expert probe to the Intelligence-mode ask path. Not marked green until merged,
  deployed, and the signed-in matrix flips on the deployed app. Release record:
  `docs/releases/records/2026-06-23-home-know-readable-gate-alignment.md`.
- 2026-06-23 · Source-owned typed visual candidate ([#3897](https://github.com/abarva-platform/abarva/pull/3897)): adds optional structured rows/columns/chart/graph
  hints to `AskSource`, populates them from Postgres-backed application, vendor, renewal, and initiative
  retrievers, and makes `buildStructuredExhibits` render visuals from those cited source rows before falling
  back to Markdown tables or evidence-required tables. Root cause: #3894 made charts/graphs renderable, but
  answer quality still depended on the model emitting a perfect table; #3895's second-pass model synthesis
  was deployed and matrix-green but lowered the deep crawl to `150/290`, proving model-call fallback is not the
  scalable fix. Gate/crawl delta after deploy: tenant matrix 5/5, post-deploy crawl 0 P0/P1/P2, deep crawl
  `156/290` with tables `48/50`, charts `3/50`, graphs `1/40`. Release record:
  `docs/releases/records/2026-06-23-brain-contract-source-structured-visuals.md`.
- 2026-06-23 · Rolled back typed exhibit synthesis ([#3896](https://github.com/abarva-platform/abarva/pull/3896)):
  reverted #3895 after deployed deep crawl regressed from #3894's `155/290` to `150/290`. Runtime proof after
  rollback: ACA revision `md92b1cdf`, digest `sha256:9625eb2a...`, 100% traffic; signed-in tenant matrix passed
  5/5. Release records: `docs/releases/records/2026-06-23-brain-contract-typed-exhibit-synthesis.md` and
  `docs/releases/records/2026-06-23-revert-typed-exhibit-synthesis.md`.
- 2026-06-23 · Typed visual graph plumbing ([#3894](https://github.com/abarva-platform/abarva/pull/3894)):
  repaired reality-crawl auth to use Playwright storage-state sessions and `tabId`, routed `AgentAnswer.graphs`
  through the API, and rendered relationship graphs in the canonical renderer. Deployed proof: tenant matrix 5/5;
  deep crawl `155/290`, tables `44/50`, charts `6/50`, graphs `2/40`. This proved the render path but not enough
  source-owned visual depth.
- 2026-06-23 · Visual/graph contract candidate (PR pending): repairs `reality-crawl.mjs` to use the same signed-in
  Playwright storage-state session and `tabId` path as `tenant-matrix-gate.mjs`, adds a timeout so one stuck answer
  cannot hang the run, strengthens rich visual prompting so chart/graph questions must emit valid Markdown data tables
  when evidence supports them, converts relationship tables into typed `AgentAnswer.graphs`, and renders graphs in the
  canonical `AgentAnswerRenderer`. Root cause: the matrix gate proved final rendered shape, but the deep crawl first
  produced false empty answers via cookie-only auth, then showed the live visual path still passed tables while chart
  and graph categories were 0 for Apex. Gate/crawl delta: candidate not marked green until deployed and all five tenants
  pass matrix plus reality crawl/report. Release record:
  `docs/releases/records/2026-06-23-brain-contract-visual-graph-contract.md`.
- 2026-06-23 · Final-answer proof alignment candidate ([#3891](https://github.com/abarva-platform/abarva/pull/3891)): strips orphan pipe-table
  fragments from final `AgentAnswer.prose` and updates the tenant matrix plus reality crawl to
  score the final `AgentAnswer` that Home/Intelligence render, not transient stream text. Root
  cause: after #3888, Apex/SkyHarbor/Meridian/Lakeshore were all green, but First Capital still
  showed red because incomplete streamed table text and final rendered answer text could diverge.
  Gate/crawl delta: not marked green until this candidate deploys and all five tenant rows pass.
  Release record: `docs/releases/records/2026-06-23-brain-contract-final-answer-proof.md`.
- 2026-06-23 · QA raw-ID detector + deployed crawl proof ([#3890](https://github.com/abarva-platform/abarva/pull/3890)): tightens the shared
  `RAW_ID` detector used by `tenant-matrix-gate.mjs` and `reality-crawl.mjs` so long
  tenant-prefixed IDs such as `APEXRETAIL-DATA-0011` count as public-answer leaks.
  Root cause: the previous regex only matched short 2-6 character prefixes, so the
  reality crawl over-counted passes. Deployed proof after rescoring the captured corpus:
  tenant matrix remains `MATRIX FAILED — 1/5 tenants` with First Capital `visual` red;
  reality crawl is `147/290` overall, with tables `45/50`, charts `4/50`, graphs `0/40`,
  and raw-ID leaks on Apex (5), Meridian (2), and Lakeshore (4). HTML report:
  `out/reality-crawl/report.html` with 15 signed-in screenshots under
  `out/reality-crawl/shots/`.
- 2026-06-23 · Readable section normalization candidate ([#3888](https://github.com/abarva-platform/abarva/pull/3888)): normalizes live model section
  variants like `Evidence — what's actually in your estate:` and inline `Implication:` / `Next move:`
  markers into the canonical consultant paragraph shape after typed table extraction. Root cause:
  Apex-style inline tables could be lifted into `AgentAnswer.tables` while leaving the surrounding
  prose as a dense or malformed paragraph, so the final answer looked less like an expert consultant
  even when the evidence and renderer were working. Gate/crawl delta: not marked green until the
  candidate is deployed and tenant-matrix + reality-crawl screenshots prove it for all five tenants.
  Release record: `docs/releases/records/2026-06-23-brain-contract-readable-sections.md`.
- 2026-06-23 · Answer render-safety candidate ([#3886](https://github.com/abarva-platform/abarva/pull/3886)): adds a shared `AgentAnswer`
  render-safety pass to remove duplicated consultant labels (`Read: Read:`) and internal record
  syntax (`clients[...]`, UUIDs, `client_id`, raw record IDs) from prose, citation chips, table
  cells, gaps, actions, and graph labels before the canonical renderer displays them. Root cause:
  response-policy and exhibit fallback code could shape useful content but did not enforce a
  final public-answer contract at the renderer boundary. Gate/crawl delta: not marked green until
  deployed-app tenant matrix + screenshots are available. Release record:
  `docs/releases/records/2026-06-23-brain-contract-answer-safety.md`.
- 2026-06-23 · Step 0 audit baseline ([#3884](https://github.com/abarva-platform/abarva/pull/3884)): read the runbook/contract/progress/gate/source files, ran
  `tenant-matrix-gate.mjs` signed-in against `https://app.abarva.ai`, and recorded the live
  baseline. Root cause found: proof harness is incomplete on `origin/main` because
  `reality-crawl.mjs` and `reality-crawl-bank.mjs` are still in open PR #3881; current deployed
  product also has a non-durable `visual` path (First Capital failed the live gate). Audit:
  `docs/build/BRAIN_CONTRACT_AUDIT_2026-06-23.md`. HTML report: blocked until crawl runner lands.
