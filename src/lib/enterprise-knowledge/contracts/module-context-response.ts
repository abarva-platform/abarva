import type { ClaudeReadyContextPayload, ContextPack } from "./context-pack";

export interface ModuleContextExplanation {
  summary: string;
  strengths: string[];
  limitations: string[];
  supportedQuestions: string[];
  unsupportedQuestions: string[];
  nextActions: string[];
}

export interface ModuleContextResponse {
  requestId: string;
  generatedAt: string;
  contextPack: ContextPack;
  explanation: ModuleContextExplanation;
  claudeReadyPayload: ClaudeReadyContextPayload;
}
