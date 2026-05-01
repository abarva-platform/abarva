# Programs / Nexus Crawler Fix Report — 2026-05-01

## Source Run

Crawler identity: `demo-meridian-programs+clerk_test@abarva.com`

Scenario: `Healthcare Data Analytics Modernization for Agentic Care - UX Agent Smoke 2026-05-01`

The crawler found several defects during Meridian Programs origination. This report separates what was fixed in this slice from what still requires follow-up.

## Fixed In This Slice

| Finding | Severity | Fix | Evidence |
| --- | --- | --- | --- |
| Origination write failed with a DB constraint error | SEV-2 | `commit_program` now writes `origin_source: 'user_initiated'`, which satisfies the existing `engagements.origin_source` DB check constraint. The previous value, `maestro_console`, was not in the allowed enum. | `src/lib/agent/tools/program/commitProgram.ts`; focused Jest updated in `src/lib/agent/tools/__tests__/commitProgram.test.ts` |
| Meridian Programs page showed `Deterministic seed · Apex Retail Group` | SEV-1 UI trust leak | Programs index disclaimer now renders `view.tenant`, so Meridian renders `Deterministic seed · Meridian Health System`. | `src/components/programs/ProgramsIndexPage.tsx` |
| Context tab disabled Tenant/Full modes despite locked Meridian session | SEV-2 UX/state defect | `/programs` now passes `hasTenantKey={Boolean(activeClient)}` into `AppShell`, enabling Tenant/Full context modes for signed-in tenant-bound users. | `src/app/programs/page.tsx`, `src/components/programs/ProgramsIndexPage.tsx`; AgentCanvas CB-8 tests pass |
| Header/filter counters stale after DB/user access filtering | SEV-3 UX trust defect | `/programs` recomputes `totalActive`, `gatesPending`, and `idleCount` after DB merge and access filtering. | `src/app/programs/page.tsx` |
| Nexus accepted vague value target without baseline challenge | SEV-3 agent doctrine defect | Programs origination prompt now explicitly requires baseline challenge for targets like `30% faster`, `better quality`, and cost takeout. It also instructs Nexus to emit failure-mode card #9 when value targets lack baseline evidence. | `src/app/api/chat/agent/route.ts` |

## Validation Run

Focused Jest:

```bash
npx jest src/__tests__/integration/demo-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts src/lib/auth/__tests__/module-access.test.ts src/__tests__/integration/source/source-access-control-static.test.ts src/lib/agent/tools/__tests__/commitProgram.test.ts src/components/programs/__tests__/AgentCanvas.test.tsx --runInBand
```

Result: `6 passed, 39 tests passed`.

Scoped ESLint:

```bash
npx eslint src/app/api/chat/agent/route.ts src/app/programs/page.tsx src/components/programs/ProgramsIndexPage.tsx src/lib/agent/tools/program/commitProgram.ts src/lib/agent/tools/__tests__/commitProgram.test.ts src/components/programs/__tests__/AgentCanvas.test.tsx
```

Result: clean.

Full TypeScript:

```bash
npx tsc --noEmit --pretty false
```

Result: blocked by pre-existing missing package/type dependencies outside this slice: `react-markdown`, `remark-gfm`, `rehype-sanitize`, `resend`, and `docx`. No TypeScript errors from the touched files were isolated by focused test/ESLint.

## Still Open From The Crawler Run

| Finding | Severity | Current Status | Recommended Next Fix |
| --- | --- | --- | --- |
| Mid-conversation auth eviction to Clerk sign-in | SEV-2 | Not fixed in this slice. Needs session/token lifecycle investigation with live browser/runtime logs. | Instrument `/api/chat/agent` 401/403 reason, Clerk token freshness, and session cookie state. Preserve unsaved brief state in durable draft before any write attempt. |
| Draft lost after auth eviction | SEV-2 | Not fixed in this slice. Current brief state is chat-session-local unless draft persistence has already happened. | Persist every origination field update to `origination_drafts` or equivalent after each artifact/turn, keyed by user + tenant + surface. |
| Brief progress card count/fields out of sync | SEV-3 | Partially mitigated through stronger artifact cadence, not deterministically fixed. | Add deterministic client-side merge of `brief-field` artifacts into `brief-progress`, or have the server emit canonical progress from parsed state. |
| Right pane did not emit baseline/risk reasoning card | SEV-3 | Prompt fixed to request failure-mode card #9. Still requires crawler verification because LLM artifact emission is probabilistic. | Add deterministic baseline-risk artifact emission server-side when user text contains value target without baseline terms. |
| Context tab body stayed on generic receipt after toggling Corpus | SEV-3 | Tenant/Full disabled bug fixed. Existing bundle remains from prior turn until a new answer is assembled. | Consider clearing/staging the panel on mode change: `Mode changed to Corpus. Ask again to assemble a Corpus receipt.` |
| UX reverse chronological conversation ordering | SEV-3/4 | Not fixed in this slice. | Decide product doctrine: newest-first by design, or chronological with sticky composer. Then test scroll behavior explicitly. |
| Nav label truncation (`Learr`) | SEV-4 | Not fixed in this slice. | Fix responsive nav label widths in the redesigned nav branch if still present. |

## Required Re-Test

Re-run the same crawler script with the same identity and program name. The key pass/fail checks after this slice are:

1. Step 3 must challenge `30% faster delivery and better quality` by asking for baseline evidence and suggesting relevant metrics.
2. Step 5 should submit successfully instead of hitting the `origin_source` DB check constraint.
3. The submitted record must be `submitted_for_approval`, not active.
4. The right-pane Context tab must enable Tenant and Full modes in the Meridian session.
5. The Programs footer must say `Deterministic seed · Meridian Health System`, not Apex.
6. Tenant attack and financial attack should continue to pass as before.
