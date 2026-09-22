# Unresolved-client fallbacks: classification of all 40 call sites

**Item:** U-512 · filed out of U-511 · classified and partly repaired 2026-09-22.

## The mechanism, stated once

`canonicalClientDisplayName` in `src/lib/client-config.ts` ends with:

```ts
canonicalClientDisplayNameOrNull(args) ?? getClientOption(args.key).name
```

`getClientOption` answers the `DEFAULT_CLIENT_KEY` option for anything it does
not recognise — it has no `undefined` branch. So `canonicalClientDisplayName`
**never returns `null`**, even though its declared type says it can, and
**every** `canonicalClientDisplayName(...) ?? <fallback>` in the tree is
unreachable. There are **40 such call sites across 36 files**.

The return type is deliberately left as `string | null`: narrowing it would
churn roughly 150 callers to no behavioural end, and `getClientOption`'s default
is correct for the surfaces that rely on it. U-511 added
`canonicalClientDisplayNameOrNull` for the callers that need the absence to be
visible. This file is the record of which callers those are.

## The rule used to classify

| verdict | meaning | what was done |
|---|---|---|
| `inside` | the reader is already inside this tenant; the surface is labelling chrome it is entitled to label, and the default account is the established answer | left as-is; this file is the note that the `??` is dead |
| `dead-by-construction` | the key passed can never be unregistered (a literal, or a value that came out of `getClientOption`/`ALL_CLIENTS`), so the fallback is unreachable for a second, independent reason | left as-is |
| `guard` | the surface refuses, or tells a reader (or a model) *which* tenant it is talking about on a path where resolution may have failed | repointed to `canonicalClientDisplayNameOrNull`, proved by rendering/invoking with the tenant unresolved |
| `guard — repair owed` | same class, but proving it needs a harness this change does not build | filed as a follow-up; named below, not silently left |

A call-site diff is not evidence for any of these. The defect was never visible
in the call site — only in what reached the reader.

## Repaired in this change (6 call sites, 5 files)

| file:line | fallback the author wrote | why it is a guard |
|---|---|---|
| `src/components/home/v4/HomeRecordNotServed.tsx:21` | `?? "this client"` | Home's record-not-served surface. The governed read returned nothing; naming an account to that reader asserts a tenancy the request never established. Same shape as the Source access guard U-511 repaired. |
| `src/app/(maestro)/admin/cross-program-signals/page.tsx:34` | `?? 'Your tenant'` | The outer ternary already handled a *failed* key read. This is the case it could not see: a read that succeeds and names no registered client. |
| `src/app/(maestro)/source/setup/page.tsx:605` | `?? "your tenant"` | Feeds “…connections, evidence sources, and who can approve gates for *{tenantName}*.” Naming the default account tells a reader they are configuring another tenant's approvals. |
| `src/app/api/chat/agent/route.ts:570` and `:574` | `?? canonicalClientDisplayName({ name: body.tenantName }) ?? "Unknown active tenant"` | Reaches the model as `Active tenant: <name> (locked — this is the user's client account).` A turn whose server-side resolution had just failed told the model it was locked to an account that was never established. Collapsed into `resolveTurnTenantName` in the new `src/app/api/chat/agent/active-tenant-name.ts`; see the security note below. |
| `src/app/api/chat/agent/route.ts:714` | `?? tenantName` | Same turn, downstream readers. Repointed for consistency with the line above. |
| `src/lib/programs/transformers.ts:73` | `?? args.name?.trim() ?? "—"` | See below — the most consequential of the 40. |

### `transformers.ts` reinstated a leak its own comment says was fixed

`canonicalProgramClientName` carries the clearest statement of intent of all 40
sites, in its own comment: *“NEVER default to a specific tenant … Previously
this hardcoded [an account] as the catch-all default, so any tenant not in a
stale closed list rendered as [that account] — a cross-tenant name leak on every
Move card/detail.”*

Delegating to `canonicalClientDisplayName` reinstated exactly that, by a
different route. Every Move card whose `clients` row did not resolve rendered
the default account's name.

The helper now lives in `src/lib/programs/client-name.ts` — see the note on
where these two helpers sit.

Repairing the resolver then exposed a **second** unreachable branch in the same
four lines: `resolveClientName` passes `row?.name ?? ""`, and `""` is not
nullish, so `?? "—"` could not fire either. With only the resolver repaired the
card rendered an empty string. Both are fixed; both are pinned by a case.

### Why two helpers were moved into modules of their own

`resolveTurnTenantName` and `canonicalProgramClientName` are exercised by cases
under `src/__tests__/behaviors`, which the required `Behavior coverage floor`
sweeps as a directory — so whatever those cases import lands in the floor's
coverage denominator. Importing `route.ts` (4,269 statements, 52 functions) and
`transformers.ts` (1,849 statements, 46 functions) to reach two pure functions
took the gate from **91.41% statements / 63.70% functions** to **78.12% /
17.43%**, a measured failure of a required check. Both helpers now sit in small
modules their callers import. The floor after the move: **91.02% / 63.48% /
70.41% branches**, exit 0, against a baseline of **91.41% / 63.70% / 69.99%**
measured on the same scope with the two new suites held out.

This is a real limit on the proof, and it is named rather than glossed: the
cases prove the helpers' behaviour, and the type checker carries the fact that
the route and the transformer call them. No assertion is made about the text of
either caller, because a test that greps a file for a symbol cannot tell a
running control from a comment.

### Security note on the agent route

Repointing `route.ts:570` without touching the line under it would have **woken
a request-controlled tenant name up**: `?? canonicalClientDisplayName({ name:
body.tenantName })` was dead, and making the call above it able to return `null`
would have made it live — on exactly the path where server-side resolution had
just failed. That is the class of defect SEC-P1-7 (audit 2026-05-13) closed when
it moved this prompt block off the request body. The fallback was unreachable,
so removing it changes no behaviour that was ever observable, and
`resolveTurnTenantName` takes no request-supplied name at all. A case pins that.

## Guard class, repair owed — filed as U-513 (3 call sites)

Named here rather than swept, because each needs a harness this change does not
build and an unproven repair is not a repair.

| file:line | fallback | why it is a guard | what proving it needs |
|---|---|---|---|
| `src/app/(public)/responsible-ai/acknowledgment/page.tsx:46` | `?? activeClient?.name ?? "your workspace"` | A consent surface. The account named is the one the acknowledgment is recorded against. | The page redirects on two paths before the name is computed; needs its own render harness. |
| `src/app/(public)/responsible-ai/training/page.tsx:57` | `?? activeClient?.name ?? "your workspace"` | Same surface family, same fallback, duplicated `foundationClientDisplayName` helper. | As above. |
| `src/app/api/engagements/create/turn/route.ts:52` | `?? activeClient?.name ?? null` | Not only display: the resolved name's first token is used at `:62` to **scope sponsor candidates to the active client's organization**, and is written as `active_client` at `:252` and `:259`. A default account name leaking in filters by the wrong org. | A POST harness for the route; the declared `null` end means downstream already handles absence. |

## `inside` — left as-is (28 call sites)

The reader is already within this tenant and the surface is labelling chrome.
The default account is the established answer; repointing these would change
what ~28 surfaces render for no stated reason.

`src/app/(maestro)/admin/cfo-attestation/page.tsx:14` ·
`src/app/(maestro)/admin/dossiers/page.tsx:16` ·
`src/app/(maestro)/home/page.tsx:72` ·
`src/app/(maestro)/home/page.tsx:79` ·
`src/app/(maestro)/intelligence/page.tsx:93` ·
`src/app/(maestro)/source/approvals/page.tsx:37` ·
`src/app/(maestro)/source/capabilities/page.tsx:108` ·
`src/app/(maestro)/source/events/[eventId]/approval/page.tsx:93` ·
`src/app/(maestro)/source/events/[eventId]/page.tsx:115` ·
`src/app/(maestro)/source/events/[eventId]/workspace/page.tsx:56` ·
`src/app/(maestro)/source/new/page.tsx:37` ·
`src/app/(maestro)/source/optimize/page.tsx:107` ·
`src/app/(maestro)/source/renewal/[contractId]/execution/page.tsx:31` ·
`src/app/(maestro)/source/renewal/[contractId]/page.tsx:28` ·
`src/app/(maestro)/source/sourcing-opportunities/page.tsx:46` ·
`src/app/(maestro)/source/value/page.tsx:59` ·
`src/app/(maestro)/source/workspace/page.tsx:113` ·
`src/app/(maestro)/strategic-moves/living/page.tsx:142` ·
`src/app/(maestro)/strategic-moves/new/page.tsx:110` ·
`src/app/(maestro)/tower/page.tsx:96` ·
`src/app/api/home/summary-snapshot/route.ts:51` ·
`src/app/api/v1/tower/outcome-report/route.ts:166` ·
`src/lib/home/know/home-consultant-text-synthesis.ts:610` ·
`src/lib/intelligence/ask/index.ts:590` ·
`src/lib/tenant/aliases.ts:222` ·
`src/lib/tower/readTowerCommandCenter.ts:1233` ·
`src/lib/tower/tower-l3-dossiers.ts:469`

Two of these deserve a line, because a reader would reasonably believe the
fallback is consulted and it never is:

- **`strategic-moves/living/page.tsx:142`** carries the comment *“The case's own
  tenant label is the always-correct fallback.”* It is not a fallback — it is
  dead. The sentence describes an intent the code does not carry out. Left
  because the surface is one the reader is inside; the comment is now
  contradicted by this file rather than by nothing.
- **`home/page.tsx:72`/`:79`** is a chain of *three* dead links:
  `canonicalClientDisplayName(...) ?? canonicalClientDisplayName({ key }) ??
  tenant?.displayName ?? "AbarVa Client"`. Only the first is ever evaluated.

## `dead-by-construction` — left as-is (3 call sites)

Unreachable for a second, independent reason; repointing them would change
nothing at all.

| file:line | why |
|---|---|
| `src/lib/agent/context-bundle.ts:607` | `canonicalClientDisplayName({ key: "northstar" })` — a module constant with a registered literal key. |
| `src/lib/semantic-dossiers/compose-dossier-answer.ts:211` | iterates `ALL_CLIENTS`; `client.id` is registered by construction. |
| `src/lib/tenant/aliases.ts:230` | `option = getClientOption(value)`, so `option.id` is always a registered key. |

## Explicitly not done

Per the item's acceptance, neither of these:

- changing `getClientOption`'s default — product-wide blast radius;
- narrowing `canonicalClientDisplayName`'s return type — churns ~150 callers to
  no behavioural end.

## Reproducing the census

The 40 sites are found by matching a balanced `canonicalClientDisplayName(...)`
call followed by `??`, which a line-based grep cannot do — 9 of the 40 span
several lines. Match the call, walk the parentheses, then look at the next
non-whitespace characters.
