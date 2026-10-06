import type { ProductSurfaceKey } from "@/lib/agent/product-truth/surface-scope";

export type AvaModuleExpertSurface = Extract<
  ProductSurfaceKey,
  "moves" | "source" | "tower" | "intelligence"
>;

export interface AvaModuleAnswerModeClassification<Mode extends string> {
  mode: Mode;
}

export interface AvaModuleTopicAwareness {
  relevant: boolean;
  matchedKeywords: string[];
  suggestion: string | null;
}

export interface AvaModulePacketBase<Surface extends AvaModuleExpertSurface> {
  surface: Surface;
  tenant: string;
  missingInputs: string[];
  caveats: string[];
  allowedActions: string[];
  disallowedActions: string[];
}

export interface AvaModuleOptionalInputField<Input> {
  key: keyof Input;
  label: string;
}

export interface AvaModuleQualityGateResult<CheckId extends string> {
  pass: boolean;
  checks: Record<CheckId, boolean>;
  failedChecks: CheckId[];
  repairInstructions: string[];
}

export interface AvaModuleExpertContract<
  Surface extends AvaModuleExpertSurface,
  Packet extends AvaModulePacketBase<Surface>,
  PacketInput,
  Mode extends string,
  QualityResult,
  Classification extends AvaModuleAnswerModeClassification<Mode> =
    AvaModuleAnswerModeClassification<Mode>,
  ClassifyInput = string,
> {
  surface: Surface;
  classifyQuestion: (input: ClassifyInput) => Classification;
  shouldBuildPacket: (args: { hardeningEnabled: boolean; mode: Mode }) => boolean;
  buildPacket: (input: PacketInput, questionText: string) => Packet;
  formatPrompt: (packet: Packet, mode: Mode) => string;
  runQualityGate: (text: string, packet: Packet, mode: Mode) => QualityResult;
}

export function isAvaModuleInputPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function collectMissingAvaModuleInputs<Input>(
  input: Input,
  fields: ReadonlyArray<AvaModuleOptionalInputField<Input>>,
): string[] {
  return fields
    .filter(({ key }) => !isAvaModuleInputPresent(input[key]))
    .map(({ label }) => label);
}

export function buildAvaModuleCaveats(missingInputs: readonly string[]): string[] {
  return missingInputs.map(
    (label) => `${label} was not loaded this turn — treat as needs confirmation, do not guess.`,
  );
}

export function textMentionsAny(text: string, needles: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}
