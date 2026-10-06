# Clean Demo Move Set

This is a five-Move synthetic reference portfolio for product demonstration. It
is grounded in the registered demo intake and candidate-opportunity analysis,
but it is not client-attested evidence, approved scope, a measured baseline, or
an approved investment.

## Content Contract

The five entries cover governed data foundations, contact-center optimization,
payment integrity, cost transparency, and member-service agent assistance. Each
has a stable `graph_node_id`, a human-facing display code, an archetype, and
explicit open-evidence items. Four carry a P1 charter scaffold; the Originate
entry correctly has no P1 capture.

Every entry is synthetic reference material. The load keeps projected value
null, value verification pending, gates empty, lifecycle `shaping`, and current
phase at the entry phase (P0–P2). Evidence gaps remain open. Sponsor records
are informational contacts with observer authority; phase-progress email is
disabled until a user explicitly configures it. All approvals belong to an
authorized workspace user.

Charter scaffolds are copied to `engagements.charter`. P1 sections are mapped
to `program_modules` as tagged `synthetic_reference_draft` content with empty
capture `value`, status `not_started`, `requires_human_review=true`, and no gate
credit. This keeps reusable content available without presenting it as captured
client input or a completed step. `business_change_assessment` remains open.

## Governed Load

The planner is intentionally read-only:

```bash
npx tsx scripts/demo/load-clean-demo-moves.ts --json --clean-test
```

Apply only through the shared digest-pinned ACA operator job, using
`scripts/demo/clean-demo-moves-aca-job.ts` and the contract in
`docs/ops/aca-data-build-job-rule.md`. The job resolves the canonical tenant
declared in `tenant-input-registry.json` through the code-owned tenant alias
registry. Both `clients.tenant_key` and `clients.slug` must resolve to that
same canonical key, and exactly one client row may match. It prints the exact
test-move archive candidates in a read-only preflight, and
requires the apply run to present the same archive-plan hash. It archives via
`lifecycle_state='archived'` (never hard-deletes or overloads legacy `status`),
then inserts or idempotently reuses the five graph IDs in one transaction.

The apply path refuses to overwrite an existing clean graph ID if its tenant,
phase, lifecycle, value, gate, evidence, attachment, deliverable, snapshot, or
approval state differs from a fresh loader-owned candidate. It does not create
evidence, approvals, phase snapshots, or deliverables. A successful run emits
validation and quality-gate output, per-step progress, and a Blob proof bundle.

Verify the signed-in Moves board independently after the job. Database readback
and a successful job are not proof of what the user sees; confirm the five
display names, early phases, null/pending value, real charter text, and open
evidence on the authenticated board.
