# Workspace explorer — design doc

The file/deliverable reset for Moves & Source. Goal: kill the canvas clutter by separating the
*decision* (the workflow pages stay light) from the *documents* (one Finder/Stripe-style
Workspace holds every file, input and output) — and make **creating a deliverable** a single
decision instead of a separate, disconnected page.

---

## 1. Problem (grounded in the live product, not assumed)

Captured from the actual app (SkyHarbor, app.abarva.ai):

**Source event today** — `Sentinel Source` agent panel (¼ width) + `Next move` card +
inline tabs `Document · Gate · Evidence · Log` + stage content + scorecards, all on one scroll.
There is already an `Open document workspace` button — the concept exists but isn't the home.

**Move detail today** — `Nexus` panel leaking raw scaffolding (`GLOBAL_NETWORK_AIRLINE-IRREGULAR-2026`,
`CITATION GAP`, `USER-CONFIRMED PENDING TENANT-ADMIN`) + tabs `Overview · Documents · File Cabinet ·
Sessions · Activity` + `Awaiting decision` banner + P0 gate criteria — all stacked.

**Deliverables today** — a *separate* `Deliverables` sub-nav page with four `Generate:` buttons
(strategy memo, RFP, eval workbook, exec rec), **detached from the event's evidence**.

### The three real problems
1. **Files are scattered across tabs** (Document, Evidence, File Cabinet) — no single home.
2. **Creating a deliverable is a separate page**, disconnected from the files you uploaded.
3. **The agent panel leaks raw IDs/scaffolding** and eats a quarter of the canvas.

---

## 2. Design principle

The canvas is doing two jobs — running the workflow AND being the file system. Split them:

| | Job | After |
|---|---|---|
| Workflow page | the decision | next move + gate + a thin agent bar. Light. |
| Workspace | the documents | one Finder/Stripe explorer: every input and output. Calm. |

~70% of the substrate already exists (`source_artifacts` registry, File Cabinet, evidence-state
ladder, the deliverables generate flow). This is **unification + reskin**, not greenfield.

---

## 3. Locked decisions

- **Surface:** drawer → expand. A right slide-over over the workflow page for a quick look
  (decision context stays visible behind it), with an `Expand` control to the full-page Finder.
- **Scope:** per-item Workspace on every Move and Source event, PLUS a tenant-wide `All files`
  vault in Setup/Admin (the librarian view across all Moves and events). Vault default view is
  "by Move/Event" with type/state/date as *facets* — never a flat 1,000-file list.
- **Buckets:** one unified explorer — Inputs and Deliverables together, so input→deliverable
  lineage is visible in one place.

---

## 4. The redesigned pages (what Moves & Source become)

Both modules follow ONE pattern — a calm decision page + two chips (`Workspace · N`, `Generate`).

### Source event (after)
- Breadcrumb (clean — no raw topic code), title, `Managed Service · Strategic · Owner`.
- Chips: `⛁ Workspace · 38`  ·  `✦ Generate deliverable`.
- 11-stage rail (Strategy → Value), current stage highlighted.
- `Next move` hero (the one thing to do now) + primary action.
- `Gate · N of M cleared` checklist (progress to advance).
- Thin `Ask Sentinel…` bar (conversational, not a file browser).
- Removed from the canvas: the `Document/Gate/Evidence/Log` tabs, the inline doc shelf, the
  vendor-response rows → all move to the Workspace.

### Move detail (after)
- Clean breadcrumb + title + `Strategic Move · Phase P0 Originate · Sponsor`.
- Chips: `⛁ Workspace · 12`  ·  `✦ Generate deliverable`.
- P0→P5 phase rail.
- `Awaiting decision` hero (`Origination brief is ready` → `Approve & advance`) + `Open brief`.
- P0 gate criteria checklist.
- Thin `Ask Nexus…` bar. No raw IDs, no scaffolding.
- Removed: `Overview/Documents/File Cabinet/Sessions/Activity` tabs → Workspace.

---

## 5. The Workspace explorer (the new home for files)

Three classic panes: **nav → file list → preview**.

### Left nav (mirrored for Moves & Source)
- **Inputs** — Evidence (loaded datasets), Context. Each row shows the evidence-state ladder
  (Loaded → Parsed → Available → Usable; Stale / Low-confidence flags) as a chip.
- **Deliverables** — grouped by phase/stage, plus **Approvals** (gate-approval records).
- **Sourcing → Vendor responses** (Source only) — one node per vendor, **structurally isolated**:
  opening Vendor A never surfaces Vendor B.
- **Upload files** — drop zone; assign a stage; governed route; versioned.

### Center — file list
name · type icon · state chip · version · updated · source. List or grid toggle, search, facets.

### Right — preview / detail
metadata, version history, **lineage**, classification, actions (Open / Download / Approve).

### Lineage (the differentiator — no generic explorer has this)
- An input shows: `used by → RFP package, Eval workbook`.
- A deliverable shows: the inputs it cited (`cites ← App portfolio · ITSM · SLA matrix`).
This ties the data room to the decisions and makes "is this fact grounded?" answerable in one click.

### Metadata model (per file)
`id, name, type (csv/pdf/docx/xlsx/html/md), kind/family, origin (uploaded|generated),
state (evidence-ladder | draft/reviewed/approved), version (current/superseded), stage_key,
source_label, classification (Internal/Restricted/Confidential), vendor (nullable, Source),
lineage: usedBy[] / cites[], audit (who/when), blob_path`.

---

## 6. The simplified create-deliverable flow (the core goal)

Today: leave the event → separate `Deliverables` page → click Generate → output detached from
the evidence. After: **one decision, in context.**

1. Click `✦ Generate` on the event/Move (or in the Workspace).
2. Pick the deliverable — four cards (RFP package · Strategy memo · Eval workbook · Exec rec).
   No config sprawl, no field forms.
3. One button. The engine **auto-assembles the right evidence** for that event/stage (you do not
   hand-pick files), runs the **6-pass authoring**, and the **quality gate blocks weak output**.
4. Progress state → result: **passed** (board-grade) or **blocked, with the specific reasons**
   (unsupported claims, missing register, too short, leak) so it's never silently mediocre.
5. It lands in the Workspace `Deliverables` as a **Draft** with its lineage → **Approve** to
   advance the gate.

Principle: **today you manage files to make a document; tomorrow you pick a deliverable and the
system manages the files** — and shows its work via lineage + the source register.

---

## 7. Entry points

- Move detail → `Workspace` chip → drawer; `Expand` → `/strategic-moves/{id}/workspace`.
- Source event → `Workspace` chip → drawer; `Expand` → `/source/events/{id}/workspace`.
- Setup/Admin → `All files` (tenant vault) at `/setup/files` — same explorer shell, scoped to the
  tenant across every Move and event, faceted by item/type/state/date.

---

## 8. Governance / RBAC (must hold)

- **Vendor isolation** is structural (a vendor node only ever loads that vendor's artifacts) and
  trace-proven. Incumbent baseline + spend are `Internal`/`Restricted` — never bidder-facing.
- **Uploads** go through the governed route (`/api/v1/source/[eventId]/artifacts/upload`), never
  the chat paperclip. **Versioning** is upgrade-only (current → superseded, no overwrite).
- **Per-user RLS** applies; download/preview honor classification + role. Every action is audited.
- **AI never final**: a generated deliverable is a Draft until a named human approves with rationale.

---

## 9. Reuse map (≈70% exists — unification, not greenfield)

- `source_artifacts` registry + `source-artifacts` blob bucket + `registerSourceArtifactUpload`.
- File Cabinet (`/source/events/{id}/file-cabinet`, FileCabinetPanel) → fold into the new shell.
- Evidence-state substrate (`source_event_evidence_states`) → the Inputs ladder chips.
- Deliverables generate flow (`/api/v1/deliverables/generate`, the per-stage `Generate` buttons,
  the 6-pass orchestrator + quality-validator) → the in-context `Generate` chip.
- Move artifacts (`generated_artifacts` / `saveGeneratedArtifact`) → Moves Deliverables bucket.

---

## 10. Build slices

1. **Read-only explorer** over the existing registry (drawer + full page; Inputs/Deliverables/
   Approvals/Vendors nav; list + preview). No new writes.
2. **Declutter the module pages** — remove inline tabs/shelves; add the `Workspace · N ↗` chip.
3. **Lineage + versions** in the preview (usedBy/cites, version history).
4. **In-context Generate** — the `Generate` chip on the event/Move; result + blocked-reasons +
   approve handoff; deliverable lands in the Workspace.
5. **Upload/version** through the governed route from the explorer; vendor-scoped uploads.
6. **Tenant vault** in Setup/Admin (`All files`) reusing the shell with tenant-wide facets.
7. **RBAC/classification** enforcement on preview/download + audit.

---

## 11. Visual system (locked)

`#F8F7F4` canvas · Georgia serif headings · DM Sans body · black/ghost buttons · real Option-2
logo. Stripe-clean left sidebar (the reference); 0.5px borders; calm whitespace; type-icon +
state-chip rows. No new color language — reuse the existing state palette (Loaded/Parsed/Usable/
Approved/Draft). Agent stays conversational, never a file browser.

---

## 12. Artifacts produced so far (in this design phase)
- Concept mockup of the 3-pane explorer.
- 4-step walkthrough (decluttered page → upload → simplified Generate → deliverable with lineage).
- Before/after, real-vs-redesign: Source event, Move detail (real screenshots captured live).

## 13. Open / next
- Wireframe the simplified Generate flow's progress + quality-gate result states (slice 4).
- Wireframe the full-page Finder ↔ drawer ↔ tenant-vault continuity.
- Interaction spec (open/preview/version/upload/search/filter/lineage/vendor-isolation/RBAC).
- Then turn slices 1–4 into a Codex build brief.
