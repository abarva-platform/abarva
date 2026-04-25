# Code Desktop Prompt · Canon Revision Session

**For:** Anand Sundaram
**Date:** April 24, 2026
**Session type:** Canon revision (builds on commit `1653852`)
**Output:** Second commit on branch `claude/keen-leakey-8f2799`

This session resolves:
- Known-issue-1 (broken path references inside canon files)
- Known-issue-2 (C3-Dxx naming collision in review doc)
- All 10 canon-vs-existing conflicts documented in the prior session's Step 4
- Places 5 previously-authored files that the canon references

Founder's resolutions (delivered by Claude, authorized by "go with your call"):
- **Pattern library placement:** Place the 2 pattern files in `docs/pattern-library/`
- **Response-mode taxonomy (C4):** Keep both, reconciled as orthogonal axes
- **Runtime pipeline (C8):** Wrap existing `runPipeline()`, do not replace
- **Autonomy charter (C10):** Scope-separate both docs; retire auto-merge authority at Cycle 4+

---

## How to use this file

1. Open Claude Code Desktop in `/Users/anand/Projects/nexus/` on branch `claude/keen-leakey-8f2799` (should still be checked out from the prior session)
2. Paste the prompt block below as your first message
3. When Code reaches Step 2, upload the contents of `canon-revision-package/` (pattern-library/, design-canon/, and platform-design-revisions/ subdirectories)
4. Let Code run steps 3-8
5. Review the diff before pushing

---

## The prompt (paste everything below this line into Code Desktop)

```
You are working on the AbarVa repository at /Users/anand/Projects/nexus/
on branch claude/keen-leakey-8f2799. This branch already has commit
1653852 (Cycle 4 canon integration). You will create a SECOND commit on
top of 1653852 that applies the revision session resolutions.

CRITICAL: This session is NOT an implementation session. This is a
canon revision session. You will NOT write application code. You will
place 5 previously-authored files, append reconciliation sections to 3
canon files, rename C3-Dxx to C4-Dxx in one review file, and update
CYCLE_STATE.md. Implementation of Cycle 4 scope items happens in a
LATER session after founder promotes canon to AUTHORED-LOCKED.

## Auto-approval scope for this session

AUTO-APPROVED (do not ask):
- Read any file in the repo
- List directory contents
- Create the new directory docs/pattern-library/
- Create / write files inside docs/pattern-library/ (the 2 pattern files)
- Create / write files inside docs/design-canon/ (the 3 numbered files)
- Edit docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md by APPENDING
  the reconciliation section provided in Step 4
- Edit docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md by APPENDING
  the reconciliation section provided in Step 4
- Edit docs/platform-design/08_BUILD_GOVERNANCE.md by APPENDING the
  reconciliation section provided in Step 4
- Edit docs/platform-design/CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md by
  renaming C3-D01 through C3-D07 to C4-D01 through C4-D07 in the
  specified lines
- Edit CYCLE_STATE.md per Step 5 below
- git add, git status, git diff (local inspection)
- git commit (local commit only)
- File integrity checks (line count, SHA, wc -l)

NOT AUTO-APPROVED (stop and ask):
- git push to any remote
- git merge into any branch
- Any deployment command
- Modifying content of the 5 source files being placed (they must be
  byte-identical to what I provide)
- Modifying any content OTHER than the specific appends and renames
  specified below
- Modifying any file outside the paths listed above
- Installing or modifying dependencies
- Running tests, dev server, or build
- Resolving any conflict OTHER than C1, C2, C3, C4, C5, C8, C9, C10
  (the ones this revision session addresses)
- Beginning implementation of any C4-Dxx scope item
- Refactoring existing code

Rule of thumb: if it changes code, hits a remote, or touches content
outside the specified appends and placements, stop and ask.

## Step 1 - Read governance state and verify branch

Read in order:
1. Verify you are on branch claude/keen-leakey-8f2799 (git branch --show-current)
2. Verify commit 1653852 is HEAD or an ancestor (git log --oneline -5)
3. Read CYCLE_STATE.md to confirm prior session's Cycle 4 section exists
4. List contents of:
   - docs/platform-design/ (should have 11 files from prior commit)
   - docs/design-canon/ (should exist, will receive 3 more files)
   - docs/pattern-library/ (should NOT exist yet; will be created)

Emit status:
- Branch confirmed: yes/no
- Commit 1653852 present: yes/no
- Prior Cycle 4 section in CYCLE_STATE.md: yes/no
- docs/platform-design/ file count
- docs/design-canon/ file count
- docs/pattern-library/ exists: yes/no

Do not proceed to Step 2 until this status is clean.

## Step 2 - Receive the 5 source files

I will provide 5 markdown files in the canon-revision-package/:

From canon-revision-package/pattern-library/:
- 00-vision-catalog-template-first-pattern.md (~55KB, 850 lines)
- 01-meta-patterns-m2-m6.md (~68KB, 1177 lines)

From canon-revision-package/design-canon/:
- 08-agent-fabric-per-turn-contract-backlog.md (~70KB)
- 09-per-surface-ui-pattern-backlog.md (~74KB)
- 10-component-design-system-backlog.md (~77KB)

You will (auto-approved):
1. Create docs/pattern-library/ directory
2. Place the 2 pattern files into docs/pattern-library/ VERBATIM
3. Place the 3 design-canon files into docs/design-canon/ VERBATIM
4. Do NOT edit content of any of the 5 files
5. Emit SHA-256 and line count for each placed file for integrity
   verification

These 5 files are previously-authored substantive canon work that never
landed in the repo. Placing them makes the references in the platform
canon valid. Content alignment with the platform canon is assumed for
this session; comprehensive reconciliation between these files and the
platform canon is Cycle 5+ scope, not this session's scope.

## Step 3 - Verify references now resolve

After placement, verify that these references in the platform canon
now point to existing files:

- docs/platform-design/00_AGENT_CENTRIC_MASTER_ANCHOR.md line 59:
  "docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md" → should resolve
- line 60: "docs/design-canon/09-per-surface-ui-pattern-backlog.md" → should resolve
- line 61: "docs/design-canon/10-component-design-system-backlog.md" → should resolve
- line 62: "docs/pattern-library/00-vision-catalog-template-first-pattern.md" → should resolve
- line 63: "docs/pattern-library/01-meta-patterns-m2-m6.md" → should resolve
- line 78: "docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md" → should resolve
- line 79: "docs/design-canon/10-component-design-system-backlog.md" → should resolve
- docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md line 26:
  "docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md" → should resolve

Verify each path with ls or cat -- if any fails, STOP and ask. This
verification confirms that Known-issue-1 and conflict C3 and conflict
C9 are resolved by the file placements.

## Step 4 - Append reconciliation sections

Append the following content to the END of three canon files. Do NOT
modify any existing content; only append.

### 4a. Append to docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md

Append the content from:
canon-revision-package/platform-design-revisions/02_APPEND_runtime_integration_note.md

Insert it at the very end of the file, AFTER the existing "## Status"
section. The append starts with "## Runtime integration note · Cycle 4
revision" and ends with the failure mode paragraph.

### 4b. Append to docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md

Append the content from:
canon-revision-package/platform-design-revisions/03_APPEND_response_modes_and_modalities.md

Insert it at the very end of the file, AFTER the existing "## Status"
section. The append starts with "## Response modes and UX modalities
· Cycle 4 revision".

### 4c. Append to docs/platform-design/08_BUILD_GOVERNANCE.md

Append the content from:
canon-revision-package/platform-design-revisions/08_APPEND_autonomy_and_auto_merge.md

Insert it at the very end of the file, AFTER the existing "## Status"
section. The append starts with "## Autonomy, approval boundaries, and
auto-merge · Cycle 4 revision".

For each append, verify before moving on:
- Original content unchanged (compare byte count of original portion
  to known SHA from prior session)
- Appended content matches the source file byte-for-byte

## Step 5 - Rename C3-Dxx to C4-Dxx in review doc

Edit docs/platform-design/CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md:

Perform these exact find-and-replace operations (in order, all
occurrences). Apply find-and-replace only within lines 180-250 of the
file (where the scope candidates section lives) to avoid accidental
changes elsewhere.

Find: "C3-D01 · Context Bundle 5-state runtime implementation"
Replace: "C4-D01 · Context Bundle 5-state runtime implementation"

Find: "C3-D02 · Page readiness contract authored per surface"
Replace: "C4-D02 · Page readiness contract authored per surface"

Find: "C3-D03 · Persona crawler verdict format adoption"
Replace: "C4-D03 · Persona crawler verdict format adoption"

Find: "C3-D04 · Implementation review packet as PR template"
Replace: "C4-D04 · Implementation review packet as PR template"

Find: "C3-D05 · Suggested action quality linter"
Replace: "C4-D05 · Suggested action quality linter"

Find: "C3-D06 · Named component specs (pre-implementation)"
Replace: "C4-D06 · Named component specs (pre-implementation)"

Find: "C3-D07 · Attachment-to-evidence outcome enforcement"
Replace: "C4-D07 · Attachment-to-evidence outcome enforcement"

Also update the heading:
Find: "## Items to promote to CYCLE_STATE.md for Cycle 3"
Replace: "## Items to promote to CYCLE_STATE.md for Cycle 4"

And update the transition paragraph if it references Cycle 3 scope:
Find any prose references to "Cycle 3 scope" within lines 180-250 and
replace with "Cycle 4 scope". Use judgment: leave references to the
ACTIVE Cycle 3 Wave 1 sweep alone (those are correct references to a
different cycle). Only change references to the canon integration
scope.

After the rename, add a note at the top of the "Items to promote"
section explaining the rename:

"**Naming note (Cycle 4 revision):** Items originally labeled C3-D01
through C3-D07 have been renamed to C4-D01 through C4-D07 to match
CYCLE_STATE.md, which uses C4-Dxx to avoid collision with the active
Cycle 3 Wave 1 P0 sweep. The scope content is unchanged."

## Step 6 - Update CYCLE_STATE.md with conflict resolutions

Edit CYCLE_STATE.md to append a new section documenting the ten
canon-vs-existing conflict resolutions. This section goes AFTER the
Cycle 5+ deferred items section that was added in the prior session.

Append this section:

---

### Cycle 4 revision session · Canon-vs-existing conflict resolutions (2026-04-24)

Ten conflicts documented in commit 1653852 Step 4 cross-check. Resolutions
applied in this revision session (commit builds on 1653852):

**Resolved new-canon-wins (3 conflicts):**
- **C1** (3 vs 3-5 chips): New canon "maximum three" rule stands.
  docs/design-canon/agent-interaction-design-thinking.md needs revision
  or retirement of its 3-5 chip section in Cycle 5+.
- **C2** (Steward voice "Utility-clerical" vs "Operationally-terse"):
  New canon "Operationally-terse" stands. agent-interaction-design-
  thinking.md needs update in Cycle 5+.
- **C5** (Atlas 3-sentence vs 150-word cap): New canon 150-word cap
  stands. agent-interaction-design-thinking.md needs update in Cycle 5+.

**Resolved via file placement (2 conflicts):**
- **C3** (broken path refs): Resolved by placing files 08, 09, 10 into
  docs/design-canon/ in this revision session.
- **C9** (nonexistent docs/pattern-library/): Resolved by creating
  docs/pattern-library/ and placing 2 pattern files in this revision
  session.

**Resolved via reconciliation appends (3 conflicts):**
- **C4** (response modes vs UX modalities): Both taxonomies preserved.
  Orthogonal axes reconciliation appended to 03_PAGE_LEVEL_AGENT_
  CONTRACTS.md.
- **C8** (12-step bundle vs 6-phase pipeline): Bundle lifecycle wraps
  runPipeline() rather than replacing it. Runtime integration note
  appended to 02_CONTEXT_BUNDLE_STANDARD.md. C4-D01 scope unchanged;
  implementation adds bundle assembly inside existing retrieve +
  assemble phases.
- **C10** (approval boundary vs autonomy charter): Scope-separated.
  Canon approval boundary governs slice initiation; autonomy charter
  governs micro-decisions inside approved slices. Reconciliation
  appended to 08_BUILD_GOVERNANCE.md. Auto-merge authority from
  memory/feedback_auto_merge_authority.md retires at Cycle 4+.
  Founder action required before Cycle 4 scope lock: formally retire
  the auto-merge memory or approve retirement implicitly by locking
  Cycle 4 scope.

**Deferred terminology cleanup (1 conflict):**
- **C6** (drawer pattern scope): Complementary, no contradiction. New
  canon's Zone E architecture and existing page-agent-coherence-work-
  order.md's implementation detail coexist. Work-order needs Zone E
  terminology update in Cycle 5+.

**No action required (1 conflict):**
- **C7** (prohibited-files list): Already aligned between new canon
  doc 00 and existing CYCLE_STATE.md Source Sidecar.

### Cycle 4 scope refinement

Cycle 4 scope items remain C4-D01 through C4-D07 as documented in
prior session. No scope changes in this revision session. Scope still
AWAITING-FOUNDER-DECISIONS on Q1/Q2/Q3.

---

Also update the Cycle 4 section header to reflect the revision
timestamp. Find the line in the Cycle 4 section that says status is
SCOPE-PROPOSED and add a note:

"Last revised: 2026-04-24 (revision session · canon reconciliation)"

## Step 7 - Pre-commit inspection

Before committing:
- Run git status - show file list
- Run git diff --stat - show change summary
- Verify no files outside these paths are in the changeset:
  - docs/pattern-library/* (new)
  - docs/design-canon/08-*.md (new)
  - docs/design-canon/09-*.md (new)
  - docs/design-canon/10-*.md (new)
  - docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md (modified: append only)
  - docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md (modified: append only)
  - docs/platform-design/08_BUILD_GOVERNANCE.md (modified: append only)
  - docs/platform-design/CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md (modified: rename only)
  - CYCLE_STATE.md (modified: append only)

For the 3 platform-design files being modified, verify that the diff
shows ONLY additions (no deletions, no modifications to existing
lines). If any modification to existing content appears, STOP and ask.

For CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md, verify the diff shows only
C3-Dxx → C4-Dxx renames plus the naming note addition. If any other
changes appear, STOP and ask.

If diff is clean, proceed to Step 8.

## Step 8 - Commit locally

Create a single local commit on top of 1653852 with this message:

    docs(platform-design): canon revision · reconciliation + placements

    Second commit in Cycle 4 canon integration, builds on 1653852.

    Resolves 10 canon-vs-existing conflicts plus both known issues:

    File placements (5 previously-authored files):
    - docs/pattern-library/00-vision-catalog-template-first-pattern.md (new)
    - docs/pattern-library/01-meta-patterns-m2-m6.md (new)
    - docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md (new)
    - docs/design-canon/09-per-surface-ui-pattern-backlog.md (new)
    - docs/design-canon/10-component-design-system-backlog.md (new)

    Reconciliation appends (3 platform-design files):
    - 02_CONTEXT_BUNDLE_STANDARD.md: Runtime integration note (C8)
    - 03_PAGE_LEVEL_AGENT_CONTRACTS.md: Response modes and UX modalities
      orthogonal-axes reconciliation (C4)
    - 08_BUILD_GOVERNANCE.md: Autonomy charter scope-separation plus
      auto-merge authority retirement note (C10)

    Known-issue-2 fix:
    - CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md: C3-Dxx renamed to C4-Dxx

    Conflict resolution summary in CYCLE_STATE.md appended.

    Cycle 4 remains SCOPE-PROPOSED pending founder answers to Q1/Q2/Q3
    and explicit retirement decision on memory/feedback_auto_merge_
    authority.md per C10 reconciliation.

    Deferred to Cycle 5+: revision or retirement of conflicting
    existing design-canon files (C1, C2, C5, C6). Comprehensive
    reconciliation between newly-placed files 08/09/10 and platform
    canon.

CRITICAL: DO NOT PUSH. Local commit only. Founder will review the
combined two-commit diff (1653852 plus this new commit) and push
manually.

## Step 9 - Implementation review packet

Per docs/platform-design/08_BUILD_GOVERNANCE.md, emit the 10-field
packet:

1. Intended scope: what this session was supposed to do
2. Files changed: specific paths from git diff --stat
3. Files intentionally not touched: confirm you did not touch files
   outside the scoped paths; confirm the 5 placed files are byte-
   identical to sources; confirm the 3 appended files had only
   additions; confirm CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md had only
   C3→C4 renames plus the naming note
4. Spec files referenced: this prompt, the 3 append-source files, the
   5 placed files, the prior commit 1653852
5. Validation run: file integrity SHAs, diff inspection, reference-
   resolution check from Step 3
6. Design quality assessment: did this revision session follow the
   same doc 08 discipline that the prior integration session followed?
7. Failure modes addressed:
   - F9.1 prevented by not pushing and requiring founder review
   - F9.2 prevented by explicit auto-approval boundary
   - F9.3 prevented by no-code rule (revision session only)
   - F9.4 N/A this session
8. Risks introduced:
   - File placements 08/09/10 may have their own internal conflicts
     with the platform canon (comprehensive reconciliation deferred)
   - Auto-merge retirement (C10) requires explicit founder action
     before Cycle 4 scope can lock
   - CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md C3→C4 rename is the only
     modification to a previously-committed canon file other than
     appends; verify diff carefully
9. Recommended next step: founder reviews combined two-commit diff,
   pushes if acceptable, then reads the canon, answers Q1/Q2/Q3,
   formally retires auto-merge authority, promotes canon to
   AUTHORED-LOCKED, locks Cycle 4 scope
10. Commit recommendation: APPROVE / DEFER / REJECT with reasoning

## What you MUST NOT do in this session

- Do NOT push to remote
- Do NOT merge
- Do NOT deploy
- Do NOT modify the 5 placed files after placement
- Do NOT modify any existing content in the 3 append target files
  (only append)
- Do NOT modify CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md except for the
  specified C3→C4 renames and the naming note addition
- Do NOT touch files 00, 01, 04, 05, 06, 07, GPT_REVIEW_NOTES.md in
  platform-design (they needed no changes)
- Do NOT resolve C1, C2, C5, C6 by editing existing design-canon
  files (Cycle 5+ scope)
- Do NOT begin any C4-Dxx implementation
- Do NOT run tests, dev server, or build
- Do NOT modify files outside the scoped paths

## Reporting standard

Every step completes with honest status emission per doc 08. If
ambiguity appears, STOP and ask.

Begin Step 1.
```

---

## Post-session checklist for Anand

After Code Desktop completes:

- [ ] Review combined two-commit diff (1653852 + new revision commit)
- [ ] Verify 5 files placed byte-identically via SHA comparison
- [ ] Verify the 3 platform-design appends contain only additions
- [ ] Verify CLAUDE_REVIEW_OF_GPT_REFINEMENTS.md has only C3→C4 renames
- [ ] Verify CYCLE_STATE.md has only appends plus the Cycle 4 revision note
- [ ] If diff is clean, push the two-commit stack to origin
- [ ] Read the 11 canon files in doc 00 order (3-4 hours)
- [ ] Formally retire `memory/feedback_auto_merge_authority.md` per C10
- [ ] Answer Q1 (Build Packs per surface), Q2 (priority ordering), Q3 (3-persona minimum)
- [ ] Promote canon documents from AUTHORED-DRAFT to AUTHORED-LOCKED
- [ ] Lock Cycle 4 scope with specific items from C4-D01 through C4-D07
- [ ] Only then begin Cycle 4 execution

After those steps, Cycle 3 Wave 1 P0 sweep also needs to reach a natural pause point. Running canon integration alongside Wave 1 is acceptable (they're in different scope lanes); running Cycle 4 implementation alongside Wave 1 is not (both compete for the same implementation surface area).
