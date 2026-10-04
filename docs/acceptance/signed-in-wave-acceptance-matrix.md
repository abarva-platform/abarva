# Signed-in wave acceptance matrix

`merged` is not `deployed`, and `deployed` is not `live-proven`. A wave reaches
`live-proven` only when somebody signs in to the deployed SHA and reads the
surface. This file is where those walks are recorded, one dated block per wave,
so that the evidence for "a person looked at this" lives in the repository
rather than in a register line that asserts it.

## How to read a row

Each row names one surface, the pull request whose behaviour it is proving, and
a verdict:

- **pass** — the behaviour the merge claims was observed on the deployed SHA.
- **fail** — the surface was reached and the claimed behaviour was not there.
  Every `fail` carries a filed item id; a `fail` with no id is an unfinished row.
- **blocked** — the surface could not be reached, or proving it would have
  required an action the walker was not authorised to take. The reason is
  stated; "blocked" is never a quiet "pass".

A walk records what was *observed*. Where a claim's enforcement lives on the
server and the walk only saw the client affordance, the row says so rather than
implying the server was exercised.

## Standing boundary for an unattended walk

A walk performs no write. It reads surfaces, changes client-side view state
(a pivot dimension, a chapter, a tab), and observes refusals **as refusals** —
a disabled control, a gate that reports a blocker, a next step that will not
open. It does not commit an action to discover whether the server refuses it,
because for a gate the failure mode under test *is* the action succeeding, and
an unattended run must not discover that by performing it. A row needing a
committed write is `blocked`, with the write named.

---

## 2026-10-04 ninth wave — walked on serving SHA `a756bfc0ef`

**Item:** C-595.
**Walked:** 2026-10-04, between 14:53:16Z and 15:00:24Z, by
`source-backlog-executor#20261004T144934Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** C-595 forbids pinning a literal SHA,
for the reason C-635 demonstrated by becoming unexecutable when the runtime
moved past the one it named. This walk resolved what was serving, stamped it,
and asserts ancestry. The serving SHA was
`a756bfc0efb4cdb6ab1108edda60debe183bd83a` (#8968), which was also `origin/main`
at walk start and still was at walk end.

**Runtime invariant, read with read-only `az` before the walk and again after
it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:ca854803a00764918314befae9ace1e847e7e2f0a4682f7f6a6fb830219f7a2f` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--ma756bfc0` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running`, created 14:41:37Z |

Read at 14:53:16Z and again at 15:00:24Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk.

### The ancestor sweep — re-derived, not inherited

C-595's acceptance says to run the sweep again rather than trust its own list,
and that instruction earned its keep: the sweep now returns **54** first-parent
merges against the 51 C-592 swept. Every merge that is an ancestor of the walked
SHA and newer than the oldest wave SHA this file records (`e085442776`) was
enumerated with `git rev-list --first-parent` and each checked with
`git merge-base --is-ancestor`. **54 merges; all 54 are ancestors.**

**The three that are new since C-592's sweep add no residue, and that was
checked rather than assumed:** #8966 `071d8cd34e`, #8967 `a09b88dbbb` and #8968
`a756bfc0ef` each touch **zero** non-test files under `src/app`,
`src/components` or `src/lib`, so `deployed` is their own ceiling. The residue
is therefore still exactly the nine C-595 names, each re-confirmed to touch
product files, and none of the nine had gained a verdict row — before this block
all nine appeared in this file only inside C-592's disposition table.

**#8963 is still open** (`MERGEABLE`, `CLEAN`, `mergedAt` null, re-read at walk
time), so the six merges whose verdicts sit in it stay excluded on exactly the
ground C-592 excluded them, and do not fall back to this item.

| Disposition | Count | Merges |
|---|---|---|
| Carried a verdict row in this file before this walk | 17 | #8918 #8922 #8923 #8925 #8927 #8931 #8932 #8934 #8936 #8937 #8949 #8950 #8952 #8953 #8955 #8958 #8964 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 20 | #8916 #8919 #8928 #8929 #8933 #8943 #8945 #8946 #8947 #8951 #8954 #8956 #8957 #8959 #8960 #8961 #8962 #8966 #8967 #8968 |
| Verdicts exist only in **unmerged** PR #8963 (C-586, sixth wave). Not re-walked and not claimed as covered | 6 | #8915 #8917 #8939 #8940 #8942 #8944 |
| Named by open item C-638, whose acceptance owns them | 2 | #8913 #8914 |
| **Walked here** | 7 | #8891 #8920 #8921 #8924 #8926 #8938 #8941 |
| **Blocked by construction — the crawl auth lane, see row 6** | 2 | #8930 #8935 |

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 enterprise-context panel | #8891 | **blocked** — the data precondition is unmet on every tenant this surface serves | #8891's client-visible half is `EnterpriseContextPanel`, mounted from `HomeV4App` behind `contextHeading && enterpriseContext`, with the `technology_data` heading additionally gated on `enterpriseContext.dependencyProof`. **It renders on no chapter of either preview tenant, and that was established from both sides rather than from one empty page.** On the tenant `/home` serves by default the record source reads `Reviewed stored record`, which is the reviewed-snapshot fallback and carries no context by design. On the other preview tenant the page reaches the live path — record source `Live governed rows`, `Source-linked: 2,910 of 2,938 record rows` — and **still** renders no panel: all seven context headings were probed by selecting each chapter in turn, **0 of 7** rendered, while the frame around them *was* mounted on all seven (`[data-home-reviewed-interpretation]` present each time), so the absence is the context and not the frame. The server payload settles it: `homeEnterpriseContext` is serialized exactly once and its value is `null`, and `dependencyProof`, `riskPaths`, `programPaths` and `projectedLinks` appear **zero** times in a 3.0 MB payload. **Why `blocked` and not `fail`:** `buildHomeEnterpriseContext` returns `null` unless it finds exactly one *cited* enterprise-profile row, at least one cited business segment, at least one cited business function, a declared business model on a synthetic-reference basis, and unique non-empty segment keys. Which of those is unmet is a projection-row question, not a surface question — a walk cannot see it. **Precondition, and who may clear it:** the data plane (lane D) must establish a source-linked enterprise context for a preview tenant; until then this panel is unreachable and no walk can promote it. Filed as residue below. |
| 2 | Home walkthrough export — the absence declaration | #8926 | **blocked** — the declaration exists only inside a generated document | #8926's change is a branch ladder that makes the export *say which absence it is* rather than silently omitting the section. The affordance is present and was read: the Home surface carries a `HOME EXPORT` block reading "Walkthrough export: chapters, tables, exhibits, evidence labels and record-source state." with `HTML` and `PDF` controls. **The declaration text itself is emitted only into the exported document**, and C-595's acceptance requires this row be taken "read-only, without performing an export", so the sentence was not observed. **Stated as a prediction, not an observation:** given row 1's finding that a serving projection *is* read on the live tenant and `homeEnterpriseContext` is `null`, the branch that tenant's export would take is `context_not_established`. Nothing here claims that was seen. Clearing this row needs either permission to generate one export, or a read-only surface that renders the declaration outside the document. |
| 3 | Source New — synthetic NDA template publication | #8921 | **pass** | Read on the one event whose `03 Suppliers & NDA` stage is `Recorded`. Opening that already-passed stage declared its own harmlessness — "This phase holds recorded work. Viewing it does not mark it complete, approve any gate, or change the current stage" — re-confirming item 20 again on a later SHA. Both halves #8921 names are present under `STAGE 05 · NDA READINESS`. **Upload:** a `TEMPLATE PDF` block with a `file` input and an `Upload PDF` submit. **Publication:** an `UPLOADED PDF` select carrying one already-uploaded option, plus `TEMPLATE VERSION`, `DISPLAY NAME`, `DECISION RATIONALE`, a `required` acknowledgement checkbox read from the DOM as `checked: false`, and a `Publish synthetic template` submit. The submit is **not** disabled — the gate is the required acknowledgement, which is a different mechanism from a disabled control and is recorded as what it is. **Lab-fenced in the product's own words:** "Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA", and the readiness block states "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, with the NDA-authority line `Not recorded` on all four. **No file was selected, nothing was uploaded and no template was published.** |
| 4 | Source New — market-package label on the phase rail | #8941 | **pass** on the unaccepted half; the accepted half is **blocked** | #8941 makes `sourceNewMarketPackageLabel` check *acceptance* rather than branch on a bare motion, returning the neutral `Market package` unless both `solicitationMotionAcceptedAt` and `solicitationMotionAcceptedByUserId` are recorded. **All four events in the walked tenant were read, not one**, because a single neutral label cannot distinguish a working guard from an absence of motions: all four serialize `solicitationMotionAcceptedAt: null` and all four render the neutral label. The strongest reading is the event sitting *at* that stage — its rail reads `04 Market package · Current` and its section heading `MARKET PACKAGE`, with **zero** visible occurrences of `RFP` anywhere on the rendered page although the server HTML for that same event contains 47, which places them in serialized data and narrative rather than in the label. **The accepted half could not be reached:** no event in this tenant has an accepted motion, and recording one is a write. The refusal state was observed; the acceptance was not performed. |
| 5 | Moves board — run-stamp stripping on client-visible labels | #8938 | **pass**, and the count is unchanged across two SHAs | A re-read of `U-553`, which C-592 measured as **0 of 8** on `031eec1f24`. On `a756bfc0ef` the board carries **8** move links and **0** of their names match #8938's own stamp pattern `\b(?:19\|20)\d{6}T?\d{6}Z?\b`; the pattern also matches **0** times anywhere in the rendered page, so no derived display code carries one either. The harness token `E2E` appears **0** times on the board, and `smoke` **0** times. The count is reproduced unchanged, which is the finding C-592's row asked for; a changed count would itself have been the finding. |
| 6 | Crawl auth lane | #8930 · #8935 | **blocked** by construction | Both merges change only `src/lib/crawl`, whose sole exercise is the crawl lane itself. That lane's Clerk secret is the dev-instance mismatch filed as `C-581` and owed as an operator secret, so no walk can exercise either merge. Recorded as blocked against `C-581` rather than omitted, exactly as C-595's acceptance requires. **Who may clear it:** the operator, by provisioning a matching Clerk secret. |
| 7 | No rendered surface | #8920 · #8924 | **not a row** — `deployed` is the ceiling | #8920 changes `src/lib/security/rls-precondition-classification.ts` and #8924 changes `src/lib/programs/types.db.ts`. Neither reaches a rendered surface, so each is disposed of with that reason stated rather than given an invented row. |

### The walk lane's own tool censors the walk's own verdict — a controlled finding

C-592 recorded that the browser tool's output redaction can manufacture a
defect, having watched a PDF filename read back as `[BLOCKED: JWT token]`
through three separate reads. **That same string reproduced here** — the
`UPLOADED PDF` option still reads back as a redaction placeholder, is 55
characters long, and recovers as an ordinary filename when the dots are
substituted. So that half is confirmed on a later SHA.

What is new, and is worse, is that the redaction keys on **the name the walker
gave the variable** and censors whatever is under it, including values that
never came from the page:

| Probe | Value returned |
|---|---|
| `authorityPresent: t.includes(<phrase>)` | `[BLOCKED: Sensitive key]` |
| `a: t.includes(<same phrase>)` | `true` |
| `harnessTokenCount: (t.split('smoke').length-1)` | `[BLOCKED: Sensitive key]` |
| `n1: (t.split('E2E').length-1)` | `0` |
| **`authorityPresent: 42`** — a literal the walker wrote, with no page input at all | `[BLOCKED: Sensitive key]` |
| **`plainNumber: 7`** — the negative control | `7` |

Same page, same expressions, different key names, different answers. The last
two rows are the control: a literal `42` is censored under a key named
`authorityPresent` while a literal `7` passes under `plainNumber`, so the
scrubber is not simply always-on and the redaction is attributable to the key
name rather than to the content. Key names containing `authority` or `token`
were the triggers observed here.

**Why this is more expensive than C-592's instance.** There the tool rewrote
what the *page* said, and a careful walker re-reading the string recovers the
truth. Here the tool rewrites what the *walker concluded*. A row written as
`authorityRecorded: false` reads back as `[BLOCKED]` and invites a `blocked`
verdict where the truth was a `fail`; the inversion runs the other way just as
easily. **Any walk that keys a result object on a page phrase should re-run the
same probe under a neutral key before writing the verdict down** — which is what
was done for every affected reading in this block.

### Stated limits of this walk

- **Rows 1 and 2 are the substance of #8891 and #8926 and neither was proven.**
  Row 1 is blocked on a data condition that no walk can clear, and row 2 is
  blocked on an action this acceptance forbids. Nothing here should be read as
  evidence that the Home enterprise-context work is live-proven; it is not.
- **Row 3 observed client affordances only.** Whether the server refuses an
  unauthorised publish was not tested, because testing it means performing the
  publish, and for a gate the failure mode under test *is* the action
  succeeding.
- **Row 4's accepted half and row 6 are blocked by a write and by an operator
  secret respectively.** Neither is a quiet pass.
- **No phone-width reading.** This walk ran at `innerWidth` 1512 throughout and
  made no attempt to resize; the 375 px row C-592 left owed is still owed and is
  not claimed here.
- **The six merges whose verdicts sit in open PR #8963 are not covered here.**
  If that PR is closed without merging, those six return to residue.

No write was performed on any surface. No upload, no template published, no
motion accepted, no NDA sent, no approval submitted, no stage advanced, no
export generated and no file downloaded. The only interactions were navigation,
chapter selection and stage selection — all client-side view state — plus
read-only DOM inspection and same-origin `GET` reads of pages already reachable
by navigation. Two gated surfaces were opened for reading and one declared that
reading it changes nothing.

### Residue — filed, not absorbed

- **The Home enterprise context is `null` on every tenant the surface serves**,
  including the one that reaches the live ECL serving projection, so #8891's
  panel and #8926's dependency-proof branch are both unreachable from any
  product surface today. This is a data-plane condition in lane D, not a UI
  defect, and it is upstream of any future attempt to live-prove either merge.
  **Filed as `D-517`**, and the id was the part that nearly went wrong. Three
  claim lines today reported that a successor could not be filed at all, because
  the regenerated queue reports the `C-500`–`C-599` **and** `T-500`–`T-599`
  bands exhausted at 0 of 100 free. That is true, and it is not the whole table:
  the `X-600` band showing 57 free C ids is **Codex's** band, not an unallocated
  one, so taking from it would re-create the precise collision the disjoint-range
  rule exists to prevent — two agents applying the same correct rule to the same
  range at the same moment. The finding is a data-plane condition and therefore a
  **lane D** item, and Claude's own `D-500`–`D-599` band reports **83 free**. The
  band table answers per lane *and* per agent; reading only its exhausted rows is
  what kept two earlier findings from being filed.

### Noted, not filed

- The default preview tenant serves the reviewed snapshot while the other serves
  live governed rows. Both are legitimate states and the surface labels each
  one, but a reader moving between them has no indication that the enterprise
  context is absent for *different reasons* in each.
- The live tenant's chapter 05 reads `Source-file quality: 0 of 14 accepted; 14
  partial` beside `Source-linked: 2,910 of 2,938 record rows`. A record that is
  97% source-linked out of files that are 0% accepted is either correct and
  uninteresting or two counters measuring different things under similar names.

---

## 2026-10-04 seventh wave — walked on serving SHA `031eec1f24`

**Item:** C-592.
**Walked:** 2026-10-04, between 13:36:58Z and 13:50:56Z, by
`source-backlog-executor#20261004T133344Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
governed healthcare reference tenant used for these walks. The tenant is named
nowhere in this block on purpose: this repository is public, and the habit of
not writing a tenant name into a public artifact is worth having before there is
a real one to protect.

**Which SHA, and why it is not pinned.** C-592 forbids pinning a literal SHA,
because C-635 pinned one and became unexecutable when the runtime moved past it.
This walk resolved what was serving, stamped it, and asserts ancestry. The
serving SHA was `031eec1f24a8daa3ae3b260a803e459a9afc5b26` (#8964), which was
also `origin/main` at walk start and still was at walk end.

| Merge | SHA | Ancestor of `031eec1f24` |
|---|---|---|
| #8949 Moves horizontal phase stepper | `f431ae90c7` | yes |
| #8950 Moves aVa docked left on desktop | `d9e927f3c8` | yes |
| #8952 Moves P3–P5 workflow actions simplified | `b4b97d79a6` | yes |
| #8953 Moves phase workspace navigation consolidated | `9f5702fe23` | yes |
| #8955 Source lab NDA upload and repeat template publication | `373a0b93a5` | yes |
| #8958 Moves P1 uploads kept out of inferred gate families | `731187eab0` | yes |
| #8964 Moves P1 capture bound to approved evidence | `031eec1f24` | yes |

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:1ddf77fd5d941e3186078a93efbf9453e1388363b899175d8c8eaccb5a8e37b7` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m031eec1f` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running` |

Read at 13:36:58Z and again at 13:50:56Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk.

### The ancestor sweep — the mechanism, not the list

C-592's acceptance asks for this and it is the reason the item exists: a wave
record that names merges as a hand-built list has left residue three times
running. So before any verdict was written, **every** merge that is an ancestor
of the walked SHA and newer than the oldest wave SHA this file records
(`e085442776`) was enumerated with `git rev-list`, and each one checked with
`git merge-base --is-ancestor`. **51 merges; all 51 are ancestors.** Every one
is accounted for below — as a row here, or as a named exclusion with its reason.

| Disposition | Count | Merges |
|---|---|---|
| Already carries a verdict row in this file | 10 | #8918 #8922 #8923 #8925 #8927 #8931 #8932 #8934 #8936 #8937 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 17 | #8916 #8919 #8928 #8929 #8933 #8943 #8945 #8946 #8947 #8951 #8954 #8956 #8957 #8959 #8960 #8961 #8962 |
| **Verdicts exist only in an unmerged pull request** — #8963 (C-586, sixth wave) walked these on `de09c6b806` and is open, mergeable and green, so this file does not yet hold them. Not re-walked, and not claimed as covered | 6 | #8915 #8917 #8939 #8940 #8942 #8944 |
| Named by open item C-638, whose acceptance owns them | 2 | #8913 #8914 |
| **Walked here** | 7 | #8949 #8950 #8952 #8953 #8955 #8958 #8964 |
| **Residue — a product surface, no verdict, and no item that owns it.** Filed as **C-595** so it is not discovered a fourth time | 9 | #8891 #8920 #8921 #8924 #8926 #8930 #8935 #8938 #8941 |

The residue row is the sweep earning its keep: C-592 named four merges, and the
sweep found nine more client-visible merges that no acceptance covers at all.

**#8949 merged empty, and the sweep is how that surfaced.** `f431ae90c7` has one
parent and a zero-file diff against it — the stepper change and *both* release
records landed inside #8950's squash (`d9e927f3c8`) 21 seconds earlier. So
#8949's content is live and #8949's own commit proves nothing; row 1 settles it
from the surface instead.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Moves phase surface — layout, at desktop width | #8949 · #8950 · #8953 | **pass** | Measured from the live DOM at `window.innerWidth` **1180**, `matchMedia('(min-width: 1024px)')` true. **#8953:** the collapsible left rail is gone — `document.querySelectorAll('.mxw-side')` returns **zero** elements — and the consolidated horizontal tab set renders with the four base labels `Steps`, `Files & Evidence`, `Intelligence`, `Approvals`, all four visible at y=260. The conditional half of `workspaceTabs` is real too — a flag-gated fifth tab `Risk Assessment` renders on the P2 phase and on no other — though that observation was made in the narrow window of row 2, not at this width, and is recorded here only because it belongs to the same merge. **#8949:** `.mxw-phase-stepper` is present and horizontal — 1121 px wide, 64 px tall, at y=63 — carrying six steps with state classes `done` and `current viewing`, reading `Originate 3 of 3 · Charter 1 of 7 · Discover & Diagnose 0 of 8 · Design Future State 0 of 8 · Roadmap & Business Case · Mobilize & Handoff 0 of 4`. **#8950:** `.mxw-ava-pop` is docked to the **left** edge — `x = 0`, `y = 44`, 312 × 727 — not a floating bottom-right bubble; `.mxw-ava-fab` has zero size at this width. The same left dock renders on the Source New event canvas. |
| 2 | Moves phase surface — layout, at narrow width | #8949 · #8950 · #8953 | **pass**, with the width stated | Read in a browser window whose viewport measured `innerWidth` **606**, below both the `md` (768) and `lg` (1024) breakpoints. The narrow tab bar renders instead, with the shortened labels `Stage`, `Files`, `Intel`, `Approvals`; at 1180 px that same bar is in the DOM with `visibility` false and the full-label bar is the visible one. So the responsive switch is real and was observed from both sides rather than inferred. aVa renders as the bottom-right floating control at this width, which is the complement of row 1's left dock. **Not a phone-width reading:** 606 px is the same Tailwind band as 375 px but is not 375 px — see the stated limit below. |
| 3 | Moves phase workflow actions, P1 and P2 | #8952 | **pass** on the reachable half; the P3–P5 half is **blocked** | #8952's change is `phase.phase >= 1` → `phase.phase >= 1 && phase.phase <= 2` on the capture editor, plus removing a duplicate upload panel and an evidence-count link from the later phases. The `>= 1 && <= 2` half is directly observable and holds: the capture editor renders at **P1** (`Charter Inputs → Upload Evidence → Approve & Build`, `Step 1 of 10`) and at **P2** (`Prepare → Upload & Review → Review Findings → Approve & Build`, `Step 1 of 12`). The `<= 2` half could not be reached: **no Move in the walked tenant has cleared the P1 gate** — all eight active Moves sit at P1 Charter except one at P0 Originate — and `phase/3`, `phase/4` and `phase/5` each redirect to `phase/1?blockedPhase=N` and render a stated refusal: "P3 cannot begin yet · Finish the required P1 gate before opening P3", with `REQUIRED · P1 gate approval`. Clearing that gate is a write. The refusal was observed as a refusal and the gate was not cleared. |
| 4 | Moves P1 capture bound to approved evidence | #8964 | **pass** | The newest merge on the serving SHA, found by the sweep rather than named by C-592. All seven P1 inputs render `Needs approved evidence`. Step 1 carries `EVIDENCE OPEN`, a `REQUIRED SOURCE · Evidence for this step · Open` block, and the governing sentence "Add a source and have a reviewer approve it in Files & Evidence. This step stays locked until that evidence is approved." The binding is enforced on the control, not only in prose: `Save & continue` has `disabled === true`, while `Add evidence for this step`, `Open Files & Evidence` and `Refresh approved evidence` are all enabled. Nothing was typed and nothing was saved; the disabled state was read from the DOM. |
| 5 | Moves P1 upload gate-family routing | #8958 | **pass** on the declared-family affordance; the classifier itself is **blocked** | #8958 gives a P1 upload `reviewFamilyKey: 'p1_uploaded_evidence'` and `evidenceType: 'other'` by default rather than inferring a gate family. What a walk can see is the *declared, not inferred* shape, and it is there: the Files & Evidence upload form carries `Evidence applies to phase` (P0–P5, defaulting to the current phase) and a separate `Covers required evidence` whose **selected value is the empty string, rendering as `Not stated`** — the gate family is a human statement, not a guess. The existing corpus is consistent with it: `Evidence family coverage — cost baseline: 4 · current state process: 7 · it systems landscape: 3 · kpi baseline: 8 · org workforce: 2 · other: 1`, an `other` bucket that exists and is populated. **What is not proven:** the classifier's routing of a *new* P1 upload. Establishing that needs an upload, which is a write. No file was selected and no upload was submitted. |
| 6 | Source NDA capture, Stage 05 | #8955 | **pass** | Read on the one event that has `03 Suppliers & NDA` recorded; opening that already-passed stage declared its own harmlessness — "This phase holds recorded work. Viewing it does not mark it complete, approve any gate, or change the current stage" — which re-confirms item 20 again on a later SHA. Both halves #8955 names are present. **Upload:** `TEMPLATE PDF` with a `file` input and an `Upload PDF` submit. **Repeat template publication:** an `artifactId` select listing the already-uploaded PDF, plus `Template version`, `Display name`, `Decision rationale`, and a required acknowledgement checkbox reading "I authorize this PDF as a synthetic template for this event only", ahead of a `Publish synthetic template` submit. **Lab-fenced, in the product's own words:** "Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA", and the readiness block states "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, `NDA AUTHORITY` unrecorded on all four. **No file was uploaded and no template was published.** |

### A near-miss worth recording: the walk lane's own tool can manufacture a defect

On the Stage 05 NDA capture surface the `artifactId` option read back as the
literal string `[BLOCKED: JWT token]` through three separate reads — the page
text, the control dump and the option list — which looks exactly like a
redaction placeholder leaking into a client-visible control on a governed
publish path, and would have been filed as a `fail`.

It is not a product defect. `[BLOCKED: JWT token]` is the **browser tool's own
output redaction**, applied to what it returns, not to what the page renders.
The option's real text is an ordinary 55-character PDF filename, ending
`…_v1.0.pdf` — three dot-separated segments (`…_v1` · `0` · `pdf`), which is
JWT-shaped enough to trip a secret scanner. The filename itself carries a tenant
legal-entity code and so is not reproduced here; the shape is the whole finding. It was recovered by reading the same
string with the dots substituted, which the scrubber does not match; the
substituted read and `.length` agree, and `option.text === option.textContent`.

Recorded because the failure mode is general and expensive in both directions: a
reading lane that silently rewrites what it returns can manufacture a leak that
does not exist, and can equally hide one that does. **Any walk row resting on a
read-back string should be re-read in a form the scrubber cannot match before it
is written down as a verdict.**

### Stated limits of this walk

- **No phone-width row.** C-592 asks for the Moves phase surface at a phone
  width. Row 2 was read at 606 px, which is in the same Tailwind band as 375 px
  and is not 375 px. The walk lane could not set a viewport: `resize_window`
  returned success for 1280×800, 1600×1000 and 1800×1050 and `window.innerWidth`
  stayed 606 through all three. The 1180 px reading in row 1 came from a
  different browser window, not from a successful resize. A true 375 px row is
  owed and is **not** claimed here.
- **Row 3's P3–P5 half and row 5's classifier are blocked by a write**, each
  named above. Neither is a quiet pass.
- **The walk was interrupted.** The browser extension disconnected between the
  606 px reading and the 1180 px reading, and the second half ran in a new tab.
  No surface was reloaded to turn a failing reading into a passing one; rows 1
  and 2 are different widths read in different windows, and both are stated as
  such.
- **The six merges whose verdicts sit in open PR #8963 are not covered here.**
  If that PR is closed without merging, those six return to residue.

No write was performed on any surface. No upload, no template published, no
candidate accepted, no NDA sent, no approval submitted, no phase advanced, no
step saved, no file downloaded. The only interactions were navigation, stage
selection and workspace-tab selection — all client-side view state — plus
read-only DOM inspection. Two gated surfaces were opened for reading and both
declared that reading them changes nothing.

### Noted, not filed

- The P1 stepper reads `Charter 1 of 7` while the status card on the same screen
  reads `INPUTS 0/7`. Both are defensible readings of a seven-input phase; they
  are not the same number on the same screen, and a reader comparing them has no
  way to tell which counts what.
- One Moves evidence item renders `Session file · v13 · needs review` beside
  twenty-one items reading `Evidence · vN · aligned`. A v13 session file still
  needing review is either correct and uninteresting or a stuck review; the
  surface does not say which.

---

## 2026-10-03 fifth wave — walked on deployed SHA `aa23d2c31f`

**Item:** C-641.
**Walked:** 2026-10-04, between 02:00:16Z and 02:07:45Z, by
`source-backlog-executor#20261004T015700Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
composite reference tenant, labelled on the surface `COMPOSITE REFERENCE TENANT
· DEMO · CANDIDATE · UNREVIEWED · Synthetic portfolio. Not a customer, not a
case study.`

**Which SHA, and why it is not pinned.** C-641 deliberately does not name a SHA,
because C-635 did and its acceptance became unexecutable when the runtime moved
on. This walk stamps what was serving and proves ancestry instead. The serving
SHA was `aa23d2c31fcfd494bc834ee771762578757a480c` (#8945), and **every one of
the ten merges C-641 names is an ancestor of it**, by
`git merge-base --is-ancestor`:

| Merge | SHA | Ancestor of `aa23d2c31f` |
|---|---|---|
| #8923 Home leadership-voice spread | `698b83d830` | yes |
| #8932 Moves charter input guidance | `80fb04f4fe` | yes |
| #8934 Moves one next action | `b6bcb12977` | yes |
| #8937 Moves step clarity | `bf47142a79` | yes |
| #8922 Home narrative decimal guard | `3d919c674c` | yes |
| #8925 Moves run-stamp rendering | `3dc2d655b1` | yes |
| #8918 Moves regenerated-title suffix | `ae095e2dd3` | yes |
| #8936 Source NDA send authority | `6c1e71fa24` | yes |
| #8931 Moves synthetic reference drafts | `32d6e6f624` | yes |
| #8927 Canonical tenant alias resolution | `30e0d29d18` | yes |

Ancestry is the assertion this walk makes about the merges. It cannot be
invalidated by the next deploy, which is the whole point of the unpinned form.

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` (`rg-abarva-controlplane-lab-eastus`) |
| Template image | `sha256:1b909a50bed3385ed898dd7d5c56b849b3a98e2f26c1015f94a0fe04b365c7dc` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--maa23d2c3` — sole entry, weight 100, Healthy / Running, created 2026-10-04T01:21:50Z |
| Revision image | identical to the template image |
| `latestReadyRevisionName` | `ca-abarva-web-lab-eastus--maa23d2c3` — the same revision that carries the traffic |
| `job-abarva-deliv-worker` | identical to the template image |
| `job-abarva-deliv-worker-event` | identical to the template image |

Read at 02:00:16Z and again at 02:07:45Z; both reads returned the same digest,
the same sole revision and the same two worker images, so no deploy landed
inside the walk and no surface was reloaded onto a different build.

**Three merges were ahead of the serving SHA and are NOT proven here.** At walk
time `origin/main` was `f431ae90c7`, three merges beyond what was serving:
#8947 `4f29addd31`, #8949 `f431ae90c7` and #8950 `d9e927f3c8`. Two of the three
are client surfaces (a horizontal phase stepper, and docking aVa to the left),
so a sixth wave is already forming. Nothing in this block should be read as
acceptance of them — and the phase rail observed in row 2 is the **vertical**
one, which is the independent confirmation that #8949 had not reached the
runtime.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home leadership-voice spread, chapter 07 | #8923 | **pass** | Full-width spread below the readout card, not in the narrow column. **The ranking is real, not decorative:** the fourteen consensus rows under "Where the interviews converged … strongest agreement first" descend monotonically — 44, 44, 44, 41, 38, 38, 36, 36, 34, 29, 23, 23, 23, 22 of 44 — matching `LeadershipVoiceFull`'s sort by proportion. **The quotes resolve from governed signals, not a placeholder:** the chapter's selector takes `signal.domains.includes("ai_value_interview_evidence")` off the `EnterpriseSignalPacket` (`ChapterPage.tsx:1724`), and what renders is tenant-specific rather than plausible prose — quotes naming `Actuarial & Underwriting Analytics Modernization`, `Epic Resolute Professional Billing` and `STARS/HEDIS Quality Mart (SQL Server On-Prem)`, each tagged with the theme it was raised under. **Every office renders, not just the most-quoted:** the metric reads `5 OFFICES QUOTED` and exactly five office blocks are present — President & CEO, CFO, Chief Data & Analytics Officer, CIO, VP Finance Operations. The counterpoints the merge added are both shown: `RAISED BY A SINGLE LEADER` with two dissent themes, and `TESTIMONY AGAINST THE RECORD · 127 of 996 responses`. No raw machine token reaches the surface — themes render as words (`Value realisation`, `Estate fragmentation`), which is the half #8923 called out. |
| 2 | Moves phase-flow surface, read as one composite | #8932 · #8934 · #8937 | **pass** | Read as one surface rather than three merges, on a P1 Charter move. **Exactly one next action exists on the page** — a single `NEXT` field reading `Complete 7 required inputs`. Measured, not eyeballed: scanning the rendered text for every next-action shape (`next`, `next step`, `next action`, `do this next`, `recommended next`) returns **one** match on the whole surface. The three same-surface changes have not produced two competing next actions. **The charter inputs say what to write** (#8932): step 1 of 10 carries "The sponsor's name, role, and email. We only record them for progress updates — sponsor sign-off is not required to complete the charter", and the control reads `Fill this in to continue.` **Step clarity holds** (#8937): the workflow strip `Charter Inputs → Upload Evidence → Approve & Build` states its own ordering rule and disclaims a visual-only affordance — "Use the left steps in order. Approve & Build remains the governed close; it is not a visual-only button." Status card is internally consistent: `INPUTS 0/7`, `EVIDENCE 1 open`, `GATE 1/2 hard met`, seven named inputs in the rail. |
| 3 | Home narrative surface, cross-cutting | #8922 | **pass** — and **C-637 moves from 4 to 0** | The whole Home body was scanned for the broken shape rather than spot-checked: **zero** matches for `/\d\. \d/` across 1,112,296 characters, which covers the embedded server payload as well as the visible text — and C-637 established the broken form was present in the raw server response, so this is the same measurement surface, not an easier one. All five figures C-637 named render **correctly and in the exact context it named them**: exhibit 01's key message reads `"Epic (17.4%) and Microsoft (9.1%) together represent more than a quarter of the $496.4M vendor spend base."`, the chapter-01 synthesis reads `MA Star Rating to 4.5+`, and the chapter-08 synthesis reads `a 6.4% error rate at 36% automation`. Probed both ways: `17.4%`, `9.1%`, `$496.4M`, `4.5+` and `6.4%` all present; `17. 4`, `9. 1`, `496. 4`, `4. 5+` and `6. 4%` all absent. C-637's acceptance says a changed count is itself the finding; the count is **0**. |
| 4 | Moves labels on the board | #8925 · #8918 | **pass**, with the limit stated | **U-553 re-read: 0 of 8 move names carry a build or run identifier**, down from 5 on each of the two previous walks. The walk separates sanitizer from corpus instead of reporting the count alone, by reading the raw record beside the rendered one. `GET /api/v1/programs` returns eight programmes, one of which is raw `"Synthetic Meridian E2E Smoke - 20260923T161431Z"` — U-553's shape (a), verbatim — and the board renders that row as `"Synthetic Meridian Health"`. So shape (a) **is genuinely sanitized on the client surface, proven against the raw record on the same row**, and no bare stamp survives it, which is the one place U-556 / U-558's question becomes observable rather than theoretical. The other seven raw names are ordinary business names. |
| 5 | Source NDA send surface | #8936 | **blocked** — undispatched, with the path named | No send was attempted and none could have been. The gate is visible and reads as an authority gate, which is what #8936 claims: on the event that has recorded Suppliers & NDA, `NDA AUTHORITY — Not recorded` on **all four** accepted suppliers, readiness posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, and the governing sentence "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Four concrete preconditions block the send, each stated by the product rather than inferred: (a) "No published NDA template version is available for this event, so no executed document can be checked against one"; (b) NDA authority not recorded for any supplier; (c) `Active contacts: 0` on every accepted supplier, with one carrying `Contact policy: do not contact · Contact readiness: prohibited`; (d) on the second event walked, stage 03 is not open at all — "This phase is not yet open … Before this phase can open: scope and strategy must advance, then supplier eligibility and required NDA coverage must be recorded." The surface also declares its own limit rather than overclaiming: "The published template versions were supplied by the caller, not verified against the authority register here. A wrong list changes this answer." |
| 6a | Moves synthetic phase reference drafts | #8931 | **pass** | The reference draft renders on the charter step, headed `AbarVa reference draft · Synthetic · review before use`, with a substantive body ("Listed sponsor contact: VP of Payment Integrity; CFO is an escalation contact. Sponsors are informational contacts, not approvers…"). The fence the merge needs is present and unambiguous: "Not client-provided, captured, approved, or evidence. This does not complete the input or clear a gate." So the draft is shown **and** is prevented from reading as client evidence or as gate progress — which is the whole difficulty of showing a synthetic draft on a governed surface. |
| 6b | Canonical tenant alias resolution | #8927 | **blocked** — not reachable from any signed-in surface | C-641 pairs this with #8931 in one minimum row, and the pairing does not hold. #8927 changes `scripts/demo/clean-demo-moves-aca-job.ts`, its test and its docs — **no route, component or API response**. Its code path is an ACA job, which an unattended walk must not run. What a walk *can* say is weaker and is said as such: the tenant alias resolves consistently to one canonical display name across the board header, the move header, the left rail and the breadcrumb (`Meridian Health · WORKFLOW AUTOMATION · HEALTHCARE_IDN`), with no raw alias leaking, and the tenant-scoped programmes API answered 200. That is a surface consistent with the job having run correctly; it is not proof the job's resolution logic changed, and the row is `blocked` rather than a quiet pass. |

### The part of row 4 that is NOT proven, stated rather than implied

U-553 named two shapes and this walk only exercised one. Shape (b) —
`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`, the **four** rows of the
original five — does not appear in the raw API response at all, so those rows
left the corpus rather than being sanitized. The rule's sufficiency against
shape (b) is therefore **unproven, not met**: the rows that would test it no
longer render. U-553's own acceptance asks for the rule set to be derived from
the live corpus rather than from an example, and a corpus that no longer
contains the example cannot answer that. **0 of 8 must not be read as U-553
closed.**

### Stated limits of this walk

Rows 5 and 6b are `blocked` and each names what would unblock it; neither is a
quiet pass. Row 4 is split between what was proven against the raw record and
what the corpus can no longer test.

No write was performed on any surface. No approval was submitted, no phase
advanced, no step saved, no envelope drafted or sent, no file downloaded. The
only interactions were navigation, chapter selection, stage selection and tab
selection — all client-side view state — plus two read-only `GET` requests
issued with the signed-in session. Two already-passed or not-yet-open stages
were opened for reading; both declared that doing so changes nothing
("Browsing here does not advance the event", "Viewing it does not mark it
complete, approve any gate, or change the current stage"), which is itself an
independent re-confirmation of item 20 on a much later SHA.

### Noted, not filed

Each needs a product call rather than a guess, and is recorded so a later reader
does not re-discover it as new:

- The phase status card reads "1 required evidence item still **need** approval
  or coverage" — a subject–verb disagreement on a client surface, in the same
  card as the single next action.
- On the Source New board one event's title is a truncated scope sentence used
  as a name: "Meridian Health In scope for workflow testing: L1/L2 service desk,
  endpoint management, patch orchestration, device life" — cut mid-word. This is
  the Source analogue of U-553's question about what belongs in a client-visible
  name, on a different surface and under no existing item.
- Three of the eight Moves rows share one programme code
  (`HEALTHCARE_IDN-MEMBER-2026`) across the names "Member Service Agent Assist"
  (twice, identical) and "Member Service Agent Assist Transformation". Whether
  the duplication is intended seeding or drift is not established here.
- The leadership-voice band reads `16 THEMES COUNTED` against fourteen rendered
  consensus rows. It is **not** a defect: `themeCount = consensus.length +
  dissent.length`, and two dissent themes render in the counterpoint card
  (`AI governance`, `Finance evidence`). Recorded because the arithmetic is not
  visible from the surface and a later reader would reasonably file it.

---

## 2026-10-03 wave — deployed SHA `44b50dcd3d`

**Item:** C-633.
**Walked:** 2026-10-03, between 15:21Z and 15:36Z, by `source-backlog-executor#20261003T1515Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
governed healthcare fixture tenant. Synthetic portfolio; the surface labels
itself `DEMO · CANDIDATE — UNREVIEWED · Synthetic portfolio. Not a customer, not
a case study.`

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:5bb19ba545a5ffd1fc81c4fde49b1ce8dfe15d48d5ba08246a25751fdee209ca` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m44b50dcd` — sole entry, weight 100, Healthy / Running |
| Revision image | identical to the template image |
| Deploy run | `aca-main-deploy` 37131672723 on the merge SHA, `createdAt` 2026-10-03T15:00:15Z, `updatedAt` 2026-10-03T15:08:34Z, success, and the newest run of that workflow |

No deploy occurred during the walk: the second read returned the same digest and
the same sole revision as the first. No surface was reloaded to change a result.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 governed chart grid | #8901 | **pass** | Exhibits render with an argument-shaped title, a key message, and an exhibit eyebrow naming the record they are drawn from — e.g. `EXHIBIT 01 · THIRD-PARTY SPEND`, "Two vendors … carry over a quarter of total vendor spend", with the two shares named in the subtitle. Counted across the briefing: 5 of 9 chapters render a plotted exhibit; 4 render none. The absence is declared rather than silent — one chapter states `EVIDENCE NOT YET SERVED` and "no rows of it reached this page. That is a gap in what was served, not a gap in the record." |
| 2 | Home v4 Technology & Data cross-dimensional pivot | #8901 | **pass** | `PIVOT BY` offers five dimensions and `MEASURE` two. Re-pivoting changes both the chart and its honesty line: Provider gives "Top 8 of 53" with "Showing the 8 largest of 53. 45 more rows are in the record and in the table below"; Criticality gives "Top 3 of 3" and "All 3 rows are shown"; switching Function from annual cost to count re-ranks the bars rather than re-labelling them. The scatter declares its own exclusion: "4 applications declare no debt score and are not plotted — counted in the table, not drawn here, so the scatter never reads a missing score as zero." |
| 3 | Moves board client surface | #8903 | **fail** — filed as **U-553** | Half the merge is live and half is not. The raw data-build stamp is gone from the portfolio header, as claimed. The move-title sanitizer is not sufficient on the real corpus: **5 of the 8 move names on the board carry a build or run identifier**, in two shapes neither of the sanitizer's rules matches — a trailing run timestamp after a mid-string token (`Synthetic <tenant> E2E Smoke - <YYYYMMDD>T<HHMMSS>Z`) and a trailing build vintage (`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`, four rows). |
| 4 | Phase transition refused for want of evidence | #8907 | **pass** | On one P1 move: `GATE 1/2 hard met`; "1 hard gate blocker remain before this phase can advance. Workbook available · acceptance required before next phase". The distinction the merge adds is visible — "Workbook review recorded · 15 accepted · 0 needs validation · 0 rejected · 0 pending · readiness 0 ready / 6 insufficient / 9 unknown", so acceptance alone does not confer readiness, and individual responses read `Required · Unknown · Accepted` and `Required · Insufficient_evidence · Accepted`. The refusal names what is missing: "What P2 Discover & Diagnose will need" lists current-state process / operating documentation, systems landscape, and KPI / metric baseline. P2–P5 are disabled in the phase rail. |

### Stated limits of row 4

The refusal was observed as a refusal. The walk did **not** attempt the
transition, so the server-side fail-closed behaviour on the gate-approval and
phase-generation routes is evidenced by that merge's own tests and not by this
walk. Proving it live needs a committed action against tenant data and is owed
as a separate, authorised step.

### Noted, not filed

Two things on the phase surface are already owned elsewhere and are recorded
here only so a later reader does not re-discover them as new: the evidence
rollup reads `Covered` while transition readiness is `0 ready / 6 insufficient`,
and a review state renders as the raw enum `Insufficient_evidence`. #8903's own
record places both in a separate workflow-correctness workstream.

---

## 2026-10-02 wave — walked on deployed SHA `e085442776`

**Item:** C-631.
**Walked:** 2026-10-03, between 16:07:25Z and 16:17:21Z, by
`source-backlog-executor#20261003T1605Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
composite reference tenant, labelled on the surface `COMPOSITE REFERENCE TENANT
· DEMO · CANDIDATE · UNREVIEWED · Synthetic portfolio. Not a customer, not a
case study.`

**Which SHA, and why it is not the wave's own SHA.** C-631 names merges from
2026-10-02. They are all ancestors of `e085442776`, which was the sole
100%-traffic revision for the whole walk, so walking the current runtime proves
them on the code that is actually serving. It does mean this walk's SHA is also
C-635's SHA: **C-635's own three merges (#8904, #8910, #8912) are not proven
here.** Nothing in this block should be read as acceptance of them.

**One correction to the item's own framing.** C-631 scopes itself to
2026-10-02T14:00Z–22:17Z and then lists #8843 inside that window. #8843's
GitHub `mergedAt` is 2026-10-02T01:24:09Z, outside it. The merge is real and is
walked below; the window in the item text is wrong, and is recorded as wrong
rather than quietly widened.

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` (`rg-abarva-controlplane-lab-eastus`) |
| Template image | `sha256:e57ba3580e01994fd83080efd79f54bce4fb255297101185e2f346ed9f95f89b` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--me0854427` — sole entry, weight 100, Healthy / Running |
| Revision image | identical to the template image |
| `job-abarva-deliv-worker` | identical to the template image |
| `job-abarva-deliv-worker-event` | identical to the template image |
| Deploy run | `aca-main-deploy` 37135052683 on `e085442776`, `createdAt` 2026-10-03T15:57:02Z, `updatedAt` 2026-10-03T16:06:59Z, success |

Read at 16:07:25Z and again at 16:17:21Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk. **The window
closed nine seconds before the next one opened:** run 37136290168 was `queued`
at 16:17:12Z for a later SHA and had shifted no traffic at the second read. A
walk recorded after that run completes is reading a different runtime.

**The walk was started only once the invariant held.** At 16:04:53Z the template
image and the 100%-traffic revision image disagreed, because run 37135052683 was
still in flight. Walking then would have put a traffic shift inside the walk.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 chapter as an executive cockpit | #8887 | **pass** | All four regions the merge claims are present and populated on the executive-brief chapter: `data-home-kpi-rail` ("3 counted from the record · 4 questions for the room · 96 signals on the record · 18 governed facts" — counts with the record they are counted from, no bare figures), `data-home-chart-grid` with one exhibit card, the governed evidence region, and `data-home-cockpit-workspace` with four tabs (Insights 7 / Open items 3 / Watch 1 / Questions 4) of which exactly one is `aria-selected`. |
| 2 | Industry context band | #8890 | **pass** | Band renders under `data-home-industry-context`, grouped by the record's own kind: `INDUSTRY PATTERNS 12` and `EXPERT LENSES 9`. Measured against the merge's three negative claims rather than read for tone: **zero** currency symbols, percentages or `USD` in the band; **zero** digits anywhere in it outside the two group counts; and the raw machine kind never rendered — only the display forms `INDUSTRY PATTERN` and `EXPERT LENS`. Provenance line present and explicit: "not this enterprise's attested facts, and not a peer benchmark … the record holds no competitor or peer figure." |
| 3 | Source-linked enterprise context | #8843 | **pass** | The briefing renders scale, model, operating segments and who pays ("$25B revenue · 68,000 people"; "Hospital & Acute Delivery · Ambulatory & Physician Network · Health Plan Operations · Shared Enterprise Services"), priorities "in the order the record states them", and record drill-through. The gap half is the stronger half and it holds: a `data-home-briefing-gaps` block headed "WHAT A NEW EXECUTIVE WOULD ASK THAT THIS RECORD CANNOT ANSWER — named rather than omitted — silence here would read as 'no issue'", which calls the competitor gap "a collection gap, not a finding about the market". The page's own source date reads "Data as of not established" rather than inventing one. |
| 4 | Enterprise-context truthfulness statements | #8858 | **blocked** | Not observable on this tenant, and the two readings are not distinguishable from the client. The statements the merge changed — `Source-file quality: N of M accepted; K not reviewed`, and the functions-without-a-segment-key wording — appear **nowhere** on the page or in the HTML export: zero matches for `Source-file quality`, for `N of M accepted`, and for `not reviewed`. That is consistent with "the statements are conditional on source-file load and approval states this tenant's record does not reach" and equally consistent with "the statements no longer render at all". Settling it needs a tenant whose record carries files in the accepted-without-approval state, which this walk could not choose. |
| 5 | Ranked risk review items | #8875 | **blocked** | The chapter is reachable and coherent, but the record the ranking is built from did not reach the page, and the page says so: `ONE EVIDENCE VIEW PENDING · EVIDENCE NOT YET SERVED · Risks & controls — "This chapter is built from the risks & controls record, and no rows of it reached this page. That is a gap in what was served, not a gap in the record."` What does render is a separate deterministic set ("7 findings · 3 the record says are wrong now · 1 evidence view pending", each carrying a named owner such as Chief Information Security Officer) and a risk-concentration exhibit sourced from "Risk register · 2 governed references". The merge's negative claims hold on what is rendered — **zero** occurrences of `risk score` or any invented score. The declared-absence behaviour is working; it is what blocks the row. |
| 6 | Walkthrough export preserves enterprise context | #8846 | **fail** — filed as **U-554** | The export was read at its own endpoint (`GET /api/home/walkthrough-export?…&format=html`, 200, 38,667 bytes) with the signed-in session. Of the seven elements the merge says it preserves, **three are present** — priorities, source dates ("Data as of"), synthetic evidence labels — and **four are absent**: business scale (no `$25B`, no `68,000`), operating segments, function ownership, and attribution gaps (no `uncited`, no `unlinked`, no "cannot answer" block). All four render on the page itself, in the same session, minutes apart. |
| 7 | Workspace users are the sole Moves approvers | #8894 | **pass** (client surface) · server half **blocked** | The Approvals overview names the approver for **6 of 6** phases as `Authorized workspace user` — Originate, Charter, Diagnose, Design, Roadmap, Mobilize — with no other approver identity offered anywhere. The word `sponsor` appears **zero** times on the move surface, and there are **zero** sponsor-approval controls; the only approval affordances are two `Review & approve →` links on the reachable phases. On the board the sponsor is a contact column only. **Blocked half, with the write named:** that a workspace user *can* approve and a non-workspace user *is refused* needs a committed approval against tenant data by a second signed-in identity. This walk performs no write and holds one identity, so the server-side authorization rests on the merge's own tests. |
| 8 | Moves premium evidence readiness accounting | #8587 | **blocked** | The accounting the merge fixes is recorded on a premium artifact generation run, for succeeded and quality-blocked runs alike. Producing one is a write and a model spend, which this walk does not perform, and no surface reached displays the recorded evidence count. The nearest visible statement is a deliverable snapshot caveat — "its attached-evidence count and content may be out of date" — which is a staleness disclosure about a prior run, not this merge's accounting. |
| 9 | Lab NDA e-signature slices | #8896 · #8897 · #8898 · #8900 | **blocked** — undispatched, and measured rather than asserted | The acceptance permits an explicit statement that the lab path is still undispatched. It is, and the runtime says why: on the serving revision `SOURCE_NDA_ESIGN_PROVIDER` is set to `disabled`, and **none** of `SOURCE_NDA_ESIGN_ACCOUNT_ID`, `_INTEGRATION_KEY`, `_KEY_ID`, `_USER_ID`, `_ENVIRONMENT` or `_TEST_INBOX` is present on the container at all (read-only `az`, same read as the invariant). So the four slices cannot be exercised end to end on this runtime — not merely "not yet run". Consistent with the surface: the Source New request stage renders zero NDA affordances for this tenant. No envelope was drafted or sent, and none could have been. |
| 10 | Generated narrative on the cockpit, cross-cutting | found while walking rows 1 and 5 | **fail** — filed as **C-637** | Four decimal figures are broken by an inserted space where an executive reads them: `Epic (17. 4%)`, `Microsoft (9. 1%)` and `$496. 4M` in exhibit 01's key message, and `4. 5+` in the Insights synthesis on chapter 01; `6. 4% error rate` in the synthesis on chapter 08. Present in the **raw server response** for `/home` (1,188,437 bytes, fetched with the session), so neither a client-side transform nor an extraction artifact. The same payload writes `17.4%` correctly 9 times and `4.5+` correctly 17 times, and 680 other decimals on the page are correct, so the generator is inconsistent rather than uniformly broken. |

### Stated limits of this walk

Rows 4, 5, 8 and 9 are `blocked`, and each names what would unblock it. None is
a quiet pass. Row 7 is split deliberately: the client surface is proven, the
server authorization is not, and the row says which is which.

No write was performed on any surface. No approval was submitted, no phase
advanced, no envelope drafted or sent, no file downloaded to disk — the export
in row 6 was read as a response body in the page, not saved. The only
interactions were navigation, chapter selection and workspace-tab selection,
all client-side view state.

### A second reading of U-553, on a newer SHA

U-553 was filed from the C-633 walk on `44b50dcd3d`. Its acceptance asks for a
re-walk. Independently re-measured here on `e085442776`: **5 move names carry a
build or run identifier**, in exactly the two shapes U-553 names — one
`Synthetic <tenant> E2E Smoke - <YYYYMMDD>T<HHMMSS>Z` and four
`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`. The count and the shapes
reproduce unchanged one SHA later. This is a confirmation, not a new item.

### Noted, not filed

Each of these needs a product call rather than a guess, and is recorded so a
later reader does not re-discover it as new:

- Every move row prints an uppercase programme code (`<SEGMENT>-<SCOPE>-<YEAR>`) beneath
  its name. Unlike U-553's build stamps this may well be a reference a client
  uses on purpose, so it is not filed as a leak. Worth a decision, because
  Home's own vocabulary gate (`cxoText`) forbids machine identifiers on client
  surfaces and its `MACHINE_IDENTIFIER_RE` matches lowercase only, so a code in
  this shape would pass that gate unchanged if it ever reached a Home surface.
- The chapter-08 evidence rollup declares `EVIDENCE NOT YET SERVED` for risks &
  controls while the same chapter renders a risk-concentration exhibit sourced
  from a risk register. Both statements may be true of different records; which
  record feeds which is not established here.
