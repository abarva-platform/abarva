# aVa Context Contract — Knowledge, airline-demo-new

What governed context aVa needs, per mode/lens, to answer grounded questions without hallucinating — and what
is missing today. Grounded in `clients/shared/20-phase3c2d-consumption-contracts/
AVA_KNOWLEDGE_PACKET_MAPPING.xlsx` (worktree `nexus-consumption-3c2d`) and
`src/lib/governance/context-corpus-policy.ts` (this branch, real shipped code).

**The two documents disagree on maturity, and both are right about their own scope.** The governance-policy
contract (`GovernedObject`, `evaluateGovernedObject`, `buildValidatedAgentContextBundle`) is real, shipped,
enforced code — the _filtering_ discipline aVa needs is not a gap. The _packet_ aVa would filter — the
tenant-specific `module_knowledge_packet_v1` content — is the gap. aVa today has a correct bouncer at the door
and nothing yet coming through it for this tenant.

---

## 1. The packet contract (what must be true before aVa may answer anything)

Per `AVA_KNOWLEDGE_PACKET_MAPPING.xlsx`, every aVa answer needs a `module_knowledge_packet_v1` instance with:

| Section          | Field                             | Requirement                                                 | Status for airline-demo-new                                                                                                              |
| ---------------- | --------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `packet_header`  | `knowledge_baseline_ref`          | required                                                    | Not confirmed populated (packet absent from populated-object breakdown)                                                                  |
| `packet_header`  | `domain_publication_versions`     | required                                                    | Same                                                                                                                                     |
| `packet_header`  | `consumption_projection_versions` | required                                                    | Same                                                                                                                                     |
| `packet_header`  | `cube_semantic_model_version`     | required when metrics queried                               | Same, and metrics themselves are broken (SD-06)                                                                                          |
| `tenant_context` | `executive_perspective`           | optional                                                    | Structural gap — no structured interview source exists                                                                                   |
| `facts`          | `accepted_fact_refs`              | required, only accepted/published, never working candidates | Depends on which domain — applications/vendors/relationships are the strongest source, KPIs/risks are confirmed broken                   |
| `relationships`  | `relationship_edges`              | optional                                                    | Populated but with the SD-08/SD-14 unbacked-endpoint caveat                                                                              |
| `metrics`        | `metric_query_hashes`             | required when metrics used                                  | Blocked by SD-06                                                                                                                         |
| `evidence`       | `evidence_refs`                   | required, displayable, never hidden truth                   | Governance layer correctly separates hidden-truth from parser-visible content (audit Sec "what is correctly absent" confirms no leakage) |
| `gaps`           | `known_gaps`                      | required, missing/withheld/conflicting surfaced plainly     | Blocked by SD-05 (the gaps this field would report are themselves the ones that failed to publish)                                       |
| `safety`         | `blocked_sources`                 | required when any source withheld                           | Implemented at the governance-policy layer (`SENSITIVE_CLASSIFICATIONS`), not yet wired to a packet for this tenant                      |

**Rule:** aVa must refuse to answer, in every mode, until `packet_header` fully resolves. This is not a
degraded-mode fallback question — it is the literal gate the prototype's own "insufficient" answer models.

---

## 2. What each mode/lens needs, specifically

### Brief mode

aVa's role here is narrative interpretation (`consumption.strategic_interpretation_v1`) and the 6-part answer
contract triggered from a lens's "Ask aVa why" action. Needs: the lens's scoped facts (via `facts.
accepted_fact_refs` filtered to the lens's mapped BusinessFunction/Capability — itself GAP-09, not yet
governed), the metrics the lens's headline cites (blocked by SD-06 for KPI-heavy lenses like `irops`/`crew`),
and the evidence-gap context the lens's "why" block depends on (blocked by SD-05). **Concretely: the
prototype's own `why_irops` answer cites "six-hour roster staleness" and "recovery time not measured" — both
are exactly the KPI family that has zero published rows today. aVa cannot honestly generate this specific
answer until SD-06 is closed, not because the packet contract is wrong, but because the fact it would cite
does not exist yet.**

### Explore mode

aVa's role is the "Ask aVa about this slice" action from any inventory table, answering questions scoped to
one inventory type and its active filters. Needs: `accepted_fact_refs` scoped to the specific inventory object
and current facet selection. Readiness mirrors the underlying inventory table's own matrix-row status exactly
— e.g., a slice-question over the Risks table inherits SD-05's gap, a slice-question over Applications inherits
the SD-01/SD-02 data-quality caveats (a correct answer here should proactively flag "application_type includes
a data-quality label, not a clean taxonomy" rather than treat the field as reliable).

### Relationships mode

aVa's role is graph-scoped explanation ("Ask aVa about this dependency," "Ask aVa about this," from node/edge
drawers) plus NL-to-graph routing ("What breaks if the crew feed stays on a nine-hour cycle?"). Needs:
`relationship_edges` from the packet, each edge's evidence per `KNOWLEDGE_GRAPH_BINDING_CONTRACT.md` Section 3.
**A grounding-specific rule that must be enforced here, not assumed:** aVa must never answer a dependency
question by treating a `capability`-origin or `service_tower`-origin edge (SD-08, SD-14 — unbacked endpoints)
as equivalent evidentiary weight to a catalog-backed one. If the packet cannot distinguish
`endpoint_catalog_backed = true` from `false` (a field that does not exist in the registry today — see
Graph Binding Contract Section 1), aVa has no way to avoid citing a meaningless node as if it were governed
fact. **This is a concrete hallucination risk specific to this tenant's actual data, not a hypothetical.**

### Evidence & gaps mode

aVa's role is contextualizing the coverage/gap/contradiction lists ("Ask aVa to frame the options" from a
contradiction drawer). Needs: `known_gaps` (blocked by SD-05) and a Contradiction object that does not exist
yet (GAP-06) — aVa cannot "frame the options" for a contradiction that has no canonical representation of what
the two sides actually assert and who owns resolving it.

### "aVa" as its own surface (the dock, independent of which mode is behind it)

The dock's own scope banner, suggested questions, and free-text routing are covered in Sections 1, 3, and 4
below. This section exists to say explicitly: **the dock is mode-agnostic UI chrome; its grounding correctness
is entirely a function of whichever mode/lens's packet content is currently in scope**, which is why this
document is organized by mode/lens rather than treating "aVa" as a fifth independent surface with its own data
needs.

---

## 3. The refusal contract (the part that is closest to ready)

The prototype's `insufficient` answer (`ANSWERS.insufficient` in the source) is the single most implementable
aVa behavior in the entire surface, precisely because refusing correctly requires less, not more, from the
data layer than answering does: it only needs `known_gaps` to be honest about what's missing. Its four-part
shape:

1. **"Not answerable yet"** — states plainly the question cannot be answered from what is published.
2. **"What is present"** — names the accepted facts that DO exist, honestly, without overselling them.
3. **"What is missing"** — enumerates the specific missing inputs by name and owner, sourced from
   `known_gaps`.
4. **"What we will not do"** — an explicit guardrail statement: _"aVa will not apply an industry cost-per-bag
   figure to your event count and present the result as your number."_ This is a hard behavioral contract, not
   a UI copy choice — it must be enforced at the prompt-construction layer (never assemble a packet that lets
   the model substitute external/benchmark data for a tenant-specific claim without saying so explicitly), not
   left to the model's own discretion.

**Once `evidence_gap_v1` (SD-05) is fixed, refusal gets MORE common, not less** — a correctly-populated gap
registry should surface more "not answerable yet" responses than the current broken-empty state does, because
today's zero-gaps state makes everything look falsely answerable. This is worth stating explicitly since it
inverts the usual intuition that "fixing the data pipeline means more answers."

---

## 4. NL routing (free-text question box) — the weakest link today

The prototype's own `onAvaKey` handler is a literal keyword-match stub: it checks the typed question for
substrings like `"erp"`, `"retire"`, `"cost"`, `"risk"`, `"access"`, `"program"`/`"gate"`, and routes to one of
six hardcoded canned answers, falling back to the refusal case for anything else. **This is not a grounding
pipeline and must not be mistaken for one when scoping production work.**

Production needs, at minimum:

- Intent classification over the free-text question, scoped by the active lens/mode (not global).
- Retrieval against `consumption.search_document_v1` (registered, populated) to find candidate grounding
  facts.
- Packet assembly (Section 1) restricted to what the retrieval step actually surfaced — never the tenant's
  full knowledge base handed to the model unfiltered.
- A pass through `buildValidatedAgentContextBundle` / `evaluateGovernedObject` (real, shipped code in
  `context-corpus-policy.ts`) so `block`-decision objects never reach the model, exactly as they don't for any
  other agent today.
- A citation-verification step before the answer renders — every claim in "Answer"/"Why" must resolve back to
  a `source_basis` in the assembled packet, mirroring the `cited_render_verified_at` discipline the governance
  policy already requires for `agent_ready` status on any governed object.

**Render gate:** the free-text box may accept input at any time, but a submitted question that cannot be
classified with reasonable confidence, or whose retrieval returns no packet-eligible facts, must route to the
Section 3 refusal pattern — never to a best-guess canned answer, which is what the prototype's own stub does
today and which production must not carry forward.

---

## 5. Access-control behavior aVa must enforce

Already correctly specified at the governance-policy layer and must be preserved exactly as-is when the
packet-building pipeline is built:

- `SENSITIVE_CLASSIFICATIONS` (`pii`, `phi`, `restricted`) may never enter shared/`corpus_global` content, and
  restricted tenant content may only enter a packet for a user whose role clears it.
- A `block`-decision object (per `evaluateGovernedObject`) never reaches the model — this is enforced in code
  today (`buildValidatedAgentContextBundle`), not merely documented.
- `blocked_sources` in the packet must record _that_ something was withheld and _why_ (routed to an owner),
  without leaking the restricted content itself — matching the prototype's own "Restricted" evidence-drawer
  behavior (existence/state/owner visible, content withheld, access request routed).
- Real client names must never appear in any packet or aVa response (`CANONICAL_TENANT_KEYS`, cover-name
  discipline) — not a concern for a synthetic tenant like airline-demo-new specifically, but the packet
  construction pipeline must apply this rule uniformly regardless of tenant, per AGENTS.md's own instruction
  that this rule has "no tenant exceptions in any scanner/validator/report/test."

---

## 6. Summary: what's actually missing vs. what's already correct

| Layer                                          | Status                                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Governance filtering (what a model may see)    | **Correct and implemented** — real code, not a gap                                              |
| Refusal contract (how to decline)              | **Contract correct**, needs `known_gaps` to be real (SD-05)                                     |
| Packet contract shape                          | **Correct and well-specified** (`AVA_KNOWLEDGE_PACKET_MAPPING.xlsx`)                            |
| Packet population for airline-demo-new         | **Missing** — absent from the populated-object breakdown                                        |
| NL routing / retrieval / citation verification | **Missing** — prototype's own implementation is an admitted stub, not a design to build against |
| Per-lens/per-mode fact scoping                 | **Missing** — depends on GAP-09 (no lens-to-canonical-taxonomy mapping)                         |
| Graph-endpoint trust distinction for grounding | **Missing** — `endpoint_catalog_backed` field does not exist (Graph Binding Contract Section 1) |
