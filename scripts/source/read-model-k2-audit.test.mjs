import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  auditReadModelContract,
  K2_REQUIREMENTS,
  renderK2AuditMarkdown,
} from "./read-model-k2-audit.mjs";

const SOURCE = readFileSync(
  new URL("../../src/lib/source/data-model/read-model-inventory.ts", import.meta.url),
  "utf8",
);

test("measures all nine K2 properties against thirteen proposed models", () => {
  const audit = auditReadModelContract(SOURCE);
  assert.equal(audit.models.length, 13);
  assert.equal(K2_REQUIREMENTS.length, 9);
  assert.deepEqual(
    audit.support.map(({ property, expressible }) => [property, expressible]),
    [
      ["reconciliation", true],
      ["denominator", true],
      ["oppositeTenantQuery", true],
      ["fieldAuthority", true],
      ["projectionTrigger", true],
      ["acceptableDelay", true],
      ["asOfDate", true],
      ["staleBehavior", true],
      ["avaMayAnswerWhileStale", false],
    ],
  );
  for (const model of audit.models) {
    assert.equal(model.state, "proposed");
    assert.deepEqual(model.cells.slice(0, 8), Array(8).fill("absent"));
    assert.equal(model.cells[8], "unexpressible");
  }
});

test("prose in another field is not counted as a K2 declaration", () => {
  const withProse = SOURCE.replace(
    'consumingSurface: "Requests and active Events"',
    'consumingSurface: "Requests and active Events; fieldAuthority: accepted"',
  );
  assert.notEqual(withProse, SOURCE);
  const audit = auditReadModelContract(withProse);
  assert.equal(audit.models[0].cells[3], "absent");
});

test("a re-spelled contract field becomes unexpressible, not silently present", () => {
  const mutated = SOURCE.replace("fieldAuthority?: string;", "fieldAuthroity?: string;");
  assert.notEqual(mutated, SOURCE);
  const audit = auditReadModelContract(mutated);
  assert.equal(audit.support[3].expressible, false);
  assert.equal(audit.models[0].cells[3], "unexpressible");
});

test("a re-spelled union member also removes expressibility", () => {
  const mutated = SOURCE.replace('  | "fieldAuthority"', '  | "fieldAuthroity"');
  assert.notEqual(mutated, SOURCE);
  assert.equal(auditReadModelContract(mutated).support[3].expressible, false);
});

test("only a named declaration turns a model cell from absent to declared", () => {
  const withField = SOURCE.replace(
    'consumingSurface: "Requests and active Events", state: "proposed"',
    'consumingSurface: "Requests and active Events", fieldAuthority: "accepted fields", state: "proposed"',
  );
  assert.notEqual(withField, SOURCE);
  const audit = auditReadModelContract(withField);
  assert.equal(audit.models[0].cells[3], "declared");
  assert.equal(audit.models[1].cells[3], "absent");
});

test("the missing aVa-staleness slot becomes detectable when actually declared", () => {
  const extended = SOURCE.replace(
    '  | "buildJob";',
    '  | "buildJob"\n  | "avaMayAnswerWhileStale";',
  ).replace(
    "  buildJob?: string;",
    "  buildJob?: string;\n  avaMayAnswerWhileStale?: string;",
  );
  assert.notEqual(extended, SOURCE);
  const audit = auditReadModelContract(extended);
  assert.equal(audit.support[8].expressible, true);
  assert.equal(audit.models[0].cells[8], "absent");
});

test("the published thirteen-by-nine matrix matches the parsed contract", () => {
  const report = readFileSync(
    new URL("../../docs/architecture/source-k2-read-model-gap-audit.md", import.meta.url),
    "utf8",
  );
  assert.ok(report.includes(renderK2AuditMarkdown(auditReadModelContract(SOURCE))));
});
