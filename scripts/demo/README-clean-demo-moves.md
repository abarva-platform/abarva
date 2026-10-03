# Meridian clean demo Move set

`clean-demo-moves.ts` is a **reviewable content spec** for a small,
realistic Strategic Moves portfolio to show a client. It replaces the test-named
/ placeholder moves that currently clutter the Meridian demo board (e.g.
"Synthetic Agent Assist Claude E2E 1002"; charter text like "ROLE-01 …
authority_matrix.csv") with five moves a healthcare CXO would recognise.

## The five moves

| Code | Name | Entry | Sponsor role | Value stance |
|---|---|---|---|---|
| MER-2026-GOV-DATA | Governed data foundation for AI / LLM automation | P1 Charter | Chief Data & Analytics Officer | foundation enabler, to be validated |
| MER-2026-CALLCTR | Call center optimization | P2 Discover | Chief Experience Officer | to be validated |
| MER-2026-PAYINT | Payment integrity and leakage reduction | P1 Charter | VP Payment Integrity | to be validated |
| MER-2026-COST-TRANSP | End-to-end cost transparency | P0 Originate | Chief Financial Officer | no funded value at Originate |
| MER-2026-AGENT-ASSIST | Member Service Agent Assist Transformation | P2 Discover | Chief Experience Officer | candidate, not funded |

## Grounding and honesty

Every move is drawn from the interview-derived candidate opportunities in
`datasets/tenant-inputs/meridian-health/derived/module-context/moves-context-view.json`.
Systems, data domains, open evidence and the boundary come from that artifact —
not invented. The source is explicit that interview support "does not create
approved funding, realized value, or program execution status", so this set:

- stays in **early phases (P0–P2)** — nothing is staged into Design/Roadmap/Mobilize;
- asserts **no funded value** (value is "to be validated" / "candidate, not funded");
- names each move's **open evidence** honestly.

That keeps the demo aligned with the evidence-gate discipline that is the
product's actual differentiator — never a false green.

## Applying it (coordinated — NOT a solo step)

This file does **not** touch the database. Loading these onto the live board is a
mutating operator data-build on the Meridian tenant, which:

- goes through an **ACA data-build job** (per `docs/ops/aca-data-build-job-rule.md`),
  not a product web request or a local `az containerapp exec`;
- must be **coordinated with the workstream actively advancing that tenant's
  evidence/phase state** (see PR #8907 "require evidence before phase
  transitions") so the two do not collide — decide together whether to clean the
  existing test-named moves first, and upsert these idempotently by
  `initiativeLink` (the `MER-MOVE-…` id);
- should reuse the proven seed machinery in `scripts/seed-apex-demo-move.ts`
  (engagement + phase-pack + sponsor upserts), parameterised by the five entries
  here, rather than a new untested loader.

### Suggested load contract

1. Dry-run the loader (prints the intended upserts; no DB write).
2. Archive/remove the test-named moves (`… E2E <n>`, "Synthetic … E2E …").
3. Upsert the five moves by `initiativeLink`, seeding each at its `entryPhase`
   with the charter content here for P1+ moves.
4. Verify on the signed-in board: five moves, realistic names, honest early
   phases, no placeholder charter text.

Until that coordinated job runs, nothing changes on the live board.
