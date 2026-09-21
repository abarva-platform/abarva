import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSourceAvaLibraryQuarantine } from "./check-source-ava-library-quarantine.mjs";

const payload = {
  ceiling: 1,
  quarantined: [
    {
      suite: "orphan.test.ts",
      owner: "T-407",
      reason: "subject is unreachable",
      subjects: ["src/lib/source/ava/orphan.ts"],
    },
  ],
};
const existing = new Set([
  "src/lib/source/ava/__tests__/orphan.test.ts",
  "src/lib/source/ava/orphan.ts",
]);

test("accepts a named suite whose primary subject remains unreachable", () => {
  assert.deepEqual(
    evaluateSourceAvaLibraryQuarantine(payload, {
      exists: (file) => existing.has(file),
    }),
    [],
  );
});

test("fails when a subject becomes product-reachable", () => {
  const problems = evaluateSourceAvaLibraryQuarantine(payload, {
    exists: (file) => existing.has(file),
    reachable: new Set(["src/lib/source/ava/orphan.ts"]),
  });
  assert.match(problems.join("\n"), /reason expired/);
});

test("fails when the list grows without moving its exact ratchet", () => {
  const problems = evaluateSourceAvaLibraryQuarantine({
    ...payload,
    quarantined: [...payload.quarantined, payload.quarantined[0]],
  });
  assert.match(problems.join("\n"), /does not match ratchet/);
});
