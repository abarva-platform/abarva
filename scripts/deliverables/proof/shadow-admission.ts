/**
 * Run evidence admission in SHADOW over a real generated artifact.
 *
 * Reports what it would have excluded and what reached the deck anyway. It gates
 * nothing — per the graph adoption rule, a new read path reports and is compared
 * against the current one before it is allowed to block.
 */
import fs from "node:fs";
import path from "node:path";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import {
  admitEvidence,
  type EvidenceAdmissionPolicy,
  type EvidenceCandidate,
  type GraphEdge,
  type MoveScope,
} from "@/lib/deliverables/governance/move-scope";
import { checkCoverage, checkContainment, buildShadowReport, type UtilisationRecord } from "@/lib/deliverables/governance/evidence-gates";
import { checkGovernanceChrome } from "@/lib/deliverables/governance/governance-chrome";
import { constraintFromProse, resolveClaimConstraints, blockedSubjects } from "@/lib/deliverables/governance/claim-constraints";
import { resolveArtifactEligibility, allowedArtifactKeys, P2_PRECONDITIONS, P3_PRECONDITIONS, type MoveGovernedState } from "@/lib/deliverables/governance/artifact-eligibility";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const DECK = process.env.SHADOW_DECK ?? "deck-composed-A.pptx";
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"));

/**
 * Scope for the contact-centre Move, from the corpus's own identifiers.
 *
 * In production this is declared at Move creation from intake. Here it is
 * transcribed from the records that name it, which is the same information by a
 * slower route.
 */
const scope: MoveScope = {
  moveId: "MOVE-CONTACT-CENTRE",
  version: 1,
  capabilityIds: ["Contact Center Virtual Assistant", "Contact Center Agent Assist"],
  programmeIds: ["PROG-CONTACT-KNOW", "Contact Center Platform / Knowledge Modernization"],
  systemIds: [
    "Salesforce Member/Patient CRM", "Epic Cadence", "Epic ClinDoc", "Epic Tapestry", "Epic Willow",
    "Eligibility service", "Knowledge base", "Power BI reporting estate", "Contact center transcript and telephony platform",
  ],
  dataDomains: ["transcripts", "intent taxonomy", "member identity", "QA labels"],
  businessFunctions: ["Contact Center / Member Service Operations", "Member Services", "Patient Access"],
  accountableOwnerIds: ["VP Member Services & Patient Experience", "Chief Experience Officer"],
  vendorIds: ["Genesys / Azure OpenAI", "Salesforce", "Epic"],
};

const policy: EvidenceAdmissionPolicy = {
  policyVersion: "p2-current-state@1",
  artifactType: "discovery_report",
  archetype: "AI_PDLC",
  required: [
    { family: "focus_initiative", minItems: 3, maxDepth: 1 },
    { family: "uploaded_current_state", minItems: 1, maxDepth: 0 },
  ],
  permitted: [
    { family: "operating_metrics", maxDepth: 1 },
    { family: "risk_controls", maxDepth: 1 },
    { family: "application_portfolio", maxDepth: 1 },
    { family: "vendor_contracts", maxDepth: 1 },
    { family: "infrastructure", maxDepth: 1 },
    { family: "budget_baseline", maxDepth: 1, maxItems: 4 },
  ],
  benchmark: [{ family: "ai_portfolio", appendixOnly: true, mustBeLabelled: true }],
  alwaysAdmit: ["claim_boundaries"],
  excluded: ["ai_use_cases", "programs"],
  legalEdges: [
    { depth: 1, relationshipTypes: ["names_object"] },
    { depth: 2, relationshipTypes: [] },
  ],
};

/** Governed state for this Move, from the records that declare it. */
const moveState: MoveGovernedState = {
  moveId: scope.moveId,
  initiativeStatus: "context_only",
  valueClaimStatus: "baseline_only",
  metricBoundary: "baseline_required_before_value_claim",
  baselineLoaded: false,
  openDiscoveryGaps: [
    "Transcript governance not loaded",
    "Real-time integration not proven",
    "Intent taxonomy not certified",
    "Member identity linkage not proven",
  ],
  towerClaimAllowed: "no",
};

async function main() {
  const request = read("request.json");
  const bundle = request.governedEvidenceBundle as { citationNumber: number; label: string; statement: string; evidenceFamily: string }[];

  // The edge set, derived from what each record actually names. In production
  // this is a slice of the governed graph; the shape is identical.
  const edges: GraphEdge[] = [];
  const candidates: EvidenceCandidate[] = bundle.map((e) => {
    const haystack = `${e.label} ${e.statement}`.toLowerCase();
    const named = [
      ...scope.capabilityIds, ...scope.programmeIds, ...scope.systemIds,
      ...scope.dataDomains, ...scope.businessFunctions, ...scope.accountableOwnerIds, ...scope.vendorIds,
    ].filter((id) => haystack.includes(id.toLowerCase()));
    const objectId = `EV-${e.citationNumber}`;
    for (const id of named) edges.push({ fromId: id, relationshipType: "names_object", toId: objectId });
    return {
      evidenceId: objectId,
      family: e.evidenceFamily,
      objectIds: [objectId, ...named],
      fromMoveUpload: e.evidenceFamily === "uploaded_current_state",
      ...(e.evidenceFamily === "uploaded_current_state" ? { uploadedAtPhase: "P2" } : {}),
    };
  });

  const decisions = admitEvidence({
    scope, policy, candidates, edges,
    enterpriseAnchorFamilies: ["enterprise_profile"],
    enterpriseAnchorMaxItems: 2,
  });

  // What the artifact actually used, measured from the artifact.
  const doc = read("governed-document.json");
  const citedNumbers = new Set<number>(doc.generatedSections.flatMap((s: { citationsUsed: number[] }) => s.citationsUsed));
  const cited = [...citedNumbers].map((n) => `EV-${n}`);
  const orchestration = read("orchestration-result.json");
  const packedNumbers = new Set<number>((orchestration.plan?.sectionPlan ?? []).flatMap((s: { evidenceCitations?: number[] }) => s.evidenceCitations ?? []));
  const packed = [...packedNumbers].map((n) => `EV-${n}`);

  const admitted = decisions.filter((d) => d.admitted);
  const inadmissible = decisions.filter((d) => !d.admitted);
  const inadmissibleCited = cited.filter((id) => inadmissible.some((d) => d.evidenceId === id));

  const utilisation: UtilisationRecord[] = candidates
    .filter((c) => c.fromMoveUpload)
    .map((c) => ({ evidenceId: c.evidenceId, state: cited.includes(c.evidenceId) ? "used" : "unused" }));

  const coverage = checkCoverage({ policy, candidates, decisions, utilisation, presentEvidenceKeys: [] });
  const containment = checkContainment({ decisions, packed, cited, rendered: cited });
  const shadow = buildShadowReport({ decisions, retrieved: packed, packed, cited, rendered: cited, coverage });

  console.log(`SHADOW ADMISSION — ${policy.artifactType} / ${policy.policyVersion}\n`);
  console.log(`  available evidence   ${decisions.length}`);
  console.log(`  admitted             ${admitted.length}`);
  console.log(`  would exclude        ${inadmissible.length}`);
  console.log(`  cited by the artifact ${cited.length}`);
  console.log(`  inadmissible, cited  ${inadmissibleCited.length}`);

  const byBasis: Record<string, number> = {};
  for (const d of admitted) byBasis[d.admittedBy ?? "?"] = (byBasis[d.admittedBy ?? "?"] ?? 0) + 1;
  console.log(`\n  admitted by: ${Object.entries(byBasis).map(([k, v]) => `${k} ${v}`).join(", ")}`);

  const byFamily: Record<string, number> = {};
  for (const d of inadmissible) byFamily[d.family] = (byFamily[d.family] ?? 0) + 1;
  console.log(`\n  would exclude, by family:`);
  for (const [f, n] of Object.entries(byFamily).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${f}`);

  console.log(`\n  coverage:    ${coverage.ok ? "pass" : `FAIL (${coverage.findings.length})`}`);
  for (const f of coverage.findings.slice(0, 4)) console.log(`      ${f.message}`);
  console.log(`  containment: ${containment.ok ? "pass" : `FAIL (${containment.findings.length})`}`);
  for (const f of containment.findings.slice(0, 4)) console.log(`      ${f.message}`);

  // ── claim boundaries, via the prose fallback ──────────────────────────────
  const prohibitions: string[] = fs.existsSync(path.join(OUT, "forbidden-claims.json"))
    ? read("forbidden-claims.json")
    : [];
  const constraints = prohibitions.map((statement, i) => constraintFromProse(statement, "tenant-prohibitions", i));
  const resolvedConstraints = resolveClaimConstraints(constraints, cited);
  const blocked = blockedSubjects(resolvedConstraints);
  console.log(`\n  claim constraints: ${constraints.length} normalised from prose`);
  console.log(`  blocked subjects:  ${blocked.length} (none can self-clear — the prose declares no clearing evidence)`);

  // ── artifact eligibility for this Move state ──────────────────────────────
  const p3 = resolveArtifactEligibility(moveState, P3_PRECONDITIONS, resolvedConstraints);
  const p2 = resolveArtifactEligibility(moveState, P2_PRECONDITIONS, resolvedConstraints);
  console.log(`\n  ELIGIBILITY for this Move state`);
  for (const a of [...p2, ...p3]) {
    console.log(`    ${a.state === "allowed" ? "ALLOWED" : "BLOCKED"}  ${a.artifactKey.padEnd(28)} ${a.state === "blocked" ? a.surfaceLabel : ""}`);
  }
  console.log(`    allowed set: ${allowedArtifactKeys([...p2, ...p3]).join(", ") || "(none)"}`);

  // ── governance chrome on the rendered file ────────────────────────────────
  const deckPath = path.join(OUT, DECK);
  if (fs.existsSync(deckPath)) {
    const inspected = await inspectDeck(fs.readFileSync(deckPath));
    const visibleText = inspected.slides.flatMap((s2) => s2.textRuns).join(" ");
    const chrome = checkGovernanceChrome({ visibleText, requireDataBasis: true });
    console.log(`\n  CHROME on ${DECK}: ${chrome.ok ? "pass" : `FAIL (${chrome.findings.length})`}`);
    for (const f of chrome.findings) console.log(`    missing ${f.marker}: ${f.why}`);
  }

  fs.writeFileSync(
    path.join(OUT, "shadow-admission.json"),
    JSON.stringify({ scope, policy, moveState, shadow, coverage, containment, decisions, resolvedConstraints, eligibility: [...p2, ...p3] }, null, 2),
  );
  console.log(`\n  written to shadow-admission.json — this gates nothing`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
