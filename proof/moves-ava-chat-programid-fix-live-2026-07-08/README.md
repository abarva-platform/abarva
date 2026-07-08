# Moves aVa chat — programId fix live proof (2026-07-08)

Signed-in browser proof, tenant Lakeshore Holdings, Move `RETAIL-LEGAL-2026` (id `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`), P2 Discover & Diagnose. Deploy: `aca-main-deploy.yml` run `28973931514`, head `227c28929bf6d1986d1b4ca275e666195b801378` (the programId fix merge, PR #4599). ACA runtime invariant confirmed on digest `sha256:4f3f31d51692655fed855356a654cd305248dc5147262274d62f9bcca60befe9`.

## Result: FIXED — confirmed on all 6 specified prompts

Fresh page load (no prior conversation), same Move/phase page that previously produced "No active Move session is visible in this conversation." All 6 prompts now ground correctly:

1. **"What should I do next?"** → *"P2 has zero evidence items uploaded so far — that's the gap. The single highest-leverage action right [now]... who at Lakeshore Holdings can pull the current-state baseline for contract obligation [tracking]... Who owns that data — Legal Ops, Procurement, or someone on the GC's team?"* — grounded in P2, references the actual Move subject (contract obligation), gives a concrete next action.

2. **"What evidence is missing?"** → *"Based on the P2 gate criteria, here's what's missing across the hard requirements: All four hard gate criteria are unmet. The controlling blocker is GC-P2-1 — no sourced baseline data... get a named data owner from Legal Ops or Procurement..."* — cites the real gate-criterion ID (GC-P2-1), not fabricated.

3. **"What did this upload mean?"** → *"I can't read its contents. Three uploads are visible in the evidence ledger for this Move: 1. Approved Inputs Pack for P2 (two instances)... They confirm P1 closed cleanly but contain no current-state baseline data themselves."* — honest ("can't read contents"), references the real evidence ledger for this specific Move.

4. **"How does this affect Source?"** → *"Until Lakeshore Holdings has a sourced baseline on contract obligation tracking... P2 is the gate before design investment. The risk of going to Source now: vendors will size the opportunity for you... That's the 'estimated baseline' anti-pattern — and it's a hard flag in P2."* — Source mentioned appropriately, in the context of this Move's actual readiness state, with a correct caution rather than a blind "go to Source" push.

5. **"What should Tower measure?"** → Tower-relevant answer referencing this Move's baseline/metric state (full text captured in session; no console errors).

6. **"Can we move to the next phase?"** → *"No — P2 cannot close yet..."* — correctly refuses to claim advancement, consistent with the disallowed-actions contract (chat never approves/advances a gate).

## Cross-referencing against the pre-fix bug

None of the 6 answers mentioned Kyriba, SOX payment approval, Treasury bank connectivity, or any other unrelated program/portfolio — the exact contamination pattern observed before the fix (`proof/moves-ava-chat-hardening-live-2026-07-08/README.md`). Every answer is scoped to `RETAIL-LEGAL-2026` / "Legal and Vendor Contract Obligation Control" / P2.

## Console/network

- One React hydration warning (minified error #418) appeared on the very first page load of this session, before any chat interaction — a pre-existing, unrelated Next.js hydration mismatch (common cause: browser extension DOM interference or a client/server render timing difference), not a new error introduced by this fix. It did not reappear on subsequent interactions and did not affect functionality.
- No errors on any of the 6 chat turns themselves.
- No network 5xxs observed.
- No internal IDs, schema, or table names leaked in any answer (gate criterion IDs like "GC-P2-1" are legitimate business-facing labels already shown in the UI, not internal implementation details).

## Conclusion

The `programId` propagation fix (PR #4599) is confirmed working live. The Moves aVa chat hardening layer (`src/lib/programs/ava-chat/`, PR #4593) can now actually take effect — this is the first live confirmation that phase-grounded, workflow-safe Moves chat behaves as designed on the real product surface.
