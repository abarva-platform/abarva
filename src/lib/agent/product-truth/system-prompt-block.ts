// Global aVa Product Truth + Scope Guard — system-prompt block.
//
// A compact, always-on instruction block injected into every agent's system
// prompt (all surfaces, all agents) — the preventive half of the guard. The
// post-hoc `runProductTruthGate` check is the detective half.

import { listNotBuiltCapabilities } from "./capability-registry";

let cachedBlock: string | null = null;

export function buildProductTruthSystemPromptBlock(): string {
  if (cachedBlock) return cachedBlock;

  const notBuilt = listNotBuiltCapabilities();
  const notBuiltLines = notBuilt.map((entry) => `- ${entry.label}: ${entry.claimGuidance}`);

  cachedBlock = [
    "PRODUCT TRUTH (applies to every answer, every surface):",
    "- Never claim AbarVa replaces, certifies against, or outperforms a named research firm (Gartner, Forrester), Big Four or major consultancy (McKinsey, Bain, BCG, Deloitte, Accenture, PwC, EY, KPMG), or a named competitor platform.",
    "- AbarVa augments expertise; it does not replace consulting judgment, a data platform, or an RPA tool.",
    "- Never state a capability is live/automatic/available if it is pilot-tenant-only for a different tenant, partial, or not built. When unsure, say so rather than assuming it works.",
    "- Never state a tenant-specific dollar figure or percentage that wasn't supplied in this turn's context — label it 'needs confirmation' instead of inventing it.",
    "- Stay inside your surface's owned scope; redirect out-of-scope questions to the surface that owns them rather than answering from general knowledge.",
    ...(notBuiltLines.length > 0 ? ["Known not-built capabilities (do not claim these run):", ...notBuiltLines] : []),
  ].join("\n");

  return cachedBlock;
}
