## Runtime integration note · Cycle 4 revision

**Added:** Cycle 4 canon revision session · April 24, 2026
**Addresses:** Conflict C8 from canon-vs-existing cross-check documented in commit `1653852`

This section clarifies how the Context Bundle's 12-step per-turn lifecycle integrates with the existing runtime implementation in `src/` and its specification in `docs/specs/platform/runtime-contracts/orchestrator.md`.

### The existing 6-phase pipeline

The existing `runPipeline()` function in the orchestrator has six phases: `parse` → `plan` → `retrieve` → `assemble` → `compose` → `render`. These six phases govern the lifecycle of every agent turn as currently implemented.

### Relationship to the 12-step bundle lifecycle

The Context Bundle's 12-step lifecycle specified earlier in this document is **not a replacement** for the existing pipeline. It is a detailed contract for what happens specifically inside the `retrieve` and `assemble` phases of `runPipeline()`, and for the specific inputs Claude must receive in the `compose` phase.

**Phase-to-step mapping:**

| Existing pipeline phase | Bundle lifecycle steps that execute here |
|---|---|
| `parse` | Step 1 (Identity resolution uses parsed authentication/route context) |
| `plan` | Step 9 (Quality scoring informs response planning) |
| `retrieve` | Steps 2 through 8 (Work Object / Workflow State / Business Context / Artifacts / Patterns / Evidence / Conversation retrieval) |
| `assemble` | Steps 9 through 10 (Quality scoring attached; bundle assembled for Claude) |
| `compose` | Step 10 continued (Claude invocation with structured bundle) |
| `render` | Step 11 (Response assembly with citations and indicators) |
| (post-pipeline) | Step 12 (Logging) |

### Implementation guidance for C4-D01

C4-D01 (Context Bundle 5-state runtime implementation) adds Context Bundle assembly as explicit behavior inside the existing `retrieve` and `assemble` phases. It does not rewrite `runPipeline()`. Implementation work:

1. Add bundle assembly functions callable from `retrieve` phase — one per bundle category (Identity, Work Object, Workflow State, Business Context, Artifacts, Patterns, Evidence, Conversation)
2. Add bundle quality scoring in `assemble` phase — compute the 6 dimensions plus the 5-state classification
3. Extend Claude invocation in `compose` phase to pass the structured bundle alongside the user prompt
4. Extend response rendering in `render` phase to surface context-used indicators and confidence qualifiers derived from bundle quality scores

The existing 6-phase pipeline remains the outer structure. The bundle lifecycle is the inner contract for what specifically happens during `retrieve` + `assemble`.

### Failure mode this prevents

This wrap-not-replace decision prevents Failure Mode F9.3 (implementation without spec). If the new canon contradicted existing runtime, implementation would require either rewriting `runPipeline()` from scratch or accepting spec-drift. Neither is acceptable. Wrapping preserves working infrastructure while adding the bundle-specific behavior the canon requires.
