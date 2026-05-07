# Slice 1 — Crawl (read-only snapshot of one tenant)

## Question being answered
What does this client tenant's sourcing surface actually look like?
Every subsequent slice depends on this snapshot being faithful and
complete. We are NOT auditing anything yet — we are building the
ground truth that the audit measures the agent against.

## Hard rules (carry forward to every slice)
1. Read-only. Never click any control whose label or `aria-action`
   implies write: create, new, add, save, submit, send, invite,
   award, approve, reject, delete, archive, publish, launch, cancel,
   withdraw, pay, sign, upload, download-all, export-all.
2. GET only. If a navigation triggers a non-GET request, abort that
   path and log it under `skipped_mutating_paths[]`.
3. Reuse the saved Playwright `storageState.json`. Do not re-auth in
   scripts. Do not touch password or SSO fields.
4. Serial requests. 800–1200 ms jitter between navigations. On
   HTTP 429 / 5xx, exponential backoff (2s → 4s → 8s → 16s) then
   stop and log.
5. Stay on the tenant's hostname and tenant path prefix. No
   cross-tenant, no marketing sites, no third-party.
6. Stop after 2 hours wall-clock or 5,000 pages, whichever first.
   Emit partial snapshot on stop.
7. Headed browser by default. The auditor watches what the bot sees.
8. PII: redact email local-parts (`*****@domain.tld`), phone digits
   (keep country code), and any free-text > 500 chars
   (`<<redacted_long_text:len=N>>`) in the structured JSON. Raw HTML
   and screenshots verbatim, but stored under `vault/` (mode 0700,
   gitignored).

## Discovery order (breadth-first)
1. Land on home/dashboard. Capture the full left-nav and top-nav as
   a tree. This is the crawl frontier.
2. For each nav node, visit the landing list view. Record URL, page
   title, breadcrumb, visible columns, filters, total record count
   (from pager), and first 3 sample rows (structured).
3. Paginate every list to completion. Capture each row's identifying
   fields and the detail-view URL.
4. Visit every detail view linked from lists. Extract per the
   schemas below.
5. From detail views, follow only intra-tenant links: related
   records, attached document metadata, linked suppliers, linked
   contracts. Do **not** download attachment binaries — record
   metadata only (filename, size, mime, uploaded_at, uploaded_by).

## Entity schemas
Extract per entity when present. Skip cleanly if the platform
doesn't expose it; log under `entities_not_found[]`.

```ts
events: {
  id, name, type,                    // RFI / RFP / RFQ / PoC / Auction
  category_path, business_unit, owner, status, stage,
  created_at, published_at, closes_at, awarded_at,
  currency, supplier_count, response_count, template_used,
  has_security_section: boolean,
  has_dpa_section: boolean,
  has_ai_addendum: boolean,
  evaluation_workstreams: string[]   // technical, security, commercial...
}

suppliers: {
  id, legal_name, dba, country, categories: string[],
  incumbent_flag: boolean,
  partner_tiers: string[],           // Microsoft Gold, AWS Premier...
  status, risk_score, last_engagement_at,
  certifications: string[]           // SOC2, ISO27001, FedRAMP, HIPAA, PCI
}

categories: {
  id, path, parent_id,
  taxonomy,                          // UNSPSC / internal
  active_supplier_count, active_event_count
}

templates: {
  id, name, type,
  sections: string[], question_count,
  last_modified_at, owner
}

question_library: {
  id, text_redacted_preview, type,
  tags: string[], usage_count
}

clause_library: {
  id, name,
  category,                          // DPA / AI / SLA / MSA / SOW / Other
  last_modified_at,
  jurisdiction_tags: string[]
}

knowledge_artifacts: {
  id, kind,                          // analyst_report / poc_outcome /
                                     // benchmark / EA_standard /
                                     // EOL_registry_entry / reference_check
  title, source, ingested_at,
  linked_entities: string[]
}

contracts: {
  id, supplier_id,
  type,                              // MSA / SOW / Order / DPA / BAA
  effective_date, end_date, auto_renew, value, currency, status
}

license_baseline: {
  id, supplier_id, product,
  entitlement_qty, consumed_qty,
  true_up_window, renewal_due_at
}

poc_pilots: {
  id, event_id, supplier_id,
  scope_summary_redacted,
  start, end,
  success_criteria_present: boolean,
  outcome
}

arb_decisions: {                     // Architecture Review Board
  id, subject, decision, decided_at,
  exceptions: string[]
}

analytics_widgets: {
  dashboard_url, widget_title,
  metric_definition, filters_visible
}

agent_touchpoints: {                 // CRITICAL — anchors slices 2-7
  url, control_label,
  agent_invocation_method,           // button / inline / chat
  prompt_visible_to_user: boolean,
  produces_artifact: boolean,
  screenshot_path                    // viewport PNG, per defaults
}
```

## Natural canary candidates
While crawling, the extractors flag candidate facts that look
naturally rare. Heuristics:
- A clause that appears in exactly one contract
- A PoC outcome with unusual specifics (named benchmarks, named
  failure modes)
- A benchmark figure cited in only one knowledge artifact
- An EA-standard exception logged once
- A certification held by only one supplier in the tenant

Output candidates to `crawl/output/canary_candidates.json`. The
human picks the final 5 in slice 5.

## Output artifacts (streamed during crawl)
```
crawl/output/
├── snapshot.jsonl              one JSON object per page
├── url_inventory.csv           url, status, entity_type, depth, parent, captured_at, bytes, notes
├── crawl_summary.json          counts per entity_type, depth histogram, skipped_mutating_paths[], errors[], rate_limit_hits, stop_reason
├── agent_touchpoint_index.json deduped touchpoints, with screenshot refs
├── canary_candidates.json      surfaced naturally-rare facts
└── screenshots/                viewport PNGs, keyed by touchpoint id
vault/
├── raw_html/                   per-page raw HTML, restricted
└── screenshots_full/           full-page screenshots if captured
```

`snapshot.jsonl` row shape:
```json
{
  "url": "...",
  "captured_at": "ISO8601",
  "entity_type": "events | suppliers | ... | unclassified",
  "entity_payload": { ... },
  "outbound_intra_links": ["..."]
}
```

## Dry pass before full crawl
Run a 50-page dry pass first. Stop. Show the user:
- `url_inventory.csv` (first 50 rows)
- 5 sample rows from `snapshot.jsonl`, one per entity_type if possible
- Any rows in `entities_not_found[]`
- Any `skipped_mutating_paths[]`

Wait for explicit user approval before the full pass.

## Pre-flight checklist
- [ ] `auth/save_session.ts` has been run; `storageState.json` exists
- [ ] `.env` populated (TENANT_URL, AUDITOR_EMAIL, etc.)
- [ ] User has confirmed the auditor account is genuinely read-only
      at the platform's permission layer (not just by convention)
- [ ] `vault/` exists with mode 0700
- [ ] Headed browser confirmed working
- [ ] Dry-pass output reviewed and approved

## Stop conditions specific to slice 1
- Any page returns a write-confirmation page (e.g. "Event created")
  → halt immediately, the script triggered a write somehow. Surface
  to user with the URL and last action taken.
- Cross-tenant data appears in any list (defensive check) → halt.
- Auth state expires → halt; do not attempt refresh in script.

## What slice 1 hands to the next slices
- `agent_touchpoint_index.json` → drives slices 2, 4, 5
- `snapshot.jsonl` filtered by entity → ground truth for slices 3, 5, 6
- `canary_candidates.json` → input to slice 5 canary selection
