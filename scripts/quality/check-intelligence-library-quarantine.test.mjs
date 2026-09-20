import assert from "node:assert/strict";
import test from "node:test";
import { evaluateIntelligenceLibraryQuarantine } from "./check-intelligence-library-quarantine.mjs";

const payload = {
  ceiling: 1,
  quarantined: [
    {
      suite: "orphan.test.ts",
      owner: "T-406",
      reason: "subject is unreachable",
      subjects: ["src/lib/intelligence/orphan.ts"],
    },
  ],
};
const existing = new Set([
  "src/lib/intelligence/__tests__/orphan.test.ts",
  "src/lib/intelligence/orphan.ts",
]);
const evaluate = (overrides = {}) =>
  evaluateIntelligenceLibraryQuarantine(payload, {
    exists: (file) => existing.has(file),
    reachable: new Set(),
    ...overrides,
  });

test("accepts a named suite whose primary subject remains unreachable", () => {
  assert.deepEqual(evaluate(), []);
});

test("fails when the reason expires because the subject becomes reachable", () => {
  assert.match(
    evaluate({ reachable: new Set(["src/lib/intelligence/orphan.ts"]) }).join(
      "\n",
    ),
    /reason expired/,
  );
});

test("fails when an excluded suite disappears", () => {
  assert.match(evaluate({ exists: () => false }).join("\n"), /missing suite/);
});

test("fails when the list grows without moving the ratchet", () => {
  const grown = {
    ...payload,
    quarantined: [...payload.quarantined, payload.quarantined[0]],
  };
  assert.match(
    evaluateIntelligenceLibraryQuarantine(grown).join("\n"),
    /does not match ratchet/,
  );
});
