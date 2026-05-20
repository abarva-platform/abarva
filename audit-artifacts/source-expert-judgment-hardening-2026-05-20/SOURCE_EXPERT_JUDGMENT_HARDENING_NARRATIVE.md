# Source Expert Judgment Hardening Narrative

Date: 2026-05-20

## Use Case

Apex Store Ops AI Scheduling Platform Sourcing. The event is intentionally hard: pending selection, renewal pressure, P0 AI/data-rights risk, incomplete pricing, and challenged savings evidence.

## Expected Outcome

AbarVa Source should behave like a senior IT sourcing VP: hold award, force targeted BAFO, preserve evidence gaps, and refuse shortcuts.

## What Changed

- Added a deterministic Source Expert Judgment Kernel.
- Wired the CXO narrative report verdict to the kernel.
- Added deterministic evidence-aware answers for six adversarial hard questions.
- Added a robustness scoring lab with hard failures for artifact contradiction, unsupported savings, incomplete pricing, P0 override, and generic answers.

## Observed Result

The corrected scenario scores 8.4/10 with no hard failures. Pre-fix behavior hard-fails because an artifact can say Award / proceed while the kernel holds award.

## VP Sourcing Judgement

This closes the root judgment miss at the deterministic layer. The system now has a sourcing brain beneath artifacts and answers. Remaining work is live browser regeneration/deployment, full PPTX/Deal Pack consistency crawl, and richer model-backed conversational reasoning once this branch can be pushed.

## Remaining Gaps

- Full browser crawl not rerun in this increment because the branch is local and repository push is blocked by 403 in this environment.
- PPTX and Deal Pack generation should be rerun after this patch is merged/deployed.
- The fallback answers are materially better, but still deterministic; model-backed evidence synthesis should build on this kernel rather than replace it.
