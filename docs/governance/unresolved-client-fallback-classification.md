# Unresolved-client fallbacks: classification of all 40 call sites

**Items:** U-512 · filed out of U-511 · all 40 classified and 6 repaired 2026-09-22.
**Closed by:** U-513 · the 3 sites U-512 left as repair-owed, repaired the same day.

All 9 guard-class sites are now repaired. The remaining 31 are `inside` or
`dead-by-construction` and are recorded here rather than changed.

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
| `guard — repair owed` | same class, but proving it needs a harness U-512 did not build | filed as U-513 and **since repaired** — see the section below |

A call-site diff is not evidence for any of these. The defect was never visible
in the call site — only in what reached the reader.

## Guard class — repaired by U-512 (6 call sites, 5 files)

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

## Guard class — repaired by U-513 (3 call sites, 3 files)

U-512 named these three and left them, because each needed a harness it did not
build and an unproven repair is not a repair. U-513 built the harnesses and
repaired all three. Each was proved by rendering or invoking with the tenant
unresolved, never by a call-site diff.

| file:line | fallback the author wrote | why it is a guard | how it was proved |
|---|---|---|---|
| `src/app/(public)/responsible-ai/acknowledgment/page.tsx:44` | `?? activeClient?.name ?? "your workspace"` | A consent surface. The form renders **“I accept it for my access to *{clientName}*.”** — the account named is the one the acceptance is filed against. | A jsdom render harness that steps past both redirects (subject present, acknowledgment still required) and renders the **real** form, then reads the consent sentence out of the page. Before the repair it read “…for my access to *<the default account>*.” |
| `src/app/(public)/responsible-ai/training/page.tsx:55` | `?? activeClient?.name ?? "your workspace"` | Same family. Renders **“Required training for *{clientName}*”**. Needs *both* redirects stepped past — acknowledgment satisfied, training still required. | Same harness. Before the repair it read “Required training for *<the default account>*”. |
| `src/app/api/engagements/create/turn/route.ts:50` | `?? activeClient?.name ?? null` | **Not a label.** The first token of the resolved name is an organization keyword that filters the sponsor candidate list at `:62`, and the name is written as `active_client` at `:252`/`:259`. | A POST harness against the real route, draining the response stream and reading back the candidate set handed to the prompt assembler. See below — this is the one with a tenant-scoping outcome. |

### The turn route filtered by the wrong organization, and the harness shows it

The other 39 sites are about what a reader is told. This one changes *who the
model is offered as a sponsor*. Measured before the repair, with three
candidates and the active client's key resolving to nothing:

```
expected 3 candidates, received 2 — and not the 3 it started from
```

The keyword was the first token of the **default account's** display name. It
dropped the candidate that actually belonged to the tenant under test, kept an
unrelated candidate whose organisation name happens to contain that token, and
pulled in a second unrelated one. A request whose tenancy never resolved was
handed a candidate list filtered by a tenant it had nothing to do with, and that
list is what the model is offered. After the repair the list is unfiltered — all
three — and `active_client` is emitted as `null` rather than the default
account's name. The exact fixtures are in the suite; they are named there rather
than here.

### Both repairs exposed the same second dead branch U-512 hit in `transformers.ts`

Once the canonical link can answer `null`, the author's next link becomes
reachable for the first time — and `activeClient?.name` of `"   "` is **not
nullish**, so `??` alone let a blank name through. On the consent pages that
rendered a consent sentence naming nothing at all; on the turn route it emitted a blank `active_client`. Both now guard with `|| null` / a `trimmedOrNull` helper,
and both are pinned by a case: dropping the two guards fails 2 of the 15.

### The duplicated helper is one helper

Both consent pages carried a byte-identical local `foundationClientDisplayName`,
so the item's question was whether to decide it twice or once. It is now
`src/lib/ai-liability/consent-client-name.ts`, next to the only resolution that
uses it, exported alongside `resolveConsentClientName` and
`UNRESOLVED_CONSENT_CLIENT_NAME`. The two pages call one function.

That module is deliberately small and imports nothing server-only, for the
reason U-512 measured: the cases live under `src/__tests__/behaviors`, which the
required `Behavior coverage floor` sweeps as a directory, so whatever a case
imports lands in that gate's denominator.

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
