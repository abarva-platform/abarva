import assert from "node:assert/strict";
import { test } from "node:test";
import { admissionIssues } from "../readback_synthetic_enterprise_v2";

test("independent admission rejects missing, drifted and unexpected families", () => {
  assert.deepEqual(admissionIssues({ applications: 344, modules: 726 }, {
    applications: 344, modules: 726,
  }), []);
  assert.deepEqual(admissionIssues({ applications: 24, modules: 726 }, {
    applications: 344, modules: 726,
  }), ["applications: expected 344, read 24"]);
  assert.deepEqual(admissionIssues({ applications: 344, extra: 1 }, {
    applications: 344, modules: 726,
  }), ["modules: expected 726, read missing", "extra: expected undefined, read 1"]);
});
