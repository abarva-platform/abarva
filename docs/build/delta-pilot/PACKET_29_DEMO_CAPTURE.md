# Packet 29 - SkyHarbor Demo Capture Script

Version: v1
Date: 2026-05-27
Status: Ready for rehearsal

## Mission

Capture a 30-minute CTO/CIO demo that proves AbarVa can turn a deep airline context layer into evidence-grounded Intelligence, Moves, and Source decisions. The demo must show both the product experience and the method behind the substrate: templates, source-upload examples, generated records, graph, chunks, overlay patterns, loader, and verification.

## Pre-Conditions

- Tenant: SkyHarbor Air.
- Authenticated persona: CTO, CIO, CFO, or Maestro/admin.
- Production deploy is current.
- SkyHarbor substrate verification passes.
- Airline pattern overlay verification passes.
- Demo should not use target-carrier names, logos, executive names, or non-public facts.

## Capture Artifacts

Create an audit directory:

```
audit-artifacts/skyharbor-demo-capture-<YYYY-MM-DD-HHMM>/
  screenshots/
  transcripts/
  data-method/
  source-event/
  move/
  cost-trace/
  final/
```

## 30-Minute Flow

### Minute 0-5 - Tenant and Method

1. Open SkyHarbor home / tenant briefing.
2. Show enterprise profile, 5-year modernization story, current IBM Z footprint, AWS estate, and value ledger.
3. Open the data-method artifacts:
   - `datasets/skyharbor-air-synthetic-v1/briefs/`
   - `datasets/skyharbor-air-synthetic-v1/templates/`
   - `datasets/skyharbor-air-synthetic-v1/source_uploads/`
   - `datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/`
4. Say: "The synthetic demo uses the same shape we would use for your real data: source files, templates, validated records, graph, chunks, embeddings, and verification."

### Minute 5-14 - Intelligence

Ask:

1. "After five years of modernization, what's the defensible progress narrative?"
2. "Which five workloads should we extract next, and which should we explicitly leave alone for 18 months?"
3. "Where is IBM still essential, and where are we over-dependent?"
4. "Where can AI-powered SDLC compress delivery in the next 90 days without operational risk?"

Expected behavior:

- Cites SkyHarbor modernization ledger, mainframe inventory, IBM engagement, integration topology, engineering productivity, value ledger, and airline pattern overlay.
- Does not invent real target-carrier names.
- Separates facts from pattern-based inference.

### Minute 14-21 - Moves

1. Click Shape Move from the strongest recommendation.
2. Create a Move around "AI-assisted mainframe dependency mining and test-generation factory for next-wave AWS extraction."
3. Verify thesis, scope, sponsor, value states, risks, dependencies, and kill criteria.
4. Ask Move chat: "Predict the three most likely reasons this Move fails in the next six months."

Expected behavior:

- Move is anchored to the originating Intelligence session.
- Failure modes mention batch-window fragility, IBM knowledge-transfer dependency, and GCC skill constraints when applicable.

### Minute 21-27 - Source

1. Open Source.
2. Start an IBM modernization restructure event.
3. Ask: "What leverage do we have for the FY2027 IBM restructure window?"
4. Ask: "If IBM refuses productivity guarantees and transition rights, how should we counter?"

Expected behavior:

- Uses IBM engagement profile, vendor portfolio, sourcing pipeline, value ledger, and sourcing/vendor overlay patterns.
- Produces a concrete RFI/RFP/BAFO stance.

### Minute 27-30 - Proof of Method

Open:

- `docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md`
- `docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md`
- `docs/build/delta-pilot/AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md`
- `datasets/skyharbor-air-synthetic-v1/verification/SUBSTRATE_QUALITY_REPORT.html`
- `datasets/skyharbor-air-synthetic-v1/verification/airline_pattern_overlay_report.md`

Close with: "This is not a hand-built deck. It is a repeatable ingestion and reasoning pipeline. Your team can replace the synthetic briefs and source-upload samples with real CMDB, contract, modernization, DORA, and value-ledger exports."

## Scoring Checklist

- Intelligence answers are evidence-grounded, not generic.
- Move creation preserves continuity from Intelligence.
- Source event uses concrete IBM/vendor/value facts.
- Agent refuses or caveats where data is unavailable.
- No target-carrier confidential terms or real target-carrier executives appear.
- Demo can show source artifacts and explain how the context layer was built.

## Output

Generate:

- `final/SKYHARBOR_DEMO_CAPTURE_REPORT.html`
- `transcripts/full-transcript.json`
- `data-method/context-layer-method-notes.md`
- `move/move-created.json`
- `source-event/source-event-created.json`
