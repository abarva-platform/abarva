import fs from "node:fs/promises";
import path from "node:path";
import { buildScenario, NOTICE, PACK_FILES } from "./scenario";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";

const s = buildScenario();
const words: Record<string, string> = {
  business_trigger:
    "The synthetic finance review identifies rising initial denials and delayed remittance feedback. Begin a denial-prevention discovery before funding a solution.",
  problem_statement:
    "Eligibility, authorization, coding and documentation exceptions are discovered after submission. Manual spreadsheet queues hide causes and recovery ownership across the invented payer and facility cohorts.",
  affected_function_process:
    "Revenue cycle submission, patient access, authorization, administrative coding checks and cash application across the invented hospitals and physician group.",
  scope_out:
    "Clinical treatment recommendations, real patient records, payer contract renegotiation, replacement of the EHR and autonomous claim submission are excluded.",
  initial_value_hypothesis:
    "Prevent avoidable write-offs through pre-submission checks and collect retained allowed revenue. Rework capacity stays non-cash until a role or contract release is evidenced. Faster collection changes timing, not a second revenue benefit.",
  outcomes_success:
    "Test a lower initial denial rate without delaying clean claims, fewer preventable write-offs, less manual rework and earlier cash collection. Targets remain proposals for the register and baseline review.",
  discovery_questions:
    "Can coverage and authorization be joined as of service date? Which reviewed reasons are preventable? Does a matched comparator show incremental collected cash? Who resolves exceptions and confirms the baseline?",
  stakeholder_owner_view:
    "Revenue cycle director owns the outcome; patient access, authorization, coding and documentation leads own source corrections; finance business partner validates collected cash; data platform owner controls governed access. Actual workspace participants must be assigned by the owner.",
  known_evidence:
    "The invented use-case brief, cohort baseline, reason taxonomy, source inventory, role interviews, finance baseline, current workflow and payer excerpts form the synthetic discovery pack.",
  missing_evidence_open_questions:
    "No real client data, independent Finance attestation, approved production access, priced estimate or realized benefit exists. The new Move and its evidence reference identifiers do not exist yet.",
  recommendation_to_advance:
    "Proceed only as a labelled synthetic discovery after the owner reviews source coverage. Preserve all unresolved assumptions for Charter.",
  sponsor_commitment:
    "Revenue cycle director is the proposed sponsor role. The owner must select an actual Move participant and separately record the participant's chosen update preference; this note grants no approval or email consent.",
  scope_boundary:
    "Assess pre-submission administrative checks, reviewed denial reasons, correction queues and recovery tracing across the invented facilities. Exclude clinical decision support, live PHI and autonomous payer submissions.",
  stakeholder_map:
    "Patient access owns eligibility; authorization team owns authorizations; coding manager owns administrative edits; documentation operations lead owns attachment completeness; cash application manager owns collection reconciliation; finance business partner validates value; data platform owner controls lineage and access.",
  decision_rights:
    "Revenue cycle director decides discovery scope; source owners validate their fields; data platform owner approves access; finance business partner certifies monetary baselines; authorized workspace users make each recorded gate decision.",
  success_criteria:
    "Reduce initial denials and preventable write-offs against reviewed synthetic cohorts, preserve clean-claim throughput and account for incremental collected cash separately from capacity. Quantified targets require confirmed register rows before acceptance.",
  evidence_plan:
    "Review the eight synthetic source files, reconcile submission denominators and mature final dispositions, validate taxonomy ownership, test joins and exception handling, and have the owner acknowledge every missing required family.",
  current_state_findings:
    "Eligibility and authorization checks do not share a versioned pre-submission decision record. Remittance feedback arrives after submission; manual workqueues duplicate correction effort. The inventory and interview notes describe this synthetic workflow only.",
  process_handoffs:
    "Patient access checks coverage, billing submits, the clearinghouse acknowledges, remits arrive, the analyst maps a reason and routes a correction, and cash application reconciles recovery or final disposition. Corrections loop to submission without a shared version history.",
  data_quality_governance:
    "Join only original claims with service-date coverage and authorization versions. Review primary-reason mapping and timezone corrections; deduplicate resubmissions; retain source batch IDs, disposition lineage and role-based access.",
  evidence_confidence:
    "The invented cohort arithmetic reconciles. Causal preventability, adoption, future access, pricing and incremental collections remain unproven hypotheses. Human demo review acknowledges synthetic origin; it does not create real client attestation.",
  recommendation:
    "Proceed conditionally within the synthetic scope after the authorized owner checks current gate requirements and records the decision. Unresolved access, commercial pricing and measurement conditions stay visible.",
  funding_governance:
    "Request funding only against the current owner-approved ROM and value-engine readback. The register budget is a ceiling, never a second investment basis. Finance business partner owns collection validation and monthly funding review.",
  roadmap_sequencing:
    "Roadmap sequence: foundation access and identity precede eligibility and authorization risk checks; reviewed correction routing precedes recovery reconciliation. Workstream dependencies, owner roles and planned milestones must be entered and reviewed in the milestone editor.",
  handoff_plan:
    "Tower handoff plan: finance business partner owns incremental collected cash; revenue cycle director owns denial-rate and throughput metrics; data platform owner owns source lineage. Transfer reviewed baselines, comparator definitions, timing assumptions and unresolved conditions to Tower.",
  mobilization_plan:
    "Mobilization plan: revenue cycle director is receiving outcome owner; integration lead is delivery owner; finance business partner is measurement owner; patient access and coding leads receive correction responsibilities. The owner assigns actual authorized participants before acceptance.",
  launch_readiness:
    "Launch readiness: require approved roadmap and estimate, reviewed value assumptions, purpose-bound access, named receiving roles, rollback criteria and acknowledged dependencies. Handoff prepares external execution; it does not claim work has begun.",
  value_proof_rules:
    "Value proof rules: reconcile original submitted claims and mature denials by the same cohort; credit only incremental collected allowed revenue against a matched comparator; exclude contractual adjustments and existing recoveries. Rework hours count as capacity at zero cash without a documented release. Days in receivables affects timing without adding annual revenue again.",
  governance_cadence:
    "Governance cadence: source owners review weekly exception completeness; finance business partner reconciles collections monthly; revenue cycle director chairs the monthly outcome review; unresolved access or comparator defects escalate to the receiving owner before any realized-value claim.",
  first_90_days:
    "First 90 days: plan access and lineage acceptance, then a shadow administrative-risk review, then a controlled correction-routing pilot and a mature-cohort collection reconciliation. Each future checkpoint needs a named role, dependency and stop criterion before handoff.",
  risks_open_items:
    "Risks and open items: policy interpretation needs source-owner review; payer response lag can mask benefit; coverage joins can be incomplete; pricing is unapproved until the cost foundation and pod are selected. No real clinical evidence or live execution is represented.",
  risks_dependencies:
    "Access approval, reviewed policy interpretation, a current approved ROM, collection comparator and receipt lineage are unresolved dependencies. Funding and rollout remain conditional; no execution or realized value is asserted.",
};
const causes = [
  {
    id: "RC-1",
    short: "coverage history",
    cause:
      "Coverage and authorization versions are missing from the pre-submission decision record",
  },
  {
    id: "RC-2",
    short: "reason routing",
    cause:
      "Inconsistent denial reason mapping leaves manual correction queues without a shared accountable routing rule",
  },
  {
    id: "RC-3",
    short: "recovery trace",
    cause:
      "Recovery receipts lack a reconciled link to the original denied claim and its final disposition",
  },
];
const design = [
  "Coverage and authorization versions belong in a service-date decision record with an administrative risk check before submission.",
  "Denial reason mapping and manual correction queues need a reviewed taxonomy, an accountable routing rule and a source-team exception queue.",
  "Recovery receipts need a reconciled original denied claim link and a versioned final disposition ledger for cash application.",
];
const special: Record<
  string,
  { mode: string; pasteBlock: string; manualFields?: Record<string, string> }
> = {
  "P2.1": {
    mode: "human-only",
    pasteBlock: "",
    manualFields: {
      discovery_notes:
        "Review the source coverage and acknowledge missing families without treating a title as approved evidence.",
    },
  },
  "P2.2": {
    mode: "human-only",
    pasteBlock: "",
    manualFields: {
      current_state_findings: words.current_state_findings,
      baseline_metrics:
        "Enter the supplied trailing-year control figures in the baseline facts editor. Copy the actual approved evidence citations shown on this new Move; do not use an assumed [E:n].",
    },
  },
  "P2.3": {
    mode: "root-cause-notes",
    pasteBlock: causes.map((c) => c.cause + ".").join("\n"),
  },
  "P2.4": {
    mode: "human-only",
    pasteBlock: "",
    manualFields: {
      solution_route_validation:
        "Review the route against the material queue and accountability changes described in the interviews. Confirm or correct it in the structured route form; no preselected outcome is claimed.",
    },
  },
  "P3.1": { mode: "design-traceability-notes", pasteBlock: design.join("\n") },
  "P3.2": {
    mode: "architecture-choice-notes",
    pasteBlock:
      "Governed batch prevention and recovery uses the versioned decision ledger and reviewed routing while retaining existing source systems. Coverage history needs a service-date coverage and authorization version join. Reason routing needs a reviewed taxonomy and manual exception queue. Recovery trace needs receipt-to-original-claim reconciliation.",
    manualFields: {
      optionLabel: "Governed batch prevention and recovery",
      solution_approach:
        "Proposed governed batch prevention and recovery with human-reviewed exceptions.",
      controls_governance: words.data_quality_governance,
      architecture_integration:
        "Declared flow: source extracts to restricted landing; landing to identity and quality review; reviewed records to canonical claim and disposition ledger; ledger to risk and routing slice; slice to human queue; receipt ledger to cash reconciliation. No implied connections.",
    },
  },
  "P3.3": {
    mode: "operating-adoption-notes",
    pasteBlock:
      "Operating model: Source-team leads certify their administrative exception rules; the data platform owner approves access and releases the reviewed data slice; finance business partner certifies the cash baseline. The owner selects actual Move participants for each role.\nProcess design: Review the pre-submission risk queue daily, return exceptions to the source team, record the disposition and reconcile subsequent receipts to the original claim. Keep human override and rollback paths.\nWorkflow: Source-team corrections move ahead of submission rather than remaining in a remittance-only rework queue.\nAdoption boundary: Clinical treatment and payer adjudication remain unchanged.",
  },
  "P3.4": {
    mode: "rom-estimate-notes",
    pasteBlock:
      "Shared foundation needs 6 sources, 28 tables, 9 entities, 0 views, 12 design rows and 24 validation rows.\nUC-1 submission risk review needs 0 sources, 0 tables, 3 entities, 4 views, 10 design rows and 20 validation rows.\nUC-2 correction routing and recovery needs 0 sources, 0 tables, 4 entities, 5 views, 12 design rows and 24 validation rows.",
  },
  "P4.2": { mode: "read-only", pasteBlock: "" },
};
const gateIds = new Set(["P0.5", "P1.5", "P2.5", "P3.5", "P4.5", "P5.4"]);
const uploadByStep: Record<string, string[]> = {
  "P0.1": [PACK_FILES[0]],
  "P0.4": [PACK_FILES[4], PACK_FILES[6]],
  "P1.1": [PACK_FILES[0]],
  "P1.4": [PACK_FILES[3], PACK_FILES[4]],
  "P2.1": [...PACK_FILES],
  "P2.2": [PACK_FILES[1], PACK_FILES[5]],
  "P2.3": [PACK_FILES[2], PACK_FILES[4], PACK_FILES[6], PACK_FILES[7]],
  "P3.1": [PACK_FILES[3]],
  "P3.2": [PACK_FILES[0]],
  "P3.3": [PACK_FILES[4]],
};
const p4labels: Record<string, string> = {
  roadmap_sequencing: "Roadmap sequence",
  funding_governance: "Funding governance",
  handoff_plan: "Tower handoff plan",
  mobilization_plan: "Mobilization plan",
  launch_readiness: "Launch readiness",
  value_proof_rules: "Value proof rules",
  governance_cadence: "Governance cadence",
  first_90_days: "First 90 days",
  risks_open_items: "Risks and open items",
};
const steps = Array.from({ length: 6 }, (_, phase) =>
  resolvePhaseWorkflow(phase, null).map((step) => ({ ...step, phase })),
)
  .flat()
  .map((step) => {
    const sections = getPhaseCaptureSections(step.phase).filter(
      (x) =>
        step.sectionKeys.includes(x.key) &&
        !x.structured &&
        x.key !== "value_plan",
    );
    const isGate = gateIds.has(step.id);
    const entry = special[step.id] ?? {
      mode: isGate
        ? "human-only"
        : step.phase >= 4
          ? "capture-notes-proposal"
          : "capture-text-step-notes",
      pasteBlock: isGate
        ? ""
        : sections
            .map(
              (x) =>
                `${p4labels[x.key] ?? x.label}: ${words[x.key] ?? words.recommendation}`,
            )
            .join(step.phase >= 4 ? "\n\n" : "\n"),
    };
    const humanClicks = isGate
      ? [
          "Read every current hard check and resolve the exact linked blocker.",
          "Build only an unsigned document for this fresh Move; review the result and sign off personally in Files & Evidence if acceptable.",
          "Read the gate rationale and personally approve only if the recorded synthetic scope is correct. Copy any refusal verbatim; do not bypass it.",
        ]
      : [
          "Open this step on the new Move; verify tenant and phase.",
          ...(uploadByStep[step.id]?.length
            ? [
                "Use Add session output / Upload evidence; select the correct evidence family, review extraction and personally approve only accurate synthetic content. Reuse an already-approved upload rather than duplicating it.",
              ]
            : []),
          entry.pasteBlock
            ? "Paste the block into this step's notes panel; inspect each proposed draft, then personally accept the appropriate ones."
            : "Use the structured controls or read-only panel; this page has no notes-fill parser.",
        ];
    if (step.id === "P1.1")
      humanClicks.push(
        "Assign an actual sponsor participant. A role written in a note is not a participant assignment; no fictional persona gives approval.",
      );
    if (step.id === "P1.4")
      humanClicks.push(
        "Complete Business change & adoption owner in its reused structured editor: queue/workflow and accountability changes are material hypotheses; choose the actual validator and evidence basis. Notes fill deliberately skips this structured field.",
      );
    if (step.id === "P2.3")
      humanClicks.push(
        "Review the causes against actual uploaded references, link approved evidence, name each short label, accept or explicitly own unresolved causes, then personally confirm the ranking. No ranking is pre-approved.",
      );
    if (step.id === "P3.2")
      humanClicks.push(
        "Use the option set actually served by the product. If the named proposed batch option is unavailable, prepare and review it through the existing option input path before choosing it; stop and report a refusal rather than claiming notes created an option. Mark coverage, explain Partly/Doesn't, confirm rationale and personally accept coverage.",
      );
    if (step.id === "P3.3")
      humanClicks.push(
        "Choose real Move participants corresponding to the proposed roles, mark decision rights and name the baseline owner. Role-only notes do not auto-fill participant identity. Accept the owner grid yourself.",
      );
    if (step.id === "P3.4")
      humanClicks.push(
        "Add the Shared foundation row before pasting counts; its notes parser fills an existing foundation, while UC-1 and UC-2 may be proposed as new use cases.",
        "Confirm counts, counting foundation once; resolve unit-hour DL references only after a separately approved M rebind; select a pricing-engine-v1 pod and inspect role/level/location/provider provenance. Group UC-1 into R1 and UC-2 into R2 with foundation once, review calculated price and personally Approve the estimate. Never substitute a local or unapproved snapshot.",
      );
    if (step.id === "P4.1")
      humanClicks.push(
        "Enter actual planned milestones in the milestone editor; sequence prose alone does not clear the milestone gate.",
      );
    if (step.id === "P4.3")
      humanClicks.push(
        "Read the governed value-engine levers and approved ROM cost after the M rebind. Review any blocked input; do not paste legacy prose as an engine case. Keep rework cash zero without a recorded release and days-AR timing limitations visible.",
      );
    if (step.id === "P5.4")
      humanClicks.push(
        "Accept the handoff package and value measurement contract personally. Verify the terminal phase record and Tower handoff surface. Handoff does not claim execution has started.",
      );
    return {
      stepId: step.id,
      title: step.title,
      phase: step.phase,
      parser: entry.mode,
      pasteBlock: entry.pasteBlock,
      manualFields:
        entry.manualFields ??
        (isGate
          ? Object.fromEntries(
              sections.map((section) => [
                section.key,
                words[section.key] ?? words.recommendation,
              ]),
            )
          : {}),
      fields: sections.map((x) => ({
        key: x.key,
        label: p4labels[x.key] ?? x.label,
      })),
      uploads: uploadByStep[step.id] ?? [],
      humanClicks,
      sourceFiles: uploadByStep[step.id] ?? [PACK_FILES[0]],
      approvalRecorded: false,
    };
  });
const sourceRef = (key: string) => ({
  kind: "register" as const,
  registerId: `UNBOUND_${key}`,
});
const registerRows = [
  ...[36, 8, 28, 24, 3, 2].map((v, i) => ({
    key: `unit_${["source", "table", "entity", "view", "design", "validation"][i]}`,
    category: "delivery",
    value: v,
    unit: "hours per component",
    sourceFile: PACK_FILES[3],
    sourceBasis: "Invented unit-hour benchmark for owner review; not a rate",
    ownerRole: "Delivery architecture lead",
  })),
  ...[
    { key: "friction", value: 1.18, unit: "multiplier" },
    { key: "productive_share", value: 0.68, unit: "share" },
    { key: "weekly_hours", value: 40, unit: "hours per FTE-week" },
  ].map((r) => ({
    ...r,
    category: "delivery",
    sourceFile: PACK_FILES[3],
    sourceBasis: "Invented delivery planning hypothesis",
    ownerRole: "Delivery architecture lead",
  })),
  ...[
    {
      key: "writeoff_baseline",
      value: s.trailingYear.writeOffs,
      unit: "USD per trailing year",
    },
    {
      key: "prevented_share",
      value: s.assumptions.preventionShare,
      unit: "share",
    },
    { key: "zero", value: 0, unit: "share" },
    { key: "margin", value: 1, unit: "share" },
    { key: "attribution", value: s.assumptions.attribution, unit: "share" },
    { key: "probability", value: s.assumptions.probability, unit: "share" },
    {
      key: "rework_hours",
      value: s.assumptions.reworkHoursPerDenial,
      unit: "hours per denial",
    },
    {
      key: "rework_target",
      value:
        s.assumptions.reworkHoursPerDenial *
        (1 - s.assumptions.reworkReductionShare),
      unit: "hours per denial",
    },
    {
      key: "denial_volume",
      value: s.trailingYear.denials,
      unit: "denials per trailing year",
    },
    { key: "days_ar", value: s.assumptions.currentDaysAR, unit: "days" },
    { key: "days_ar_target", value: s.assumptions.targetDaysAR, unit: "days" },
    {
      key: "discount",
      value: s.assumptions.annualDiscountRate,
      unit: "annual rate",
    },
    {
      key: "budget_ceiling",
      value: s.assumptions.budgetCeiling,
      unit: "USD ceiling",
    },
  ].map((r) => ({
    ...r,
    category: "value",
    sourceFile: PACK_FILES[5],
    sourceBasis:
      "Synthetic finance baseline or explicitly proposed synthetic hypothesis",
    ownerRole: "Finance business partner",
  })),
].map((r) => ({
  ...r,
  status: "proposed",
  confidence: 3,
  registerId: null,
  approvedBy: null,
}));
const rebind = {
  version: 1,
  datasetId: s.datasetId,
  notice: NOTICE,
  status: "preparation_only",
  moveId: null,
  authenticatedClientKey: null,
  registerIds: null,
  sourceSetHash: null,
  loadApproval: null,
  operatorJob:
    "Reuse Brief M's governed seed job after its reviewed contract supports these exact rows",
  registerRows,
  cost: { kind: "rom", snapshotId: "UNBOUND_OWNER_APPROVED_CURRENT_P3_ROM" },
  ratePolicy: {
    engine: "pricing-engine-v1",
    podId: null,
    requiredProvenance: [
      "foundation version",
      "role",
      "level",
      "location",
      "provider class",
      "rate key",
    ],
    rates: [],
  },
  levers: [
    {
      id: "L1",
      name: "Incremental collected allowed revenue retained by denial prevention",
      conversion: "revenue",
      driver: {
        name: "Prevented write-off share",
        unit: "share",
        direction: "increase",
        baseline: sourceRef("zero"),
        target: sourceRef("prevented_share"),
      },
      terms: [
        { role: "driver_delta" },
        {
          role: "base",
          label: "Trailing-year denied-claim write-offs",
          ref: sourceRef("writeoff_baseline"),
        },
        {
          role: "margin",
          label: "Net allowed receipts basis; no gross-charge conversion",
          ref: sourceRef("margin"),
        },
      ],
      attribution: sourceRef("attribution"),
      probability: sourceRef("probability"),
      timing: { startMonth: 8, rampMonths: 6, paymentLagMonths: 2 },
    },
    {
      id: "L2",
      name: "Administrative rework capacity",
      conversion: "non_cash",
      driver: {
        name: "Rework per initial denial",
        unit: "hours",
        direction: "decrease",
        baseline: sourceRef("rework_hours"),
        target: sourceRef("rework_target"),
      },
      terms: [
        { role: "driver_delta" },
        {
          role: "base",
          label: "Initial denials in trailing year",
          ref: sourceRef("denial_volume"),
        },
      ],
      attribution: sourceRef("attribution"),
      probability: sourceRef("probability"),
      timing: { startMonth: 8, rampMonths: 6, paymentLagMonths: 0 },
      releasePath: null,
    },
    {
      id: "L3",
      name: "Collection timing observation",
      conversion: "non_cash",
      driver: {
        name: "Days in accounts receivable",
        unit: "days",
        direction: "decrease",
        baseline: sourceRef("days_ar"),
        target: sourceRef("days_ar_target"),
      },
      terms: [{ role: "driver_delta" }],
      attribution: sourceRef("attribution"),
      probability: sourceRef("probability"),
      timing: { startMonth: 8, rampMonths: 6, paymentLagMonths: 0 },
      releasePath: null,
    },
  ],
  horizonYears: 3,
  discountRate: sourceRef("discount"),
  knownGaps: [
    "The existing value engine accepts integer-month cash lags; an eight-day DSO improvement cannot be credited as an invented one-month shift or annual working-capital revenue. Keep the conservative two-month L1 lag and show days-AR as a non-cash metric until an independently reviewed timing extension exists.",
    "No new Move, exact register allocation, named load approval or owner-approved ROM exists. Placeholder refs are preparation identifiers, not valid citations. Resolve them in a separately reviewed M rebind before generation or apply.",
    "This proposal has more rows than the earlier M seed. Same-job reuse requires an exact schema/scope review; it is not an authorization to widen a load.",
  ],
};

async function main() {
  const out = path.resolve(
    process.argv[2] ??
      "datasets/tenant-inputs/meridian-health/moves/denials-pack-v1",
  );
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(
    path.join(out, "scenario.json"),
    JSON.stringify(s, null, 2) + "\n",
  );
  await fs.writeFile(
    path.join(out, "walk-notes.json"),
    JSON.stringify(
      {
        version: 1,
        notice: NOTICE,
        moveId: null,
        status: "prepared_not_walked",
        parserRevision:
          "origin/main at authoring; test against actual parser implementations",
        steps,
        proposedCauses: causes,
        proposedDesignElements: design,
        baselineControls: s.trailingYear,
        bindBeforePaste: [
          "Actual approved evidence references for baseline facts",
          "Actual authorized Move participants",
          "Exact register IDs after reviewed scoped preflight",
          "Owner-approved ROM snapshot",
        ],
        rebindFile: "register-rebind-proposal.json",
      },
      null,
      2,
    ) + "\n",
  );
  await fs.writeFile(
    path.join(out, "register-rebind-proposal.json"),
    JSON.stringify(rebind, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      output: out,
      claimRows: s.claims.length,
      denialRows: s.denials.length,
      steps: steps.length,
      trailingYear: s.trailingYear,
    }),
  );
}
void main();
