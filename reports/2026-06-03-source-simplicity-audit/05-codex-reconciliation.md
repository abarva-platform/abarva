# Codex Cross-Check — Reconciliation

A second, independent code-grounded pass (Codex) was run in parallel. It is **~85% convergent** with this audit, which raises confidence on the shared findings. This doc records where the two agree (act on these now), where they conflict (resolved against code), and what Codex caught that this audit missed.

## 1. Convergence — high confidence, act on these

Both audits independently reached:

- **Subtraction, not addition.** The disease is "explain mode" — simultaneous explanations/labels/counters competing for attention, not too many features.
- **The workflow/structure is strong; the *experience* is noisy.** Keep the event-canvas skeleton (ID strip · stage rail · tabs · agent lane); calm the chrome.
- **Events vs Portfolio overlap** — the distinction isn't sharp enough; one should become a mode of the other.
- **Agent dock too assertive too early** — supports the workspace, shouldn't compete with it.
- **Evidence tab over-explains the seven-state model** — collapse by default, reveal on demand.
- **Gate tab reads like governance software** — keep the function, compress the procedural text.
- **Intake over-coaches** — agent-branded guidance cards explain the product, not the decision.
- **Internal language must leave buyer copy** — `deterministic`, `seed`, `scaffold`, `tier`, `minimum state`, `runtime`, codenames-as-labels.
- **Exports shouldn't occupy prime header real estate** — one calm menu.
- **A "clutter inventory" is the right foundation before the CXO Bible** — so the Bible describes the target, not today's noise.

These need no further validation — they're independently confirmed. → work the [leverage order](03-clutter-inventory.md#leverage-order-do-in-this-sequence).

## 2. Conflicts — resolved against the code

| Claim | Codex | This audit | Verdict |
|---|---|---|---|
| **`/source` behavior** | "Redirects to `/source/events`." | Local `/source/page.tsx` renders `SourceDecisionQueueView`. | **Prod proved Codex right** ([screenshot pass](06-screenshot-validation.md)): deployed `/source` **redirects to `/source/events`**. My local branch renders the Decision Queue instead → **branch/prod drift** (flag separately). Note: Codex's *credit* for the redirect is still misplaced — it sends `/source` to the **worst** page (Events), not the best (Queue). |
| **Sub-nav `Queue/Events/Portfolio`** | "Lean and understandable. Good restraint." | Three peer tabs = the overlap problem. | **This audit, and Codex agrees with itself later** ("Events vs Portfolio feel too close"). The 3-tab nav is what to rationalize, not praise. Resolve to: Decision Queue (act-mode home) + Portfolio (analysis mode); retire Events. |
| **Cleanest reference surface** | Log tab. | Vendor detail (4.0/5). | **Both, scoped:** vendor detail = cleanest *page* (the page-level target); Log tab = cleanest *tab within the canvas*. Use vendor detail as the page benchmark. |

## 3. Net-new from Codex — verified and adopted

- **Value page leaks (`computeBaseline()`, `runtime`, `seed`)** — verified at [value/page.tsx:101](src/app/(maestro)/source/events/[eventId]/value/page.tsx#L101) and [SourceValueLedger.tsx:388,399](src/components/source/SourceValueLedger.tsx#L388). A **function name in buyer copy** is the worst single leak found. The value page was outside the original 10-route scope; now added as **L10–L11** in the [clutter inventory](03-clutter-inventory.md#tier-3--internal-label-leaks-reword-each-is-a-trust-paper-cut) and to the [element inventory](01-element-inventory.csv).
- **Concrete renames** — adopted into the inventory as a new **RENAME** verdict: "Capture to move forward" → "What we still need"; "Promote to X" → "Advance to X"; "Evidence readiness" → "Evidence".

## 4. Taxonomy merge

Codex proposed `Keep / Merge / Rename / Hide / Delete`; this audit used `KEEP / DEMOTE / MERGE / DELETE` (with rewording folded into DELETE rationale). Merged taxonomy going forward:

| Verdict | Meaning |
|---|---|
| **KEEP** | Load-bearing for the next decision. |
| **MERGE** | A sibling already says this → collapse. |
| **RENAME** | Right element, wrong words → reword (split out of DELETE; clearer). |
| **HIDE / DEMOTE** | Real but secondary → tooltip, overflow, collapse, or earn-before-show. |
| **DELETE** | No defensible purpose. |

Codex's "Why it exists" / "User value" columns are a good discipline; the existing CSV's `rationale` column carries that intent. No structural change needed.

## 4b. Where the screenshot pass corrected BOTH audits

- **Disclaimer stacking:** this audit *refuted* it from code (grep missed the shared AgentDock strings); Codex's instinct that warnings become wallpaper was right. The [screenshot pass](06-screenshot-validation.md) confirmed two banners stack on every agent-rail surface. **Refutation reversed.**
- **Data inconsistency (Tier 0):** neither audit caught from code that the three home scorecards *contradict* each other (3 events/$74M vs 2 events/$39M). Only visible live. Now the lead finding.

## 5. Net effect on the headline findings

Unchanged and now **double-confirmed**: page sprawl (4 homes / 2 KPI vocabularies / 2 event-detail impls), redundant status conveyance, internal-label leaks. The reconciliation **strengthened** finding #1 (Codex's redirect misread actually revealed the `/source`≡`/source/queue` duplication is even more clearly a duplication) and **added** the value page as a fifth leaky surface.
