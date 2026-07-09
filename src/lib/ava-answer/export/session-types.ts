import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

export type AvaChatSessionExportFormat = "html" | "pdf";

export interface AvaChatSessionExportTurn {
  id: string;
  role: "user" | "agent";
  body: string;
  at?: string;
  answer?: AvaAnswerPacket | null;
}

export interface AvaChatSessionExport {
  title?: string;
  surface: string;
  tenantKey?: string;
  turns: AvaChatSessionExportTurn[];
}

export interface AvaChatSessionExportStats {
  userTurns: number;
  agentTurns: number;
  answerPackets: number;
  charts: number;
  tables: number;
  graphs: number;
  citations: number;
  blockedAnswers: number;
  warningFindings: number;
}
