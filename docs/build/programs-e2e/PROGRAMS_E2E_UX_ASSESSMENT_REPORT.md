# Programs / Strategic Moves E2E UX Assessment Report

Date: 2026-05-02  
Environment: `https://app.abarva.ai` production  
Scope: Programs/Strategic Moves + Tower handoff touchpoint

## Executive UX Verdict

UX verdict: PRE-PRODUCTION BUT MUCH STRONGER AFTER FIXES.

The core lifecycle now works, and the agent experience is materially better than at the beginning of the crawl. Nexus can now ask for, ingest, and use meeting notes; generate artifacts; move phases; and tell the truth when something is incomplete. The UI still has friction: stale right-rail states, overloaded chat history, narrow viewport issues, and confusing naming leftovers.

## UX Strengths

| Area | Strength |
| --- | --- |
| Phase rail | P0-P6 lifecycle is visible and understandable after label corrections: Originate, Discovery, Synthesis, Design, Execution Roadmap, Approval & Mobilization, Tower Handoff |
| Agent canvas | Nexus is clearly positioned as Program Orchestrator and can coach phase work in-place |
| Upload modal | Pasted notes flow is simple and useful; it explicitly states text/Markdown/CSV/JSON are parsed immediately |
| Deliverable generation | The agent explains what it saved and what changed, which builds trust |
| Failure honesty | Nexus no longer pretends a write succeeded when it failed; later fixes made most write paths pass |
| Financial restraint | Generated executive artifacts avoided exact financial values for non-finance-authorized user |
| Tower handoff | Completed P6 handoff appears on Tower and links back to the source move |

## Severity 1 Issues

No unresolved Severity 1 blocker remains for the tested end-to-end lifecycle.

Issues that were Severity 1 / blocker earlier in the crawl and are now fixed:

| Issue | Fix |
| --- | --- |
| P5 advanced without required signed artifacts | PR #1411, verified before this continuation |
| P6 completion did not persist lifecycle completion correctly | PR #1415 / #1416, verified in Meridian, Apex, First Capital |
| Discovery gate allowed advancement despite hard gaps | PR #1419, verified in Apex rerun |
| Baseline hallucination in generated P3 artifacts | PR #1428 plus live regeneration, verified in First Capital DB |

## Severity 2 Issues

| Issue | Evidence | Recommendation |
| --- | --- | --- |
| Right rail can become stale or incomplete | Earlier runs showed progress cards out of sync; final First Capital P4/P5 showed useful gate cards but P6 history becomes noisy | Make right rail a durable phase-state receipt, not just reactive transcript artifacts |
| Upload `scan_status` remains `pending` after successful text parsing | `program_attachments.scan_status=pending` while evidence row is parsed and usable | Add `parsed` or `evidence_extracted` state distinct from malware/file scan |
| Tower mobile/narrow layout buries handoff content | Screenshot showed Atlas card first; handoff list below first viewport; full-page screenshot repeated header sections | Tower redesign should prioritize executive pressure cards and handoff list above or alongside agent, especially on narrow widths |
| Naming divergence: First Capital vs `arcturus` | UI says First Capital; URL/client key and storage path use `arcturus` | Canonicalize display alias or show tenant display name consistently while keeping key internal |
| Chat history becomes too dense after long lifecycle | Final First Capital transcript contains multiple artifact revisions and prior obsolete text | Add phase transcript folding, “latest signed artifact” receipts, and hide superseded generation chatter by default |
| Agent status pill says `Active` even when lifecycle is completed | Completed program still shows agent `● Active` | Rename to `Nexus available` or separate agent availability from lifecycle state |
| Setup route discoverability mismatch | Previously observed `/setup` route 404 while Setup nav maps to `/admin` | Add `/setup` redirect to `/admin` or remove route ambiguity |

## Severity 3 Issues

| Issue | Recommendation |
| --- | --- |
| Missing spaces in streamed copy such as `now.Tower` | Add post-stream whitespace normalization or renderer handling |
| P0 seed package uses `discovery_report` type in some runs | Add canonical `origination_brief` / `program_seed_brief` type |
| Current historical P2 deliverables have type-key mismatch | Leave as historical data or write a one-time cleanup migration if needed for demos |
| Upload modal copy says PDF/Office captured for follow-up parsing | This is honest, but should show a stronger “not parsed yet” receipt after upload |
| P6 final contract required multiple cleanup prompts for retrieval hygiene | Add prompt/eval rule: never mention superseded bad values in saved artifacts |
| Tower header/top nav at narrow width truncates Source | Future Atrium work should address responsive navigation behavior |

## Agent UX Assessment

### What Nexus Does Well Now

- Handles long phase work without losing all context.
- Generates real signed artifacts through tool calls.
- Uses uploaded notes as phase evidence.
- Explains gate outcomes and next phase requirements.
- Maintains the doctrine that execution happens outside AbarVa after P5/P6.
- Does not expose exact financial values in tested artifacts.
- Can revise signed artifacts when evidence quality issues are found.

### What Nexus Still Needs

- Stronger built-in retrieval hygiene so it does not need user/QA correction to remove superseded values.
- Better right-pane receipts that distinguish current controlling artifacts from historical chat text.
- A concise artifact diff view instead of long chat paragraphs for every revision.
- Phase-specific “good looks like” cards: P1 baseline proof, P2 promise contract, P3 design integrity, P4 roadmap, P5 authority package, P6 Tower contract.

## Tower Redesign Notes

The uploaded canonical vision package confirms Atrium chrome is future work, not part of this QA loop. For Tower specifically, the redesign should protect these principles:

- Tower is execution observability, not project management.
- Tower inherits the P2 promise contract, P4 roadmap, P5 approvals, P6 tracking contract, milestones, owners, and escalation rules.
- Atlas owns Tower synthesis; Nexus closes at P6.
- First screen should answer: what changed, what is at risk, what decision is needed.
- Weekly/monthly status ingestion should parse notes/decks into milestones, risks, decisions, KPI deltas, and escalation cards.
- Exact financial values remain role-gated.
- Tenant isolation remains strict.

## Overall UX Readiness

| Area | Rating |
| --- | --- |
| Lifecycle comprehension | Good |
| Agent usefulness | Good and improving |
| Evidence/document handling | Good for text notes; incomplete for PDF/Office parsing |
| Deliverable trust | Good after PR #1428; needs retrieval-hygiene evals |
| Gate transparency | Good after fixes; right rail can improve |
| Tower readiness | Functional handoff visible; redesign needed for executive usability |
| Mobile/narrow viewport | Needs work |

Final UX verdict: usable for controlled pilot walkthroughs with an informed facilitator; not yet polished enough for unsupervised enterprise users.
