# MW1 · Maestro Workshop Intelligence Contract

Slice ID: MW1
Slice name: Maestro Workshop Intelligence Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract governs the **Maestro Workshop Intelligence** product
surface. The Client Maestro is the human leading the engagement; the
platform's job is to make every workshop they lead **the most
prepared, best-captured, and most followed-up workshop they have
ever run** — without inserting itself into the room.

---

## A. Client Maestro role

The **Client Maestro** is the human consultant or engagement lead
who runs the workshop. They:

- Own the relationship with the executive sponsor.
- Set the agenda, hold the room, and run the conversation.
- Are accountable for the program's outcome at G1 / G2 / G3 / G4.
- Decide what the program does next.

The platform never replaces the Maestro. It prepares them, captures
the room, and synthesizes the outcome. The Maestro's voice is the
only voice in the room.

---

## B. Nexus as program mastermind

**Nexus** is the program mastermind. Across every workshop, Nexus:

- Composes the Context Bundle the Maestro reads before walking in.
- Tracks the program's gate readiness, evidence chain, and value
  ledger against the Maestro's intent for the session.
- Surfaces what is known, what is missing, and what the Maestro
  should ask.
- After the session, updates the program state from captured notes.

Nexus is the agent the Maestro talks to between sessions. Atlas
composes the executive editorial **after** Nexus has updated the
program state.

---

## C. AbarVa resources / SMEs

AbarVa's **resources** — pattern library, authored content, prior
case examples, vendor evaluations, regulatory references — are
composed alongside Nexus retrieval into the Maestro's Context
Bundle.

AbarVa's **SMEs** (subject-matter experts) are surfaced as
**recommendations**, not auto-assignments. The Maestro chooses
which SME to bring into the next workshop. Recommendations come
from:

- Pattern key match (e.g., AI governance pattern → AI governance
  SME).
- Industry / archetype alignment.
- Prior engagement history with the tenant.
- SME availability per the engagement calendar.

The platform never books the SME automatically; the Maestro decides.

---

## D. Before-workshop intelligence

For every scheduled workshop the platform produces a **pre-workshop
brief**. The brief is composed deterministically from the program
state and the Maestro's stated session objective.

### Required fields

| Field | Definition |
|---|---|
| **objective** | One sentence naming what the session must achieve. |
| **requiredAttendees** | Named attendees with role + reason for invitation. |
| **preReadList** | Documents the attendees should read before walking in. |
| **agenda** | Time-boxed agenda mapped to the objective. |
| **questionsToAsk** | Specific questions Nexus has surfaced as gaps. |
| **likelyTensions** | Known disagreements / unresolved decisions Nexus has detected. |
| **decisionPoints** | Decisions the room must make to advance the program. |
| **evidenceChecklist** | What must be captured for downstream G2 / G3 / G4 defense. |

### Voice

- The pre-workshop brief is read by the Maestro alone, not the
  attendees.
- The brief is direct, specific, and avoids fluff.
- Where Nexus does not have data, the brief honestly names the gap
  rather than fabricating a question.

---

## E. During / after-workshop capture

The platform does **not record audio** by default. It captures notes
the Maestro types, uploads, or pastes. Capture types:

| Capture | What it represents |
|---|---|
| **notes** | Free-form notes typed during the session. |
| **decisions** | Structured decision records (what was decided, by whom, when). |
| **risks** | Surfaced risks with named owner and mitigation. |
| **objections** | Surfaced objections from attendees with reason. |
| **missingInputs** | Inputs the room could not produce; deferred to next session. |
| **stakeholderAlignment** | Per-attendee alignment state (aligned / partial / unaligned). |
| **followUpActions** | Next-step actions with named owner and due date. |

Capture is **explicit**: the Maestro chooses what to file and where.
Auto-classification is offered but the Maestro confirms.

---

## F. After-workshop synthesis

After the session is filed, Nexus runs the deterministic
**post-workshop synthesis**. The synthesis:

1. **Updates program state.** Phase advance / hold / regress;
   evidence chain delta; value ledger delta; gate readiness delta.
2. **Revises deliverables.** Promotes Stub-tier deliverables to
   Outline / Rich based on captured content; surfaces deliverables
   that newly need refresh.
3. **Updates gate readiness.** Re-runs the canonical four-gate
   readiness check against captured inputs.
4. **Recommends next session.** Names the next session's
   objective, attendees, and earliest date based on dependency
   chain.
5. **Generates executive summary.** Atlas composes the
   one-page executive readout for the sponsor.

Synthesis is deterministic in v1 — no live model invocation. Live
synthesis arrives in a future slice.

---

## G. Save / stop / start program state

Programs are **resumable**. The Maestro can:

- **Save** — flush in-progress state to the program record without
  advancing the phase.
- **Stop** — pause the program; Nexus surfaces the resume
  checklist.
- **Start** (or resume) — re-open the program; Nexus replays the
  Context Bundle from the last save point.

Every save / stop / start emits an audit row. The Maestro is the
only role that can advance the phase.

---

## H. Meeting notes ingestion contract

The Maestro can ingest meeting notes from three sources today:

- Typed notes (in the platform).
- Pasted notes (from a personal note-taker).
- Uploaded docs (PDF / DOCX / Markdown).

For every ingestion the platform:

- Stores the raw text alongside the workshop record.
- Runs deterministic extractors (no model invocation in v1) for:
  decisions, risks, objections, missing inputs, follow-ups.
- Asks the Maestro to confirm the extractor outputs before filing.
- Tags every extracted record with `source: 'maestro_capture'` and
  `createdFrom: 'deterministic_seed'` until live extraction lands.

Audio recording, real-time transcription, and meeting bot ingestion
are deferred. The platform does not insert itself into the room.

---

## I. SME recommendation logic

SME recommendations are composed deterministically:

1. Match the program's pattern key (I1) against the SME taxonomy.
2. Score by industry / archetype alignment.
3. Filter by SME availability per the engagement calendar.
4. Rank by prior engagement history with the tenant.
5. Surface the **top three** SMEs with reason captions.

The Maestro selects (or rejects) any SME. The platform does not
auto-book.

---

## J. Dynamic deliverable refinement loop

After every workshop, deliverables are **re-evaluated** against
captured content:

- Stub-tier deliverables can be promoted to Outline.
- Outline deliverables can be promoted to Rich when captured
  evidence covers the required sections.
- Rich deliverables can be flagged as **stale** when captured
  content contradicts them.
- Required-but-stub deliverables surface as deliverable-coverage
  gaps in the Tower (S9e signal).

The refinement loop is deterministic in v1; live refinement (Nexus
generating new deliverable sections) is deferred to a future slice.

---

## K. Agent roles

| Agent | Role in the workshop loop |
|---|---|
| **Nexus** | Program mastermind. Composes the Context Bundle, tracks readiness, runs deterministic synthesis. |
| **Sentinel** | Detects patterns + failure modes (I1 / PF1) before and after the workshop. |
| **Steward** | Validates capture completeness; surfaces unowned items; runs gate readiness checks. |
| **Atlas** | Composes the executive readout after the workshop; never speaks during the workshop itself. |

Atlas only speaks **about** the workshop, never **in** the workshop.

---

## L. Future implementation slices

The following slices are proposed in dependency order. Each lands
in its own slice doc with explicit allowed / forbidden files.

| Slice | Name | Depends on | One-line goal |
|---|---|---|---|
| **MW2** | Workshop Readiness Read Model | MW1, S9d | Pure deterministic projection of program state into a per-workshop readiness shape. |
| **MW3** | Nexus Maestro Brief UI | MW1, MW2 | Apple-like surface where the Maestro reads the pre-workshop brief. |
| **MW4** | Meeting Notes Capture Contract | MW1 | Defines the typed / pasted / uploaded notes capture flow with deterministic extractors. |
| **MW5** | Session Template Generator | MW1, MW2 | Generates time-boxed agenda templates from the program's stated objective. |
| **MW6** | SME Recommendation Panel | MW1, ADM3 | Renders the top-three SME recommendations with reason captions. |
| **MW7** | Deliverable Refinement Loop | MW1, S9d, PDEL | Implements the deterministic Stub → Outline → Rich refinement after each workshop. |

---

## M. Acceptance for `verified` promotion of MW1

- Founder confirms the **Client Maestro / Nexus / SME** role
  partition.
- Founder confirms the **before / during / after** capture model
  and the **save / stop / start** lifecycle.
- Founder confirms the **meeting notes ingestion** contract excludes
  audio + real-time transcription in v1.
- Founder confirms the **SME recommendation** logic surfaces top
  three with the Maestro deciding.
- Founder confirms the **dynamic deliverable refinement** loop is
  deterministic in v1.
- Founder signs off on the future-slice plan MW2 → MW7.
- Application code, runtime, auth, supabase, and migrations remain
  untouched (test enforced via the manifest's forbidden-files
  list).

## Validation

- `npx tsc --noEmit --pretty false` — pass (no application code
  changed).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
