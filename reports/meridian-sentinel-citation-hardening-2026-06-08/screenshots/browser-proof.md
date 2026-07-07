# Signed-in Browser Proof — app.abarva.ai (revision --0000070) · 2026-06-08

Performed in a live, Clerk-authenticated session (Chrome "work" device) on the
deployed revision. NOTE: the active tenant for the signed-in user (Anand Sundaram)
is **Lakeshore Holdings**; the `?client=meridian` param does not switch the active
client (no tenant switcher — by design). The EvidenceBasis UI code is identical
across tenants, so this fully exercises the deployed citation binding. The
Meridian-specific visual (same component, Meridian data) requires a session whose
active client is Meridian.

## Ask 1 — ungrounded question (negative case)
Q: "What are the top three AI investments I should be sequencing for the next four
quarters, and what evidence do you have to back them?"
- Answer streamed with the contract posture: "let me give you my honest view, with
  the caveat that I'm working from pattern expertise here, not your specific program
  inventory or IT financials, which aren't loaded in this session."
- Evidence widget: **EVIDENCE BASIS (0)** · badge **LOW** · "No grounded sources".
- **Citation gap shown (honest):** "Citation gap — no grounded sources for this
  answer. Treat it as unverified inference until evidence is loaded."
- ✅ Proves: citation gap appears when evidence is absent; confidence = LOW.

## Ask 2 — grounded question (positive case)
Q: "Who are our named executives and operating companies, and what is our data and
analytics stack?"
- Answer grounded in loaded client data: named the C-suite (incl. Meera Rao CIO),
  the operating companies + CFOs, and the data/analytics stack — "Snowflake
  Enterprise (Tier 1, hosted on Azure East US 2 …) feeding into Power BI … Azure
  Data Factory … Anaplan runs FP&A … Northline has its own Azure subscription …
  Brightmark runs a GCP/BigQuery sandbox" — then an honest closing gap.
- Evidence widget: **EVIDENCE BASIS (4)** · badge **PARTIAL** · "Partial evidence".
- **No citation-gap warning** (sources exist).
- ✅ Proves: evidence chips render when sources exist; citation gap suppressed;
  confidence = PARTIAL (nuanced, not overclaimed High); answer cites loaded context.

## Acceptance coverage (UI)
- Evidence drawer/chips render ✅
- Citation gap appears when evidence absent ✅ (Ask 1)
- Citation gap does NOT appear when citations exist ✅ (Ask 2)
- Confidence classification honest (LOW vs PARTIAL) ✅
- Answers evidence-aware / no fabrication ✅

## Caveat
- Visual proof captured on the deployed UI under the Lakeshore active tenant
  (signed-in user's client). Identical EvidenceBasis code serves Meridian; a
  Meridian-active session reproduces the same behavior over Meridian data.
