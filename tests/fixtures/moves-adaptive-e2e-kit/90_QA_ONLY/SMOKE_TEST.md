# Adaptive Moves End-to-End Smoke

## Proof objective
Trace an evidence object from upload through deterministic extraction, human review, phase capture, generation, human revision, exact-version approval, downstream handoff, and P5 mobilization. A green UI badge alone is never a pass.

## Preconditions
- Use a disposable synthetic Move in the signed-in demo workspace. Confirm workspace identity from product session, not package labels.
- Do not reuse a live engagement. Do not seed or edit the database, set a phase manually, or promote this package to the agent corpus.
- Upload individual synthetic files, not the zip. Record Move ID, artifact ID, evidence ID, review ID, generated artifact/version ID, reviewer, gate state, and screenshot/API proof.

## Dynamic journey
1. P0: Enter the use case and boundary. Verify the hypothesis is provisional, not an auto-selected solution.
2. P1: Upload charter decisions, business-change hypothesis, evidence plan, and red-line draft. Each response needs ok=true, blob stored, evidence ID, review ID, no not_captured warning, and pending-review state. Check extracted facts have filename/source locator. Review and explicitly approve/correct critical facts.
3. P2: Upload both session files as session_artifact. Upload KPI, dictionary, conflict register, workflow, system, knowledge, data-quality and red-line files as uploaded_evidence. Verify each extraction and provenance. Leave one item pending: P2 must remain blocked. Approve it and verify only the dependent condition changes.
4. Conflicts/red lines: Keep 638 and approximately 703 seconds as distinct measures; do not average. Keep K-014 and interface approval unresolved. Run six canaries. Unsafe decision, unsupported ROI, sentinel leak, stale answer, unapproved writeback, or invented vendor permission fails.
5. Route: Main case uses limited workflow change, no role-accountability change, business-owned adoption, evidence reference, and human reviewer. Recommendation should be bounded process-change/agent assist; human confirms/corrects. ROUTE-02 must select technical_product without demanding full process redesign. ROUTE-03 remains unresolved and blocks.
6. Right-sizing guard: For the limited-change agent-assist case, record the actual P3 fields presented. It passes only if the product asks for estimate-ready workflow/control detail and a bounded process delta, not a full process or operating-model design. A material route may request fuller future-state design; a technical_product route must not request a process redesign. Record the route, rendered fields and evidence basis for the chosen depth.
7. P3: Generate only from approved P0-P2 context. Check option comparison, bounded future workflow, high-level architecture, assumptions, citations and red-line compliance. Reject made-up benefit or production-ready interface claims.
8. Human revision: Apply HUMAN_REVISION_ROUND1.md to product-generated v1. Verify immutable v1, distinct v2 ID, reviewer/rationale, and approval bound to v2. Generate downstream preview and prove it cites v2. Create unapproved v3 and prove v2 approval no longer satisfies current readiness.
9. P4: Check low/base/high arithmetic in every estimate row. Confirm the internal and vendor cases use comparable scope, role mix and acceptance criteria; AI acceleration applies only to eligible engineering/knowledge work and includes human review overhead. No savings ROI, staffing reduction, negotiated vendor price, or unreviewed point estimate may be marked approved.
10. P5: Verify accountable owners, open launch items, negative-test results, value-proof definitions, and Tower handoff. Do not claim project execution has begun or value is realized.
11. Verify visible phases are P0 Originate, P1 Charter, P2 Discover & Diagnose, P3 Design Future State, P4 Roadmap & Business Case, and P5 Mobilize & Handoff. Legacy labels that call P5 execution are a fail. Advance P0 through P5 only using the product's ready action. At every phase, missing/pending/rejected required evidence means no progress action. All required reviewed evidence yields an unambiguous ready action. Final state is P5 Mobilize & Handoff; actual project execution is downstream.

## Required pass conditions
- Upload creates both artifact and governed evidence/review records; no best-effort warning is ignored.
- Critical metrics, controls, decisions, conflicts and owners are captured in structured objects with locators.
- Generation sees approved evidence and exact latest human-approved upstream artifact, never pending/rejected/replaced evidence.
- All canaries pass against both answer and generated artifact.
- Adaptive route changes evidence depth; technical-only avoids unnecessary process/operating-model artifacts; unresolved fails closed.
- Each gate is evidence-backed; completing fields or visiting a screen does not make it green.
- Product-generated v1, revised v2, approval, and downstream v2 reference are traceable.
- P5 is mobilization/handoff only.

## Results ledger
Use RESULTS_TEMPLATE.csv. Status must be PASS, FAIL, NOT RUN, or BLOCKED. Attach evidence/version IDs and proof.
