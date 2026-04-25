# Pattern Taxonomy

## Purpose

Define the kinds of patterns AbarVa uses and whether each is product logic, retrieved guidance, or both.

| Pattern Type | Purpose | Examples | Product Logic or Guidance | Agent Usage | Validation Implications |
| --- | --- | --- | --- | --- | --- |
| Structural Pattern | Defines canonical product or process structure. | Source stages, Programs phases, artifact lifecycle. | Usually product logic. | Agents explain where the user is in the structure. | Validates stage transitions and required objects. |
| Guidance Pattern | Advises what to do in context. | If scope baseline is weak, do not release RFP. | Usually retrieved guidance. | Agents recommend next action and missing inputs. | Validates response grounding and action quality. |
| Artifact Pattern | Shapes deliverables and templates. | RFP section library, scorecard template, executive brief. | Both. | Agents generate Rich, Outline, or Stub artifacts. | Validates artifact readiness and missing inputs. |
| Validation Pattern | Tests whether work is ready or safe. | Cannot move to Evaluation if scorecard is not locked. | Usually product logic. | Steward explains blocks; Nexus explains remediation. | Powers deterministic validation fixtures and workflow gates. |
| Benchmark/Baseline Pattern | Provides comparative expectations or baselines. | Typical AMS transition cost range, AI adoption benchmark. | Retrieved guidance, later product logic when quantified. | Atlas and Nexus compare portfolio or event context. | Requires evidence and confidence labeling. |
| Negotiation Pattern | Identifies negotiation traps and levers. | Transition support exclusion, volume-band pricing trap. | Retrieved guidance. | Nexus suggests negotiation questions and tradeoffs. | Validates that negotiation advice cites pattern rationale. |
| Failure Mode Pattern | Describes a known way work fails and how to prevent it. | Generic RFP, unpriced scope, uncited evidence. | Both. | Sentinel and Steward detect risk; Nexus recommends prevention. | Powers crawler personas, validation fixtures, and readiness checks. |
| UX/Interaction Pattern | Defines product interaction behavior. | Three choices plus custom, journey map, context-used strip. | Product logic / UI standard. | Agents use the pattern to guide interaction. | Visual and behavior validation checks consistency. |
| Agent Response Pattern | Defines response structure by situation. | Direct Answer, Guidance, Decision, Low Context. | Product logic in UI/runtime; guidance in docs. | Agents choose response mode based on context and intent. | Validates anti-vanilla behavior and missing-context honesty. |

## Taxonomy Rules

- A single authored pattern may contain multiple pattern types.
- Structural and validation patterns are candidates for product logic.
- Guidance, negotiation, and benchmark patterns usually remain retrievable context until the rule is stable and deterministic.
- Artifact patterns bridge authored IP and generated work products.
- UX and agent response patterns govern how the product presents intelligence.

