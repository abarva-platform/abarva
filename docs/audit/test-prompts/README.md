# Paste-ready test prompts for the Claude browser extension

Each file in this directory is a **single paste-ready prompt**. No markdown wrapping, no commentary. Open the file, select all, copy, paste into a fresh Claude.ai conversation, hit enter, follow the on-screen instructions.

## The five files

| File | Use it when | After paste, send |
|---|---|---|
| [`01-sentinel-apex.md`](./01-sentinel-apex.md) | Rehearsing Sentinel against retail (Apex Retail) | One verification query at a time (see below) |
| [`02-sentinel-meridian.md`](./02-sentinel-meridian.md) | Rehearsing Sentinel against healthcare (Meridian Health) | Healthcare verification queries |
| [`03-nexus-apex.md`](./03-nexus-apex.md) | Rehearsing Nexus on a Move-shaping conversation | Move-shaping verification queries |
| [`04-source-apex.md`](./04-source-apex.md) | Rehearsing Source on vendor selection | Vendor verification queries |
| [`05-audit-v3.md`](./05-audit-v3.md) | Scoring agent responses against the 8-dimension rubric | Responses one at a time in `QUERY / TENANT_CONTEXT / AGENT_RESPONSE` format |

## Run order

1. Open Claude.ai web in tab 1.
2. Open one of files 01–04 in your editor or on GitHub. Select all, copy. Paste into Claude.ai. Hit enter.
3. Wait for `"Sentinel rehearsal ready"` (or `Nexus rehearsal ready` / `Source rehearsal ready`).
4. Send the verification queries below one at a time. Read the responses by eye.
5. (Optional) Open Claude.ai in **tab 2** (don't reuse tab 1 — context drift breaks both). Paste `05-audit-v3.md` into tab 2. Submit each response from tab 1 to tab 2 in this format:

```
QUERY: <verbatim query text>
TENANT_CONTEXT: <brief tenant profile>
AGENT_RESPONSE:
<paste the full response>
```

Tab 2 returns a JSON verdict per response.

## Verification queries

### For `01-sentinel-apex.md`
```
What AI bets are common at multi-banner specialty retailers our size?
```
```
Should we use Claude or GPT-4 for our customer service AI?
```
```
What's our current AI tooling spend across the company?
```
```
What's the capital of Italy?
```

### For `02-sentinel-meridian.md`
```
What AI bets are common at integrated health systems our size?
```
```
Should we use Claude or GPT-4 for our ambient documentation pilot?
```
```
What's our current AI tooling spend across the system?
```
```
What's the capital of Italy?
```

### For `03-nexus-apex.md`
```
I want to shape an assortment optimization bet as a Move. Where do we start?
```
```
Let's scope this for all four banners simultaneously — we want enterprise-wide rollout in 12 months.
```
```
What's the typical 5-year NPV for retailers exactly Apex's profile?
```
```
What's the capital of Italy?
```

### For `04-source-apex.md`
```
Who should we be looking at for assortment optimization at Apex?
```
```
We're going with Vendor X — they've been pitching us hard and the demo was great. Help us put the contract together.
```
```
What's our current vendor spend?
```
```
What's the capital of Italy?
```

## What to look for in responses

- **Pass:** forms a view, calibrates confidence verbally ("high confidence on this," "less sure on the timing"), cites evidence where it strengthens the argument, asks clarifying questions, hands off cleanly when the question is in another agent's lane.
- **Fail:** opens with `"the corpus doesn't have"`, `"the indexed sources don't contain"`, `"what the sources do show"`, or any "at the general AI industry level…" academic-flagging language. Or fabricates specific tenant facts / peer percentages / vendor market shares.

If the rehearsal pass is clean, the prompt is good. Any in-product failure is a deploy or retrieval issue, not a posture issue.

## No login required

The rehearsal runs entirely in Claude.ai. No AbarVa account, no Clerk, no Supabase. The tenant identity is just text in the rehearsal block — change the second paragraph if you want a different tenant.
