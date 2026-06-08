# Admin Loader — UX workflow + wireframe spec

**North star:** *drop your files → I'll tell you what I found → answer 0–2 questions → confirm.*
Apple-simple on the surface; fully governed (Blob preservation, citations, review) underneath.
Open `wireframe.html` for the low-fidelity screens. Visual language = the locked AbarVa design
system (off-white `#F8F7F4`, Georgia headings, DM Sans body, black/ghost buttons) — do not change.

## Three on-ramps (same destination, same governance)

1. **Drop zone (default, 90% of users).** One big "Add your data" surface. Drop files, a folder,
   or a ZIP — CSV/XLSX/PDF/PPTX/DOCX. AI auto-detects each file's dimension and mapping.
2. **Dimension-targeted (power user shortcut).** "Load into a specific area" → pick a dimension →
   drop the file → AI maps *within* that dimension (fewer/zero questions).
3. **Direct-to-Blob (IT exception, advanced).** IT uploads straight to the governed landing-zone
   container via **Azure Storage Explorer / azcopy** (their preference), then we ingest it.
   See §"Direct-to-Blob" below. Governance is automatically satisfied (the file is already in Blob).

All three converge on the **same review screen** and the **same commit pipeline**.

## The flow (4 calm states)

```
[1 Add]  ->  [2 Understanding]  ->  [3 Here's what I found]  ->  [4 Loaded]
 drop          reading + parse        batch review + 0-2 Qs        cited + answerable
```

- **1 · Add** — empty state: the drop zone + two quiet secondary links (dimension-targeted; Azure Storage).
- **2 · Understanding** — calm progress: "Reading 12 files… understanding…". No spinners-of-doom; show file count.
- **3 · Here's what I found** — the batch review (below). The only screen the user really acts on.
- **4 · Loaded** — "12 files · 450 facts · originals preserved · sources cited" + a one-tap "Ask Sentinel" and the quiet state pills.

## Screen 3 — the batch review (the heart)

A single table, identical whether 1 file or 30:

| File | Area (dimension) | Facts | Confidence | Action |
|---|---|---|---|---|
| `cmdb_export.xlsx` | Applications/Systems ▾ | 412 | High ✓ | preview |
| `leadership.pdf` | Org & Leadership ▾ | 38 | High ✓ | preview |
| `Q3_board.pptx` | **needs answer** ▾ | — | Low ⚠ | answer |

- Banner: **"10 ready · 2 need a quick answer."** Primary button reflects state:
  - all ready → **"Confirm & load 12"**
  - some low → **"Answer 2 questions"** then **"Confirm & load 12"**
- Each row: the **Area is a dropdown pre-filled with the AI's pick** (one-tap correct); "preview" opens
  the mapped sample (source column → canonical field) for trust; documents show a "review-required" tag.
- Confidence chip: High ✓ (auto) · Med (pre-selected, confirm) · Low ⚠ (must answer).

## Confidence → action thresholds

| Confidence | Behavior |
|---|---|
| **≥ 0.85** (content + structure [+ filename] agree) | Auto-classified; shown, no question |
| **0.60–0.85** | Best-guess pre-selected; one-tap confirm in the table |
| **< 0.60** or material ambiguity | **Ask** one plain, batched question (best-guess pre-selected) |

Rule to stay Apple-like: **default to a confident best-guess; only *block* with a question when
confidence is low AND the field is material; batch all questions for a multi-file upload into one short pass.**
Never a per-field wizard.

## Clarification step (only when needed)
Plain English, batched, pre-answered:
> *"`Q3_board.pptx` — I think this is **Financials**. Is that right?"* [Financials ▾] [Skip this file]
> *"Column 'Amount' — annual contract value or monthly run-rate?"* [Annual ▾]

Questions are **only about mapping/interpretation**, never "supply the missing number." Skipping a
file leaves it un-ingested (no half-commit).

## Direct-to-Blob (the IT exception you asked for)

For IT teams who prefer their own tools:
1. Each tenant has a governed **landing-zone container path**, e.g. `landing/<tenant_key>/inbox/`.
   The Admin page shows it + an **"Open in Azure Storage Explorer"** helper (and an azcopy snippet).
2. IT drops files there directly (Storage Explorer / azcopy / SDK).
3. Pickup, either:
   - **Auto** — Event Grid fires → `azure-landing-zone-consumer.ts` ingests (already built), or
   - **Manual ("process one time")** — the Admin page's **"Landing zone"** tab shows *"3 new files
     detected — [Review & ingest]"*, which runs the **same** classify → map → review → confirm flow.
4. Because the file is already in Blob, **Gate 0 is satisfied by construction** — we just record the
   `blob_url` + `file_hash` in `source_files` and proceed. Same citations, same review-required for docs.

> This keeps the "advanced/exception" path fully governed — no side-door that skips preservation or
> provenance. It's the same pipeline, just a different way the bytes arrived in Blob.

## States to design (don't skip)
empty · uploading/streaming-to-blob · understanding · review (all-ready / needs-answers) · clarifying ·
committing · loaded · partial (some skipped) · error (per-file, specific, resumable) · landing-zone-empty.

## Component inventory (for build)
`DropZone` · `OnRampLinks` (dimension-targeted, Azure-storage) · `UnderstandingProgress` ·
`ReviewTable` (rows = `FileClassificationRow` with Area dropdown + confidence chip + preview) ·
`MappingPreview` (source→canonical, with citations) · `ClarificationStep` (batched Q's) ·
`ConfirmBar` · `LoadedSummary` + `StatePills` · `LandingZonePanel` (path + Storage Explorer helper + detected-files list).

## Non-negotiables carried through every on-ramp
Blob preservation (Gate 0) · document facts review-required · proportionality validation · citation to
the preserved original · provenance (mapping proposal + user clarifications stored) · tenant scoping/RLS.

## Agent-assisted validation — Steward (workflow-anchored)

Validation is open-ended, so the loader's ask/validate/confirm brain is the Setup/Admin agent
**Steward** (Claude, Anthropic-only, audited egress). It assists **inside** the drop→review→confirm
spine — it is *not* a chatbot front door. Conversation is the exception path, surfaced only when
the structured flow can't resolve something.

### Hybrid: deterministic for the knowable, agent for the open-ended
- **Deterministic checks** (fast, free): schema types/required, value ranges, **proportionality bands**
  (org profile), FK/orphan resolution, duplicate-by-hash, units.
- **Steward (agent) checks** (open-ended): semantic mapping, **conflicts** ("two people titled CFO —
  which is current?"), **implied gaps** ("deck cites a 24th hospital not in your profile — add it?"),
  realism judgment ("IT budget reads 0.3% of revenue — typo or just the security slice?"),
  format weirdness. The agent only reasons where rules can't reach.

### Four touchpoints (mapped to the wireframe)
1. **Classification + mapping** — Steward proposes file→dimension and column→field with confidence.
2. **Inline clarification cards** (Screen 4) — the batched questions *are* Steward; best-guess pre-selected, one tap.
3. **Open-ended validation flags** (Screen 3 rows) — calm row-level flags (⚠ confirm / ➕ add) — confirm/correct, not free typing.
4. **"Ask Steward" dock** (scoped) — a side panel for the genuinely messy file; full conversation, **scoped to that file/upload**, never global.

### Boundary rule — inline flag vs escalate to conversation
- **Inline flag (default):** a single-row/single-field issue resolvable in ≤1 decision (pick/confirm/correct).
  Stays in the table. ~90% of cases.
- **Escalate to the scoped Ask-Steward dock when:** multi-step ambiguity; a conflict needing context;
  the user taps "why?/what is this?"; or a file stays low-confidence after one question. The dock is
  scoped to that file/upload, carries its parsed preview, and writes back the resolved mapping.
- **Never** open a global chatbot; never make a clean upload require conversation.

### Governance (the agent makes lineage *better*, not riskier)
- **Steward proposes/asks; the human confirms.** No auto-commit — document-derived facts stay review-required.
- **Anthropic-only**, audited via `ai_egress_audit` (provider=anthropic), `clients.ai_policy` gate.
- **The Q&A is stored as provenance** — the proposal, the flag, and the user's answer are saved, so
  "how this fact came to be" is fully auditable (an upgrade over silent rules).
- Every committed fact still cites the Blob-preserved original (Gate 0).

### Apple guardrail
Steward must make the user **talk less, not more.** Target: most uploads = **zero** conversation;
the agent earns its keep on the messy ~10%. If users feel like they're chatting to load data, we've
over-rotated — tighten the confidence thresholds and default to confident proposals.
