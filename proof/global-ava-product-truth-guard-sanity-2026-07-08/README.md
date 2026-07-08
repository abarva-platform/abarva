# Global aVa Product Truth + Scope Guard — post-deploy sanity check (2026-07-08)

Scoped sanity check (not a full re-proof): confirms the new always-on system-prompt block (`buildProductTruthSystemPromptBlock`, PR #4606) did not regress the Moves aVa chat grounding fix confirmed earlier today (PR #4599/#4601).

Deploy: `aca-main-deploy.yml` run `28977943627`, head `6f3e676e7cc0a13c83f7d36d27e59c07cb80dcc6` (the product-truth-guard merge). ACA runtime invariant confirmed on digest `sha256:e4f09978e075023ad8ad5f4ce0c8a1ae1c32a03598c92cbb2766a8976c4bed1d`.

## Result: no regression

Fresh page load, Lakeshore Holdings, Move `RETAIL-LEGAL-2026`, P2 Discover & Diagnose. Asked "What should I do next?":

> "P2 has zero evidence items uploaded and gate approvals are pending. The single highest-leverage action [right now]... Specifically: who at Lakeshore Holdings can pull the baseline data for contract obligation tracking?"

Still correctly grounded in P2 and this Move's actual subject (contract obligation tracking), consistent with the proof captured in `proof/moves-ava-chat-programid-fix-live-2026-07-08/README.md`. No console errors on page load or on the chat turn.

## Scope note

This confirms the global block is additive and safe — it did not degrade the already-proven Moves grounding. It does **not** constitute a proof that the guard itself catches a live hallucination attempt (that requires either the composed gate wired post-hoc, or a deliberate adversarial live prompt on a surface where a not-built/pilot-only capability could plausibly be claimed — not yet attempted). See the release record's Known Gaps for what's still open.
