# Code Desktop Prompt v3 — AbarVa Platform Canon Integration

**For:** Anand Sundaram
**Date:** April 24, 2026
**Session type:** Canon integration (NOT implementation)
**Revision reason:** v2 had two stale assumptions that Code caught correctly:
1. Referenced a non-existent `docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md` path
2. Assumed Cycle 2 was closing and Cycle 3 was next, when reality is Cycle 3 is mid-flight with 15 PRs merged under "Wave 1 P0 sweep" charter

Both corrections baked into this v3 prompt.

---

## How to use this file

1. Open Claude Code Desktop in `/Users/anand/Projects/nexus/`
2. Paste the prompt block below as your first message
3. When Code reaches Step 2, upload the 11 files from your local copy of `/mnt/user-data/outputs/platform-design/`
4. Let Code run through steps 3-7
5. Review the commit diff before pushing
6. After session completes, run the follow-up revision session (see "Post-session revision needed" at bottom of this file)

---

## The prompt (paste everything below this line into Code Desktop)

```
You are working on the AbarVa repository at /Users/anand/Projects/nexus/.

CRITICAL: This session is NOT an implementation session. This session is a
canon integration session. You will NOT write application code. You will
integrate 11 new platform-design documents into the repo and update governance
state. Implementation happens in a later session against the locked canon.

## Auto-approval scope for this session

The following operations run WITHOUT asking me for approval on each one.
Run them directly:

AUTO-APPROVED (do not ask):
- Read any file in the repo
- List directory contents
- Create the new directory docs/platform-design/
- Create / write files inside docs/platform-design/ (the 11 canon files)
- Edit CYCLE_STATE.md per Step 5 below
- git add, git status, git diff (local inspection)
- git commit (local commit only - see Step 6 for exact message)
- File integrity checks (line count, SHA, wc -l)

NOT AUTO-APPROVED (stop and ask):
- git push to any remote
- git merge into any branch
- Any deployment command (vercel deploy, vercel --prod, npm run deploy, etc.)
- Modifying content inside the 11 canon files (they must be byte-identical
  to what I provide)
- Modifying any file outside docs/platform-design/ and CYCLE_STATE.md
- Installing or modifying dependencies
- Running tests, dev server, or build
- Decisions on Q1, Q2, Q3 (founder decisions pending)
- Any implementation of C4-D01 through C4-D07 scope candidates
- Any refactor of existing code
- Any resolution of conflicts between new canon and existing design-canon
- Fixing the two known issues flagged in Step 2 below (founder will address
  in a separate revision session)

Rule of thumb: if it changes code, hits a remote, or requires product
judgment, stop and ask. If it moves documentation files, inspects state,
or commits locally, proceed without asking.

## Known issues baked into this session (do NOT try to fix)

Two issues are known and intentionally deferred. Do not fix either one.
Flag them in your final implementation review packet so founder can
address in a short follow-up session.

Known-issue-1: Broken path references inside the 11 canon files.
Several canon files reference `docs/design-canon/08-agent-fabric-per-turn-
contract-backlog.md` which does not exist in this repo. The actual
docs/design-canon/ uses descriptive filenames, not numbered filenames.
This was a stale-memory error from an earlier session. Canon files stay
byte-identical for this integration; the path references get corrected
in a separate follow-up session before the canon is promoted to
AUTHORED-LOCKED.

Known-issue-2: Cycle numbering inside CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md.
That file references scope items C3-D01 through C3-D07. Actual cycle
numbering will be C4-D01 through C4-D07 in CYCLE_STATE.md (because
Cycle 3 is already active with a different charter). The review doc's
C3-Dxx naming gets corrected in the same follow-up session as above.

For this integration session: place the 11 files as-is, use C4-Dxx in
CYCLE_STATE.md, and flag both issues for later.

## Step 1 - Read governance state first

Read in order:
1. /Users/anand/Projects/nexus/CYCLE_STATE.md
2. List contents of /Users/anand/Projects/nexus/docs/design-canon/
   (do NOT try to read a specific numbered file - it does not exist;
    we want to know what actually IS in that directory so Step 4's
    cross-check uses real filenames)

Report back:
- Current cycle number and status
- Whether Cycle 2 is still MERGED-PENDING-VERIFICATION or has advanced
- Whether Clerk email-code auth has been enabled (check for notes in
  CYCLE_STATE about this)
- Full list of files in docs/design-canon/ so we know what to cross-
  check against in Step 4
- Whether docs/platform-design/ directory already exists (it should not)

Do not proceed to Step 2 until you have emitted this status.

## Step 2 - Receive the new canon

I will provide 11 markdown files that belong in a NEW directory:
/Users/anand/Projects/nexus/docs/platform-design/

The files are:
- 00_AGENT_CENTRIC_MASTER_ANCHOR.md
- 01_PLATFORM_NORTH_STAR.md
- 02_CONTEXT_BUNDLE_STANDARD.md
- 03_PAGE_LEVEL_AGENT_CONTRACTS.md
- 04_VISUAL_AND_INTERACTION_SYSTEM.md
- 05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md
- 06_VALIDATION_AND_CRAWLER_PERSONAS.md
- 07_FAILURE_MODE_CATALOG.md
- 08_BUILD_GOVERNANCE.md
- GPT_REVIEW_NOTES.md
- CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md

You will (auto-approved):
1. Create the docs/platform-design/ directory
2. Place all 11 files there VERBATIM. Do NOT edit content. Do NOT "fix"
   typos. Do NOT "improve" prose. Do NOT fix Known-issue-1 or Known-
   issue-2 above. These files are AUTHORED-DRAFT by design.
3. Emit for each file: path, line count, and SHA-256 so we verify
   transfer integrity.

## Step 3 - Read the canon in the specified order

After files are placed, read them in this sequence and emit a one-paragraph
summary of each:

1. docs/platform-design/00_AGENT_CENTRIC_MASTER_ANCHOR.md
2. docs/platform-design/CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md
3. docs/platform-design/01_PLATFORM_NORTH_STAR.md
4. docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md
5. docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md
6. docs/platform-design/04_VISUAL_AND_INTERACTION_SYSTEM.md
7. docs/platform-design/05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md
8. docs/platform-design/06_VALIDATION_AND_CRAWLER_PERSONAS.md
9. docs/platform-design/07_FAILURE_MODE_CATALOG.md
10. docs/platform-design/08_BUILD_GOVERNANCE.md

## Step 4 - Cross-check against existing canon

Check for conflicts between the new platform-design canon and the files
you listed from docs/design-canon/ in Step 1. Use the ACTUAL filenames
you discovered, not the numbered paths that may appear inside the canon
documents.

Pay particular attention to:
- Any docs/design-canon/ file that describes agent per-turn behavior,
  voice contracts, or runtime agent fabric (these may conflict with
  02 Context Bundle Standard and 03 Page-Level Agent Contracts)
- Any docs/design-canon/ file that describes per-surface UI patterns
  (may conflict with 04 Visual and Interaction System)
- Any docs/design-canon/ file that describes component specifications
  (may conflict with 04 Visual and Interaction System)
- Any docs/pattern-library/ file that describes pattern structure
  (may conflict with 02 Context Bundle Standard Category 6 Patterns)

Emit a structured list of conflicts:
- Conflict location (specific file + section or line range)
- Nature of conflict (contradictory rule, contradictory naming, etc.)
- Proposed resolution (preserve new canon per doc 00 source-of-truth map,
  or preserve existing, or requires founder decision)

Do NOT fix conflicts in this session. Document them only.

## Step 5 - Update CYCLE_STATE.md (auto-approved)

Edit /Users/anand/Projects/nexus/CYCLE_STATE.md to:

1. Leave existing Cycle 2 entry UNCHANGED except:
   - If Clerk email-code auth is now enabled (per what you saw in Step 1),
     update only the blocking note to reflect that persona walks can now
     proceed for C2-02 through C2-14
   - Do not change Cycle 2 status or scope

2. Leave existing Cycle 3 entry UNCHANGED entirely:
   - Cycle 3 (Wave 1 P0 sweep, 15 PRs merged) stays exactly as-is
   - Do not rename, do not renumber, do not modify scope
   - The canon integration is net-new scope, not a replacement

3. APPEND a new Cycle 4 - Canon Integration and Implementation Gates
   section AFTER the existing Cycle 3 section:

   Cycle 4 - Canon Integration and Implementation Gates
   Status: SCOPE-PROPOSED - AWAITING-FOUNDER-DECISIONS
   Prerequisites before scope lock:
     - Founder answers to Q1, Q2, Q3 per
       docs/platform-design/CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md
     - Cycle 3 (Wave 1 P0 sweep) reaches natural pause point before
       Cycle 4 execution begins
     - Founder promotes 11 canon documents from AUTHORED-DRAFT to
       AUTHORED-LOCKED after review
     - Two known-issue fixes applied in short revision session
       (broken path refs, C3/C4 naming in review doc)

   Scope candidates (not locked):
     - C4-D01: Context Bundle 5-state runtime implementation
       (per docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md addendum)
     - C4-D02: Page readiness contract authored per surface (5 contracts)
       (per docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md addendum)
     - C4-D03: Persona crawler verdict format adoption
       (per docs/platform-design/06_VALIDATION_AND_CRAWLER_PERSONAS.md
        addendum)
     - C4-D04: Implementation review packet as PR template
       (per docs/platform-design/08_BUILD_GOVERNANCE.md addendum)
     - C4-D05: Suggested action quality linter
       (per docs/platform-design/05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md
        addendum)
     - C4-D06: Named component specs - Readiness Meter, Gate State Badge,
       Action Bar (per docs/platform-design/04_VISUAL_AND_INTERACTION_
       SYSTEM.md addendum)
     - C4-D07: Attachment-to-evidence outcome enforcement
       (per docs/platform-design/05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md
        addendum)

   Note: CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md labels these items C3-D01
   through C3-D07 (stale numbering from a prior session). CYCLE_STATE.md
   uses C4-Dxx to avoid collision with the active Cycle 3 Wave 1 sweep.
   Review doc will be corrected in a follow-up revision session.

4. APPEND a Cycle 5+ deferred items section AFTER Cycle 4:
   - Context freshness metadata per Context Bundle field
   - Context provenance tagging per major fact
   - Failure mode 12-field schema backfill across F1.1-F9.4
   - Resolution of canon-vs-existing conflicts documented in Step 4
     of this session

5. Do NOT mark Cycle 4 as active. Do NOT begin any C4 item.

## Step 6 - Commit locally (auto-approved)

Before committing:
- Run `git status` and show me the file list
- Run `git diff --stat` and show me the change summary
- Verify no files outside docs/platform-design/ and CYCLE_STATE.md are
  in the changeset

If any file outside the expected scope appears in the diff, STOP and ask.
Do not commit unscoped changes.

If the diff is clean, create a single local commit with this exact message:

    docs(platform-design): integrate agent-centric canon v1.0-draft (Cycle 4)

    Add 11-file platform-design canon including GPT refinement pass:
    - 00-08: Nine canon documents (AUTHORED-DRAFT, GPT-REFINED)
    - GPT_REVIEW_NOTES.md: GPT refinement summary
    - CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md: Consistency review plus scope
      candidates (originally labeled C3-Dxx in the review doc, renamed to
      C4-Dxx in CYCLE_STATE.md to avoid collision with active Cycle 3)

    Update CYCLE_STATE.md:
    - Cycle 2: unchanged entries, Clerk auth status updated if enabled
    - Cycle 3: unchanged, active Wave 1 P0 sweep continues
    - Cycle 4 (new): scope candidates C4-D01 through C4-D07 proposed,
      AWAITING-FOUNDER-DECISIONS Q1/Q2/Q3
    - Cycle 5+ deferred items listed

    Known issues flagged for later fix (NOT fixed in this session):
    - Several canon files reference docs/design-canon/08-agent-fabric-
      per-turn-contract-backlog.md which does not exist. Path correction
      needed in 00_AGENT_CENTRIC_MASTER_ANCHOR.md and related files.
    - CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md uses C3-Dxx naming that now
      conflicts with active Cycle 3; rename to C4-Dxx in next revision.

    Status: AUTHORED-DRAFT. No implementation proceeds until founder
    promotes canon to AUTHORED-LOCKED, answers Q1/Q2/Q3, and Cycle 3
    reaches a pause point.

CRITICAL: DO NOT PUSH. Local commit only. Founder will review the diff
and push manually.

## Step 7 - Emit the implementation review packet

Per docs/platform-design/08_BUILD_GOVERNANCE.md, emit this 10-field packet:

1. Intended scope: what this session was supposed to do
2. Files changed: specific paths from git diff --stat
3. Files intentionally not touched: what I avoided and why (specifically
   call out that Known-issue-1 and Known-issue-2 were deferred)
4. Spec files referenced: which canon documents informed the session
5. Validation run: read-and-summarize validation, file integrity checks;
   no code tests (none apply)
6. Design quality assessment: does this integration follow the canon it
   introduces? Specifically: did I apply section 08 Build Governance
   discipline to this very session?
7. Failure modes addressed:
   - F9.1 merge-equals-closure (prevented by not pushing)
   - F9.2 scope drift (prevented by auto-approval boundary)
   - F9.3 implementation without spec (prevented by no-code rule)
   - F9.4 fixed items regressing (N/A this session)
   How each was prevented in this session.
8. Risks introduced: anything worth flagging for the next session.
   Specifically mention the two known issues still present in the canon.
9. Recommended next step: what founder should do before Cycle 4 locks.
10. Commit recommendation: APPROVE / DEFER / REJECT with reasoning.

## What you MUST NOT do in this session

Repeated for clarity:

- Do NOT push to remote
- Do NOT merge into main or any other branch
- Do NOT deploy to Vercel, staging, or production
- Do NOT edit the content of any of the 11 canon files
- Do NOT fix Known-issue-1 (broken path references inside canon)
- Do NOT fix Known-issue-2 (C3-Dxx naming in review doc)
- Do NOT modify active Cycle 3 entry in CYCLE_STATE.md
- Do NOT begin any C4-Dxx implementation
- Do NOT refactor existing code
- Do NOT decide Q1/Q2/Q3 for founder
- Do NOT resolve canon-vs-existing conflicts in this session
- Do NOT run tests, dev server, or build
- Do NOT modify files outside docs/platform-design/ and CYCLE_STATE.md

## Reporting standard

Every step completes with honest status emission per doc 08:
- What I did (specific paths, specific actions, auto-approved or asked)
- What worked
- What did not work
- What I did not do (and why)
- Risks
- Next action

If ambiguity appears, STOP and ask. Do not guess. Do not fabricate. Do
not expand scope silently.

Begin Step 1.
```

---

## Post-session revision needed (short follow-up session)

After Code completes this integration session, two small fixes need a separate session with me (Claude) to apply. This is the "revision session" referenced multiple times in the prompt above.

### Fix 1: Broken path references inside canon files

The 11 canon files reference `docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md` in these specific locations:

- `00_AGENT_CENTRIC_MASTER_ANCHOR.md` — "Source of truth map" section, "Read order" section
- `02_CONTEXT_BUNDLE_STANDARD.md` — "Enforcement" section
- `03_PAGE_LEVEL_AGENT_CONTRACTS.md` — "The per-turn contract" section
- `08_BUILD_GOVERNANCE.md` — "Source of truth" references

The actual `docs/design-canon/` uses descriptive filenames (Code's Step 1 output will show the real names). The path references need to be updated to point at the actual file (or removed if no equivalent exists).

### Fix 2: Cycle numbering in review doc

`CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md` uses C3-D01 through C3-D07 throughout. These need to be renamed to C4-D01 through C4-D07 to match CYCLE_STATE.md.

### When to run the revision session

Run it after Code completes the integration session and you've reviewed the commit diff. Before you promote the canon from AUTHORED-DRAFT to AUTHORED-LOCKED. Before Cycle 4 scope locks.

The revision session takes ~15 minutes and produces a second commit on top of the integration commit.

---

## Session handoff checklist

Before starting Code Desktop:

- [ ] You have the 11 files locally (downloaded from platform-design output folder)
- [ ] You are in the `nexus` repo on the correct branch
- [ ] You have confirmed Clerk email-code auth status (enabled or still pending)
- [ ] You have 45-60 minutes uninterrupted

After Code Desktop completes:

- [ ] Review the commit diff — files in `docs/platform-design/` and `CYCLE_STATE.md` only
- [ ] Review the implementation review packet Code emitted
- [ ] Do NOT push yet
- [ ] Run the revision session with Claude to fix Known-issue-1 and Known-issue-2
- [ ] After revision session, review combined diff
- [ ] Push to origin (manual)
- [ ] Schedule your own review pass on the 11 canon docs
- [ ] Answer Q1, Q2, Q3
- [ ] Promote canon to AUTHORED-LOCKED
- [ ] Lock Cycle 4 scope
- [ ] Begin Cycle 4 execution in subsequent sessions (after Cycle 3 pauses)
