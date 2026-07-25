# AbarVa Golden Health System — Enterprise Profile

**Tenant key:** `internal-golden`
**Last updated:** 2026-07-24
**Reviewed by:** Synthetic fixture — no human review required (regression/demo fixture, not a client engagement)
**Data classification:** Internal / Internal-Fixture

## Purpose of this tenant

This is the **Golden Move fixture tenant**, created per `docs/architecture/MOVES_OPERATING_MODEL.md`'s
"Golden Move" proposal. It exists solely so that regression testing, demo walkthroughs, and evidence
phase-scoping proofs never again need to touch a real client tenant or a disputed Move (see the
MEMBER AI ASSIST fabrication-incident remediation record for why this matters). Every value below is
fictional and generated for this purpose. `internal-golden` is not a client and must never appear in
any client-facing portfolio view, billing record, or pilot report.

## At-a-glance

| Field | Value |
|---|---|
| Legal name | AbarVa Golden Health System (fictional) |
| Ownership type | Not-for-profit integrated delivery network with for-profit subsidiaries (fictional) |
| Headquarters | Denver, Colorado |
| Founded | 1974 (fictional); current holding-company structure formed 2009 (fictional) |
| Annual revenue | $54.2B FY2026 (synthetic — sized to the AbarVa substrate volumetric standard) |
| Employees | 142,000 |
| Employed physicians | 9,600 |
| Staffed beds | 7,200 |
| Hospitals | 42 across Colorado, Utah, Arizona, New Mexico |
| Covered lives (health plan) | 2.1M |
| Annual ambulatory visits | 21.4M |

## Tenant personality

AbarVa Golden Health System is a fictional $54.2B integrated delivery network with a
provider-sponsored health plan, deliberately built at the same Healthcare / "Member AI Assist"-style
archetype and scale as the Meridian Health System fixture, but as its own permanent, internal-only
regression asset. It operates 42 hospitals across Colorado, Utah, Arizona, and New Mexico, runs a
mixed Epic/Oracle Health clinical estate, and carries a member-facing AI assist program (the Golden
Move's subject matter) analogous in shape to MEMBER AI ASSIST, without being that Move or that data.

## Golden Move usage

- Regression: does a code change break the Evidence → Knowledge → Decision → Approval loop end to end.
- Demo: safe to screenshot, safe to show a prospect, safe to hand to a new engineer.
- Proof: real (synthetic) evidence uploaded and approved across at least two phases, so cross-phase
  evidence-scoping tests always have real data to run against.

This tenant is excluded from client-facing portfolio views and reports by construction (tenant key,
not a status flag), per `docs/architecture/MOVES_OPERATING_MODEL.md`.
