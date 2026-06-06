# Meridian / PHS Demo — Walkthrough Script

Audience: CXO buyer + technical evaluator. Tenant: **Meridian Health
(`meridian-health`)**, synthetic. Duration: ~15 minutes.

> Say up front: "This is a synthetic, Meridian/PHS-inspired pilot tenant. Every
> number is illustrative — nothing here is real confidential PHS data."

Sign in as a Meridian CXO persona (e.g. `meridian-cdao` / `meridian-cdio` test
accounts). Each step lists the **surface**, **action**, and **what to say**.

## 1. Admin Context Layer — "the context is really loaded"

- Surface: Admin → Context Layer.
- Action: filter tenant `meridian-health`. Show the source files and the
  embedding status.
- Say: "873 chunks embedded, 0 pending, 0 failed. This entered through the
  governed admin context loader, not a seed shortcut." (Evidence:
  `../MERIDIAN_AZURE_EMBED_DRAIN_EVIDENCE_2026-06-06.md`.)
- Validate: no "context not loaded" banner; counts match 873/0/0.

## 2. Data Loads / Agent Readiness — "governed provenance"

- Surface: Admin → Data Loads (ingestion runs) and Agent Readiness.
- Action: show the latest load run for `meridian-health` and the enrichment
  templates (KPI library, Databricks target model, plan/provider analytics).
- Say: "Each row became a retrievable chunk with tenant + source provenance."

## 3. Intelligence Brief / Enterprise Context — "Sentinel knows Meridian"

- Surface: `/intelligence`.
- Action: confirm Enterprise Context shows Meridian as loaded (not unloaded).
- Ask 2–3 hard questions from `HARD_QUESTIONS_AND_EXPECTED_ANSWERS.md`, one each
  for CFO, CDAO, and audit personas.
- Say: "Notice the answer shape — My read, Options, Evidence, Assumptions,
  Risk/gate — short sections, not a wall of text, and it cites loaded evidence."
- Validate: answer cites Meridian evidence; no cross-tenant bleed (no Apex/
  SkyHarbor/First Capital); no giant unreadable paragraph.

## 4. Strategic Move — the hero project

- Surface: `/strategic-moves` → open **AI-enabled Population Health & Clinical
  Performance Command Center**.
- Action: walk the Phase Rail P0→P5. Open the Documents tab.
- Say: "One Move, six phases, each with a real deliverable — charter, discovery,
  target-state architecture, business case, mobilization/RACI, value contract."
- Validate: PhaseRail shows P0..P5 then → Tower; each phase has a deliverable.

## 5. Artifact downloads — "buyer-grade outputs"

- Surface: Move → Documents → each deliverable → export.
- Action: download the executive memo (DOCX), value model (XLSX), board brief
  (PDF), architecture pack (HTML), RACI/mobilization (XLSX), evidence appendix.
- Say: "These open in Word/Excel/PDF and every claim traces to loaded evidence."
- Validate: each artifact downloads and opens; content matches `artifacts/`.

## 6. Tower — "after handoff"

- Surface: Tower.
- Action: show the value-measurement contract the Move hands to Control Tower.
- Say: "After P5, Control Tower owns value realization, model monitoring, and
  risk. AbarVa frames and mobilizes the Move; Tower runs the scoreboard."

## Closing line

"Everything you saw is grounded in loaded Meridian context, scoped to this one
tenant, and honest about being synthetic. That is the difference between a demo
and a defensible buyer conversation."
