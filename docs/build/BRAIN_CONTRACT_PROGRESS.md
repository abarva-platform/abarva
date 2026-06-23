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
| 1 · substrate / `dims19` | 🟥 | 🟥 | 🟥 | 🟥 | 🟥 | — |
| 2 · retrievable / `grounded` | 🟥 | 🟥 | 🟥 | 🟥 | 🟥 | — |
| 3 · one engine / `experts` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 4 · one voice / `readable` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 5 · exhibits / `visual` | 🟥 | 🟥 | 🟥 | 🟥 | 🟥 | — |
| 6 · continuity (to add) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 7 · honesty / `fence`+`noRawId` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| render / intel (pages) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |

> Seed values above are the *expected* starting state (dims rolled-up at 8, exhibits suppressed,
> grounding hedging). Replace with the real first gate run, then update as fixes land.

## Reality-crawl pass rates (the deep test)

Re-run `reality-crawl.mjs` + `reality-crawl-report.mjs` after each foundation fix; paste the
overall + the exhibit categories here, and link the HTML report.

| Run (date · SHA) | overall | table | chart | graph | grounded | report |
|---|--:|--:|--:|--:|--:|---|
| _baseline_ | — | — | — | — | — | _link_ |

---

## Step log (newest first)

Each landed step: what changed, the root cause it fixed, the PR, the gate/crawl delta, the report link.

- _(append here)_
