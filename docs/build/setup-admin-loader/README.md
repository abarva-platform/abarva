# Setup/Admin Loader — design + exemplar

Start here: **`DESIGN.md`** (the loader framework: per-dimension template anatomy, two
intake lanes, the proportionality engine, the visible intake state machine, and the
retrieval-proof "definition of done").

Worked exemplar (copy this anatomy to all ~24 dimensions):
- `templates/leadership-org/` — schema (`*.template.csv`), `HOW_TO_FILL.md`, `golden-questions.md`
- `templates/kpi-register/` — schema, `HOW_TO_FILL.md`, **`provider-payer-metric-catalog.md`** (role→KPIs depth), `golden-questions.md`
- `org-profile.template.csv` + `realism-ranges.md` — the proportionality backbone (exec counts, IT budget, KPI counts scale to org size + industry)

Principle: perfect **intake** first (realistic, proportional, deep, citeable); attaching it
to Sentinel/Nexus is downstream. "Done" = the golden questions answer grounded + cited.

## UX / workflow
- **`UX_WORKFLOW.md`** — the Admin-loader workflow: three on-ramps (drop zone · dimension-targeted · direct-to-Blob via Azure Storage Explorer), the 4 calm states, the batch-review contract, confidence→(auto/confirm/ask) thresholds, and the IT exception path. Apple-simple; governed underneath.
- **`wireframe.html`** — low-fidelity screens (Add → Understanding → Here's what I found → Clarify → Loaded → Azure-Storage exception). Locked design system.
