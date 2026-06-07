# How to fill — Leadership & Org

**What this becomes:** `person` facts + `reports_to` graph edges in the tenant context.
**Questions it makes answerable:** "Who is our CEO/CFO/CIO/CDAO?", "Who approves IT spend?",
"How big is the security team?", "Who runs Meridian West Hospital?", "What's the org structure in Finance?"

## Fields
| Field | Required | What to enter | Good example | Avoid |
|---|---|---|---|---|
| `person_name` | yes | Full name | `David Chen` | `CFO` (that's the title) |
| `title` | yes | Exact title | `Chief Financial Officer` | `Finance guy` |
| `function` | yes | One of: Executive, Finance, Operations, Clinical, Nursing, IT, Data, Strategy, HR, Legal | `Finance` | free text |
| `role_level` | yes | C-suite \| EVP \| SVP \| VP \| Director | `C-suite` | `senior` |
| `reports_to` | yes (except CEO) | The manager's name (or title if name unknown) | `Maria Alvarez` | blank for non-CEO |
| `entity` | yes | `System` or the hospital/plan name | `Meridian West Hospital` | blank |
| `team_fte` | when known | Headcount they own | `310` | guesses with no basis |
| `budget_owned_usd` | when known | Annual budget they own | `76000000` | `$76M` (use the number) |
| `decision_rights` | recommended | What they approve | `Approves capital >$1M` | |
| `source` | yes | The file/sheet this came from | `exec-roster.csv` | blank |

## Realism (so it matches an org of this size)
Use the tenant **org profile** (`org-profile.template.csv`) to sanity-check counts:
- **C-suite count** scales with size. Meridian (the worked example) is **~$11.2B revenue,
  23 hospitals, 6,800 beds, 42,000 FTE** (`src/data/meridian.ts`) → roughly **14–20** system
  C-suite, **plus** a CEO (and usually CMO/CNO) **per hospital/entity**, and **60–120 VPs**.
  A single-hospital community provider may have 6–9 C-suite total.
- **Budgets must align:** IT leader's `budget_owned_usd` ≈ **3–5% of revenue** — Meridian's IT
  budget is **$340M (3.0% of $11.2B)**; CISO/security ≈ **$34M, ~60 FTE**.
- **Every non-CEO has a `reports_to`** — the chain must resolve to the CEO (no orphans).
The loader **warns** (not blocks) when counts/budgets fall outside the expected band for the
org profile; override with a note (kept as provenance).

## Minimum viable roster (don't overthink — start real, start simple)
At minimum load the C-suite + each entity's CEO + the 1–2 VPs per function you can name.
You can deepen later; partial is fine and the agent will answer what's loaded and say what's missing.
