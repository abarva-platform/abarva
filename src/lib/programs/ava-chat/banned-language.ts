// Moves aVa chat hardening — banned-language guard.
//
// Deterministic post-hoc scan for the behaviors the product spec explicitly
// bans: deflecting to Claude, leaking internal implementation terms, and
// claiming a workflow action (approval, advancement, promotion) happened
// through chat alone. Modeled on the existing pattern in
// src/lib/agent/voice-doctrine/nexus.ts (checkNexusVoice) and
// src/lib/source/ava/answer-quality-gate.ts: violations only, no
// auto-repair — the caller decides what to do with them.

export type MovesAvaBannedLanguageCategory =
  | "model_deflection"
  | "internal_leak"
  | "workflow_bypass_claim";

export interface MovesAvaBannedLanguageViolation {
  id: string;
  category: MovesAvaBannedLanguageCategory;
  matchedText: string;
}

interface BannedPattern {
  id: string;
  category: MovesAvaBannedLanguageCategory;
  pattern: RegExp;
}

const BANNED_PATTERNS: readonly BannedPattern[] = [
  // model_deflection — never position Claude as a separate, better option.
  {
    id: "mv-deflect-1",
    category: "model_deflection",
    pattern: /\bask claude\b/i,
  },
  {
    id: "mv-deflect-2",
    category: "model_deflection",
    pattern: /\bclaude can (give|provide|do)\b/i,
  },
  {
    id: "mv-deflect-3",
    category: "model_deflection",
    pattern: /\bgo to claude\b/i,
  },
  {
    id: "mv-deflect-4",
    category: "model_deflection",
    pattern: /better answer from (claude|the model|the ai model)/i,
  },
  // internal_leak — no raw IDs, schema, route, or packet-field names.
  {
    id: "mv-leak-1",
    category: "internal_leak",
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    id: "mv-leak-2",
    category: "internal_leak",
    pattern: /\b(moveId|programId|surfaceContext|tenantKey|packet\.\w+)\b/,
  },
  {
    id: "mv-leak-3",
    category: "internal_leak",
    pattern: /\b(engagements table|program_evidence_items|gate_approvals table)\b/i,
  },
  // workflow_bypass_claim — chat must never claim it did the workflow step.
  {
    id: "mv-bypass-1",
    category: "workflow_bypass_claim",
    pattern: /\bi('ve| have) approved\b/i,
  },
  {
    id: "mv-bypass-2",
    category: "workflow_bypass_claim",
    pattern: /\bi('ve| have) advanced (the|this) phase\b/i,
  },
  {
    id: "mv-bypass-3",
    category: "workflow_bypass_claim",
    pattern: /\b(this|the) (upload|evidence) (has been|is) approved\b/i,
  },
  {
    id: "mv-bypass-4",
    category: "workflow_bypass_claim",
    pattern: /\bpromoted to enterprise context\b/i,
  },
  {
    id: "mv-bypass-5",
    category: "workflow_bypass_claim",
    pattern: /\b(gate|phase) (has been|is) (now )?advanced\b/i,
  },
];

export interface MovesAvaBannedLanguageResult {
  pass: boolean;
  violations: MovesAvaBannedLanguageViolation[];
}

export function checkMovesAvaBannedLanguage(
  text: string,
): MovesAvaBannedLanguageResult {
  const violations: MovesAvaBannedLanguageViolation[] = [];
  for (const { id, category, pattern } of BANNED_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({ id, category, matchedText: match[0] });
    }
  }
  return { pass: violations.length === 0, violations };
}
