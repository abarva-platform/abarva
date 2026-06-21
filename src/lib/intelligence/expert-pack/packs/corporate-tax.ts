// Consilium expert — Corporate Tax (cross-cutting function).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert covering the corporate TAX function end-to-end: direct tax (the income-
// tax provision / ASC 740 & IAS 12, compliance and returns), indirect tax
// (sales/use, VAT/GST, determination at the transaction), transfer pricing
// (policy, documentation, and intercompany pricing), the tax data + tax-engine
// estate (Vertex, Avalara, ONESOURCE, Corptax, native SAP/Oracle tax), global
// compliance (OECD BEPS Pillar Two, e-invoicing / real-time reporting mandates),
// tax planning, and controversy / audit defense.
//
// CORE DOCTRINE — THE TAX DATA, NOT THE TAX TOOL, IS THE BINDING CONSTRAINT.
// Tax data sourcing from the ERP/GL is the perennial bottleneck: despite "tax
// engines," the provision is still built and reconciled in spreadsheets because
// the underlying transaction- and entity-level data is not tax-sensitized at
// source. Two forces now break what the spreadsheet survived: (1) BEPS Pillar
// Two and the spread of e-invoicing / real-time reporting mandates force
// near-real-time, data-quality-dependent compliance no manual process can keep
// up with; (2) transfer-pricing documentation is audit exposure that is
// chronically under-resourced. "Tax automation" ROI is real — but it is GATED
// by upstream master- and transaction-data quality, not by the tax tool. A tax
// engine fed bad data automates the wrong answer faster.
//
// DISTINCT FROM Finance — FP&A & Controllership (the close, consolidation, and
// management reporting / value attestation — that expert owns the GL and the
// plan; this expert consumes the GL and owns the tax-sensitized layer on top)
// and from Treasury (cash, liquidity, funding, FX — that expert owns the cash;
// this expert owns the tax POSITION, including the cash-tax it drives). This
// expert owns the tax judgment, the tax data sourcing problem, and the
// compliance/controversy posture. Product-aware (tax engines + ERP tax), not
// product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const corporateTaxExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.corporate-tax",
    expertName: "Corporate Tax Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "corporate-tax",
    scopeNote:
      "Cross-cutting corporate TAX function: direct tax (income-tax provision / " +
      "ASC 740 & IAS 12, compliance and returns), indirect tax (sales/use, " +
      "VAT/GST, transaction determination), transfer pricing (policy, " +
      "documentation, intercompany pricing), the tax data + tax-engine estate " +
      "(Vertex, Avalara, ONESOURCE, Corptax, native SAP/Oracle tax), global " +
      "compliance (OECD BEPS Pillar Two, e-invoicing / real-time reporting " +
      "mandates), tax planning, and controversy / audit defense. The binding " +
      "constraint is honest: tax DATA sourcing from the ERP/GL — not the tax " +
      "tool — is the bottleneck; the provision still lives in spreadsheets, " +
      "Pillar Two and e-invoicing force real-time data-quality-dependent " +
      "compliance, and transfer-pricing documentation is chronically " +
      "under-resourced audit exposure. EXCLUDES the financial close / " +
      "consolidation / management reporting and value attestation (Finance — " +
      "FP&A & Controllership expert) and cash / liquidity / funding / FX " +
      "(Treasury expert). This expert owns the tax position and the tax data " +
      "problem, not the close or the cash.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "effective_tax_rate",
        name: "Effective tax rate (ETR)",
        definition:
          "Total income-tax expense (current + deferred) as a percentage of " +
          "pre-tax book income, reported under ASC 740 / IAS 12 — the headline " +
          "rate the board, auditors, and investors watch.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 18,
          high: 27,
          basis:
            "Large multinationals post a GAAP ETR clustering around the low-20s " +
            "after the US 21% federal rate plus state and foreign mix; the " +
            "in-range goal is a stable, defensible rate near the statutory blend, " +
            "not the lowest possible number",
          label: "planning-range",
        },
        dataSource:
          "ASC 740 / IAS 12 tax provision reconciled to pre-tax book income from " +
          "the GL, by jurisdiction",
        whyItMatters:
          "ETR is the single most-scrutinized tax number. It must be defensible " +
          "and stable: a rate that swings or sits implausibly low invites " +
          "restatement risk, audit attention, and — post-Pillar Two — a top-up " +
          "tax. 'In-range' matters more than 'low' because surprises, not levels, " +
          "destroy board trust.",
      },
      {
        key: "cash_tax_rate",
        name: "Cash tax rate",
        definition:
          "Cash income taxes actually paid as a percentage of pre-tax book " +
          "income, distinct from the accounting (book) ETR which includes " +
          "deferred tax.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 12,
          high: 24,
          basis:
            "Cash tax typically runs below book ETR where timing differences, " +
            "credits (R&D, foreign tax credits), and NOLs defer cash; the gap and " +
            "its sustainability are the planning question, not a single target",
          label: "planning-range",
        },
        dataSource:
          "Tax payments from treasury/AP cross-referenced to the provision and " +
          "return filings by jurisdiction",
        whyItMatters:
          "Cash tax is what actually leaves the enterprise and what Treasury must " +
          "fund. The book-vs-cash gap is where planning lives, but it must be " +
          "sustainable and defensible — a gap driven by aggressive positions is a " +
          "controversy and Pillar-Two top-up risk, not durable value.",
      },
      {
        key: "provision_close_cycle",
        name: "Tax-provision close cycle time",
        definition:
          "Working days from the financial close (pre-tax book numbers final) to " +
          "a final, reviewed ASC 740 / IAS 12 tax provision ready for the " +
          "controller and auditors.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Tax-department benchmarks; provision-software-enabled, well-sourced " +
            "departments close the provision in 3-5 days, spreadsheet-bound " +
            "departments 10-12+ and are on the critical path of the close",
          label: "planning-range",
        },
        dataSource:
          "Provision-software / spreadsheet workpaper timestamps from book-close " +
          "handoff to provision sign-off",
        whyItMatters:
          "The provision sits on the critical path of the financial close — a slow " +
          "tax close delays SEC filing and management reporting. Its length is the " +
          "clearest symptom of the data-sourcing bottleneck: the days are spent " +
          "rebuilding tax-sensitized data the ERP did not deliver.",
      },
      {
        key: "auto_sourced_positions_pct",
        name: "% return positions auto-sourced from systems",
        definition:
          "Share of return and provision data points (book-tax differences, " +
          "apportionment data, fixed-asset/depreciation detail, entity P&Ls) " +
          "sourced directly and systematically from the ERP/GL and source " +
          "systems versus manually re-keyed or spreadsheet-built.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 75,
          basis:
            "Tax-data-management maturity ranges; advanced tax functions with a " +
            "governed tax data layer auto-source 70-75%+, while spreadsheet-bound " +
            "departments re-key the majority below 30%",
          label: "planning-range",
        },
        dataSource:
          "Tax data management / provision tooling lineage versus manual workpaper " +
          "and re-keying logs",
        whyItMatters:
          "THE diagnostic of the core doctrine. Despite tax engines, most " +
          "departments rebuild tax data by hand because the ERP/GL is not " +
          "tax-sensitized at source. This metric measures whether the data " +
          "bottleneck is actually solved — every automation ROI is gated by it.",
      },
      {
        key: "indirect_tax_determination_accuracy",
        name: "Indirect-tax determination accuracy",
        definition:
          "Share of sales/use and VAT/GST determinations at the transaction " +
          "(taxability, rate, jurisdiction) that are correct as later confirmed " +
          "by audit, reconciliation, or self-review.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.5,
          basis:
            "Tax-engine-enabled determination with clean product/customer tax " +
            "data reaches 99%+; poor master data (missing tax codes, bad " +
            "ship-to/jurisdiction) drags real-world accuracy below 96%",
          label: "planning-range",
        },
        dataSource:
          "Tax engine (Vertex/Avalara/ONESOURCE) determination logs reconciled to " +
          "audit findings and use-tax accrual self-reviews",
        whyItMatters:
          "Every wrong determination is either an over-collection (customer/ " +
          "competitive risk) or an under-collection (assessment + penalty risk). " +
          "Accuracy is bounded by master-data quality, not the engine — a tax " +
          "engine fed a missing product tax code returns a confident wrong rate.",
      },
      {
        key: "sales_use_assessment_rate",
        name: "Sales/use-tax audit assessment rate",
        definition:
          "Average net assessment (additional tax + penalty + interest) per " +
          "sales/use-tax audit as a percentage of the audited tax base, across " +
          "closed jurisdiction audits.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.1,
          high: 2,
          basis:
            "Indirect-tax audit experience; well-controlled determination and " +
            "documentation hold assessments near 0.1-0.5% of base, weak controls " +
            "and exemption-certificate gaps drive 1.5-2%+ assessments",
          label: "planning-range",
        },
        dataSource:
          "Closed sales/use-tax audit results by jurisdiction versus the audited " +
          "taxable base",
        whyItMatters:
          "The realized cost of indirect-tax determination and documentation " +
          "failures. High assessments expose missing exemption certificates, " +
          "nexus mistracking (post-Wayfair), and determination errors — all " +
          "symptoms of the master-data and process gaps the engine cannot fix " +
          "alone.",
      },
      {
        key: "tp_documentation_coverage",
        name: "Transfer-pricing documentation coverage",
        definition:
          "Share of material intercompany transactions / entity relationships " +
          "covered by current, defensible transfer-pricing documentation (local " +
          "file, master file, benchmarking) for the relevant tax year.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "TP maturity ranges; well-resourced groups document 90-95% of " +
            "material flows contemporaneously, chronically under-resourced TP " +
            "functions leave material flows undocumented below 60%",
          label: "planning-range",
        },
        dataSource:
          "TP documentation register cross-referenced to the intercompany " +
          "transaction map and entity P&Ls",
        whyItMatters:
          "Transfer-pricing documentation is audit exposure that is chronically " +
          "under-resourced. Undocumented or stale intercompany flows are the " +
          "single largest controversy and double-taxation risk for a " +
          "multinational — and the gap is almost always capacity, not knowledge.",
      },
      {
        key: "einvoicing_rtr_compliance_rate",
        name: "E-invoicing / real-time-reporting compliance rate",
        definition:
          "Share of transactions in jurisdictions with e-invoicing or real-time " +
          "/ continuous transaction control (CTC) mandates that are submitted " +
          "successfully, on time, and accepted by the tax authority platform.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 97,
          high: 99.9,
          basis:
            "CTC/e-invoicing mandates require near-100% acceptance to avoid " +
            "blocked invoices and penalties; mature integrations sit at 99.5%+, " +
            "while data-quality and integration gaps drop real-world acceptance " +
            "below 98%",
          label: "planning-range",
        },
        dataSource:
          "E-invoicing / CTC platform submission and acceptance logs by " +
          "jurisdiction (clearance status, rejection reasons)",
        whyItMatters:
          "Real-time mandates (Italy SdI, India IRP, LATAM CTC, EU ViDA roadmap) " +
          "make tax compliance a transaction-blocking, data-quality-dependent " +
          "process: a rejected e-invoice can stop a sale. No spreadsheet survives " +
          "this — it forces the data quality the provision could previously fudge.",
      },
      {
        key: "tax_data_reconciliation_exceptions",
        name: "Tax-data reconciliation exceptions",
        definition:
          "Count (or rate) of unresolved reconciliation exceptions between the " +
          "tax data (provision, returns, indirect-tax filings) and the GL / source " +
          "systems per close or filing cycle.",
        unit: "exceptions / cycle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 100,
          basis:
            "Tax data management experience; a governed tax data layer surfaces a " +
            "handful of true exceptions per cycle, while a poorly sourced estate " +
            "generates dozens-to-hundreds of reconciling items consuming the team",
          label: "planning-range",
        },
        dataSource:
          "Tax-to-GL reconciliation logs from provision and indirect-tax tooling " +
          "by cycle",
        whyItMatters:
          "Reconciliation exceptions are the direct, countable manifestation of " +
          "the data-sourcing bottleneck. Every exception is manual effort and " +
          "control risk; the volume is the truest leading indicator of whether " +
          "the tax data layer is healthy or whether the team is firefighting.",
      },
      {
        key: "controversy_backlog",
        name: "Notices & controversy backlog",
        definition:
          "Number of open tax notices, audits, and controversy matters across " +
          "jurisdictions, weighted or aged, awaiting response or resolution.",
        unit: "open matters",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 80,
          basis:
            "Multinational controversy load scales with jurisdiction count; " +
            "well-run shops keep a small actively-managed queue with low aging, " +
            "while under-resourced functions accumulate aged notices and miss " +
            "response deadlines",
          label: "planning-range",
        },
        dataSource:
          "Tax controversy / matter-management tracker by jurisdiction, status, " +
          "and age",
        whyItMatters:
          "An aging controversy backlog converts manageable matters into " +
          "penalties, lost appeal rights, and surprise cash assessments. Backlog " +
          "size and aging measure whether the function is in control of its " +
          "audit exposure or merely reacting to it.",
      },
      {
        key: "manual_hours_per_filing_cycle",
        name: "Manual hours per filing cycle",
        definition:
          "Total manual analyst/preparer hours consumed per major filing or " +
          "provision cycle on data gathering, re-keying, spreadsheet workpapers, " +
          "and reconciliation (versus review and judgment).",
        unit: "hours / cycle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 40,
          high: 600,
          basis:
            "Workforce Economics substrate (tax tower rate-card x cycle effort); " +
            "automated, well-sourced cycles are light, spreadsheet-bound provision " +
            "and compliance cycles consume hundreds of manual hours",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (tax tower) x cycle activity logging, " +
          "split data-assembly vs review",
        whyItMatters:
          "The effort metric that exposes how much scarce tax talent is spent " +
          "ASSEMBLING data rather than exercising tax judgment. It is the labor " +
          "face of the data bottleneck and the capacity automation can redeploy — " +
          "but only after the upstream data is fixed.",
      },
      {
        key: "rd_credit_capture_rate",
        name: "R&D / credit capture rate",
        definition:
          "Share of statutorily eligible R&D and other tax credits (foreign tax " +
          "credit, incentives) actually identified, substantiated, and claimed " +
          "versus the estimated eligible population.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Credit-capture maturity ranges; functions with systematic data " +
            "capture and substantiation claim 85-95% of eligible credits, while " +
            "manual identification leaves material eligible spend unclaimed below " +
            "60%",
          label: "planning-range",
        },
        dataSource:
          "Credit study workpapers reconciled to eligible cost data from the GL, " +
          "payroll, and project systems",
        whyItMatters:
          "Unclaimed credits are cash left on the table — pure foregone value. " +
          "Capture is bounded by the ability to source and substantiate eligible " +
          "cost data (project, payroll, vendor), making it another expression of " +
          "the data-sourcing constraint, here on the value-creation side.",
      },
    ],

    painThemes: [
      {
        key: "provision_in_spreadsheets",
        name: "The provision lives in spreadsheets despite the tax engine",
        description:
          "The enterprise owns a tax engine and provision software, yet the ASC " +
          "740 / IAS 12 provision is actually built, adjusted, and reconciled in " +
          "sprawling spreadsheets because the ERP/GL does not deliver " +
          "tax-sensitized data — so the software is a system of record after the " +
          "fact, not the place the work happens.",
        detectionSignal:
          "Low % auto-sourced positions, long provision close cycle, many tax-data " +
          "reconciliation exceptions, 'the real provision is in the workbook' " +
          "culture, key-person spreadsheet dependency.",
        diagnosticQuestion:
          "When you build the provision, what share of the numbers comes straight " +
          "from a governed system versus being rebuilt and reconciled in " +
          "spreadsheets — and where does the time actually go?",
      },
      {
        key: "tax_data_not_sourced_at_origin",
        name: "Tax data not sensitized at the source system",
        description:
          "Master and transaction data (product/customer tax codes, ship-to " +
          "jurisdiction, entity attributes, book-tax difference detail) is not " +
          "captured tax-correctly in the ERP/source systems, so tax spends every " +
          "cycle reconstructing and correcting data downstream — the perennial " +
          "bottleneck behind every other tax pain.",
        detectionSignal:
          "High reconciliation-exception count, frequent missing tax codes, " +
          "manual jurisdiction overrides, determination errors traced to bad " +
          "master data, repeated 'cleanse the data again' projects.",
        diagnosticQuestion:
          "Is tax data captured correctly at the point of transaction in the ERP, " +
          "or does tax rebuild and correct it downstream every cycle?",
      },
      {
        key: "tp_documentation_under_resourced",
        name: "Transfer-pricing documentation chronically under-resourced",
        description:
          "Material intercompany flows go undocumented or with stale " +
          "benchmarking because TP is a small team facing a large, multi-" +
          "jurisdiction documentation burden — leaving the group exposed to " +
          "adjustment, penalty, and double taxation when an authority asks.",
        detectionSignal:
          "Low TP documentation coverage, documentation produced reactively only " +
          "when audited, stale comparables/benchmarking, intercompany flows with " +
          "no current local file, scramble at audit notice.",
        diagnosticQuestion:
          "What share of your material intercompany transactions have current, " +
          "defensible TP documentation ready today — not assembled in a scramble " +
          "after an audit notice?",
      },
      {
        key: "realtime_mandate_unready",
        name: "Unready for real-time / e-invoicing mandates",
        description:
          "New e-invoicing and continuous-transaction-control mandates require " +
          "clean, complete data submitted and cleared in real time, but the " +
          "enterprise's transaction data and integrations are not ready, so " +
          "invoices get rejected, sales stall, and compliance becomes a " +
          "transaction-blocking emergency.",
        detectionSignal:
          "E-invoicing compliance rate below range, rejected/blocked invoices, " +
          "manual re-submission, jurisdiction-by-jurisdiction firefighting as each " +
          "mandate goes live, no central CTC strategy.",
        diagnosticQuestion:
          "For each jurisdiction with an e-invoicing or real-time-reporting " +
          "mandate, are you clearing transactions cleanly at near-100%, or " +
          "firefighting rejections as each mandate goes live?",
      },
      {
        key: "pillar_two_data_gap",
        name: "BEPS Pillar Two data and modeling gap",
        description:
          "Pillar Two's 15% global minimum tax demands granular, jurisdiction-by-" +
          "jurisdiction GloBE data (covered taxes, qualifying income, substance " +
          "carve-outs) the existing tax data estate cannot produce reliably, so " +
          "top-up exposure and safe-harbor eligibility cannot be modeled with " +
          "confidence.",
        detectionSignal:
          "No reliable jurisdictional GloBE data, Pillar Two top-up modeled in " +
          "ad-hoc spreadsheets, uncertainty on safe-harbor qualification, data " +
          "gaps for constituent entities, surprise exposure at provision time.",
        diagnosticQuestion:
          "Can you produce defensible jurisdiction-by-jurisdiction GloBE data and " +
          "model your Pillar Two top-up and safe-harbor position, or is it an " +
          "ad-hoc spreadsheet estimate?",
      },
      {
        key: "indirect_tax_master_data_gaps",
        name: "Indirect-tax determination undermined by master-data gaps",
        description:
          "The tax engine determines sales/use and VAT/GST correctly only when " +
          "fed clean product taxability, customer exemption, and jurisdiction " +
          "data — but missing tax codes, expired exemption certificates, and bad " +
          "ship-to data drive confident wrong determinations and audit " +
          "assessments.",
        detectionSignal:
          "Determination accuracy below range, rising use-tax accruals, audit " +
          "assessments tied to exemption-certificate gaps, frequent manual rate " +
          "overrides, product-onboarding without tax-code assignment.",
        diagnosticQuestion:
          "When the tax engine returns a determination, how confident are you the " +
          "product taxability, exemption certificates, and jurisdiction data " +
          "behind it are clean and current?",
      },
      {
        key: "controversy_reactive_firefighting",
        name: "Reactive, firefighting controversy management",
        description:
          "Notices and audits are handled one-off and late because there is no " +
          "central matter management, no contemporaneous documentation, and no " +
          "capacity buffer — so manageable matters age into penalties and lost " +
          "appeal rights, and audit defense reinvents the support each time.",
        detectionSignal:
          "Growing/aging controversy backlog, missed response deadlines, support " +
          "reassembled from scratch per audit, no link between positions taken and " +
          "documentation retained, recurring same-issue assessments.",
        diagnosticQuestion:
          "Is your audit and notice response proactive and documented as positions " +
          "are taken, or reassembled reactively under deadline each time an " +
          "authority asks?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_tax_data_sourcing",
        name: "AI-assisted tax data sourcing & sensitization",
        valueMechanism:
          "AI maps, classifies, and tax-sensitizes ERP/GL and transaction data at " +
          "the source — assigning tax codes, jurisdictions, and book-tax " +
          "difference categories, and flagging missing or anomalous attributes — " +
          "so the provision and returns draw from governed data instead of being " +
          "rebuilt by hand, attacking the binding constraint directly.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "ERP/GL transaction and master data with current attributes",
          "Tax code / taxability and jurisdiction reference data",
          "Historical mappings and exception dispositions to learn from",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Classification proposes; tax reviews and owns the mapping — no silent auto-tax-treatment",
          "Source-data quality bounds the output; AI surfaces gaps, it does not invent missing attributes",
        ],
        metricsMoved: [
          "auto_sourced_positions_pct",
          "tax_data_reconciliation_exceptions",
          "manual_hours_per_filing_cycle",
        ],
      },
      {
        key: "ai_provision_acceleration",
        name: "AI-accelerated tax provision (ASC 740 / IAS 12)",
        valueMechanism:
          "AI assembles the provision from governed data — calculating book-tax " +
          "differences, rolling forward deferreds, drafting the rate " +
          "reconciliation and tax footnote, and flagging anomalies versus prior " +
          "periods — so the team reviews and exercises judgment rather than " +
          "rebuilding workpapers, compressing the provision close cycle.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Tax-sensitized data from the GL and the prior-period provision",
          "Statutory rates, valuation-allowance positions, and uncertain-tax-position registry",
          "Prior footnote and rate-reconciliation templates",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "The provision is an externally reported, SOX-controlled number — tax must review and sign every component",
          "Drafted footnote/rate-rec language must be verified; no unverified disclosure to the financials",
        ],
        metricsMoved: [
          "provision_close_cycle",
          "manual_hours_per_filing_cycle",
          "effective_tax_rate",
        ],
      },
      {
        key: "ai_indirect_tax_determination",
        name: "AI-enhanced indirect-tax determination & exception triage",
        valueMechanism:
          "AI improves and monitors sales/use and VAT/GST determination by " +
          "auto-classifying product taxability, validating exemption " +
          "certificates, and triaging determination exceptions and use-tax " +
          "accruals — raising determination accuracy and cutting the audit " +
          "assessments that flow from master-data gaps.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Tax engine determination logs and product/customer master data",
          "Exemption-certificate repository and jurisdiction/nexus footprint",
          "Historical audit assessments and use-tax accrual reviews",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Taxability classifications must be reviewed before they govern live determinations",
          "Over- and under-collection both carry liability; thresholds route uncertain items to review",
        ],
        metricsMoved: [
          "indirect_tax_determination_accuracy",
          "sales_use_assessment_rate",
          "tax_data_reconciliation_exceptions",
        ],
      },
      {
        key: "ai_transfer_pricing_documentation",
        name: "AI-supported transfer-pricing documentation & benchmarking",
        valueMechanism:
          "AI drafts local files, master files, and intercompany analyses from " +
          "the entity/transaction map and refreshes benchmarking — turning the " +
          "chronically under-resourced documentation burden into a reviewable " +
          "production line, so material flows carry current, defensible " +
          "documentation contemporaneously rather than in an audit scramble.",
        adoptionProfile: "early",
        dataDependencies: [
          "Intercompany transaction map and entity P&Ls / functional analysis",
          "TP policy, prior documentation, and comparables/benchmarking data",
          "Jurisdictional documentation requirements (local + master file)",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Documentation is the audit-defense artifact — a tax professional must own and sign the analysis",
          "Benchmarking and functional analysis must be defensible, not plausible-sounding boilerplate",
        ],
        metricsMoved: [
          "tp_documentation_coverage",
          "controversy_backlog",
          "manual_hours_per_filing_cycle",
        ],
      },
      {
        key: "ai_pillar_two_globe",
        name: "AI for Pillar Two GloBE data assembly & modeling",
        valueMechanism:
          "AI assembles jurisdiction-by-jurisdiction GloBE data (covered taxes, " +
          "qualifying income, substance carve-outs) from the consolidation and " +
          "entity data, models the top-up tax and safe-harbor eligibility, and " +
          "flags data gaps — making Pillar Two a governed, modelable position " +
          "rather than an ad-hoc spreadsheet estimate.",
        adoptionProfile: "early",
        dataDependencies: [
          "Constituent-entity financial data and consolidation detail by jurisdiction",
          "Covered taxes and qualifying-income mapping to GloBE rules",
          "Substance / payroll / tangible-asset data for carve-outs and safe harbors",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "GloBE positions feed real top-up liability and disclosure — tax must validate every jurisdiction",
          "Safe-harbor qualification is rules-dependent; the model must trace to source data, not assert eligibility",
        ],
        metricsMoved: [
          "effective_tax_rate",
          "cash_tax_rate",
          "tax_data_reconciliation_exceptions",
        ],
      },
      {
        key: "ai_tax_research_controversy_copilot",
        name: "Tax research & controversy copilot",
        valueMechanism:
          "A grounded copilot answers tax-technical and position questions from " +
          "authoritative sources, drafts audit/notice responses from the " +
          "documented position history, and tracks the controversy queue — " +
          "deflecting research time, accelerating defensible responses, and " +
          "keeping the notice backlog from aging into penalties.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Authoritative tax law / guidance corpus and the firm's position history",
          "Controversy / matter-management tracker with deadlines and status",
          "Documentation and workpapers supporting positions taken",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Tax-technical conclusions must cite authority and be reviewed — no unverified legal positions filed",
          "Privileged / sensitive controversy material must be access-fenced to authorized advisors",
        ],
        metricsMoved: [
          "controversy_backlog",
          "manual_hours_per_filing_cycle",
          "rd_credit_capture_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "governed_tax_data_layer",
        name: "Governed tax data layer (tax-sensitized at source)",
        description:
          "A governed layer that captures and sensitizes tax-relevant data at the " +
          "ERP/source-system point of origin — tax codes, jurisdictions, " +
          "book-tax-difference attributes, entity attributes — and feeds the " +
          "provision, returns, and indirect-tax determination from one reconciled " +
          "source, attacking the binding data-sourcing constraint at its root.",
        boundary:
          "Owns the tax-sensitized data model and its reconciliation to the GL; " +
          "does not own the GL/close itself (Finance controllership) or the source " +
          "transaction systems, which it consumes and corrects upstream.",
        humanAccountabilityPoint: "VP Tax / Head of Tax Technology & Data",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "integrated_tax_engine_estate",
        name: "Integrated tax-engine estate (determination + provision + compliance)",
        description:
          "Tax engines (Vertex/Avalara/ONESOURCE) for indirect-tax determination, " +
          "provision software (ONESOURCE/Corptax) for direct tax, and compliance " +
          "tooling integrated to the ERP and the governed tax data layer — so " +
          "determination, provision, and filing run on the same trusted data " +
          "rather than disconnected point tools fed by spreadsheets.",
        boundary:
          "Owns tax calculation, determination, and filing workflow; does not own " +
          "the underlying transaction data quality (the data layer) or the GL — " +
          "the engine is only as right as the data it is fed.",
        humanAccountabilityPoint: "Head of Tax Technology",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "realtime_compliance_ctc_hub",
        name: "Real-time compliance & e-invoicing (CTC) hub",
        description:
          "A centralized hub that handles e-invoicing and continuous-transaction-" +
          "control mandates across jurisdictions — validating, formatting, and " +
          "clearing transactions in real time against authority platforms with " +
          "one integration pattern — so each new mandate is a configuration, not " +
          "a fire drill.",
        boundary:
          "Owns the clearance/submission workflow and mandate-format compliance; " +
          "does not own the upstream transaction data quality it depends on or the " +
          "commercial invoicing decision.",
        humanAccountabilityPoint: "Head of Indirect Tax / Global Compliance",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "tp_documentation_factory",
        name: "Transfer-pricing documentation factory",
        description:
          "A repeatable, AI-supported production model for TP documentation — " +
          "local files, master file, intercompany analyses, refreshed " +
          "benchmarking — driven from the entity/transaction map so material " +
          "flows are documented contemporaneously and defensibly rather than " +
          "scrambled together at audit.",
        boundary:
          "Owns documentation production and benchmarking refresh; does not own " +
          "the TP policy / intercompany pricing decisions themselves (set by tax " +
          "leadership) or the intercompany transactions (set by the business).",
        humanAccountabilityPoint: "Head of Transfer Pricing",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Tax value is realized on three fronts, all gated by the same binding " +
        "constraint — tax DATA quality, not the tax tool. First, EFFICIENCY: " +
        "AI-assisted data sourcing and an accelerated provision cut manual hours " +
        "per cycle, the provision close cycle, and reconciliation exceptions, " +
        "freeing scarce tax talent from data assembly for judgment. Second, RISK " +
        "REDUCTION: better indirect-tax determination, contemporaneous transfer-" +
        "pricing documentation, real-time mandate readiness, and a managed " +
        "controversy queue lower audit assessments, double-tax exposure, and " +
        "penalty risk — and make the ETR defensible and stable rather than a " +
        "surprise. Third, CASH/VALUE CAPTURE: disciplined credit capture (R&D, " +
        "foreign tax credits) and defensible planning convert foregone value into " +
        "claimed cash. BUT the honest constraint dominates every front: a tax " +
        "engine fed bad data automates the wrong answer faster, and Pillar Two " +
        "and e-invoicing mandates now FORCE the data quality the spreadsheet " +
        "provision could previously fudge. None of the prize is realizable until " +
        "the upstream master and transaction data is tax-sensitized at source; " +
        "absent that, 'tax automation' is automating reconciliation of bad data. " +
        "Effort and cost bind to the Workforce Economics substrate (tax tower); " +
        "cash-tax effects trace to the provision and the Treasury funding view.",
      dominantHaircutFactors: [
        {
          factor: "Upstream tax-data quality ceiling",
          rationale:
            "Automation, determination accuracy, and Pillar Two / e-invoicing " +
            "readiness are all bounded by how tax-sensitized the ERP/source data " +
            "is; where master and transaction data is poor, forecast value must be " +
            "discounted until the data layer is fixed — the tool cannot exceed its " +
            "inputs.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between projected tax-automation benefit and realized " +
              "benefit where upstream master/transaction data was not remediated " +
              "first",
            label: "planning-range",
          },
        },
        {
          factor: "Regulatory change velocity (Pillar Two, e-invoicing, nexus)",
          rationale:
            "Multi-jurisdiction mandates change continuously; benefit can be " +
            "eroded by re-work as rules, formats, and safe harbors shift, so value " +
            "must be discounted for the ongoing change burden a static design " +
            "cannot absorb.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Re-work and re-implementation experience as e-invoicing and GloBE " +
              "rules evolved jurisdiction by jurisdiction",
            label: "planning-range",
          },
        },
        {
          factor: "Tax-judgment irreducibility / control posture",
          rationale:
            "The provision, TP positions, and controversy responses are reported, " +
            "controlled, and audit-exposed; AI can assemble and draft but tax must " +
            "review and own, so a share of effort is irreducible and benefit must " +
            "not assume full automation of judgment.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis:
              "Residual review/judgment effort retained in SOX-controlled and " +
              "audit-exposed tax processes after automation",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & integration friction across the tax-engine estate",
          rationale:
            "Value requires integrating engines, provision software, and the data " +
            "layer and moving the team off spreadsheets; partial integration and " +
            "persistent shadow workbooks leave benefit unrealized.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Tax-transformation experience where incomplete integration and " +
              "spreadsheet habits diluted realized benefit",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Provision & compliance manual-effort reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reduction in manual provision/compliance preparation effort " +
              "from a governed tax data layer plus provision automation",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in manual_hours_per_filing_cycle re-deployed from " +
            "data assembly to review and judgment",
        },
        {
          lever: "Provision close-cycle compression",
          range: {
            low: 0.25,
            high: 0.6,
            basis:
              "Reported compression in provision close cycle time once data is " +
              "auto-sourced and the provision is software-driven",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in provision_close_cycle working days",
        },
        {
          lever: "Indirect-tax assessment / leakage reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in audit assessments and over/under-collection " +
              "leakage from improved determination accuracy and certificate management",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in sales_use_assessment_rate and associated leakage",
        },
        {
          lever: "Credit capture uplift",
          range: {
            low: 0.05,
            high: 0.3,
            basis:
              "Reported uplift in eligible R&D/credit capture from systematic data " +
              "capture and substantiation versus manual identification",
            label: "planning-range",
          },
          measuredAs:
            "Absolute lift in rd_credit_capture_rate (eligible credits actually claimed)",
        },
      ],
      timeToValueBand:
        "Efficiency levers (AI data sourcing, provision acceleration) realize in " +
        "2-4 quarters BUT only after the governed tax data layer is established — " +
        "which is itself a 2-4 quarter build and the true gate. Indirect-tax " +
        "determination and e-invoicing/CTC readiness: 1-3 quarters per " +
        "jurisdiction wave. Transfer-pricing documentation factory: 2-3 cycles to " +
        "reach contemporaneous coverage. Pillar Two GloBE data and modeling: " +
        "1-2 quarters to stand up, ongoing to maintain as rules evolve. Full " +
        "tax-function modernization: 18-36 months, gated on the tax data layer " +
        "landing first — never on buying another tax tool.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Indirect-tax determination engine",
          role:
            "System of record for transaction-level sales/use and VAT/GST " +
            "determination — taxability, rate, and jurisdiction at the point of " +
            "transaction, integrated to the ERP and billing.",
          examples: [
            "Vertex",
            "Avalara",
            "Thomson Reuters ONESOURCE Determination",
            "SAP / Oracle native tax determination",
          ],
        },
        {
          name: "Tax provision & compliance software",
          role:
            "System of record for the direct-tax provision (ASC 740 / IAS 12), " +
            "income-tax compliance, and returns — book-tax differences, deferreds, " +
            "rate reconciliation, and filing workflow.",
          examples: [
            "Thomson Reuters ONESOURCE (Tax Provision / Income Tax)",
            "CSC Corptax",
            "Bloomberg Tax provision",
            "Native ERP tax provision modules",
          ],
        },
        {
          name: "ERP / general ledger (tax source)",
          role:
            "The source of actuals and transaction/master data the entire tax " +
            "function depends on — the bottleneck system that must be " +
            "tax-sensitized for the rest to work.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion / E-Business Suite",
            "Microsoft Dynamics 365 Finance",
            "Workday Financials",
          ],
        },
        {
          name: "Transfer-pricing documentation & data",
          role:
            "System of record for intercompany transaction mapping, TP policy, " +
            "local/master files, and benchmarking — the audit-defense artifact " +
            "store.",
          examples: [
            "ONESOURCE / Corptax TP modules",
            "Benchmarking databases (TP Catalyst / RoyaltyStat-type comparables)",
            "Governed intercompany transaction register",
          ],
        },
        {
          name: "E-invoicing / continuous-transaction-control platform",
          role:
            "Handles real-time clearance and reporting against tax-authority " +
            "platforms for mandate jurisdictions — submission, clearance status, " +
            "and rejection handling.",
          examples: [
            "Sovos",
            "Pagero",
            "Vertex / Avalara e-invoicing modules",
            "Local authority platforms (Italy SdI, India IRP, LATAM CTC)",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Tax Officer / VP Tax",
          accountability:
            "The enterprise tax position, the effective and cash tax rates, the " +
            "integrity of the provision, global compliance, and the controversy " +
            "posture — accountable to the CFO, audit committee, and authorities.",
        },
        {
          title: "Director of Tax Reporting / Tax Accounting",
          accountability:
            "The ASC 740 / IAS 12 provision, deferred-tax accounting, the tax " +
            "footnote, uncertain tax positions, and SOX tax controls — that the " +
            "reported tax numbers are accurate and defensible.",
        },
        {
          title: "Head of Indirect Tax",
          accountability:
            "Sales/use and VAT/GST determination accuracy, nexus tracking " +
            "(post-Wayfair), exemption-certificate management, e-invoicing / CTC " +
            "compliance, and indirect-tax audit defense.",
        },
        {
          title: "Head of Transfer Pricing",
          accountability:
            "TP policy and intercompany pricing, contemporaneous documentation " +
            "coverage (local + master file), benchmarking, and TP audit defense " +
            "across jurisdictions.",
        },
        {
          title: "Head of Tax Technology & Data",
          accountability:
            "The governed tax data layer, tax-engine and provision-software " +
            "integration to the ERP, data sensitization at source, and the " +
            "automation roadmap — owning the binding data-sourcing constraint.",
        },
      ],
      regulatoryFrames: [
        {
          name: "ASC 740 / IAS 12 income-tax accounting",
          relevance:
            "Governs the tax provision, deferred taxes, valuation allowances, and " +
            "uncertain tax positions reported in the financials; AI in the " +
            "provision must produce numbers that conform and are auditable.",
        },
        {
          name: "OECD BEPS Pillar Two (global minimum tax / GloBE rules)",
          relevance:
            "A 15% jurisdictional minimum tax requiring granular GloBE data, " +
            "top-up calculation, and safe-harbor analysis the legacy data estate " +
            "cannot reliably produce — the forcing function for real tax data " +
            "quality.",
        },
        {
          name: "US sales/use nexus (Wayfair) and VAT/GST regimes",
          relevance:
            "Post-Wayfair economic nexus and global VAT/GST rules drive where and " +
            "how indirect tax must be determined, collected, and remitted — " +
            "expanding the determination and registration footprint.",
        },
        {
          name: "E-invoicing / continuous-transaction-control mandates",
          relevance:
            "Real-time clearance and reporting regimes (Italy SdI, India IRP, " +
            "LATAM CTC, EU ViDA roadmap) make compliance transaction-blocking and " +
            "data-quality-dependent — no manual process keeps up.",
        },
        {
          name: "SOX / ICFR controls over the tax provision",
          relevance:
            "The provision and related tax balances are ICFR-controlled; any AI " +
            "or automation in the provision requires audit trails, approval " +
            "evidence, and human accountability for the reported numbers.",
        },
      ],
      canonicalTerms: [
        {
          term: "ASC 740 / IAS 12 (income tax provision)",
          definition:
            "The accounting standards governing how income taxes — current and " +
            "deferred — are recognized and disclosed in the financial statements.",
        },
        {
          term: "Effective tax rate (ETR)",
          definition:
            "Total income-tax expense as a percentage of pre-tax book income; the " +
            "headline accounting tax rate, distinct from the cash tax rate.",
        },
        {
          term: "BEPS Pillar Two / GloBE",
          definition:
            "The OECD framework imposing a 15% global minimum effective tax by " +
            "jurisdiction, computed on GloBE (Global Anti-Base-Erosion) income and " +
            "covered taxes, with top-up tax where the floor is not met.",
        },
        {
          term: "Transfer pricing",
          definition:
            "The arm's-length pricing of transactions between related entities of " +
            "a multinational group, and the documentation required to defend those " +
            "prices to tax authorities.",
        },
        {
          term: "Continuous transaction control (CTC) / e-invoicing",
          definition:
            "Tax-authority regimes that require invoices/transactions to be " +
            "cleared or reported in real time, making compliance a transaction-" +
            "level, data-quality-dependent process.",
        },
        {
          term: "Tax determination",
          definition:
            "The point-of-transaction decision of taxability, rate, and " +
            "jurisdiction for indirect tax — only as accurate as the product, " +
            "customer, and jurisdiction master data feeding the engine.",
        },
        {
          term: "Book-tax difference",
          definition:
            "A difference between income recognized for financial-statement " +
            "(book) purposes and for tax purposes; the building block of the " +
            "provision, permanent or temporary.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Tax data sourcing and provision close",
        authoritativeSource:
          "Provision/compliance tooling lineage and workpaper timestamps versus " +
          "manual re-keying and reconciliation logs",
        whatGoodEvidenceLooksLike:
          "Share of return/provision data points auto-sourced from governed " +
          "systems, reconciliation-exception counts per cycle, and provision " +
          "close days from book-close handoff to sign-off.",
        weakEvidenceToReject:
          "A vendor 'we automate your tax data' claim or an assertion that the " +
          "tax engine 'handles' sourcing with no auto-sourced-% or " +
          "exception-count basis.",
      },
      {
        claim: "Indirect-tax determination accuracy and audit assessments",
        authoritativeSource:
          "Tax engine determination logs reconciled to audit findings, use-tax " +
          "accrual reviews, and exemption-certificate completeness",
        whatGoodEvidenceLooksLike:
          "Determination accuracy by jurisdiction/product confirmed against " +
          "audits, net assessment per audit as a share of base, and certificate " +
          "coverage.",
        weakEvidenceToReject:
          "A statement that the tax engine 'gets it right' with no audit-" +
          "confirmed accuracy or assessment-rate measure, or accuracy quoted " +
          "without master-data quality context.",
      },
      {
        claim: "Transfer-pricing documentation coverage and exposure",
        authoritativeSource:
          "TP documentation register cross-referenced to the intercompany " +
          "transaction map and entity P&Ls",
        whatGoodEvidenceLooksLike:
          "Per material flow: a current local/master file with defensible " +
          "benchmarking and functional analysis, and the share of material flows " +
          "documented contemporaneously.",
        weakEvidenceToReject:
          "A claim that TP is 'documented' with no coverage percentage, stale " +
          "comparables, or documentation only assembled reactively at audit.",
      },
      {
        claim: "Pillar Two and e-invoicing compliance readiness",
        authoritativeSource:
          "GloBE jurisdictional data assembly and e-invoicing/CTC platform " +
          "submission-and-acceptance logs by jurisdiction",
        whatGoodEvidenceLooksLike:
          "Defensible jurisdiction-by-jurisdiction GloBE data with a modeled " +
          "top-up and safe-harbor position, and near-100% e-invoice clearance " +
          "with rejection-reason analysis.",
        weakEvidenceToReject:
          "A Pillar Two 'estimate' in an ad-hoc spreadsheet with no jurisdictional " +
          "data trace, or an e-invoicing 'we're compliant' claim with no clearance/" +
          "acceptance metrics.",
      },
      {
        claim: "Tax-function cost, effort, and credit capture",
        authoritativeSource:
          "Workforce Economics substrate (tax tower, rate-card x FTE) x cycle " +
          "effort logging, and credit-study workpapers reconciled to eligible cost",
        whatGoodEvidenceLooksLike:
          "Manual hours per filing cycle split assembly vs review, fully-loaded " +
          "tax cost, and eligible-versus-claimed credit reconciled to GL/payroll/" +
          "project data.",
        weakEvidenceToReject:
          "A blanket 'tax is lean/expensive' or 'we capture our credits' assertion " +
          "with no tower-level cost basis, cycle-effort measure, or eligible-" +
          "population reconciliation.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When you build the tax provision, what share of the numbers comes straight from a governed system versus being rebuilt and reconciled in spreadsheets — and where does the time go?",
      "Is tax data captured correctly at the point of transaction in the ERP, or does tax rebuild and correct it downstream every cycle?",
      "What share of your material intercompany transactions have current, defensible transfer-pricing documentation ready today, not assembled in a scramble after an audit notice?",
      "Can you produce defensible jurisdiction-by-jurisdiction GloBE data and model your Pillar Two top-up and safe-harbor position, or is it an ad-hoc spreadsheet estimate?",
      "For each jurisdiction with an e-invoicing or real-time-reporting mandate, are you clearing transactions cleanly at near-100%, or firefighting rejections as each mandate goes live?",
      "When the tax engine returns a sales/use or VAT determination, how confident are you the product taxability, exemption certificates, and jurisdiction data behind it are clean and current?",
      "Is your audit and notice response proactive and documented as positions are taken, or reassembled reactively under deadline each time an authority asks?",
    ],
    maturitySignals: [
      "A governed tax data layer sensitizes data at the ERP source, so the provision and returns draw from one reconciled source with few exceptions — not from rebuilt spreadsheets.",
      "The provision closes inside a few days on software, and most return positions are auto-sourced rather than re-keyed.",
      "Material intercompany flows carry current, defensible TP documentation contemporaneously, and Pillar Two top-up and safe-harbor positions are modeled from governed jurisdictional data.",
      "Indirect-tax determination runs at near-100% accuracy on clean master data, e-invoicing/CTC clears at near-100%, and the controversy queue is small and actively managed.",
    ],
    redFlags: [
      "The provision and returns are really built in spreadsheets despite owning a tax engine, with a long close cycle and many reconciliation exceptions — the data is not sensitized at source.",
      "Transfer-pricing documentation is produced reactively only at audit, with stale benchmarking and material flows undocumented.",
      "Pillar Two top-up is an ad-hoc spreadsheet estimate and e-invoicing mandates are handled as jurisdiction-by-jurisdiction fire drills with rejected invoices.",
      "Indirect-tax determination errors and exemption-certificate gaps drive recurring audit assessments, and the controversy backlog is aging into penalties.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Indirect-tax engines (Vertex, Avalara, ONESOURCE Determination)",
        category: "Sales/use and VAT/GST transaction determination",
        switchingCost:
          "Moderate-to-high — ERP integration, tax-code mappings, and " +
          "exemption-certificate data accrete; re-integrating determination across " +
          "billing systems is the real cost, not the engine licence.",
        renewalDynamics:
          "Transaction-volume or subscription pricing; e-invoicing/CTC and AI " +
          "determination features upsold as premium tiers and as new mandates go live.",
      },
      {
        vendorName: "Direct-tax provision & compliance (ONESOURCE, Corptax, Bloomberg Tax)",
        category: "ASC 740 / IAS 12 provision, income-tax compliance, returns",
        switchingCost:
          "High — provision logic, entity structures, and historical workpapers " +
          "are deeply built in; re-implementing the provision mid-cycle is rarely " +
          "done, so incumbents have strong renewal leverage.",
        renewalDynamics:
          "Per-entity / module subscription; Pillar Two and AI-provision modules " +
          "increasingly upsold; pricing pressure tied to entity-count growth.",
      },
      {
        vendorName: "ERP / GL incumbents with native tax (SAP, Oracle, Microsoft, Workday)",
        category: "Tax source data + native tax determination/provision add-ons",
        switchingCost:
          "Extreme — the GL is fused to enterprise data; native tax modules are " +
          "bundled to discipline best-of-breed but the source-data dependency is " +
          "non-switchable in isolation.",
        renewalDynamics:
          "Bundled enterprise agreements; native tax determination/provision " +
          "pushed against best-of-breed engines at renewal.",
      },
      {
        vendorName: "E-invoicing / CTC platforms (Sovos, Pagero, vendor modules)",
        category: "Real-time clearance and continuous-transaction-control compliance",
        switchingCost:
          "Moderate — jurisdiction connectors and integration patterns accrete; " +
          "switchable per region but with re-integration effort as mandates expand.",
        renewalDynamics:
          "Per-jurisdiction / per-document pricing; scope grows automatically as " +
          "new mandates go live, creating recurring upsell.",
      },
      {
        vendorName: "Transfer-pricing & benchmarking tooling / advisors",
        category: "TP documentation, benchmarking comparables, audit defense",
        switchingCost:
          "Low-to-moderate for tooling but high advisory continuity value — the " +
          "durable asset is the documentation discipline and comparables history, " +
          "not the tool.",
        renewalDynamics:
          "Subscription comparables data plus advisory engagements; the negotiation " +
          "is documentation coverage and contemporaneity, not just tool price.",
      },
    ],
    switchingCosts:
      "The GL and the mature provision platform are effectively non-switchable in " +
      "isolation — provision logic, entity structures, ERP integration, and " +
      "historical workpapers are built in. The negotiable frontier is in the " +
      "indirect-tax engines and e-invoicing/CTC platforms (re-integrable per " +
      "region with effort), in AI/automation feature pricing layered on the " +
      "provision and engines, and — most importantly — in whether spend is " +
      "directed at the binding constraint (the governed tax data layer) rather " +
      "than at another tool that will be fed the same bad data.",
    negotiationLevers: [
      "Tie provision/engine AI-feature pricing to measured outcomes — auto-sourced %, provision close-cycle reduction, determination accuracy — not entity or seat counts",
      "Audit, explainability, and model-validation rights for any AI in the provision, determination, or TP documentation (SOX / model-risk / audit defense)",
      "E-invoicing/CTC pricing and roadmap commitments covering upcoming mandates (EU ViDA, expanding LATAM/APAC), not just live jurisdictions",
      "Bundle native ERP tax against best-of-breed engines at renewal to discipline pricing — while protecting against being locked into a weaker determination engine",
      "Direct spend at the governed tax data layer first; pilot-to-scale gating on one entity/jurisdiction with auto-sourced-% and reconciliation-parity proof before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      tax_data_sourcing_claim: [
        "auto-sourced % of return/provision positions from governed systems",
        "reconciliation-exception count per cycle",
        "provision close days from book-close handoff",
      ],
      indirect_tax_claim: [
        "determination accuracy confirmed against audit findings",
        "net assessment per audit as a share of base",
        "exemption-certificate coverage and master-data quality basis",
      ],
      transfer_pricing_claim: [
        "documentation coverage of material intercompany flows",
        "contemporaneity (current local/master file, not reactive)",
        "defensible benchmarking and functional analysis",
      ],
      global_compliance_claim: [
        "jurisdiction-by-jurisdiction GloBE data trace for Pillar Two",
        "modeled top-up and safe-harbor position from source data",
        "e-invoicing/CTC clearance-and-acceptance logs with rejection analysis",
      ],
      cost_effort_credit_claim: [
        "Workforce Economics substrate cost basis (tax tower, rate-card x FTE)",
        "manual hours per cycle split assembly vs review",
        "eligible-versus-claimed credit reconciled to GL/payroll/project data",
      ],
    },
    citationStandard:
      "Quantitative tax claims cite the governed source: ETR and cash-tax claims " +
      "cite the ASC 740 / IAS 12 provision reconciled to pre-tax book income by " +
      "jurisdiction; data-sourcing and provision-cycle claims cite tooling " +
      "lineage, reconciliation-exception counts, and close timestamps; indirect-" +
      "tax claims cite determination logs reconciled to audit findings and " +
      "certificate coverage; transfer-pricing claims cite the documentation " +
      "register against the intercompany map with contemporaneity; Pillar Two and " +
      "e-invoicing claims cite jurisdictional GloBE data and clearance/acceptance " +
      "logs. A claim that 'the tax engine handles it' must be backed by " +
      "data-quality and accuracy evidence — the engine is only as right as its " +
      "inputs, never asserted as correct on faith.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not measured auto-sourced % or reconciliation exceptions — frame data-bottleneck severity and automation benefit as an industry planning range, not their measured number.",
      "Determination or provision accuracy is asserted from the tax engine without audit confirmation or master-data context — mark as tool output pending data-quality validation.",
      "A Pillar Two top-up or e-invoicing readiness figure comes from an ad-hoc spreadsheet — flag it as an estimate lacking a jurisdictional data trace, not a defensible position.",
      "Vendor-reported automation, accuracy, or close-time outcomes are cited — mark as provider claims pending tenant validation against their own data.",
    ],
    inferenceLanguage: [
      "Across multinationals at this scale, despite owning a tax engine, the provision typically still runs in spreadsheets because...",
      "Without your measured auto-sourced % and reconciliation-exception count, the industry pattern suggests the data bottleneck is...",
      "Peer tax functions commonly find that automation ROI is gated by upstream data quality rather than the tool, so...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific auto-sourced %, provision close-cycle, determination-accuracy, or TP-coverage number for this tenant",
      "A Pillar Two top-up or safe-harbor position treated as defensible without a jurisdiction-by-jurisdiction GloBE data trace",
      "A claim that the tax engine determines correctly without audit-confirmed accuracy and master-data quality evidence",
      "An automation-benefit number that assumes the upstream tax data is fixed when data quality has not been demonstrated",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "tax KPI scorecard / tax-function health",
      exhibitKind: "table",
      note: "ETR, cash tax rate, provision close cycle, auto-sourced %, determination accuracy, TP coverage, e-invoicing compliance, reconciliation exceptions, controversy backlog vs planning ranges.",
    },
    {
      questionPattern:
        "effective tax rate reconciliation / what drives the ETR off statutory",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "valueBridge",
      note: "Bridge the statutory rate to the reported ETR by driver (foreign rate differential, credits, permanent differences, Pillar Two top-up, valuation allowance).",
    },
    {
      questionPattern:
        "where tax effort sits / manual hours across direct, indirect, TP, compliance",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost/effort across direct tax, indirect tax, transfer pricing, and compliance to show where capacity is trapped in data assembly vs judgment.",
    },
    {
      questionPattern:
        "transfer-pricing documentation coverage / where is the audit exposure",
      exhibitKind: "table",
      note: "Per material intercompany flow: entity pair, transaction type, current documentation status, benchmarking date, and exposure flag.",
    },
    {
      questionPattern:
        "Pillar Two / e-invoicing readiness by jurisdiction",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap jurisdictions by GloBE data readiness, modeled top-up exposure, and e-invoicing/CTC clearance rate to show where readiness gaps concentrate.",
    },
    {
      questionPattern:
        "automation benefit gated by data quality / sensitivity of ROI to auto-sourced %",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of swing factors (upstream data quality, regulatory change, judgment irreducibility, adoption) showing how each haircut moves the realizable tax-automation benefit.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The program targets the binding constraint first — a governed tax data layer that sensitizes ERP/source data — before buying or scaling another tax tool",
      "Pillar Two and e-invoicing mandates are used as the forcing function that funds and disciplines the data-quality work the spreadsheet provision previously fudged",
      "Tax retains review and ownership of every reported and audit-exposed output (provision, TP, controversy) while AI assembles and drafts the data and documentation",
      "Transfer-pricing documentation is resourced as a contemporaneous production line, not a reactive audit scramble, and credit capture is made systematic",
    ],
    failureDrivers: [
      "Spend goes to another tax tool while the upstream data stays bad — automating reconciliation of wrong data and realizing little of the projected benefit",
      "The provision stays in spreadsheets because the ERP is never tax-sensitized at source, so close cycles and reconciliation exceptions never improve",
      "Multi-jurisdiction regulatory change (Pillar Two, e-invoicing, nexus) outruns a static design, and each mandate becomes a fresh fire drill",
      "Transfer-pricing documentation stays under-resourced and reactive, leaving material flows undocumented until an audit converts the gap into an assessment",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Indirect-tax determination and e-invoicing/CTC adopt first and most " +
      "readily because the mandates are non-negotiable and the value is " +
      "immediate (a rejected invoice blocks a sale). The governed tax data layer " +
      "and AI-accelerated provision follow as the data work matures — the highest " +
      "leverage but the slowest because they require fixing upstream data and a " +
      "CFO/CTO mandate, not just a tax tool. Transfer-pricing automation and " +
      "Pillar Two GloBE modeling adopt deliberately as data and capacity allow. " +
      "The pattern is regulation-pulled at the edge (compliance you cannot avoid) " +
      "and constraint-gated at the core (the data layer everything else needs).",
    roiClarity: "medium",
    roiClarityBasis:
      "Efficiency ROI (manual hours per cycle, provision close-cycle " +
      "compression) is firm because it is directly measurable in the Workforce " +
      "Economics substrate and tooling logs. Risk-reduction ROI (lower audit " +
      "assessments, avoided Pillar-Two surprises, defensible TP) is real but " +
      "probabilistic — realized as avoided cost and lower variance, not a clean " +
      "P&L line. Credit-capture ROI is firm where eligible-versus-claimed can be " +
      "reconciled. The dominant uncertainty is the binding constraint: every " +
      "benefit is gated by upstream tax-data quality, which is exactly why the " +
      "evidence and hedge rules force an auto-sourced-% and data-quality basis " +
      "before any automation benefit is treated as bankable.",
  },

  regulatoryFrame: {
    name: "Multi-frame tax compliance (ASC 740/IAS 12, BEPS Pillar Two, indirect-tax & e-invoicing mandates, SOX)",
    relevance:
      "Corporate tax sits at the intersection of several binding frames: ASC 740 " +
      "/ IAS 12 govern the reported provision and require auditable, SOX-" +
      "controlled numbers; OECD BEPS Pillar Two imposes a 15% jurisdictional " +
      "minimum tax demanding granular GloBE data the legacy estate cannot " +
      "reliably produce; post-Wayfair nexus and global VAT/GST regimes plus " +
      "real-time e-invoicing / CTC mandates make indirect-tax compliance " +
      "transaction-blocking and data-quality-dependent; and transfer-pricing " +
      "documentation standards govern audit defense. Together these are the " +
      "forcing function for real tax data quality — and any AI in the provision, " +
      "determination, TP documentation, or GloBE modeling must be explainable, " +
      "auditable, and human-accountable for the reported and filed numbers (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
