# Brain Contract — progress tracker

**This file is the single source of progress truth.** Update it in the SAME PR as each fix
(check the cells, link the PR, link the proof). Status legend: ⬜ not started · 🟡 in progress ·
🟥 red (gate fails) · 🟩 green (proven on the deployed app). "Proven" = matrix column green for
that tenant AND a signed-in screenshot in the HTML report.

Contract spec: `docs/build/BRAIN_CONTRACT.md` · Gate: `scripts/qa/tenant-matrix-gate.mjs` ·
Deep test: `scripts/qa/reality-crawl.mjs` → report `scripts/qa/reality-crawl-report.mjs`.

---

## Conformance matrix (invariant × tenant)

Cells = current status on the **deployed** app. Keep this in sync with the live gate run.

| Invariant (column) | Apex | First Capital | SkyHarbor | Meridian | Lakeshore | PR |
|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 · substrate / `dims19` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; screenshot report pending |
| 2 · retrievable / `grounded` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; screenshot report pending |
| 3 · one engine / `experts` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) gate-only baseline; code assertion pending |
| 4 · one voice / `readable` | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | [#3886](https://github.com/abarva-platform/abarva/pull/3886) answer-safety deployed; follow-up readable section candidate in progress; all-green proof pending |
| 5 · exhibits / `visual` | 🟡 | 🟥 | 🟡 | 🟡 | 🟡 | [#3884](https://github.com/abarva-platform/abarva/pull/3884) First Capital failed live gate on 2026-06-23 |
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
| 2026-06-23 · `036693168` · tenant matrix only | 49/50 current columns | — | — | — | 5/5 | report blocked: `reality-crawl.mjs` + bank are open in PR #3881, not on `origin/main` |

---

## Step log (newest first)

Each landed step: what changed, the root cause it fixed, the PR, the gate/crawl delta, the report link.

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
