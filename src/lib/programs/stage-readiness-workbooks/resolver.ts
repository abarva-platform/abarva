import { createHash } from "crypto";

import type {
  DiscoveryEvidenceReadiness,
  DiscoveryFamilyCoverage,
} from "@/lib/programs/discovery/evidence-readiness";
import type {
  MoveEvidenceNeedPacket,
  MoveEvidenceNeedPriority,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import {
  type AssessmentDimensionPlan,
  type AssessmentDimensionPlanEntry,
  type AssessmentRequirement,
  type EvidenceSourceClass,
  type QuestionState,
  type StageReadinessWorkbookQuestion,
  type StageReadinessWorkbookSpec,
  type StageReadinessWorkbookTab,
} from "./types";

export const STAGE_READINESS_WORKBOOK_CONTRACT_VERSION =
  "stage-readiness-workbook-v1";
export const STAGE_READINESS_DIMENSION_PLAN_VERSION =
  "stage-readiness-dimension-plan-v1";

export interface BuildStageReadinessWorkbookSpecInput {
  moveId: string;
  moveName: string;
  phase: number;
  nextPhase: number;
  archetype: string;
  readiness: DiscoveryEvidenceReadiness;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  generatedAt?: string;
  artifactVersion?: string;
}

function workbookName(phase: number, nextPhase: number): string {
  if (phase === 0 && nextPhase === 1) return "Charter Readiness Workbook";
  if (phase === 1 && nextPhase === 2) return "Discovery Workbook";
  if (phase === 2 && nextPhase === 3)
    return "Solution Design Readiness Workbook";
  if (phase === 3 && nextPhase === 4) return "Investment Readiness Workbook";
  if (phase === 4 && nextPhase === 5) return "Mobilization Readiness Workbook";
  return "Stage Readiness Workbook";
}

function requirementForPriority(
  priority: MoveEvidenceNeedPriority,
): AssessmentRequirement {
  if (priority === "required") return "required";
  if (priority === "recommended") return "recommended";
  return "light_touch";
}

function stateForFamily(family: DiscoveryFamilyCoverage): QuestionState {
  if (family.status === "covered") return "prefilled_confirmed";
  return family.required ? "insufficient_evidence" : "needs_answer";
}

function sourceClassForFamily(
  family: DiscoveryFamilyCoverage,
): EvidenceSourceClass {
  if (family.status === "covered") return "client_fact";
  return "evidence_gap";
}

function packetByFamilyId(
  packets: MoveEvidenceNeedPacket[],
): Map<string, MoveEvidenceNeedPacket> {
  return new Map(packets.map((packet) => [packet.familyId, packet]));
}

function tabForFamily(familyId: string, label: string): string {
  const text = `${familyId} ${label}`.toLowerCase();
  if (text.match(/workflow|process|runbook|business|operations/))
    return "Business & Process";
  if (text.match(/system|crm|integration|architecture|platform|technology/))
    return "Technology & Integration";
  if (text.match(/data|claims|eligibility|knowledge|transcript|quality/))
    return "Data & Quality";
  if (text.match(/ai|model|analytics|decision|human|clinical/))
    return "Analytics / AI";
  if (text.match(/risk|security|privacy|phi|control|compliance|policy/))
    return "Risk, Security & Controls";
  if (text.match(/metric|kpi|baseline|finance|value|cost/))
    return "Performance & Value";
  if (text.match(/workforce|change|adoption|training|owner|cadence/))
    return "People & Change";
  if (text.match(/vendor|contract|commercial|sourcing/))
    return "Vendor / Commercial";
  return "Other Inputs";
}

function sanitizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function buildDimensionEntry(
  family: DiscoveryFamilyCoverage,
  packet: MoveEvidenceNeedPacket | undefined,
): AssessmentDimensionPlanEntry {
  const requirement = packet
    ? requirementForPriority(packet.priority)
    : family.required
      ? "required"
      : "light_touch";

  return {
    dimensionId: family.familyId,
    label: family.label,
    requirement,
    rationale:
      packet?.whyItMatters ??
      "This input anchors the next phase in reviewed evidence instead of unsupported assumptions.",
    requiredEvidenceFamilies: family.required ? [family.familyId] : [],
    source: "archetype",
    status: stateForFamily(family),
    evidenceSourceClass: sourceClassForFamily(family),
  };
}

interface InterviewQuestionTemplate {
  id: string;
  responseType: StageReadinessWorkbookQuestion["responseType"];
  question: (label: string) => string;
  why: (entry: AssessmentDimensionPlanEntry) => string;
  evidence: (packet: MoveEvidenceNeedPacket | undefined) => string[];
  owner: (packet: MoveEvidenceNeedPacket | undefined) => string;
}

const MISSING_EVIDENCE_INTERVIEW_TEMPLATES: InterviewQuestionTemplate[] = [
  {
    id: "current_state",
    responseType: "text",
    question: (label) =>
      `Describe the current-state reality for ${label.toLowerCase()}: what happens today, where it starts and ends, and which teams touch it.`,
    why: (entry) =>
      `${entry.rationale} Start with the operating path so the next phase does not design against a generic workflow.`,
    evidence: (packet) => [
      ...(packet?.acceptedFormats.map((format) => `${format} source`) ?? []),
      "Current-state workflow notes",
      "Interview transcript or operating notes",
    ],
    owner: (packet) => packet?.ownerSource ?? "Process owner / accountable SME",
  },
  {
    id: "volume_baseline",
    responseType: "text",
    question: (label) =>
      `What volumes, frequency, cycle times, backlog, cost, quality, or service metrics should anchor ${label.toLowerCase()}? Include period, population, and known data gaps.`,
    why: () =>
      "The workbook needs the denominator, period, and population before any value, staffing, or prioritization claim is safe.",
    evidence: () => [
      "KPI export",
      "Queue or case-volume report",
      "Finance or operations baseline",
    ],
    owner: () => "Operations owner + Finance / analytics",
  },
  {
    id: "systems_data",
    responseType: "text",
    question: (label) =>
      `Which systems, data fields, files, reports, or knowledge sources prove ${label.toLowerCase()}? Name the system of record, refresh cadence, owner, and access constraint.`,
    why: () =>
      "P2 needs sourceable records, not just recollection. This also separates client facts from assumptions and reference patterns.",
    evidence: () => [
      "System inventory",
      "Data extract",
      "Report screenshot",
      "Access or lineage note",
    ],
    owner: () => "Data owner / system owner",
  },
  {
    id: "exceptions_controls",
    responseType: "text",
    question: (label) =>
      `Where does ${label.toLowerCase()} fail, vary by segment, require escalation, or carry risk? Capture exceptions, controls, decision rights, and review triggers.`,
    why: () =>
      "The useful design constraints usually sit in exceptions, controls, and escalation paths rather than in the happy path.",
    evidence: () => [
      "Exception log",
      "Controls matrix",
      "Policy excerpt",
      "Escalation or audit sample",
    ],
    owner: () => "Risk / compliance owner + process owner",
  },
  {
    id: "decision_owner",
    responseType: "text",
    question: (label) =>
      `Who can confirm ${label.toLowerCase()}, what evidence will they upload, and what open decision must be resolved before the next phase?`,
    why: () =>
      "Every gap needs an accountable owner and an explicit next action, otherwise the workbook becomes a list of interesting questions rather than a route to phase readiness.",
    evidence: () => [
      "Named owner",
      "Decision note",
      "Uploaded file list",
      "Known gap rationale",
    ],
    owner: (packet) => packet?.ownerSource ?? "Accountable executive delegate",
  },
];

const PREFILLED_EVIDENCE_VALIDATION_TEMPLATES: InterviewQuestionTemplate[] = [
  {
    id: "confirm_currency",
    responseType: "yes_no_partial",
    question: (label) =>
      `Confirm whether the pre-filled evidence for ${label.toLowerCase()} is current, complete, and still representative of the operating reality.`,
    why: (entry) => entry.rationale,
    evidence: (packet) =>
      packet?.acceptedFormats.map((format) => `${format} source`) ?? [
        "Approved evidence reference",
      ],
    owner: (packet) => packet?.ownerSource ?? "Client owner / evidence steward",
  },
  {
    id: "changed_since_capture",
    responseType: "text",
    question: (label) =>
      `What changed since the evidence for ${label.toLowerCase()} was captured? Call out date changes, scope changes, system changes, policy changes, and volume shifts.`,
    why: () =>
      "A pre-filled row is useful only if it is still current enough to guide the next phase.",
    evidence: () => [
      "Updated note",
      "Recent KPI extract",
      "Change log",
      "Owner attestation",
    ],
    owner: () => "Evidence owner / process owner",
  },
  {
    id: "known_gaps",
    responseType: "text",
    question: (label) =>
      `What is not covered by the existing ${label.toLowerCase()} evidence, and what file or interview would close that gap?`,
    why: () =>
      "Validated evidence should preserve known gaps instead of hiding them behind a confirmed status.",
    evidence: () => ["Gap note", "Follow-up file", "Interview owner"],
    owner: () => "Evidence steward",
  },
];

export function buildAssessmentDimensionPlan(input: {
  moveId: string;
  phase: number;
  nextPhase: number;
  archetype: string;
  readiness: DiscoveryEvidenceReadiness;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
}): AssessmentDimensionPlan {
  const packets = packetByFamilyId(input.evidenceNeedPackets);
  return {
    moveId: input.moveId,
    phase: input.phase,
    nextPhase: input.nextPhase,
    archetype: input.archetype,
    dimensions: input.readiness.families.map((family) =>
      buildDimensionEntry(family, packets.get(family.familyId)),
    ),
  };
}

function buildQuestions(
  family: DiscoveryFamilyCoverage,
  entry: AssessmentDimensionPlanEntry,
  packet: MoveEvidenceNeedPacket | undefined,
): StageReadinessWorkbookQuestion[] {
  const templates =
    family.status === "covered"
      ? PREFILLED_EVIDENCE_VALIDATION_TEMPLATES
      : MISSING_EVIDENCE_INTERVIEW_TEMPLATES;

  return templates.map((template) => ({
    questionId: `q_${sanitizeId(family.familyId)}_${template.id}`,
    dimensionId: family.familyId,
    question: template.question(family.label),
    whyItMatters: template.why(entry),
    responseType: template.responseType,
    suggestedEvidence: template.evidence(packet),
    likelyOwnerRole: template.owner(packet),
    required: entry.requirement === "required",
    state: entry.status,
    prefilledResponse:
      family.status === "covered" && template.id === "confirm_currency"
        ? `Available evidence: ${family.evidenceTitles.join("; ")}`
        : null,
    evidenceRefs: family.evidenceIds,
    sourceClass: entry.evidenceSourceClass,
  }));
}

function groupTabs(
  questions: StageReadinessWorkbookQuestion[],
): StageReadinessWorkbookTab[] {
  const grouped = new Map<string, StageReadinessWorkbookQuestion[]>();
  for (const question of questions) {
    const tab = tabForFamily(question.dimensionId, question.question);
    const list = grouped.get(tab) ?? [];
    list.push(question);
    grouped.set(tab, list);
  }

  return Array.from(grouped.entries()).map(([title, tabQuestions]) => ({
    tabId: sanitizeId(title),
    title,
    requirementSummary: `${tabQuestions.filter((q) => q.required).length} required, ${
      tabQuestions.length
    } total`,
    questions: tabQuestions,
  }));
}

function suggestedSessions(tabs: StageReadinessWorkbookTab[]) {
  return tabs.map((tab) => ({
    session: tab.title,
    participants:
      tab.title === "Performance & Value"
        ? "Operations owner + Finance"
        : tab.title === "Risk, Security & Controls"
          ? "Security / compliance owner + process owner"
          : tab.title === "Technology & Integration" ||
              tab.title === "Data & Quality"
            ? "Architecture / data owner + process owner"
            : "Process owner + accountable SME",
    tabs: [tab.title],
    typicalTime: tab.questions.length > 8 ? "60-90 min" : "45-60 min",
  }));
}

function contentHash(
  specWithoutHash: Omit<StageReadinessWorkbookSpec, "metadata">,
): string {
  return createHash("sha256")
    .update(JSON.stringify(specWithoutHash))
    .digest("hex")
    .slice(0, 24);
}

export function buildStageReadinessWorkbookSpec(
  input: BuildStageReadinessWorkbookSpecInput,
): StageReadinessWorkbookSpec {
  const packets = packetByFamilyId(input.evidenceNeedPackets);
  const dimensionPlan = buildAssessmentDimensionPlan(input);
  const questions = input.readiness.families.flatMap((family) => {
    const entry = dimensionPlan.dimensions.find(
      (dimension) => dimension.dimensionId === family.familyId,
    );
    if (!entry) {
      throw new Error(`Missing dimension plan entry for ${family.familyId}`);
    }
    return buildQuestions(family, entry, packets.get(family.familyId));
  });
  const tabs = groupTabs(questions);
  const openItems = questions
    .filter((question) =>
      ["needs_answer", "insufficient_evidence"].includes(question.state),
    )
    .map((question) => {
      const packet = packets.get(question.dimensionId);
      return {
        questionId: question.questionId,
        dimensionId: question.dimensionId,
        title: question.question,
        owner: question.likelyOwnerRole,
        status: question.state,
        nextAction:
          packet?.nextAction ??
          "Provide the source evidence or mark the item not applicable with rationale.",
        blocksNextPhase: question.required,
      };
    });

  const requiredAreas = dimensionPlan.dimensions.filter(
    (dimension) => dimension.requirement === "required",
  ).length;
  const recommendedAreas = dimensionPlan.dimensions.filter(
    (dimension) => dimension.requirement === "recommended",
  ).length;

  const specWithoutHash = {
    workbookId: `${input.moveId}:p${input.phase}-p${input.nextPhase}:stage-readiness`,
    workbookVersion: "1",
    contractVersion: STAGE_READINESS_WORKBOOK_CONTRACT_VERSION,
    moveId: input.moveId,
    moveName: input.moveName,
    phase: input.phase,
    nextPhase: input.nextPhase,
    artifactName: `${workbookName(input.phase, input.nextPhase)} — ${input.moveName}`,
    archetype: input.archetype,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    dimensionPlan,
    startHere: {
      purpose:
        "Prepare the next phase without asking for information already available in approved evidence.",
      alreadyPrefilled: questions.filter(
        (q) => q.state === "prefilled_confirmed",
      ).length,
      needsInput: openItems.length,
      requiredAreas,
      recommendedAreas,
      suggestedSessions: suggestedSessions(tabs),
    },
    tabs,
    evidenceAndOpenItems: openItems,
  } satisfies Omit<StageReadinessWorkbookSpec, "metadata">;

  return {
    ...specWithoutHash,
    metadata: {
      workbookContentHash: contentHash(specWithoutHash),
      artifactVersion: input.artifactVersion,
      dimensionPlanVersion: STAGE_READINESS_DIMENSION_PLAN_VERSION,
      source: "deterministic_stage_readiness_resolver",
    },
  };
}
