# AbarVa Programs Strict Completion Kickoff

**Version:** 1.2 (DRAFT — awaiting founder Q4, Q8 answers + remaining pre-flight artifacts)
**Authoritative reference:** `docs/build/ARCHITECTURE_VISION_V1.md` (v1.2)
**Source defects:** `docs/build/CRAWL_DEFECTS_REPORT_2026-04-29.md` (42 observations)
**Discipline:** Surface-by-surface, every dimension, no half-fixes
**Predecessor:** UX audit + form fix wave + production crawl test
**Successor:** Sourcing strict completion (deferred until Programs passes strict)

---

## §-1 · Revision history

**v1.2 (this version)** incorporates the v1.1 review:

- F0.4 split: tool-use applies only to **interactive** routes (4 of 8); synthesis routes get F0.2 + F0.3 only
- Foundation order flipped to F0.1 → F0.2 → F0.4 → F0.3 so the instruction layer references tools that exist
- Cold-open delivery mechanism added as an explicit Surface 1 implementation note
- Conversation persistence (Obs #4) added as explicit Surface 1 scope item with storage approach
- F0.2 user-context block ordering corrected: appended **after** role/identity, not prepended
- F0.4 streaming clarified: tool-use is a multi-turn loop (new completion request with `tool_result` appended), not a single paused stream
- F0.1 clarifies the canonical pattern detail route is `/source/patterns/[patternId]`; other variants flagged for later consolidation
- F0.1 scope includes a reusable `<AgentMarkdown>` component; surfaces with custom message renderers (Atlas drawer, Engagement console, etc.) wire it as their surface ships, not in F0.1
- Pre-flight specifies a 30-min minimum wait window after pause file commit
- §14 dispatch sequence adds: loop re-greps `@anthropic-ai/sdk` imports at dispatch start; halts if route count differs from documented 8
- F0.3 validator gains `malformed-citation-tag` violation type

**v1.1** incorporated the v1 review (pre-flight, all 8 routes enumerated, action-claim integrity reframed as F0.4 tool-use, validator → telemetry, recentActivity dropped, both `/programs/new` routes, PR-count estimates removed, foundation reframed sequential, §10.5 founder critical-path, cold-open vs in-conversation address-by-name, filename corrected to `AgentResponse.tsx`, pattern regex extended to N-segment IDs, citation tags rendered as inline chips, Q7 dropped from required-before-fire).

---

## §0 · Pre-flight requirements (executed BEFORE this kickoff fires)

This kickoff references three documents that must exist at the start of every wave:

1. `docs/build/ARCHITECTURE_VISION_V1.md` — must be authored and committed (status: pending)
2. `docs/build/CRAWL_DEFECTS_REPORT_2026-04-29.md` — must be committed from chat history (status: pending)
3. `docs/build/CORPUS_PAUSE.md` — must be re-created (was paused in `e246175c`, resumed in `871fe9b1`; **currently RUNNING, must be re-paused**)

**Pre-flight PR (operational housekeeping, ships first):**

```
chore(ops): pre-flight for programs strict completion wave

- Commit ARCHITECTURE_VISION_V1.md to docs/build/
- Commit CRAWL_DEFECTS_REPORT_2026-04-29.md to docs/build/
- Re-create docs/build/CORPUS_PAUSE.md to halt corpus loop
- Wait ≥30 min after pause-file merge before declaring pass
```

**Pre-flight acceptance:**

- [ ] All three docs exist at the paths above
- [ ] Corpus loop confirmed paused — **wait at least 30 minutes after pause-file merge** with no new corpus PRs landing
- [ ] Founder verifies pause + docs in repo

If pre-flight fails, this kickoff cannot fire. The autonomous loop dispatched against this kickoff halts at first read if any referenced doc is missing.

---

## §1 · The discipline this kickoff enforces

This is not a defect-cluster fix wave. It is a **surface-by-surface strict completion** wave.

The discipline:

- Pick one surface
- Fix it on every dimension
- Verify it passes strict before moving to the next
- Do not move to the next surface until the current surface is done

A surface is done when ALL of these are true:

1. **Agent as expert consultant** — the agent on this surface knows the user (David) by name, references his role and sponsorship history, adapts tone to his role lens, builds rapport like a senior consulting partner who has worked with him for months. Handles small-talk gracefully. Never claims actions it didn't take.

2. **Reactive workspace** — the right pane materializes the agent's reasoning as it happens. No static dashboards next to active conversations. No forms competing with agents. Structured artifacts assemble in real-time as the agent reasons.

3. **Knowledge layer real** — agent answers ground in corpus when corpus has answers, ground in tenant data when tenant has answers, ground in general knowledge transparently when nothing else applies. Pattern citations are real and clickable.

4. **Data integrity** — no DEMO data bleeding through. No stale dates. No debug labels. Numbers reconciled across surfaces. Gates evaluate against real evidence.

5. **Action-claim integrity** — when the agent says "Created", "Registered", "Scheduled", "Updated", the API call DID succeed. Enforced **structurally via tool-use** (F0.4): conversational theater is impossible because the response is gated on the tool result.

If any one fails for the surface, the surface is not done. No exceptions.

---

## §2 · Why surface-by-surface, not defect cluster

Customers experience surfaces, not defect clusters. A customer walking to `/programs/new` either has a complete experience or doesn't. Fixing "blockers" without fixing "serious" leaves seams; fixing "experience" without fixing "knowledge" leaves trust gaps; fixing "agent" without fixing "reactive workspace" leaves the wrong paradigm.

The cost: the first complete surface takes longer to ship. The benefit: when it ships, it actually works.

---

## §3 · Structure

```
PRE-FLIGHT (operational, ships first)
   ↓
FOUNDATION LAYER (cross-cutting infrastructure, sequential)
   F0.1 → F0.2 → F0.4 → F0.3
   ↓
Surface 1 · /programs/new (the create-program flow, both routes)
   ↓
Surface 2 · /programs/[id] (program detail, phase tabs)
   ↓
Surface 3 · /programs (programs list)
   ↓
Surface 4 · /home (home dashboard with Nexus)
   ↓
Surface 5 · /programs/[id]/report (full report)
   ↓
PROGRAMS STRICT COMPLETE
```

**Foundation ships sequentially.** F0.4 ships before F0.3 so the instruction layer references tools that exist (instructions describe what tool-use guarantees; if tools aren't registered, the instruction lies).

After foundation, surfaces ship sequentially. No parallel surface work.

---

## §4 · Foundation Layer (ships before any surface work)

**The 8 LLM routes in scope (verified by repo grep for `@anthropic-ai/sdk` imports):**

**Interactive (chat-shaped, support tool-use in F0.4):**
1. `src/app/api/chat/route.ts`
2. `src/app/api/chat/agent/route.ts`
3. `src/app/api/chat/step/route.ts`
4. `src/app/api/engage/[engagementId]/turn/route.ts`

**Synthesis (one-shot generation, F0.2 + F0.3 only — F0.4 does NOT apply):**
5. `src/app/api/programs/synthesis/route.ts`
6. `src/app/api/reasoning/stage-synthesis/route.ts`
7. `src/app/api/tower/synthesis/route.ts`
8. `src/app/api/source/synthesis/route.ts`

Synthesis routes produce one-shot recommendations (verified: `programs/synthesis/route.ts` returns "2–3 sentence maestro-voice recommendation, no markdown"). They take no user actions; tools have no role there. Forcing tool-use shape onto them would be regression risk for no benefit.

Every foundation fix that touches "agent routes" applies to ALL 8 unless explicitly noted otherwise.

---

### F0.1 · Markdown→HTML renderer in agent message rendering

**Defect addressed:** Crawl observations #3, #28 — every agent on every surface renders markdown as raw text (asterisks, pipe tables, hash symbols visible as literal characters).

**Scope:**

The repo has multiple components rendering agent text (`AgentResponse.tsx`, `AtlasDrawer.tsx`, `AtlasChatPanel.tsx`, `EngagementConsole.tsx`, `StageSynthesisDrawer.tsx`, etc.). F0.1 ships:

1. **A reusable `<AgentMarkdown>` component** in `src/lib/agent/markdownRenderer.ts` — the canonical text-to-formatted-React renderer
2. **Wires it into `src/components/agent/AgentResponse.tsx`** — the structured renderer that's used by Steward (`/programs/new`) and most consoles via `AgentRail`

Surfaces with custom message renderers (Atlas drawer, Engagement console, etc.) wire `<AgentMarkdown>` when their surface fix ships, not in F0.1. F0.1 is the renderer + the canonical wiring; per-surface wiring follows the surface-by-surface discipline.

**Implementation:**

Use `react-markdown` with `remark-gfm` for GitHub-flavored markdown. Custom renderers for:

- **Pattern IDs** — regex `\b(PAT(?:-[A-Z]+)+-\d+|T\d+-[A-Z]+\d+)\b` (handles N-segment IDs like `PAT-SRC-CAT-EHS-001`) → render as `<a href="/source/patterns/{id}">`. **Canonical pattern detail route is `/source/patterns/[patternId]`** (verified: `src/app/(maestro)/source/patterns/[patternId]`). Other pattern detail routes exist (`/programs/patterns`, `/(public)/patterns`, `/intelligence/patterns`); consolidation is out of scope for this kickoff.
- **Program IDs** — regex `\bAPX-[A-Z]+-\d{4}\b` → `/programs/{id}`
- **Source IDs** — regex `\bSRC-[A-Z]+-\d{4}\b` → `/source/{id}` (events) or `/source/patterns/{id}` (patterns) — disambiguate by prefix lookup
- **Citation tags** — regex `\[(user-context|tenant-specific|PAT-[A-Z\-]+\d+):\s*([^\]]+)\]` → render as inline chips:
  - `[user-context: ...]` → small chip, light navy background, "personal" icon
  - `[tenant-specific: ...]` → small chip, IBM-blue accent, "building" icon
  - `[PAT-...: ...]` → small chip, paper background with navy border, links to pattern detail
  - `Drawing on general practice (not AbarVa-specific):` (literal phrase) → italic preface with subtle divider
- Tables: HTML tables with brand-aligned styling (paper bg, navy borders, IBM blue accents)
- Code blocks, lists, headers: native rendering
- XSS prevention: sanitize via `rehype-sanitize`

**Coexistence with `{{cite:...}}` placeholders:** `AgentResponse.tsx` already resolves `{{cite:type:id}}` placeholders to `<AgentCitation>`. The new renderer applies markdown to the text segments **between** citation placeholders, leaving the citation resolution pipeline intact.

**Acceptance:**

1. Open Steward chat on `/programs/new`, send a message, receive a response with bold/table/pattern citation
2. Verify: bold renders as bold, not `**bold**`
3. Verify: table renders as visual grid
4. Verify: pattern ID renders as clickable link, navigates to `/source/patterns/{id}`
5. Verify: 4-segment pattern IDs (`PAT-SRC-CAT-EHS-001`) link correctly
6. Verify: citation tags `[user-context: ...]`, `[tenant-specific: ...]`, `[PAT-...]` render as chips
7. Verify: `{{cite:type:id}}` placeholders still render as `<AgentCitation>` pills
8. XSS test: send `<script>alert('xss')</script>`, verify sanitized
9. Snapshot Steward + AgentRail-using surfaces — markdown rendered, structure intact

**Out of scope:**
- Wiring `<AgentMarkdown>` into Atlas drawer, Engagement console, etc. (per-surface)
- Changing what agents say (just how it renders)
- Adding new artifact types beyond markdown (surface-specific)

---

### F0.2 · User context (Layer 0) injection into all agent prompts

**Defect addressed:** Crawl observation #31 — agents don't know the logged-in user by name.

**Files:**
- `src/lib/agent/userContext.ts` (NEW — extract user context from session)
- All 8 agent route files listed in §4 — extend system prompt composition

**Implementation:**

Create `getUserContext(session)` returning:

```typescript
type UserContext = {
  firstName: string;        // "David"
  fullName: string;         // "David <Last>"
  role: string;             // pulled from user record
  tenantId: string;         // "apex-retail-group"
  tenantDisplayName: string; // "Apex Retail Group"
  sponsorshipHistory: {     // populated from engagement records where user is sponsor
    programId: string;
    programName: string;
    currentPhase: string;
  }[];
};
```

**`recentActivity` is explicitly NOT in scope.** No user-activity log exists in the schema. Adding it would require activity-capture infrastructure (out of scope for this kickoff).

**Prompt composition order (matters):**

```
1. Role / identity / agent voice          ← existing per-agent role line
2. USER CONTEXT (Layer 0)                 ← NEW from F0.2 — appended AFTER role
3. Knowledge / domain context             ← existing demo block, retrieval context
4. Task / instructions                    ← existing
```

User context goes **after role establishment, before task instructions**. Putting it before role dilutes role priming.

The injected block:

```
USER CONTEXT (highest priority — Layer 0):
You are speaking with {firstName} ({role} at {tenantDisplayName}).

{firstName}'s sponsorship history:
- {programName} ({phase}): you sponsored this
- ...

Address {firstName} by name in greetings and when contextually appropriate. 
Reference his role lens when framing responses. Acknowledge his sponsorships 
when relevant.
```

**For each of the 8 routes:**
- Extract session at request entry
- Call `getUserContext(session)`
- Compose user context block AFTER existing role/voice line, BEFORE knowledge/task content

**Acceptance:**

1. Sign in fresh as David
2. Open Nexus chat on `/programs/apx-cdp-2026`, ask "good morning"
3. Verify Nexus addresses by name: "Morning, David."
4. Ask "what programs am I sponsoring?"
5. Verify Nexus references actual sponsorship history
6. Repeat with each agent: Steward (`/programs/new`), Sentinel (`/source/...`), Atlas (`/tower`)
7. All four agents address user by name
8. **Verify across all 8 routes:** trigger each route; confirm user context present in the LLM call (inspect via logging or server-side assertion)

---

### F0.4 · Tool-use shape for actions (structural action-claim integrity)

**Note: F0.4 ships BEFORE F0.3** — the instruction layer in F0.3 instructs agents to invoke tools, which only makes sense once tools are registered.

**Defect addressed:** Crawl observation #1 (Steward "Try again" lies), #35 (Steward A/B/C ambiguity), #18 (Advance to P4 button bypasses gates) — at the architectural level.

**Why tool-use, not instructions:**

Instructions ("don't claim success without verifying API succeeded") rely on agent compliance. Tool-use ("agent emits `commit_program` call, route invokes API, response only sends after tool result") makes "claimed without doing" structurally impossible. The agent literally cannot say "Registered ✅" before the tool returns success because response generation is gated on the tool result.

**Scope: interactive routes only.** F0.4 applies to the 4 interactive routes (`chat`, `chat/agent`, `chat/step`, `engage/turn`). Synthesis routes are unchanged.

**Files:**
- `src/lib/agent/tools/registry.ts` (NEW — central tool catalog)
- `src/lib/agent/tools/program/commitProgram.ts` (NEW — first tool, used by Surface 1)
- `src/lib/agent/streaming/toolUseLoop.ts` (NEW — handles the tool-use turn loop)
- 4 interactive agent route files — refactored to support function-calling shape

**Streaming pattern (clarified):**

Anthropic's tool-use streaming is a **multi-turn loop**, not a single paused stream:

1. Route streams the agent's response.
2. When the model emits a `tool_use` block, the stream completes for that turn.
3. Route invokes the tool's `handler`.
4. Route issues a **new** completion request with conversation history + `tool_result` appended.
5. Route streams the new response (which contains the agent's natural-language confirmation).
6. Steps 2-5 repeat if the model emits another `tool_use`.

The Anthropic SDK's `messages.stream()` plus a manual loop handles this. Reference: Anthropic SDK tool-use docs. Do not reach for `pause()`/`resume()` semantics — they don't exist.

**Tool catalog shape:**

Each tool has `name`, `description`, `input_schema`, `handler`, `surfaces` (route-context patterns where the tool is exposed).

**First tool: `commit_program`** (used by Surface 1):

```typescript
{
  name: 'commit_program',
  description: 'Persist a new program to the database after user has explicitly confirmed.',
  input_schema: {
    type: 'object',
    properties: {
      program_name: { type: 'string' },
      problem_statement: { type: 'string' },
      target_outcome: { type: 'string' },
      timeline: { type: 'string' },
      sponsor_person_id: { type: 'string' },
      lead_person_id: { type: 'string' },
      classification: { type: 'string' },
      matched_pattern_id: { type: 'string' }
    },
    required: ['program_name', 'problem_statement', 'sponsor_person_id']
  },
  surfaces: ['/programs/new', '/demo/programs/new'],
  handler: async (args, ctx) => {
    // Refresh auth token if expired
    // POST to /api/programs with args
    // Return { success: true, program_id: ... } or { success: false, error: ... }
  }
}
```

**Failure handling:** If the tool handler returns `{ success: false }`, the agent receives this in the next turn's `tool_result` and generates an honest failure message: "Couldn't register the program — the create API returned a 401 (session expired). Want me to refresh and try again?"

**Token refresh:** The `commit_program` handler explicitly refreshes the auth token before the POST if the token is near expiry. Closes Obs #1.

**Acceptance:**

1. Walk Surface 1 conversation through to "Shall I register?" confirmation
2. User confirms ("yes")
3. Verify in network log: `commit_program` tool call invoked
4. Verify in DB: program record exists
5. Verify in chat: Steward's "Registered ✅" message appears AFTER tool succeeds
6. Force tool failure (mock API returns 401) — verify Steward reports failure honestly with recovery offer
7. Token expiry test: let session sit until token near-expires, then trigger creation. Verify automatic refresh.
8. Verify across the 4 interactive routes: each registers its relevant tools, none expose tools outside their surface

**Out of scope:**
- Tools beyond `commit_program` (other tools ship per surface as needed — `advance_phase` with Surface 2, etc.)
- Permission system for tools (every tool runs with current user's permissions; per-tool gating is later)

---

### F0.3 · Synthesis instruction layer (the trust contract)

**Note: F0.3 ships AFTER F0.4** — by the time agents read "invoke the corresponding tool," tools are registered and the instruction is true.

**Defect addressed:** Crawl observations #9 (Nexus refuses AMS data), #15 (Sentinel rigid scope), #32 (Nexus refuses small-talk) — and architectural gap G1 from vision.

**Note on action-claim integrity:** Instruction text describes what F0.4 tool-use enforces. Integrity itself comes from F0.4; instruction text aligns the agent's voice with the structural reality.

**Files:**
- `src/lib/intelligence/synthesis/instructionLayer.ts` (NEW)
- `src/lib/intelligence/synthesis/outputValidator.ts` (NEW — telemetry only)
- All 8 agent route files — compose instruction layer into system prompts (after user context from F0.2)

**Instruction layer content:**

```
KNOWLEDGE PRIORITY ORDER:

1. USER CONTEXT (Layer 0) — David's name, role, sponsorship
   Cite as: [user-context: based on David's CDP sponsorship]

2. TENANT-SPECIFIC DATA (Layer 1) — Apex Retail's prior decisions
   Cite as: [tenant-specific: based on Apex Retail's 2024 Vendor C selection]

3. ABARVA CORPUS (Layer 2) — typed patterns, signals, contradictions
   Cite as: [PAT-PRG-CDP-001: Customer Data Platform Programme Lifecycle]

4. GENERAL KNOWLEDGE (Layer 3) — fallback, used transparently
   Disclose as: Drawing on general practice (not AbarVa-specific):

USE LAYERS IN PRIORITY ORDER. When a higher-priority layer answers, prefer it.

CONVERSATIONAL SCOPE POLICY:

Casual or out-of-scope questions deserve brief acknowledgment + answer + redirect.
Never refuse small-talk rigidly.

WRONG: "That's outside my remit."
RIGHT: "Probably mid-70s in Tampa today. But you're not here for weather — 
       here's what's pressing on your portfolio..."

When a question is in-scope but feels boundary-adjacent, use available data. 
Don't deflect when you have the answer.

WRONG: "Vendor selection is outside Nexus's lane."
RIGHT: "Vendor C was selected at BAFO Stage 7 — pricing 14% below median. 
       Here's why it's the right call..."

ACTION-CLAIM INTEGRITY:

When the user requests an action (create program, schedule meeting, register 
vendor, etc.), invoke the corresponding tool. Do NOT announce success in your 
response unless the tool result confirms the action succeeded.

The available tools are exposed by the runtime. If you need an action that has 
no tool, say so honestly: "I'd need a tool I don't have access to in order 
to actually do that. Want me to draft the request for you to send manually?"

DO NOT:
- Cite a pattern that doesn't exist in the retrieval results
- Claim user/tenant-specific knowledge you don't have
- Pretend general LLM knowledge came from corpus
- Fabricate analyst reports, vendor pricing, specific numbers

YOU ARE A SENIOR CONSULTING PARTNER:

You're not a chatbot. You're a senior consulting partner who's worked with 
David and his team for months. You know their portfolio. You build rapport.

Address David by name. Reference his prior work when relevant. Frame responses 
through his role lens. Be direct, substantive, helpful.
```

**Validator (telemetry only, NOT a blocker):**

`outputValidator.ts` exports `validateSynthesisOutput(output, context)`:

```typescript
type Violation = {
  type:
    | 'uncited-pattern'
    | 'fabricated-number'
    | 'undisclosed-fallback'
    | 'rigid-scope-refusal'
    | 'malformed-citation-tag';
  detail: string;
  span?: [number, number];
};
```

Notes:
- Action-claim violations are NOT in the validator (enforced structurally by F0.4 tool-use)
- `malformed-citation-tag` flags citation tags that don't match the canonical bracket grammar (case variants, em-dashes, missing colons) — surfaces LLM compliance drift as telemetry rather than silently falling through to plain text in the F0.1 renderer

**Validation timing:** post-hoc, after the response has fully streamed. Validator runs against the complete final text. Violations logged to `synthesis_violations` for monitoring. **Validator does NOT block streaming.** Pre-stream validation requires buffering, which kills streaming. The structural integrity mechanism is tool-use (F0.4); the validator is alarm telemetry.

**Acceptance:**

1. Open any agent chat, ask weather small-talk → response answers briefly + redirects
2. Ask Nexus on `/programs/apx-cdp-2026` about AMS vendors → response uses available data
3. Trigger an intentional fabrication test (force agent to cite non-existent `PAT-FAKE-001`) → validator logs `uncited-pattern`
4. Send a malformed citation tag in a test response → validator logs `malformed-citation-tag`
5. Verify validator does NOT block streaming
6. Verify violations table populates correctly
7. Apply across all 8 agent routes — every route composes instruction layer

---

### Foundation Layer · Acceptance Gate

Before ANY surface work begins:

- [ ] F0.1 PR merged: markdown renders as HTML in `AgentResponse`-using surfaces (Steward, Nexus rail), citation chips render
- [ ] F0.2 PR merged: all 4 agents address user by name, all 8 routes inject user context (after role, before task)
- [ ] F0.4 PR merged: tool-use shape supported in 4 interactive routes; `commit_program` tool exists and tested end-to-end
- [ ] F0.3 PR merged: synthesis instruction layer composed into all 8 agent routes; validator runs post-hoc telemetry
- [ ] Production deployment verified: founder personally tests on live `app.abarva.ai`
- [ ] Smoke tests:
  - [ ] Markdown rendering on Steward + Nexus rail
  - [ ] Each agent addresses David by name
  - [ ] Small-talk on each agent — graceful redirect, not refusal
  - [ ] Trigger an action via tool-use (test program creation in dev) — verify structural integrity (no claim without API success)

If any item fails: foundation work continues. Do NOT proceed to Surface 1.

---

## §5 · Surface 1 · `/programs/new` (the create-program flow)

**Two routes in scope (both replaced as a single coordinated change):**
- `src/app/programs/new/page.tsx` (production)
- `src/app/demo/programs/new/page.tsx` (demo)

Both routes get the same reactive workspace + Steward conversation. Demo route may diverge in fixtures (different tenant, sample data) but the UX paradigm is identical.

### Surface 1 · Implementation scope (added in v1.2)

**Cold-open delivery mechanism.** Surface 1 demands a server-rendered initial Steward greeting keyed to user identity. The delivery path:
- Page is a server component (or has a server-component wrapper)
- On render, calls `getUserContext(session)` (from F0.2) and a small `composeColdOpen(userContext)` helper that produces a structured `RenderedResponse` with first-message text
- Initial message is hydrated as the first item in the conversation thread
- No LLM call required for the cold-open — it's a templated greeting using user's first name

**Conversation persistence.** Surface 1 demands "Steward conversation lost on reload" be fixed (Obs #4). Approach:
- Steward conversations are persisted as engagement turns in the existing engagement schema (the same store used for chat threads elsewhere)
- Engagement is keyed by `(user_id, surface, draft_program_correlation_id)` so the in-flight program origination has a stable thread
- On page mount, if a draft engagement exists for the user on this surface, hydrate the thread from it
- On `commit_program` success, the engagement is marked `committed` and dissociated from `/programs/new`; navigation to the new program detail page happens

If conversation persistence requires schema additions, those ship as part of Surface 1 (acknowledged scope, not silent drift).

### Strict completion criteria for `/programs/new`

**Agent (Steward) is the expert consultant:**

- [ ] **Cold-open address-by-name:** server-rendered initial greeting from Steward when David lands on the page (before he types anything). "Morning, David. Let's stand up a new program — what are we solving?" Per implementation scope above.
- [ ] **In-conversation address-by-name:** Steward addresses David by name where natural through conversation (not at every turn — that's robotic — but when the conversational moment calls for it).
- [ ] References David's existing portfolio when relevant
- [ ] Conducts the program origination as a conversation, not as form-filling instructions
- [ ] Extracts structured information from natural language
- [ ] Matches the use case to corpus patterns and CITES the matched pattern
- [ ] Surfaces cross-program dependencies
- [ ] Handles small-talk gracefully
- [ ] Drafts the program brief through dialogue
- [ ] Confirms with the user before any action
- [ ] On confirmation, **emits `commit_program` tool call** (per F0.4)
- [ ] Confirmation message ("Registered ✅") only generates after tool returns success
- [ ] On failure, reports failure honestly with recovery options

**Reactive workspace works:**
- [ ] Both legacy 3-step forms (production + demo) are REMOVED
- [ ] Right pane shows a reactive Program Brief that assembles as Steward extracts each piece
- [ ] Brief fields populate as Steward extracts them (name, classification, matched pattern with chip, sponsor, lead, target outcomes, dependencies)
- [ ] By "Shall I register?", right pane shows complete brief ready to commit
- [ ] On registration success (via tool), navigation to `/programs/[new-id]`

**Knowledge layer real:**
- [ ] Steward retrieves from corpus, tenant data, user context
- [ ] All pattern citations clickable (via F0.1 renderer, target `/source/patterns/{id}`)
- [ ] Citation tags `[user-context]`, `[tenant-specific]`, `[PAT-...]` render as chips
- [ ] No fabricated pattern IDs

**Data integrity:**
- [ ] Newly created program persists in database
- [ ] Appears in `/programs` list, has detail page, survives refresh
- [ ] No DEMO-prefixed data on this surface
- [ ] Demo route uses demo fixtures only; production route uses Apex Retail data only — no cross-bleed

**Action-claim integrity (structural, via F0.4):**
- [ ] Session expiry on submit fixed (token refresh in `commit_program` handler)
- [ ] When Steward says "Registered ✅", program ACTUALLY exists in DB (structurally guaranteed)
- [ ] Pre-work assignment claims either invoke real notification tools OR are clearly drafted-not-sent
- [ ] Schedule claims either invoke real calendar tools OR are clearly proposed-not-scheduled

### Defects this surface fix closes

From the crawl report:
- B1 (Obs #1) Session expiry on form submit — closed via F0.4 token refresh
- B3 (Obs #2) Form competing with agent — closed by removing both forms
- S (Obs #4) Steward conversation lost on reload — closed via engagement-keyed conversation persistence (Surface 1 scope)
- S (Obs #5) APX-AMS-2026 not creatable — closed via working create flow
- S (Obs #35) Steward A/B/C ambiguity — closed via tool-use (F0.4)

Plus inherits from foundation: F0.1 (markdown), F0.2 (user awareness), F0.3 (instruction layer), F0.4 (tool-use).

### Surface 1 · Acceptance Gate

- [ ] Founder personally walks both routes (`/programs/new` and `/demo/programs/new`) end-to-end
- [ ] Steward conducts the full origination conversation
- [ ] Cold-open greeting addresses David by name on both routes
- [ ] Right pane assembles brief reactively
- [ ] On confirm, program is created via `commit_program` tool, persists, navigation works
- [ ] All 5 strict completion dimensions verified
- [ ] Re-crawl `/programs/new` only — confirm zero blockers, zero serious

If any item fails: Surface 1 work continues. Do NOT proceed to Surface 2.

---

## §6 · Surface 2 · `/programs/[id]` (program detail with phase tabs)

### Strict completion criteria for `/programs/[id]`

**Agent (Nexus) is the expert consultant:**
- [ ] Cold-open: Nexus's initial message references David by name AND the specific program
- [ ] In-conversation address-by-name where natural
- [ ] Knows current phase, gate status, blockers, recent activity
- [ ] Cites real corpus patterns (clickable)
- [ ] References cross-program dependencies
- [ ] Synthesizes vendor/sourcing data when program has linked source events (closes Obs #9)
- [ ] Handles small-talk gracefully
- [ ] Uses tools (`advance_phase`, `record_decision`, etc. — introduced as needed) for actions

**Reactive workspace works:**
- [ ] Phase tabs DRIVE main content (closes Obs #7, #20, #29)
- [ ] Each phase tab shows phase-specific content
- [ ] When Nexus discusses entities, right pane highlights them
- [ ] Stage advancement is a confirmed action via `advance_phase` tool

**Knowledge layer real:**
- [ ] Retrieval pulls from corpus, tenant data, user context
- [ ] Pattern citations clickable
- [ ] Cross-instance citations clickable

**Data integrity:**
- [ ] No DEMO-prefixed data
- [ ] No "Deterministic seed" debug labels
- [ ] Gate evaluation reflects real evidence
- [ ] Synthesis confidence calculated from actual data, not zero (closes Obs #26)
- [ ] Numbers reconcile with home, Tower, source events

**Action-claim integrity:**
- [ ] "Advance to P4: Build" GATED when criteria unmet (closes Obs #18)
- [ ] Successful advancement persists via `advance_phase` tool
- [ ] Document upload claims verify against storage write
- [ ] Schedule claims verify against calendar/scheduler

### Surface 2 · Acceptance Gate

- [ ] Founder walks `/programs/apx-cdp-2026` through all 6 phase tabs
- [ ] Each phase tab shows phase-specific content
- [ ] Nexus addresses David by name, references CDP sponsorship
- [ ] Nexus answers AMS vendor questions using available data
- [ ] Gate enforcement on Advance buttons verified
- [ ] DEMO data not visible
- [ ] Re-crawl `/programs/apx-cdp-2026` — zero blockers, zero serious

---

## §7 · Surface 3 · `/programs` (programs list)

### Strict completion criteria

**Agent on this surface:**
- [ ] Cold-open addresses David
- [ ] Provides portfolio-level commentary on demand
- [ ] Synthesizes across the listed programs

**Reactive workspace works:**
- [ ] When agent discusses specific programs, those programs highlight in the list
- [ ] Filter/sort interactions update the list reactively
- [ ] Click on a program navigates correctly

**Knowledge layer real:**
- [ ] Programs reflect tenant scope only (no DEMO bleed)
- [ ] Cross-program patterns surface

**Data integrity:**
- [ ] All Apex Retail programs visible (6 plus any created)
- [ ] No DEMO-prefixed entries
- [ ] Phase, status, gate state accurate per program
- [ ] Numbers reconcile with detail pages

**Action-claim integrity:**
- [ ] "+ Originate program" navigates to `/programs/new`
- [ ] No fabricated program data

### Surface 3 · Acceptance Gate

- [ ] All Apex Retail programs visible, no DEMO bleed
- [ ] Agent addresses David and synthesizes portfolio
- [ ] Click navigation works
- [ ] Re-crawl `/programs` — zero blockers, zero serious

---

## §8 · Surface 4 · `/home` (home dashboard with Nexus)

### Strict completion criteria

**Agent (Nexus) is the expert consultant:**
- [ ] Morning briefing addresses David by name (verify still works post-foundation)
- [ ] References sponsorship and recent activity in briefing
- [ ] Handles small-talk gracefully (closes Obs #32)
- [ ] Provides cross-portfolio synthesis on demand
- [ ] No "outside my lane" rigid refusals

**Reactive workspace works:**
- [ ] When Nexus discusses programs/pressures/source events, right-pane cards highlight or expand
- [ ] AgentColumn layout proportion meaningful for Mode A surfaces
- [ ] Suggested actions A/B/C have clear state via tool-use affordances

**Knowledge layer real:**
- [ ] Pattern, program, source event, pressure citations all clickable

**Data integrity:**
- [ ] Header date is current (closes Obs #6)
- [ ] All metric cards reflect real data
- [ ] No DEMO-prefixed entries (closes Obs #27 fully)
- [ ] LOCKED badge resolved per founder decision (§11 Q4)
- [ ] Gate pass rate, alert count, evidence coverage accurate or properly disclosed (§11 Q8)

**Action-claim integrity:**
- [ ] Nexus's "Want me to..." offers either trigger real tools or are clearly framed as suggestions

### Surface 4 · Acceptance Gate

- [ ] Sign in fresh as David, land on home
- [ ] Date current, no DEMO bleed, LOCKED resolved
- [ ] Nexus briefing personalized
- [ ] Small-talk handled gracefully
- [ ] Re-crawl `/home` — zero blockers, zero serious

---

## §9 · Surface 5 · `/programs/[id]/report` (full program report)

### Strict completion criteria

- [ ] Report renders for any program (test on APX-CDP-2026, APX-CC-2026, APX-MRC-2025)
- [ ] Gate Summary table reflects current state
- [ ] Active Contradictions populated from real corpus + tenant data
- [ ] Risk Register populated correctly
- [ ] Citations clickable
- [ ] Print/PDF export works
- [ ] No DEMO bleed
- [ ] All five dimensions hold

### Surface 5 · Acceptance Gate

- [ ] Generate report for 3+ programs, all render correctly
- [ ] Print to PDF, verify formatting
- [ ] All citations work
- [ ] Re-crawl `/programs/[id]/report` — zero blockers, zero serious

---

## §10 · Programs Strict Complete · Final Gate

- [ ] Run a FULL Programs re-crawl
- [ ] Confirm zero blockers across all Programs surfaces
- [ ] Confirm zero serious defects across all Programs surfaces
- [ ] Founder personally walks Discovery → Operate journey end-to-end
- [ ] Founder confirms: "I would let a CPO walk this without apology"

If confirmed: **Programs is strict complete.** Update `ARCHITECTURE_VISION_V1.md` to v1.3. Begin Sourcing strict completion (separate kickoff).

---

## §10.5 · Founder critical-path acknowledgment

This kickoff places the founder on the critical path at every gate:

1. Pre-flight verification
2. Foundation Layer Acceptance Gate
3. Surface 1 Acceptance Gate
4. Surface 2 Acceptance Gate
5. Surface 3 Acceptance Gate
6. Surface 4 Acceptance Gate
7. Surface 5 Acceptance Gate
8. Final Gate

**8 founder-blocking checkpoints.** Combined with no-parallel-work, founder availability is the rate-limiting resource for this entire wave.

This is a deliberate cost. Strict criteria are subjective; cross-dimensional interactions only surface in real walkthroughs; the acceptance bar is "founder confirms readiness," not "tests pass."

**Operational implication:** plan ~30-60 min of personal walkthrough time per gate. 8 gates × 45 min ≈ 6 hours of founder time across the wave. Concentrate gates in dedicated review windows.

If founder availability becomes the bottleneck, invest in better gating tooling (auto-generated dimension checklists, screenshot diffing), not in relaxing gates.

---

## §11 · Decisions needed before this kickoff fires

Required answers before fire:

1. **Q4 (LOCKED badge meaning):** Tooltip explaining? Hide entirely? Some other treatment? **NEEDS FOUNDER INPUT.**
2. **Q8 (Gate pass rate 0% / 155 alerts):** Real fixture state or calibration artifacts? Affects Surface 4 + Surface 2 data integrity scope. **NEEDS FOUNDER INPUT.**

Already resolved:
3. Q1 (Reactive workspace scope on /programs/new): Replace form entirely. Both routes. Confirmed.
4. Q2 (DEMO data in Tower): Bug — strip from Apex Retail tenant view. Confirmed.
5. Q3 (APX-AMS-2026 fixture): Don't seed — fix create flow. Confirmed.
6. Q5 (Steward A/B/C semantics): Triggers via tool-use. Confirmed via F0.4.
7. Q6 (Nexus scope boundary): Use available data. Confirmed via F0.3.
8. Q7 (Admin reasoning tools): Out of scope for Programs strict. Deferred to /intelligence fix wave.

---

## §12 · What this kickoff is NOT

- Not a Sourcing fix wave
- Not a corpus build wave
- Not a knowledge layer activation wave
- Not an Azure migration wave
- Not a feature-add wave
- Not parallel work

---

## §13 · Anti-patterns this kickoff explicitly rejects

1. **Generative loops without scope guards.** Explicit scope per surface; halt on drift.
2. **Schema-without-data.** Every artifact type defined must be loaded with real data and queried in production before the surface ships.
3. **Code-without-binding.** Every new component must be wired into the live route.
4. **Form-led with agent decoration.** Surface 1 explicitly removes this.
5. **Velocity-without-direction reporting.** Report against strict completion criteria, not PR counts.
6. **Parallel surface work.** One surface at a time. Foundation is sequential (F0.1 → F0.2 → F0.4 → F0.3).
7. **Documentation-implementation drift.** Update implementation or update kickoff explicitly.

---

## §14 · How this kickoff gets dispatched

**Pre-conditions:**

1. Founder confirms answers to §11 Q4 and Q8
2. Pre-flight PR has shipped (vision + crawl docs committed; corpus pause re-created)
3. Corpus loop confirmed paused for ≥30 min after pause-file merge with no new corpus PRs landing

**Dispatch sequence:**

1. This kickoff committed to `docs/build/PROGRAMS_STRICT_COMPLETION_KICKOFF_V1.md`
2. Foundation Layer dispatches as 4 sequential PRs: F0.1 → F0.2 → F0.4 → F0.3
3. Foundation Acceptance Gate verified by founder before Surface 1
4. Surfaces 1-5 dispatch sequentially, each with founder acceptance gate
5. Final Gate verified — Programs strict complete

**The autonomous agent dispatched against this kickoff:**

- **At dispatch start: re-greps `@anthropic-ai/sdk` imports across `src/app`. Halts and reports if route count differs from the documented 8.** (Catches stale enumeration if a route was added between kickoff commit and dispatch.)
- Reads this entire document at the start of every wave
- Reads `ARCHITECTURE_VISION_V1.md` at the start of every wave
- Reads `CRAWL_DEFECTS_REPORT_2026-04-29.md` at the start of every wave
- Halts and reports if any referenced doc is missing
- Halts and reports if asked to violate any anti-pattern
- Halts and reports if a surface's acceptance gate fails
- Does NOT proceed to next surface without founder confirmation
- Does NOT generate work outside the surface currently being fixed

---

## §15 · Status

**Status:** DRAFT v1.2.

**Awaiting:**
- Founder answers to §11 Q4 (LOCKED badge) and Q8 (gate pass rate / alerts real or fixture)
- Pre-flight artifacts (commit `ARCHITECTURE_VISION_V1.md` + `CRAWL_DEFECTS_REPORT_2026-04-29.md`)

The corpus pause file (`docs/build/CORPUS_PAUSE.md`) is being recreated as part of v1.2 commit. This kickoff document itself is being committed to the repo as the canonical build canon.

**Ready to commit and dispatch when founder Q4/Q8 + missing source docs resolve.**

---

**End of Programs Strict Completion Kickoff v1.2.**
