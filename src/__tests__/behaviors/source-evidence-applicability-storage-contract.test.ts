import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { permitsAbsenceDeclaration } from "@/lib/source/evidence-authority";

const originalPath = join(
  process.cwd(),
  "supabase/migrations/20260928075400_source_evidence_applicability.sql",
);
const extensionPath = join(
  process.cwd(),
  "supabase/migrations/20260930003800_source_scope_prior_baseline_applicability.sql",
);
const currentSowPath = join(
  process.cwd(),
  "supabase/migrations/20260930082400_source_scope_current_sow_applicability.sql",
);

function checkExpression(sql: string): string {
  const match = sql.match(
    /ADD CONSTRAINT source_event_evidence_applicability_check CHECK \(([\s\S]*?)\n  \);/,
  );
  expect(match).not.toBeNull();
  return match![1]
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

describe("Source evidence applicability storage contract", () => {
  it("extends only the named absence allowlist without weakening the existing guard", () => {
    expect(existsSync(extensionPath)).toBe(true);
    const original = readFileSync(originalPath, "utf8");
    const extension = readFileSync(extensionPath, "utf8");

    expect(extension).toMatch(/^BEGIN;\s+ALTER TABLE public\.source_event_evidence_states\s+DROP CONSTRAINT source_event_evidence_applicability_check;/);
    expect(extension.trimEnd()).toMatch(/COMMIT;$/);
    const expected = checkExpression(original).replace(
      "'EVID-SRC-STR-SPEND-BASELINE'",
      "'EVID-SRC-STR-SPEND-BASELINE', 'EVID-SRC-SCOPE-FY-CONTRACT'",
    );
    expect(checkExpression(extension)).toBe(expected);
  });

  it("preserves the prior migration's allowed subset in the application", () => {
    expect(existsSync(extensionPath)).toBe(true);
    const extension = readFileSync(extensionPath, "utf8");
    const allowed = [...checkExpression(extension).matchAll(/'EVID-SRC-[A-Z-]+'/g)]
      .map(([value]) => value.slice(1, -1));

    expect(allowed).toEqual([
      "EVID-SRC-STR-INCUMBENT",
      "EVID-SRC-STR-SPEND-BASELINE",
      "EVID-SRC-SCOPE-FY-CONTRACT",
    ]);
    for (const requirementId of allowed) {
      expect(permitsAbsenceDeclaration(requirementId)).toBe(true);
    }
  });

  it("adds only the current-SOW absence case after the prior-baseline migration", () => {
    expect(existsSync(currentSowPath)).toBe(true);
    const prior = readFileSync(extensionPath, "utf8");
    const current = readFileSync(currentSowPath, "utf8");
    expect(current).toMatch(/^BEGIN;\s+ALTER TABLE public\.source_event_evidence_states\s+DROP CONSTRAINT source_event_evidence_applicability_check;/);
    expect(current.trimEnd()).toMatch(/COMMIT;$/);
    expect(checkExpression(current)).toBe(checkExpression(prior).replace(
      "'EVID-SRC-SCOPE-FY-CONTRACT'",
      "'EVID-SRC-SCOPE-FY-CONTRACT', 'EVID-SRC-SCOPE-CURRENT-SOW'",
    ));
    expect(permitsAbsenceDeclaration("EVID-SRC-SCOPE-CURRENT-SOW")).toBe(true);
    expect(permitsAbsenceDeclaration("EVID-SRC-SCOPE-WORKFORCE")).toBe(false);
  });
});
