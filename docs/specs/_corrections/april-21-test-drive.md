# AbarVa Corrections Document · Post-Test-Drive · April 21

**Purpose:** Specific, actionable corrections for Claude Code based on Anand's first live test drive of the Program creation flow (April 21, morning). Ordered by severity. Each item has exact observable behavior, root cause hypothesis, and remediation.

**Context:** Anand attempted to create a Program via Nexus conversational intake. Conversation went well for the first 6 turns — Nexus handled framing, stakeholder substitution, classification locking thoughtfully. Then two things broke: (1) `<engagement_ready>` JSON payload leaked to user-visible chat, (2) post-conversation redirect to engagement console never happened, leaving user stranded on intake page after Nexus promised redirect.

**Scope:** Critical fixes (P0) must be done before next test drive. Consistency fixes (P1) before Prat demo. Context fixes (P2) when convenient.

---

## P0 · CRITICAL · Must fix before next test drive

### P0-1 · `<engagement_ready>` JSON leaks into user-visible chat

**Observed behavior:**

After Anand confirmed the Program classification, Nexus responded:

> "Got it. Creating AI-Driven IT Vendor Spend Optimization — retail, back office, optimise objective, with Jake Chen as sponsor. Setting it up now."

Then rendered raw JSON directly in the conversation:

```
<engagement_ready>
{
  "name": "AI-Driven IT Vendor Spend Optimization",
  "sponsor_graph_node_id": "person_jake_chen",
  "sponsor_creation_needed": false,
  "industry_code": "RETAIL",
  "function_code": "BACK_OFFICE",
  "objective_code": "OPTIMISE",
  "topic_code": "ai_vendor_spend_optimization"
}
</engagement_ready>
```

User response: "Ok i see. bunch of code.."

Nexus recovered gracefully ("Ha, sorry about that — that's just the handoff to the system to actually spin up the engagement. You won't normally see it."), but the damage was done — user saw internal scaffolding in what's supposed to be a consulting conversation.

**Root cause hypothesis:**

The Nexus system prompt instructs the model to emit `<engagement_ready>` tags as a signal to the frontend that intake is complete and engagement creation should fire. But one or more of the following is true:

1. The frontend isn't stripping `<engagement_ready>` tags before rendering the message to the user
2. The system prompt isn't instructing Nexus to emit these tags silently (outside assistant message body)
3. No structured tool call exists for "fire engagement creation" — intent is being smuggled through text content instead

Most likely: (1) and (3) combined. Frontend naively renders message text; backend pattern-matches on `<engagement_ready>` in text; no actual tool call infrastructure.

**Remediation — preferred path:**

Replace tag-in-text pattern with proper tool call. Nexus invokes `create_engagement` tool with structured arguments. Tool call is invisible to user (not rendered in message list). Tool result (success/failure) triggers redirect.

```typescript
// Nexus tool definition
{
  name: "create_engagement",
  description: "Create a new engagement when intake conversation is complete. Only call when name, sponsor, industry, function, and objective are confirmed with user.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      sponsor_graph_node_id: { type: "string" },
      sponsor_creation_needed: { type: "boolean" },
      industry_code: { type: "string", enum: ["RETAIL", "FINSERV", "HEALTHCARE"] },
      function_code: { type: "string", enum: ["FRONT_OFFICE", "MIDDLE_OFFICE", "BACK_OFFICE"] },
      objective_code: { type: "string", enum: ["GROW", "OPTIMISE", "PROTECT"] },
      topic_code: { type: "string" }
    },
    required: ["name", "sponsor_graph_node_id", "industry_code", "function_code", "objective_code"]
  }
}
```

**Remediation — tactical path if tool-call wiring takes more than half a day:**

Frontend strips `<engagement_ready>...</engagement_ready>` blocks from message content before render. Pattern: `/<engagement_ready>[\s\S]*?<\/engagement_ready>/g → ''`. Applied in message renderer.

System prompt updated with instruction: "When ready to fire engagement creation, emit `<engagement_ready>` tags AFTER your conversational closing message (two line breaks separator). The tags will be hidden from the user."

**Acceptance criteria:**

- User types through complete intake flow
- Nexus confirms classification and announces engagement creation conversationally ("Setting it up now.")
- User sees NO JSON, NO XML-like tags, NO system scaffolding in chat
- Backend successfully creates engagement record
- Frontend receives signal to redirect

**Files to touch (best guess, Claude Code verifies):**

- `src/lib/agents/nexus-engagement-intake/system-prompt.ts` (or equivalent)
- `src/components/chat/message-renderer.tsx` (or equivalent)
- `src/lib/agents/nexus-engagement-intake/route.ts` (or equivalent, if tool-call path chosen)

---

### P0-2 · Promised redirect never happens

**Observed behavior:**

Nexus's final message to Anand:

> "On it. Once the console loads I'll have the diagnostic plan waiting for you — vendor inventory pull, spend taxonomy, AI use case shortlist, and a first-pass savings hypothesis we can pressure-test with Jake.
>
> Give it a few seconds to redirect and we'll pick up there."

No redirect occurred. User stranded on intake page.

**Root cause hypothesis:**

Multiple possible causes:

1. Engagement creation backend call is firing but frontend isn't subscribed to completion event
2. Engagement creation is failing silently and redirect logic never triggers
3. `<engagement_ready>` tag is detected but the downstream orchestrator isn't wired
4. Engagement is being created successfully but no redirect URL is returned/followed

Need backend logs to confirm which. Starting with hypothesis 3 (most likely given P0-1 finding — if tool call doesn't exist, orchestration is loosely wired).

**Remediation:**

Part of P0-1 fix. When `create_engagement` tool completes successfully (or when text-tag is stripped and engagement record created), backend returns `{ success: true, engagement_id, redirect_url }`. Frontend receives, auto-navigates to `redirect_url` within 2 seconds.

If engagement creation fails, Nexus receives the error as tool_result, responds conversationally: "Something went wrong spinning up the engagement — [error detail if meaningful]. Want to try again, or should I help you figure out what's off?"

**Critical Nexus behavior change:**

Nexus should NOT promise redirects in the message content. Nexus should say:

> "Setting it up now."

…and nothing about "you'll be redirected" or "give it a few seconds." The redirect is a UI behavior Nexus doesn't control and shouldn't narrate. If Nexus promises a redirect and the redirect doesn't happen, Nexus looks broken. If Nexus simply announces creation and the redirect is a separate UI event, redirect failure is a system issue but Nexus's message still makes sense.

**System prompt addition:**

> "Do NOT narrate system behaviors like redirects, loading states, or UI transitions. These are handled by the application layer. Announce engagement creation conversationally and let the UI handle transitions. Never say 'you'll be redirected' or 'once the console loads.'"

**Acceptance criteria:**

- User completes intake
- Nexus announces creation without promising redirect
- Backend creates engagement within 3 seconds
- Frontend auto-navigates to `/engagements/[id]` within 2 seconds of creation
- If creation fails, Nexus receives error and responds conversationally, user stays on intake page

---

### P0-3 · Engagement vs Program language inconsistency in UI

**Observed behavior:**

User memory confirms: product was renamed from "Engagement" to "Program" weeks ago. But UI still shows:

- Top nav: "Engagements" (should be "Programs")
- Message header labels: "NEXUS · ENGAGEMENT" (should be "NEXUS · PROGRAM" or just "NEXUS")
- Breadcrumb: "ENGAGEMENT · NEW" (should be "PROGRAM · NEW")
- Input placeholder: "Describe the engagement…" (should be "Describe the program…")
- Page URL: `/engagements/new` (arguably fine to keep since changing URLs breaks bookmarks — leave route alone, change display label only)

**Root cause:**

Language rename was applied to spec docs + some surfaces but not systematically through the app. Partial migration.

**Remediation:**

Global find-and-replace in UI string files. Audit checklist:

- [ ] `src/app/**/*.tsx` — any literal "Engagement" / "Engagements" / "engagement" / "engagements" in rendered text
- [ ] `src/components/**/*.tsx` — same audit
- [ ] i18n files if any
- [ ] Database display labels (engagement.status, engagement.stage display values — verify)
- [ ] Email templates (if any exist)
- [ ] Agent system prompts (check if Nexus refers to "engagement" internally — should say "Program" in all user-visible responses)

**Do NOT change:**

- Database table names (`engagements` table stays — internal)
- TypeScript type names (`Engagement` type stays — internal)
- URL routes (`/engagements/*` stays — bookmark preservation)
- Migration file names (historical)
- Internal logging / telemetry

**Acceptance criteria:**

- Every user-visible surface says "Program" / "Programs"
- Nexus system prompts say "Program" in all generated messages
- Internal code / database / URLs unchanged
- No "Engagement" word appears anywhere a user can see it

**Special handling for Nexus agent label:**

Current: "NEXUS · ENGAGEMENT" on every Nexus message.  
Change to: "NEXUS" (drop the category suffix entirely).

The "· ENGAGEMENT" suffix was presumably there to differentiate Nexus from Sentinel and Atlas. Better approach: label format is "NEXUS" alone; the surface context (Programs vs Intelligence vs Tower) is already clear from the page.

---

### P0-4 · Nav shows Admin-persona items to all users

**Observed behavior:**

Top nav visible in Anand's test drive:

> Home · Engagements · Intelligence · Control Tower · Platform · Investor · Admin

When Prat demos this, he should NOT see "Platform" or "Investor" or "Admin." These are:

- **Platform:** Internal product concept / dev surface
- **Investor:** Gated investor page (token-protected)
- **Admin:** Admin user actions

Persona-appropriate nav for a Fortune 50 CIO logged in as themselves:

> Home · Programs · Intelligence · Control Tower

Four items. Clean. No internal scaffolding.

**Root cause:**

Nav rendering does not check user role or persona before rendering items. All nav items render regardless of user.

**Remediation:**

Role-gated nav rendering. Three user types:

1. **Admin / Founder** (Anand): sees all items including Platform, Investor, Admin
2. **Internal** (Ava / Maestro staff once they exist): sees Home, Programs, Intelligence, Control Tower, Admin
3. **Client user** (Prat, Priya, Dan): sees Home, Programs, Intelligence, Control Tower only

Implementation: check `user.role` or persona flag before rendering each nav item. Gate Platform, Investor, Admin behind role !== 'client'.

For Prat demo, ensure Prat's demo user is set up with persona `client` so nav renders clean.

**Acceptance criteria:**

- Anand (admin) sees all 7 nav items
- Prat demo user sees 4 nav items (Home, Programs, Intelligence, Control Tower)
- Switching persona in impersonation mode (if it exists) updates nav immediately

---

## P1 · IMPORTANT · Fix before Prat demo

### P1-1 · Typography / spacing consistency in chat messages

**Observed behavior (subjective from screenshot):**

Chat messages render with:
- NEXUS label in small caps teal — good
- User messages with "YOU" label in same small caps teal — good
- Message body in white on dark — readable
- Card boundaries between messages — fine

Issues:
- Line height on multi-paragraph Nexus responses feels slightly tight
- No visual anchor for what to do next after Nexus's response (user has to scroll down to find input)
- The JSON-leak issue from P0-1 compromised the visual hierarchy (monospace block dropped into otherwise prose chat looks broken)

**Remediation:**

Once P0-1 is fixed (no JSON leaks), validate chat readability holds up. If not, minor line-height and spacing pass. Not blocking.

---

### P1-2 · Input area affordances

**Observed behavior:**

Message input at bottom of page shows "Describe the engagement…" (becomes "Describe the program…" after P0-3 fix). "Send" button. That's it.

**Gap:**

During real test drives, users will want to:
- Attach a document (meeting transcript, existing charter, vendor list)
- Invoke a specific Intelligence product mid-conversation
- Re-generate Nexus's last response if it was off-target
- Copy the conversation to clipboard for sharing

None of these are visible in the current input UI.

**Remediation — not all urgent, prioritize:**

For Prat demo:
- Input remains as-is (just text + send)
- No attachment / invocation UI needed for demo flow

Post-demo:
- Add file attachment icon
- Add "invoke Intelligence product" slash-command-style interaction
- Add per-message regenerate + copy actions

**P1-2 is defer-post-demo except the P0-3 language fix.**

---

### P1-3 · Client selector in top nav

**Observed behavior:**

Top nav shows "Apex Retail ▾" as active client selector. Good UX pattern.

**Gap (unverified):**

- Does clicking the dropdown show First Capital Financial and Meridian Health as options?
- Does selecting a different client switch context across Home / Programs / Intelligence / Control Tower?
- What happens if user creates a Program while "Apex Retail" is selected, then switches to "First Capital"? Does Program stay attached to Apex?

Not tested. Likely works correctly for Apex today since that's the seeded client, but worth verifying all 3 clients switch cleanly before Prat demo.

**Remediation:**

Quick smoke test. Switch between Apex, First Capital, Meridian. Confirm:
- Nav header updates to show selected client
- URL updates appropriately
- Programs list shows only that client's Programs
- Intelligence threads scope to that client
- Control Tower shows that client's portfolio

If any break, log as separate bug.

---

## P2 · POLISH · When convenient

### P2-1 · Nexus acknowledgment of JSON leak felt too apologetic

**Observed:**

When Anand said "Ok i see. bunch of code..", Nexus replied:

> "Ha, sorry about that — that's just the handoff to the system to actually spin up the engagement. You won't normally see it."

The "Ha, sorry about that" is slightly off-tone. Real senior consultant would say "That's internal scaffolding you shouldn't see — noted, we'll hide that." More matter-of-fact, less apologetic-chatty.

**Remediation:**

System prompt tone adjustment. Delete once P0-1 is fixed (no more leaks, no need for recovery language). Note for future: Nexus's error-recovery tone should be grounded, not ingratiating.

**P2-1 resolves automatically when P0-1 ships.** No standalone work.

---

### P2-2 · Nexus offered both "User setup first" and "stub them inline" — ambiguous choice

**Observed:**

Nexus said:

> "Easiest path is to create them via User setup first, but I can also stub them inline if you give me a name and title."

Anand didn't choose either — he pivoted to "use CIO as sponsor" instead. Good outcome but the choice Nexus offered was unclear:

- What does "User setup" mean? Is that a separate flow? In another tab?
- What is "stub them inline"? A person record that doesn't fully exist?
- What's the difference operationally?

**Remediation:**

System prompt update. When Nexus offers choices that imply different workflows, Nexus should briefly describe the difference. Example better wording:

> "Easiest path: I can add them as a draft person record right now (takes 30 seconds, full setup can happen later). Or if you want a fully-onboarded CPO first — with email invite and portal access — we'd need to route through User setup, which takes a couple minutes. Which fits?"

Gives user enough information to choose without over-explaining.

**Priority:** Low. Address when polishing Nexus intake system prompt generally.

---

### P2-3 · Nexus pivoted smoothly on CPO → CDO but could go further

**Observed:**

Nexus found no CPO, offered Jake Chen (CDO) as closest fit with tradeoffs. Good. Anand accepted.

**Opportunity for depth:**

Nexus could have also noted: "Jake is CDO, so he owns digital strategy and probably has budget authority for digital/tech vendor consolidation. That makes this Program fit his mandate well — probably strengthens sponsor alignment vs. a hypothetical CPO who might be budget-holder but not AI-strategy-holder."

That kind of political/organizational context is senior-consultant territory. High value, low cost to add.

**Remediation:**

When Nexus offers a sponsor substitution, system prompt encourages noting why the substitute is a good fit beyond just title adjacency. Surfaces the political logic.

**Priority:** Low. Polish. Would make Nexus feel more like a consultant and less like a classifier.

---

### P2-4 · Timeline reference "eight to twelve weeks" too specific for a Nexus intake

**Observed:**

Nexus said:

> "Realistic timeline is eight to twelve weeks to first wave of savings, with the AI platform maturing over six months or so."

This is a reasonable consulting heuristic but Nexus is stating it with confidence during intake, before Phase 4 Diagnosis has happened, before data has been seen. That's a Phase 5 claim being made in Phase 0.

**Better framing:**

> "Typical engagements like this see first wave of savings in 8-12 weeks, with platform maturation over 6 months — but your actual timeline depends on what Phase 4 surfaces about data readiness and vendor contract windows. We'll tighten that once diagnosis is further along."

Acknowledges the heuristic, honors Phase 4 primacy.

**Priority:** Low. System prompt refinement.

---

## Summary

**P0 items (4) — must fix before next test drive:**

1. Strip `<engagement_ready>` JSON from user-visible chat (ideally via proper tool call; tactically via regex filter)
2. Fix redirect-after-creation flow + remove "you'll be redirected" language from Nexus system prompt
3. Global "Engagement" → "Program" in user-visible UI (keep internal names/routes)
4. Role-gated nav rendering (hide Platform / Investor / Admin from client persona)

**P1 items (3) — fix before Prat demo:**

1. Chat typography validation (after P0-1 resolved)
2. Input area — defer attachment/invocation UI, ship language fix only
3. Client selector switching smoke test across 3 clients

**P2 items (4) — polish when convenient:**

1. Nexus recovery tone (resolves via P0-1)
2. "User setup vs stub inline" choice clarity
3. Sponsor substitution political-context depth
4. Intake timeline claims deferred to Phase 4

---

## Paste-to-Codex block

> Corrections from first live test drive (April 21). Priority order:
>
> **P0-1** Fix `<engagement_ready>` JSON leaking into user-visible chat. Preferred: convert to proper Nexus tool call `create_engagement` with structured args, invisible to user. Tactical: frontend regex-strip tags before render, update system prompt to emit tags after conversational content.
>
> **P0-2** Engagement creation backend fires successfully but redirect doesn't happen. Wire tool_result (or tag-detection) to frontend redirect to `/engagements/[id]`. Update Nexus system prompt to NEVER promise redirects in message content. Nexus announces creation, UI handles navigation.
>
> **P0-3** Global "Engagement" → "Program" in user-visible text only. Scan `src/app/**/*.tsx` and `src/components/**/*.tsx` for literal strings. Also check Nexus system prompts. Do NOT change database tables, TypeScript types, URLs, migration names. Also change message label "NEXUS · ENGAGEMENT" to just "NEXUS".
>
> **P0-4** Role-gate top nav. Hide Platform, Investor, Admin items when user role is 'client'. Admin (Anand) continues to see all items.
>
> **P1-3** Smoke test client selector — Apex / First Capital / Meridian switching should update Programs list, Intelligence scope, Tower portfolio.
>
> Commit in logical PRs: P0-1+P0-2 together (both touch Nexus intake flow), P0-3 in own PR, P0-4 in own PR, P1-3 just verification.

---

**END OF DOCUMENT**
