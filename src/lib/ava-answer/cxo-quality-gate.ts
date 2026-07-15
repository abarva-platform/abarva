import type {
  AvaAnswerPacket,
  AvaCxoAnswerMode,
  AvaCxoQuality,
  AvaCxoQualityFinding,
} from "@/lib/ava-answer/contract";
import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";

const MODEL_DEFLECTION_RE =
  /\b(?:ask|use|try|go\s+direct(?:ly)?\s+to)\s+(?:claude|chatgpt|the\s+model|an?\s+llm)\b|\b(?:as\s+an?\s+ai|as\s+a\s+language\s+model|i\s+(?:am|can(?:not|'t))\s+(?:only\s+)?(?:an?\s+ai|a\s+model|browse|access\s+the\s+internet)|claude\s+(?:can|could|would|should)|the\s+model\s+(?:can|could|would|should))/i;
const HOLLOW_START_RE =
  /^\s*(?:here\s+(?:are|is)|it\s+depends|great\s+question|excellent\s+question|i\s+can\s+help|i'll\s+help|let\s+me|below\s+is)\b/i;
const EVIDENCE_LANGUAGE_RE =
  /\b(?:loaded|source|evidence|tenant|benchmark|case stud|pattern|corpus|according to|based on)\b/i;
const CAVEAT_LANGUAGE_RE =
  /\b(?:assumption|caveat|validate|confirm|missing|not loaded|not yet|incomplete|unsupported|directional|evidence needed)\b/i;
const NEXT_MOVE_RE =
  /\b(?:next move|next step|sequence|prioriti[sz]e|validate|decide|fund|pilot|scale|assign|stand up|defer|stop)\b/i;
const RAW_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6}|[a-z_][a-z0-9_:-]*\[[^\]\s]{8,}\]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;
const INTERNAL_VISIBLE_LANGUAGE_RE =
  /\b(?:candidate_move|move_id|phase_id|artifact_id|evidence_id|source_record_id|context_pack_id|tenant_id|client_id|program_evidence_items|move_artifacts|substrate|loaded context|loaded evidence|loaded tenant sources|source rows?|edge rows?|debug|packet)\b|\bV\d+(?:[_-][A-Za-z0-9./-]+|\s+(?:substrate|data\s+layer|context\s+layer))\b/i;

export function classifyCxoAnswerMode(input: {
  question: string;
  intent?: string;
}): AvaCxoAnswerMode {
  const q = `${input.question} ${input.intent ?? ""}`.toLowerCase();
  if (/\b(?:compare|portfolio|holdings?|portfolio companies|across companies|rank across)\b/.test(q)) {
    return "portfolio_comparison";
  }
  if (/\b(?:source|sourcing|vendor|renewal|contract|rfx|rfp|supplier|outsource|ams)\b/.test(q)) {
    return "sourcing_decision";
  }
  if (/\b(?:roadmap|sequence|wave|phasing|timeline|plan|90 days|quarter|year)\b/.test(q)) {
    return "roadmap";
  }
  if (/\b(?:risk|control|governance|compliance|audit|exposure|safe|board use)\b/.test(q)) {
    return "risk_control";
  }
  if (/\b(?:operating model|centralize|federate|shared service|shared services|roles|org|organization)\b/.test(q)) {
    return "operating_model";
  }
  if (/\b(?:investment|invest|fund|value case|business case|roi|savings|payback|benefit)\b/.test(q)) {
    return "investment_case";
  }
  if (/\b(?:current state|diagnos|what is loaded|loaded vs inferred|missing|readiness|state of)\b/.test(q)) {
    return "tenant_diagnosis";
  }
  if (/\b(?:industry|trend|case stud|benchmark|what are others|market|adoption)\b/.test(q)) {
    return "industry_trend";
  }
  if (/\b(?:strategy|strategic|where should|what should|top \d|prioriti[sz]e)\b/.test(q)) {
    return "strategy_insight";
  }
  return "direct_fact";
}

function hasVisualRequest(question: string): boolean {
  return /\b(?:chart|graph|visual|visuali[sz]e|plot|2\s*x\s*2|2x2|quadrant|matrix|table|scorecard|rank)\b/i.test(
    question,
  );
}

function requestedVisualKinds(question: string): Array<"table" | "chart" | "graph"> {
  const kinds = new Set<"table" | "chart" | "graph">();
  if (/\b(?:table|scorecard|rank|matrix|compare|comparison|top \d)\b/i.test(question)) {
    kinds.add("table");
  }
  if (/\b(?:chart|visual|visuali[sz]e|plot|2\s*x\s*2|2x2|quadrant|trend|over time)\b/i.test(question)) {
    kinds.add("chart");
  }
  if (/\b(?:graph|relationship|relationships|dependency|dependencies|network|map)\b/i.test(question)) {
    kinds.add("graph");
  }
  return [...kinds];
}

function visibleArtifactKinds(answer: AvaAnswerPacket): Set<"table" | "chart" | "graph"> {
  const kinds = new Set<"table" | "chart" | "graph">();
  for (const artifact of answer.artifacts.filter(isVisibleAvaArtifact)) {
    if (artifact.artifact === "table") kinds.add("table");
    if (artifact.artifact === "chart") kinds.add("chart");
    if (artifact.artifact === "graph") kinds.add("graph");
  }
  return kinds;
}

function combinedPublicText(answer: AvaAnswerPacket): string {
  return [
    answer.directAnswer,
    answer.interpretation,
    answer.businessImplication,
    answer.recommendation,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function hasSourceBackedMaterial(answer: AvaAnswerPacket): boolean {
  return (
    answer.citations.length > 0 ||
    answer.factsUsed.length > 0 ||
    answer.metricsUsed.length > 0 ||
    answer.relationshipsUsed.length > 0 ||
    (answer.corpusUsed?.length ?? 0) > 0
  );
}

function requiresAdvisoryCompleteness(mode: AvaCxoAnswerMode): boolean {
  return mode !== "direct_fact";
}

function pushFinding(
  findings: AvaCxoQualityFinding[],
  finding: AvaCxoQualityFinding,
) {
  findings.push(finding);
}

export function evaluateCxoAnswerQuality(
  answer: AvaAnswerPacket,
): AvaCxoQuality {
  const mode = classifyCxoAnswerMode({
    question: answer.question,
    intent: answer.intent,
  });
  const text = combinedPublicText(answer);
  const findings: AvaCxoQualityFinding[] = [];

  if (MODEL_DEFLECTION_RE.test(text)) {
    pushFinding(findings, {
      code: "model-deflection-language",
      severity: "error",
      message:
        "Answer deflects to Claude, an LLM, or model capability instead of responding as aVa.",
      field: "directAnswer",
    });
  }
  if (RAW_ID_RE.test(text)) {
    pushFinding(findings, {
      code: "raw-internal-id",
      severity: "error",
      message: "Answer exposes an internal ID or record handle.",
      field: "directAnswer",
    });
  }
  if (INTERNAL_VISIBLE_LANGUAGE_RE.test(text)) {
    pushFinding(findings, {
      code: "internal-visible-language",
      severity: "error",
      message:
        "Visible CXO answer exposes internal product, data-layer, or trace language.",
      field: "directAnswer",
    });
  }
  if (answer.status === "answered" && HOLLOW_START_RE.test(text)) {
    pushFinding(findings, {
      code: "weak-executive-opener",
      severity: "warning",
      message:
        "Answer should open with the executive read, not a generic acknowledgement.",
      field: "directAnswer",
    });
  }

  const visibleKinds = visibleArtifactKinds(answer);
  if (hasVisualRequest(answer.question)) {
    for (const kind of requestedVisualKinds(answer.question)) {
      if (!visibleKinds.has(kind)) {
        pushFinding(findings, {
          code: `missing-${kind}-artifact`,
          severity: "warning",
          message: `Question asked for a ${kind}; answer should include a typed ${kind} artifact.`,
          field: "artifacts",
        });
      }
    }
  }

  if (requiresAdvisoryCompleteness(mode)) {
    if (!hasSourceBackedMaterial(answer) && !EVIDENCE_LANGUAGE_RE.test(text)) {
      pushFinding(findings, {
        code: "missing-evidence-boundary",
        severity: "warning",
        message:
          "Advisory answers should say what evidence, corpus, or loaded tenant context supports the read.",
        field: "citations",
      });
    }
    if (
      (answer.quality.evidenceStrength !== "strong" ||
        answer.quality.tenantGrounding !== "complete") &&
      answer.caveats.length === 0 &&
      answer.gaps.length === 0 &&
      !CAVEAT_LANGUAGE_RE.test(text)
    ) {
      pushFinding(findings, {
        code: "missing-caveat-or-evidence-need",
        severity: "warning",
        message:
          "Partial or directional advisory answers need a caveat, assumption, or evidence-needed statement.",
        field: "caveats",
      });
    }
    if (answer.nextSteps.length === 0 && !NEXT_MOVE_RE.test(text)) {
      pushFinding(findings, {
        code: "missing-next-move",
        severity: "warning",
        message:
          "Executive advisory answers should end with an actionable next move.",
        field: "nextSteps",
      });
    }
  }

  const penalty = findings.reduce(
    (total, finding) => total + (finding.severity === "error" ? 35 : 10),
    0,
  );
  const score = Math.max(0, 100 - penalty);
  const passed = findings.every((finding) => finding.severity !== "error");
  return { mode, score, passed, findings };
}
