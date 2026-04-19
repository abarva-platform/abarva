# AbarVa Build Backlog — Execution Guide

**Generated:** April 18, 2026
**Context:** Post-Shail review. PR #2 (Supabase lazy-init) merged. PR #1 (client_brief + opening ceremony) ready to merge.
**Rule:** No timeframes. Execute one package at a time with Claude Code. Run the acceptance test. Move to next.

---

## HOW TO USE THIS DOCUMENT

Each package has four parts:

1. **Goal** — one sentence. What this package actually fixes.
2. **The Claude Code prompt** — paste directly into Claude Code. No editing.
3. **Acceptance test** — what "done" looks like. Must pass before moving on.
4. **Regression check** — what prior package's acceptance test you re-run to confirm nothing broke.

Packages 1–4 are specced in full detail. Packages 5–15 are specced at strategy level — their exact shape will be informed by what you learn from 1–4. I will write the detailed spec for each when you're ready to execute it.

---

## THE EXECUTION RULE

Do not skip ahead. The temptation after Package 4 will be to jump to the Contract Analyser (Package 9) because it's the shiny demo piece. Resist it. If the advisor still feels stale by session 3, no demo moment matters.

Sequence is:
- Memory foundation (1–4)
- State truthfulness (5–8)
- Differentiated products (9–11)
- Outcome credibility (12–13)
- Enterprise readiness (14–15)

---

# PHASE 1 — MEMORY FOUNDATION

These four packages make the advisor feel human across multiple interactions. Everything else is scaffolding around this.

---

## 🎯 PACKAGE 1 — SESSION MEMORY

### Goal
The advisor remembers everything said earlier in the current conversation. No more "advisor forgot what I told it two messages ago."

### Why it matters
Today, every advisor turn is one-shot. It reads `client_brief`, responds, forgets. If the CIO says "I'm most worried about Epic timing" in turn 2, by turn 4 the advisor has no idea. The opening ceremony is beautiful but the follow-up collapses. This fixes that.

### The Claude Code prompt

```
Build session memory for the advisor.

STEP 1 — Create Supabase table `session_messages`:

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null,
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  turn_number integer not null,
  client_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_messages_lookup
  on session_messages(engagement_id, user_id, turn_number desc);

create index if not exists idx_session_messages_client
  on session_messages(client_id, user_id, created_at desc);

STEP 2 — Modify the advisor route (src/app/api/advisor/route.ts
or wherever the chat endpoint lives; identify it by finding the
handler that calls anthropic.messages.create with client_brief).

Before generating a response:

a) Query last 20 turns for this engagement_id + user_id,
   ordered by turn_number ASC.

b) If total turns > 20, the OLDEST turns (everything before
   the last 20) need a summary. Make a cheap Haiku call:

   model: "claude-haiku-4-5-20251001"
   system: "You are summarizing an ongoing advisor conversation
            for context preservation. Produce a 3-5 sentence
            summary preserving: the user's stated concerns,
            any decisions made, any constraints stated, and
            the current topic. No fluff. No meta-commentary."
   user: [concatenated older turns]

c) Build the messages array for the main Claude call:

   system prompt = existing client_brief system prompt
                 + (if summary exists) "\n\nPRIOR CONVERSATION
                   SUMMARY:\n" + summary
   messages = last 20 turns verbatim + new user turn

d) Generate response as normal.

e) AFTER the response streams/completes, write TWO rows to
   session_messages:
   - The user's message (role='user', turn_number=N)
   - The assistant's response (role='assistant', turn_number=N+1)

Use the existing getSupabase() lazy pattern. Do NOT module-scope
the Supabase client.

STEP 3 — Handle missing fields gracefully. If engagement_id or
user_id is missing in the request, fall back to current behavior
(no memory) and log a warning. Don't crash.

STEP 4 — Add a /api/advisor/history endpoint:
GET /api/advisor/history?engagement_id=X&user_id=Y
Returns the full turn history as JSON. Protected by Clerk auth,
user must match user_id or be admin. This is for the UI to
restore conversation state on page reload.

STEP 5 — Modify the advisor UI component to call history on
mount and restore the turn list, so reloading the page doesn't
lose the conversation visually.

Commit message:
"feat: session memory — advisor reads prior turns + Haiku
summary of older context, persisted in session_messages"
```

### Acceptance test
1. Open Meridian. Start an engagement. Advisor opens with ceremony (from PR #1).
2. Reply: *"I'm most worried about Epic timing, not denial rate."*
3. Advisor responds.
4. Reply: *"Tell me more about the prior auth angle."*
5. Advisor's response should reference the Epic concern — something like *"Given you're most worried about Epic timing..."*
6. Reload the page. The conversation should still be visible.
7. Continue — advisor still remembers.

**Pass:** advisor references Epic concern from turn 2 in turn 4. Page reload preserves history.
**Fail:** advisor asks generic questions again, or conversation disappears on reload.

### Regression check
PR #1 opening ceremony still fires on brand-new engagement with zero prior turns. Verify by starting a *fresh* engagement — full demonstrate-knowledge-pressure-test opening should still appear.

---

## 🎯 PACKAGE 2 — RELATIONSHIP DEPTH AWARENESS

### Goal
Advisor opens differently on visit 2 than on visit 1. First session = full ceremony. Returning session = "good to see you, last time we landed on X, what's moved?"

### Why it matters
This is the specific "robotic on second engagement" problem. A human partner never repeats the full intro. The advisor shouldn't either.

### The Claude Code prompt

```
Build relationship depth awareness into the advisor.

STEP 1 — Create Supabase table:

create table if not exists user_client_relationship (
  user_id text not null,
  client_id text not null,
  session_count integer not null default 1,
  first_session_at timestamptz not null default now(),
  last_session_at timestamptz not null default now(),
  last_session_summary text,
  total_turns integer not null default 0,
  primary key (user_id, client_id)
);

STEP 2 — Define "session" boundary:
A new session starts if >2 hours have passed since the last
turn for this user+client combo. Otherwise the current session
continues.

STEP 3 — On every advisor request, BEFORE generating:

a) Query user_client_relationship for (user_id, client_id).

b) If row doesn't exist: this is session 1.
   - INSERT row with session_count=1.
   - Set depth_variable = "first_session".

c) If row exists: check time since last_session_at.
   - If gap < 2 hours: still same session. depth_variable
     = "continuing" (no opening change, just respond).
   - If gap >= 2 hours: new session.
     - Increment session_count.
     - Update last_session_at = now().
     - Determine depth_variable:
         session_count == 2: "returning_recent"
         session_count == 3-4: "returning_familiar"
         session_count >= 5: "established"

STEP 4 — Modify the advisor system prompt to branch on
depth_variable:

if depth_variable == "first_session":
   use existing PR #1 opening ceremony (demonstrate knowledge
   → name tension → pressure-test → Genome → sharp question)

if depth_variable == "continuing":
   no opening instruction — just respond to the current
   message naturally

if depth_variable == "returning_recent":
   "You are reopening a conversation with this user. You have
    spoken before. Do NOT repeat the full situation ceremony.
    Open with ONE sentence acknowledging return, ONE sentence
    referencing the most relevant prior context (from
    last_session_summary in the brief), and a sharp question
    about what's moved since. Tone: warm but direct."

if depth_variable == "returning_familiar":
   "You have worked with this user multiple times. Skip any
    preamble. Reference specific prior decisions or constraints.
    Pick up where you left off. Tone: colleague who just saw
    them yesterday."

if depth_variable == "established":
   "You are in an established working relationship. No intro,
    no recap. Start with an observation or pickup. Tone:
    trusted advisor on a standing call."

STEP 5 — At the END of each session (when the user's session
is idle for >30 min, or on explicit session-close event),
generate a session summary via Haiku and store in
last_session_summary. Use this content in future session
openings.

Prompt for summary:
"Summarize this advisor session in 2-3 sentences. Preserve:
 what the user was focused on, what was decided or deferred,
 what constraints were stated, and what's unresolved. This
 summary will be read when the user returns — write it as if
 briefing yourself for the next conversation."

STEP 6 — Update session_messages INSERT to also increment
user_client_relationship.total_turns.

Commit message:
"feat: relationship depth awareness — advisor opening adapts
to session count (first / continuing / returning / established),
session summaries stored for next-visit pickup"
```

### Acceptance test
1. **Session 1:** Fresh Meridian engagement. Full opening ceremony fires. Have a 3-turn conversation. Close tab.
2. **Session 2 (wait 2+ hours, or manually set last_session_at to yesterday in Supabase):** Reopen. Advisor should open with *"Good to see you back. Last time we landed on [X]. What's moved?"* — NOT the full denial-rate-Epic-CDO ceremony.
3. **Session 3:** Shorter still. Skips acknowledgment, goes to pickup.
4. **Session 5:** No intro at all. Starts with an observation or question.

**Pass:** visible tonal shift from session 1 → 2 → 3 → 5. No repeated ceremonies.
**Fail:** advisor repeats the full opening on session 2.

### Regression check
- Package 1: session memory still works within a given session (messages persist, reload restores).
- PR #1: first-ever session still gets full ceremony.

---

## 🎯 PACKAGE 3 — ENGAGEMENT LEDGER

### Goal
New engagements for the same client reference prior engagements. Completed decisions, deferrals, and outcomes are recorded and read back.

### Why it matters
Meridian runs Engagement 1 (RCM automation) and defers it. Weeks later they start Engagement 2 (vendor selection for Epic integration). The advisor should open Engagement 2 knowing Engagement 1 exists and referencing what was decided. Today: zero awareness.

### The Claude Code prompt

```
Build the engagement ledger.

STEP 1 — Create Supabase table:

create table if not exists engagement_history (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  engagement_id text not null,
  event_type text not null check (event_type in (
    'decision', 'deferral', 'phase_complete', 'phase_stalled',
    'outcome_committed', 'outcome_verified', 'engagement_started',
    'engagement_closed'
  )),
  event_summary text not null,
  event_detail jsonb,
  recorded_at timestamptz not null default now()
);

create index on engagement_history(client_id, recorded_at desc);
create index on engagement_history(engagement_id);

STEP 2 — Create the ledger extraction pass.

After EVERY advisor response is generated (Package 1's write
step), fire a secondary Haiku call:

model: "claude-haiku-4-5-20251001"
system: "You extract ledger-worthy events from advisor
         conversation turns. Return a JSON array of events.
         Each event has: event_type (one of: decision, deferral,
         constraint, outcome_committed), event_summary (one
         sentence), event_detail (key facts as JSON).

         ONLY extract if the turn contains an explicit
         durable commitment. Most turns contain NONE. Do not
         invent events. If nothing qualifies, return []."

user: [the user turn + assistant response pair]

If events are returned, INSERT them into engagement_history
with the current engagement_id and client_id.

STEP 3 — Modify advisor route to read ledger on NEW engagement.

When the advisor route detects this is the first turn of a NEW
engagement (no prior turns in session_messages for this
engagement_id), query:

  SELECT * FROM engagement_history
  WHERE client_id = $1 AND engagement_id != $2
  ORDER BY recorded_at DESC LIMIT 10;

If results exist, include in system prompt:

"PRIOR ENGAGEMENT HISTORY FOR THIS CLIENT:
 [formatted list of recent events from other engagements]

 OPENING INSTRUCTION: The user has prior engagement history
 with you. Before responding to their stated topic, reference
 ONE relevant prior event (decision, deferral, or constraint)
 and ask whether it's still in effect or the new engagement
 is separate. Do NOT give the full first-time ceremony."

This OVERRIDES the Package 2 depth logic for the special case
of "new engagement but prior engagement history exists."

STEP 4 — Seed engagement_history with events for the existing
Meridian/Arcturus/Apex seed data. At minimum:
- Meridian E001: engagement_started (Apr 1), phase_complete
  Phase 0 (Apr 5), decision "prioritize RCM automation" (Apr 5),
  phase_stalled Phase 1 (Apr 10, deferred pending data
  readiness fix), outcome_verified $22.4M (Apr 16).
- Same pattern for Arcturus and Apex.

STEP 5 — Add UI surface at /maestro/[client]/ledger showing
the full engagement history for the client. Read-only table:
date, engagement, event type, summary. This is the Maestro's
"what have we done here before" reference.

Commit message:
"feat: engagement ledger — durable events extracted after each
turn, surfaced when new engagements open for same client"
```

### Acceptance test
1. Open Meridian. The seed data should show Engagement E001 with multiple ledger events.
2. Create a NEW engagement for Meridian (different topic — e.g. "vendor selection for data platform").
3. Advisor's first message should reference Engagement E001 — something like *"Before we start — you've got the RCM automation engagement that wrapped with $22.4M verified, and Phase 1 of the AI governance work that stalled pending data readiness. Is this new data platform selection related, or a separate fire?"*
4. View `/maestro/meridian/ledger` — see the full event history.

**Pass:** new engagement opens referencing prior engagement by name + outcome.
**Fail:** new engagement opens as if the prior engagement didn't exist.

### Regression check
- Package 1: session memory intact within conversation.
- Package 2: first-time engagement for a *new* client (not Meridian) still gets full ceremony. Meridian's depth-based returning-session behavior still works when continuing Engagement E001.

---

## 🎯 PACKAGE 4 — CONSTRAINTS LAYER

### Goal
Durable statements the CIO makes ("Ensemble off-limits until Epic go-live") get captured and permanently filter future advice. Advisor never proposes what the user already ruled out.

### Why it matters
This is the relationship-memory completeness move. It's not "memory" in the sense of recalling what was said — it's enforcement. The advisor actively protects against violating prior constraints. This is what makes a partner feel trusted.

### The Claude Code prompt

```
Build the constraints layer.

STEP 1 — Create Supabase table:

create table if not exists client_constraints (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  constraint_text text not null,
  constraint_type text check (constraint_type in (
    'vendor', 'budget', 'timing', 'policy', 'technology', 'other'
  )),
  source_engagement_id text,
  source_turn_id uuid references session_messages(id),
  active boolean not null default true,
  expires_condition text,
  deactivated_at timestamptz,
  deactivated_reason text,
  created_at timestamptz not null default now()
);

create index on client_constraints(client_id, active)
  where active = true;

STEP 2 — Extend the Package 3 extraction pass.

Modify the post-response Haiku call to ALSO extract constraints.
Update its system prompt:

"You extract two things from advisor turns:

1. Ledger events (as before): decisions, deferrals,
   phase changes, outcomes.

2. Constraints: durable statements the user has made that
   should filter ALL future advice for this client.
   Examples:
   - 'We can't touch Ensemble until Epic goes live'
     → type: vendor, expires_condition: 'Epic go-live'
   - 'Board policy: no new vendor spend over $5M without
     full RFP'
     → type: policy, expires_condition: null (permanent)
   - 'We're not hiring net-new FTEs until FY27'
     → type: budget, expires_condition: 'FY27 start'

   Do NOT extract:
   - Temporary preferences ('let's discuss RCM first today')
   - Hypotheticals ('if we had more budget, we'd...')
   - Questions or uncertainty

   Return JSON: {events: [...], constraints: [...]}.
   Most turns: both arrays empty. Only extract when explicit."

When constraints are returned, INSERT them with the current
client_id, source_engagement_id, source_turn_id.

STEP 3 — Modify advisor route to load constraints BEFORE
generating every response.

Query:
  SELECT constraint_text, constraint_type, expires_condition
  FROM client_constraints
  WHERE client_id = $1 AND active = true
  ORDER BY created_at DESC;

If results exist, PREPEND to system prompt:

"ACTIVE CONSTRAINTS FOR THIS CLIENT — never propose anything
 that violates these. If the user's request would violate a
 constraint, acknowledge the constraint explicitly and ask
 whether it still holds before proceeding:

 [list of constraint_text with their types]"

STEP 4 — Add a constraint deactivation flow.

When the advisor response explicitly acknowledges a constraint
and the USER responds with language indicating the constraint
no longer holds ("that's lifted now", "board changed that",
"we're revisiting"), the extraction pass should flag the
constraint for deactivation.

Implementation: add a third field to extraction output:
  constraints_to_deactivate: [constraint_ids that should be
  marked active=false with deactivated_reason]

On receiving this, UPDATE client_constraints SET active=false,
deactivated_at=now(), deactivated_reason=... WHERE id IN (...).

STEP 5 — Add UI surface at /maestro/[client]/constraints showing
active constraints. Read-only list with date, type, text, source
engagement. Toggle to show deactivated constraints with
deactivation reason.

STEP 6 — Seed Meridian with two constraints:
- "Ensemble contract cannot be renegotiated until after Epic
   go-live in Q3 2026" (type: vendor, expires_condition:
   'Epic go-live')
- "No AI initiatives in production until named executive
   sponsor is in place" (type: policy)

Commit message:
"feat: constraints layer — durable user statements extracted,
persisted, and enforced on all future advisor responses"
```

### Acceptance test
1. Open Meridian. View `/maestro/meridian/constraints` — should show 2 seeded constraints.
2. Start a new engagement or continue an existing one. Ask: *"What should we do about the Ensemble contract? They're overcharging us."*
3. Advisor response should acknowledge the constraint — something like *"You told me Ensemble renegotiation is off-limits until Epic go-live. That still holds? If so, we have options short of renegotiation — SLA enforcement, credit claims, and documentation for the post-Epic renewal cycle."*
4. Reply: *"Actually, the board revisited — we can touch Ensemble now."*
5. Next turn, the advisor should proceed with Ensemble options AND the constraint should be marked deactivated in the UI.

**Pass:** advisor protects against constraint-violating advice on turn 1, accepts deactivation on turn 2, proceeds accordingly on turn 3.
**Fail:** advisor proposes Ensemble renegotiation without acknowledging the constraint.

### Regression check
- Package 1: session memory works.
- Package 2: depth-based openings still fire correctly.
- Package 3: engagement ledger still reads on new engagements.

---

## 🧭 MOMENT MAP AUDIT (between Package 3 and 4)

Before executing Package 4, run a 30-minute audit. For each moment below, describe desired advisor behavior. Log gaps vs what Packages 1–3 now provide:

- First-ever session, known client (Meridian), brand-new engagement
- First session, unknown client (uploaded from scratch), no seeded brief
- Second session same day (continuing), same engagement
- Second session 3 days later, same engagement (returning to stalled work)
- New engagement, same client, prior engagements exist
- Returning after >30 days (feels cold again?)
- User uploads new data mid-engagement — does brief update?
- Phase gate rejected — how does next turn frame the setback?
- Engagement closed with verified outcome — how does next engagement open?
- New user joining an existing client engagement mid-stream

Output: a table of (moment, desired behavior, current behavior after Package 3, gap). This becomes the regression test suite for everything after and reveals which of Packages 5–15 are most urgent.

---

# PHASE 2 — STATE TRUTHFULNESS

With memory solid, now the "AbarNexus already knows you" claim needs to stay true over time.

---

## 🎯 PACKAGE 5 — MOMENT MAP AUDIT (parallel, no code)

Covered above. Execute between Packages 3 and 4. Produces the test harness for all subsequent packages.

### The prompt (for me, not Claude Code)
When you're ready, say *"run moment map audit"* and I'll walk you through each moment, capture desired behavior, and produce the gap log.

---

## 🎯 PACKAGE 6 — LIVING CLIENT BRIEF

### Goal
`client_brief` stops being static JSON. Re-reads uploaded data and updates itself with timestamps. Epic days-out counts down. Denial rate updates when new RCM report uploaded.

### Strategy
A scheduled job (Supabase cron or Vercel cron) runs nightly. For each client, queries `engagement_uploads`, extracts current metrics via Claude, writes updated brief with a `brief_version` and `updated_at`. Advisor always reads the *latest* version. Old versions retained for audit.

### Key schema change
```sql
alter table client_brief add column brief_version integer default 1;
alter table client_brief add column last_source_files jsonb;
-- new column: metrics jsonb WITH per-metric timestamps
```

### Claude Code spec
Written on execution — depends on upload pipeline state at that moment.

### Acceptance test
Upload a new RCM report showing 16.4% denial rate. Within 24 hours (or manual trigger), next advisor session opens with "your denial rate has improved to 16.4 — what's the next pressure?" — not the stale 18.2%.

---

## 🎯 PACKAGE 7 — UPLOAD → RE-INGEST → RE-MATCH PIPELINE

### Goal
Every file upload triggers embed → index → Genome re-match → advisor sees new findings next session.

### Why it matters
Today uploads don't actually enrich AbarNexus. Fix: the whole thesis of "the platform learns from your data" requires the learning loop to exist. This is it.

### Strategy
Upload handler enqueues a job. Worker:
1. Parses file (PDF/XLSX/CSV)
2. Chunks + embeds via OpenAI/Voyage
3. Indexes to Pinecone under client namespace
4. Runs Genome match pass (existing logic)
5. Writes new matches to `genome_matches`
6. Notifies advisor context builder that client state is stale

### Claude Code spec
Written on execution — this one will be the largest package so far and should be broken into sub-packages once we get there.

### Acceptance test
Upload Meridian Q2 vendor scorecard. Within 5 minutes, advisor's next response on vendor topics references findings from that scorecard.

---

## 🎯 PACKAGE 8 — CHATGPT COMPARISON CI

### Goal
Automated weekly test: standard Meridian opening prompt through AbarVa + through plain Claude, side-by-side stored. Weekly review: is AbarVa still categorically sharper?

### Why it matters
Without this, we'll drift back to ordinary without noticing. This is the moat-verification loop.

### Strategy
Nightly GitHub Action or Vercel cron:
1. Fires a canonical "start Meridian engagement" request against AbarVa prod
2. Fires the same context to plain Claude (no tools, just the CIO framing)
3. Stores both responses in a Supabase `comparison_log` table
4. Simple weekly review UI at `/admin/comparison` showing side-by-side

### Claude Code spec
Written on execution.

### Acceptance test
Comparison log populates weekly. Reviewing 4 consecutive weeks shows AbarVa responses consistently sharper (more specific, more data-driven, better opening ceremony) vs plain Claude.

---

# PHASE 3 — DIFFERENTIATED PRODUCTS

Vendor Intelligence trio. The wow moments a CIO can feel in 60 seconds. Only build these *after* Phases 1–2 are solid.

---

## 🎯 PACKAGE 9 — CONTRACT ANALYSER

### Goal
PDF upload → Claude extraction → risk-scored clause analysis against hardcoded 30-clause benchmark library. Downloadable brief with specific redlines.

### Strategy
- `/vendor/contract-analyser` page with PDF drop zone
- Tool-use Claude call extracts clauses: SLA, liability caps, auto-renewal, termination, IP, data rights, audit rights
- Each clause compared against benchmark table (hardcoded initially — 30 clauses from IACCM public positions)
- Risk score per clause: green / yellow / red with $ exposure
- Downloadable PDF brief via server-side rendering

### Claude Code spec
Written on execution. Will require me to provide the 30 benchmark clauses — I'll research and produce them when you're ready.

### Acceptance test
Upload any real vendor contract. Within 60 seconds, get a risk report identifying at least 3 concrete clause issues with $ exposure estimates.

---

## 🎯 PACKAGE 10 — VENDOR DNA + NEGOTIATION INTELLIGENCE

### Goal
Seed `vendor_dna` table from USASpending.gov federal contract data (free, public). Top 20 enterprise vendors (healthcare + FinServ). Negotiation brief generator: vendor + deal context → playbook.

### Strategy
- One-time data pull from USASpending.gov API, filtered by NAICS 541511-541519
- ETL into `vendor_dna` table with: rate benchmarks, scope patterns, subcontractor behavior, transition risk
- `/vendor/negotiate` form: vendor + deal size + timing + leverage factors
- Claude generates negotiation playbook citing specific federal contract comparables

### Claude Code spec
Written on execution. Will include the USASpending query builder and initial seed set.

### Acceptance test
Enter "Infosys, AMS outsourcing, $45M, 3 years, healthcare". Get negotiation brief citing at least 3 comparable federal contracts with specific rate benchmarks and 5 named negotiation levers.

### Note from prior session
You pushed back on federal data as apples-to-oranges for AI-native work. That critique is valid. Package 10 as written targets traditional outsourcing contracts (AMS, cloud migration, analytics modernization) where federal data IS still the best public benchmark. For AI-native delivery pricing, we'll need a separate package — the "AI-Native Delivery Benchmarks" build — which uses public AI case studies and synthetic benchmarks rather than legacy hour-based data. Let's decide when we get there whether to split 10 into 10a (traditional) and 10b (AI-native).

---

## 🎯 PACKAGE 11 — SLA MONITOR (GENERIC)

### Goal
Generalize the Ensemble demo. Upload contract + monthly report → extract SLA commitments → calculate breach → generate claim letter.

### Strategy
- `/vendor/sla-monitor` page, two-file upload
- Claude extracts SLA terms from contract PDF
- Extracts actual performance from monthly report PDF
- Calculates breach using penalty formula
- Generates formal claim letter (downloadable)
- Tracks unclaimed credits in `vendor_sla_credits` table

### Claude Code spec
Written on execution.

### Acceptance test
Upload a vendor contract with 99.9% SLA and a monthly report showing 99.71% actual. Get breach calculation with credits owed ($X,XXX) and a downloadable formal claim letter citing the specific contract section.

---

# PHASE 4 — OUTCOME CREDIBILITY

Makes the fee model real and auditable. Not demo features — contract features.

---

## 🎯 PACKAGE 12 — DAY 0 BASELINE PROTOCOL

### Goal
Client uploads source data → advisor extracts baseline metrics → both parties digitally sign → locked in Supabase with hash. No human judgment in extraction.

### Strategy
- `/engagement/[id]/baseline` wizard
- Upload source document(s)
- Claude extracts metrics in structured format (configurable per engagement type)
- Display proposed baseline for Maestro review + client acknowledgment
- Digital signature via hash of extracted data + both parties' acknowledgment
- Lock to `engagement_baselines` table with immutable hash
- Audit trail of source document, extraction logic, timestamps

### Claude Code spec
Written on execution.

### Acceptance test
Complete the baseline protocol for a Meridian engagement. Attempt to modify the baseline after lock — should be blocked. Hash verification passes. Third-party can reproduce extraction from stored source.

---

## 🎯 PACKAGE 13 — MONTHLY OUTCOME EXTRACTION

### Goal
Same source pattern as baseline, same extraction methodology, auto-delta calculation. Feeds fee tracker, generates monthly invoice evidence.

### Strategy
- Scheduled monthly job per active engagement
- Re-requests source data from client
- Applies identical extraction as Day 0
- Calculates delta vs locked baseline
- Writes to `engagement_outcomes` table with per-month rows
- Generates invoice evidence package (PDF + source hash manifest)

### Claude Code spec
Written on execution. Requires Package 12 to be live.

### Acceptance test
Monthly outcome package generates for Meridian showing Month 3 delta vs Day 0 baseline, invoice-ready, reproducible from stored source.

---

# PHASE 5 — ENTERPRISE READINESS

CTO-led. Impossible solo. Needed before first real client data enters the system.

---

## 🎯 PACKAGE 14 — AUDIT LOG + EXPORT HOOKS

### Goal
Every advisor action, data access, and decision logged immutably. KPMG / Big 4 audit-ready package exportable.

### Strategy
- `audit_log` table: append-only, immutable rows
- Every sensitive action writes a row: actor, action, target, timestamp, context hash
- Export endpoint produces a signed audit bundle
- Retention policy + Row-level security so users only see their scope

### Claude Code spec
Written when CTO onboards. This build requires architectural choices (append-only enforcement, hash chaining, export format) that should not be made solo.

---

## 🎯 PACKAGE 15 — ENTERPRISE AUTH & RBAC

### Goal
SSO (Azure AD minimum), granular roles (Executive / Maestro / Viewer / CISO / Admin), session timeout, concurrent session control.

### Strategy
- Migrate from Clerk dev instance to Clerk prod or replace with Auth0 / WorkOS
- SAML SSO config per client
- RBAC table with role→permission mapping
- Middleware enforcing permissions on every route
- Session timeout + concurrent session limit

### Claude Code spec
Written when CTO onboards. Biggest single build in the backlog.

---

# CROSS-CUTTING DISCIPLINE

Two standing practices enforced from this session forward, not one-off builds.

## Weekly cold-user test
Every Friday, 15 minutes. Someone who hasn't touched the product that week does a fresh session on one flow. What surprised them? What broke? What felt ordinary? Rotates through flows — after a month, every flow has been cold-tested.

**First test flow:** open Meridian, start a new engagement, continue it across 3 separate sessions (use Package 2 time-skip to simulate). Note anything that feels robotic, wrong, or like a ChatGPT answer rather than a senior partner answer.

## Curve-ball log
At the end of every build session, both parties name one way the thing we just built could break under real use that we haven't addressed. Not critique — blind-spot surfacing. Logged at the bottom of this document as we go.

### Curve-ball log (starting now)
- **After Package 0 (opening ceremony, pre-compaction):** Second engagement would sound robotic — Anand flagged. Leads to Package 2.
- **After Package 1 (session memory):** [to be logged on completion]

---

# WHAT TO DO NEXT

1. **Merge PR #1** if not already merged. That ships the opening ceremony (Package 0).
2. **Run the Shail re-test** on live app — verify Meridian opening now demonstrates knowledge.
3. **Execute Package 1 (Session Memory).** Paste the Claude Code prompt from above. Ship it. Run the acceptance test.
4. **Report back.** Tell me "Package 1 shipped" with any observations. I'll confirm acceptance and spec Package 2 in full detail with current context.
5. **Repeat** for Package 2, then 3. Run Moment Map Audit. Continue.

---

# ONE FINAL NOTE

This backlog represents the *current* view. After each package ships, it will change. Packages 5–15 are specced at strategy level precisely because what we learn from 1–4 will reshape them. Don't treat the order past Package 4 as fixed — treat it as a default we'll revisit every 3 packages.

The only thing that is fixed: memory foundation (1–4) before anything else. That's non-negotiable.

Go build Package 1.
