# Next Slice Plan: Source Context Depth For Fixture Defers

Date: 2026-04-24

Status: planning only. Do not implement the context-depth slice until explicitly approved.

## 1. Purpose

Improve deterministic seeded Source context so the validation runner can distinguish gaps that are truly intentional from gaps that should be addressable before chat UI or model wiring.

The slice should enrich the current Source context layer with enough non-generated grounding for Data & AI Modernization Sourcing to support stronger fixture results without introducing any runtime agent behavior.

The target is not to make every fixture pass. The target is to make the current defers more precise and reduce defers where seeded deterministic context should already exist.

## 2. Why Context Depth Comes Before Chat/Model/UI

Context depth comes before chat/model/UI because Nexus must be context-first, not prompt-first.

If the system does not have seeded pattern sections, scorecard defaults, citation placeholders, and attachment summary placeholders, a future chat surface would either become generic or rely on generated prose to cover deterministic data gaps.

This slice should prove that the platform can supply richer grounding before:

- chat UI renders suggested actions
- API routes assemble Source context
- model calls synthesize guidance
- upload/parsing flows convert files into evidence
- user-facing workflow surfaces consume agent outputs

## 3. Current Defers To Address

Address these current runner defers if they can be resolved with deterministic seeded context:

- Pattern-section grounding for Data & AI Modernization Sourcing.
- Scorecard default criteria, weights, and rationale.
- Scorecard override readiness where no override has been made yet.
- Evidence/citation placeholder scaffolding for seeded event facts.
- Vendor response attachment summary placeholder behavior.
- Portfolio-level value context if current seeded events already expose enough value-at-stake data.

The goal is to move appropriate fixtures from `defer` to `pass` only when the seeded context actually supports the expectation.

## 4. Defers That Should Remain Intentional

These should remain `defer` unless explicitly seeded with deterministic data in this slice:

- Real uploaded vendor response parsing.
- File-specific citations based on actual uploaded documents.
- Realized value statements when only projected value exists.
- Vendor comparisons that require complete normalized vendor response data.
- Artifact/RFP generation readiness where required Scope inputs remain missing.
- Any recommendation that depends on model-assisted synthesis or human approval.

Intentional defers are product guardrails. They prevent Nexus from pretending to know what the system has not yet captured.

## 5. Files Likely To Create

Possible files:

- `src/lib/source/pattern-context-seed.ts`
- `src/lib/source/evidence-seed.ts`
- `src/lib/source/attachment-seed.ts`

Create new files only if keeping richer seed data separate makes the Source domain layer easier to review. Prefer small, deterministic modules over expanding one large seed file if the data becomes dense.

Likely implementation review after the slice:

- `docs/abarva-source/build-pack/implementation-reviews/07_CONTEXT_DEPTH_FOR_DEFERS_REVIEW.md`

## 6. Files Likely To Update

Likely updates:

- `src/lib/source/mock-seed.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/agent-validation-fixtures.ts`
- `src/lib/source/agent-validation-runner.ts` only if report grouping needs a small deterministic refinement
- `src/lib/source/index.ts` if new seed/context modules are exported
- `CYCLE_STATE.md` after implementation

Possible type updates only if needed:

- `src/lib/source/types.ts`
- `src/lib/source/agent-context.ts`
- `src/lib/source/attachments.ts`
- `src/lib/source/agent-validation.ts`

Avoid updates to Source UI components, route pages, API routes, model runtimes, upload handlers, `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`.

## 7. Seed Data To Add

Seed only deterministic, reviewable context.

Recommended seed additions:

- Data & AI Modernization Sourcing pattern sections:
  - applicability signals
  - diagnostic questions
  - required inputs
  - common risks
  - stage gate expectations
  - sourcing levers
  - Nexus stage guidance
- Scorecard defaults:
  - criteria
  - default weights
  - rationale
  - evidence expectations
  - override rules
  - lock/approval implications
- Evidence/citation placeholder scaffolding:
  - event-state citation placeholders
  - pattern-guidance citation placeholders
  - value-at-stake citation placeholders where seeded
  - explicit confidence and source type labels
- Attachment summary placeholder behavior:
  - vendor response attachment metadata placeholder
  - parse status such as `needsPurpose`, `parsing`, or `parseFailed`
  - no extracted claims unless explicitly seeded
  - clear reason why file-specific answers still defer
- Portfolio/value context:
  - deterministic per-event value-at-stake values already present in seeded event data
  - clear distinction between projected and realized value
  - no invented savings assumptions

## 8. Fixture Expectation Changes

Update fixture expectations only where the added seeded context justifies a stronger result.

Potential changes:

- Pattern grounding fixture may move from `defer` to `pass` if relevant pattern sections are populated and referenced.
- Scorecard governance fixture may move from `defer` to `pass` if default weights and override rules are seeded.
- Dashboard attention/risk fixtures may become more specific if portfolio-level value and lifecycle context are complete.
- Vendor response summary should still `defer` unless deterministic attachment summary content exists.
- RFP generation should still `defer` while required Scope inputs are missing.
- Evidence/citation checks should pass only for seeded citations and remain deferred for document-specific claims.

Every fixture change should include a rationale in the implementation review packet.

## 9. Validation Commands

Expected validation for the context-depth slice:

```bash
npx eslint src/lib/source/mock-seed.ts src/lib/source/context-builder.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation-runner.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

If new deterministic seed modules are added, include them in the eslint command.

Recommended smoke check:

```bash
npx tsx -e "import { getSourceContextValidationReport } from './src/lib/source/agent-validation-runner.ts'; console.log(JSON.stringify(getSourceContextValidationReport(), null, 2));"
```

Do not run browser/UI verification for this slice unless a failure unexpectedly touches UI code.

## 10. Acceptance Criteria

The context-depth slice is acceptable when:

- deterministic seeded pattern-section context exists for Data & AI Modernization Sourcing
- deterministic scorecard default context exists
- evidence/citation placeholder scaffolding exists without inventing unsupported facts
- vendor response attachment placeholder behavior is explicit
- fixture expectations are updated only where richer context supports them
- validation runner output shows improved grounding and preserves intentional defers
- no LLMs, chat UI, API routes, upload/parsing, or workflow expansion are introduced
- validation commands pass
- implementation review packet documents changed outcomes, remaining defers, and next recommendations

