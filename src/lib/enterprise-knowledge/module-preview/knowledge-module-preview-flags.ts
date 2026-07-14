import type { KnowledgeModuleKey } from "../contracts";

export const KNOWLEDGE_MODULE_PREVIEW_FLAGS = {
  moves: "ENABLE_KNOWLEDGE_LAYER_MOVES_PREVIEW",
  intelligence: "ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_PREVIEW",
} as const satisfies Partial<Record<KnowledgeModuleKey, string>>;

export type KnowledgeModulePreviewKey = keyof typeof KNOWLEDGE_MODULE_PREVIEW_FLAGS;

export function isKnowledgeModulePreviewEnabled(
  moduleKey: KnowledgeModulePreviewKey,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[KNOWLEDGE_MODULE_PREVIEW_FLAGS[moduleKey]] === "true";
}
