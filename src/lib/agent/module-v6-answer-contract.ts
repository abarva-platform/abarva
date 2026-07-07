import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";

export const MODULE_V6_ANSWER_CONTRACT_VERSION =
  "module-v6-answer-contract-2026-07-01";

export type ModuleV6Surface = "tower" | "intelligence" | "source" | "moves";

export type ModuleV6PacketType =
  | "metric-read-model"
  | "advisory-packet"
  | "vendor-commercial-packet"
  | "execution-sequence-packet";

export interface ModuleV6PacketContract {
  version: typeof MODULE_V6_ANSWER_CONTRACT_VERSION;
  surface: ModuleV6Surface;
  packetType: ModuleV6PacketType;
  tenantKey: string;
  tenantName: string;
  question: string;
  packetSummary: string;
  requiredEvidenceFamilies: string[];
  availableEvidenceFamilies: string[];
  missingEvidence: string[];
  claudeOwnsVisibleOutput: true;
  rendererRole: "placement_only";
}

export interface ModuleV6VisibleSection {
  id: string;
  label: string;
  modelText: string;
  renderedText?: string | null;
}

export interface ModuleV6VisibleSectionParity {
  id: string;
  label: string;
  modelText: string;
  renderedText: string;
  byteEqualExceptWhitespace: boolean;
}

export interface ModuleV6VisibleOutputAudit {
  version: typeof MODULE_V6_ANSWER_CONTRACT_VERSION;
  surface: ModuleV6Surface;
  packetType: ModuleV6PacketType;
  answerSource: "claude_text" | "deterministic_contract" | "contract_failed";
  claudeInvoked: boolean;
  claudeSelected: boolean;
  fallbackUsed: boolean;
  rawClaudePreserved: boolean;
  visibleSectionParity: ModuleV6VisibleSectionParity[];
  validationErrors: string[];
}

export function buildModuleV6PacketContract(args: {
  surface: ModuleV6Surface;
  packetType: ModuleV6PacketType;
  tenantKey: string;
  tenantName: string;
  question: string;
  packetSummary: string;
  requiredEvidenceFamilies?: readonly string[];
  availableEvidenceFamilies?: readonly string[];
  missingEvidence?: readonly string[];
}): ModuleV6PacketContract {
  return {
    version: MODULE_V6_ANSWER_CONTRACT_VERSION,
    surface: args.surface,
    packetType: args.packetType,
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    packetSummary: args.packetSummary,
    requiredEvidenceFamilies: [...(args.requiredEvidenceFamilies ?? [])],
    availableEvidenceFamilies: [...(args.availableEvidenceFamilies ?? [])],
    missingEvidence: [...(args.missingEvidence ?? [])],
    claudeOwnsVisibleOutput: true,
    rendererRole: "placement_only",
  };
}

export function moduleV6VisibleOutputInstructions(
  contract: Pick<ModuleV6PacketContract, "surface" | "packetType">,
): string {
  return [
    "V6 visible-output contract:",
    `- Surface: ${contract.surface}.`,
    `- Packet type: ${contract.packetType}.`,
    "- Claude must produce every user-visible answer word and every tab/pane payload.",
    "- The API and renderer may parse markers or JSON only to place content into panes.",
    "- The API and renderer must not rewrite prose, replace labels, summarize, scrub, infer, or improve the model output.",
    "- Validation compares model_output to rendered_text for each visible section, byte-for-byte except whitespace.",
    "- If a required visual or tab is missing, state the missing output as a contract failure; do not synthesize a replacement outside the model.",
  ].join("\n");
}

export function moduleV6PacketPromptBlock(
  contract: ModuleV6PacketContract,
): string {
  return [
    "V6 packet contract:",
    JSON.stringify(contract, null, 2),
    "",
    `Visible tenant identity requirement: start the first user-visible sentence with the exact tenant display name "${contract.tenantName}".`,
    "Do not use legacy customer names if the tenantName is a generic demo label.",
    "",
    moduleV6VisibleOutputInstructions(contract),
  ].join("\n");
}

export function normalizeModuleVisibleText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function computeModuleV6VisibleSectionParity(
  sections: readonly ModuleV6VisibleSection[],
): ModuleV6VisibleSectionParity[] {
  return sections.map((section) => {
    const renderedText = section.renderedText ?? section.modelText;
    return {
      id: section.id,
      label: section.label,
      modelText: section.modelText,
      renderedText,
      byteEqualExceptWhitespace:
        normalizeModuleVisibleText(section.modelText) ===
        normalizeModuleVisibleText(renderedText),
    };
  });
}

export function buildModuleV6VisibleOutputAudit(args: {
  surface: ModuleV6Surface;
  packetType: ModuleV6PacketType;
  answerSource: ModuleV6VisibleOutputAudit["answerSource"];
  claudeInvoked: boolean;
  claudeSelected: boolean;
  fallbackUsed: boolean;
  rawClaudePreserved: boolean;
  sections: readonly ModuleV6VisibleSection[];
  validationErrors?: readonly string[];
}): ModuleV6VisibleOutputAudit {
  const visibleSectionParity = computeModuleV6VisibleSectionParity(
    args.sections,
  );
  const parityErrors = visibleSectionParity
    .filter((section) => !section.byteEqualExceptWhitespace)
    .map((section) => `visible_section_mutated:${section.id}`);
  return {
    version: MODULE_V6_ANSWER_CONTRACT_VERSION,
    surface: args.surface,
    packetType: args.packetType,
    answerSource: args.answerSource,
    claudeInvoked: args.claudeInvoked,
    claudeSelected: args.claudeSelected,
    fallbackUsed: args.fallbackUsed,
    rawClaudePreserved: args.rawClaudePreserved,
    visibleSectionParity,
    validationErrors: [
      ...new Set([...(args.validationErrors ?? []), ...parityErrors]),
    ],
  };
}

export function collectModuleV6VisibleText(
  sections: readonly ModuleV6VisibleSection[],
): string {
  return sections
    .map((section) => section.modelText)
    .filter(Boolean)
    .join("\n");
}

export function validateModuleV6VisibleSections(
  sections: readonly ModuleV6VisibleSection[],
): string[] {
  const issues: string[] = [];
  if (sections.length === 0) issues.push("no_visible_sections");
  for (const section of sections) {
    const visible = assertVisibleAnswerContract(section.modelText);
    if (!visible.passed) {
      issues.push(
        ...visible.violations.map(
          (violation) => `${section.id}:${violation.id}`,
        ),
      );
    }
  }
  return [...new Set(issues)];
}
