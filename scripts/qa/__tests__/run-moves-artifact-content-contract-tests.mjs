#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { evaluateArtifactContent, loadContract } from "../moves-artifact-content-contract.mjs";

const repoRoot = path.resolve(new URL(".", import.meta.url).pathname, "../../..");
const contract = loadContract(path.join(repoRoot, "docs/qa/moves-rich-context-synthetic-acceptance-contract.json"));

const phaseText = {
  1: "1,142,000 open care gaps with a 41.2% overall closure rate. The design-scope-only feed is excluded from launch. An unsupported shadow database has no owner.",
  2: "1,142,000 open care gaps. The prior model was retired and the prior alert was declined. 41 of 86 interface channels are not under source control. The shadow registry remains unsupported.",
  3: "1,142,000 open care gaps. The prior model was retired and the prior alert was declined. 41 of 86 interface channels are not under source control and 33 of 86 are unmonitored. Data Governance Lead is vacant. The shadow registry remains unsupported.",
  4: "1,142,000 open care gaps with a 41.2% overall closure rate. The design-scope-only feed is excluded from launch. UNVALIDATED zero-value inputs remain outside the business case. The shadow database has no owner.",
  5: "1,142,000 open care gaps with a 41.2% overall closure rate. The design-scope-only feed is excluded from launch. UNVALIDATED zero-value inputs remain outside the plan. The shadow registry remains unsupported and 33 of 86 interfaces are unmonitored.",
};
const artifacts = Object.entries(phaseText).map(([phase, text]) => ({
  artifactId: `artifact-${phase}`,
  title: `Phase ${phase} artifact`,
  phase: Number(phase),
  text,
}));

const passing = evaluateArtifactContent({ contract, artifacts });
assert.equal(passing.ok, true);
assert.deepEqual(passing.missingSignals, []);
assert.deepEqual(passing.missingPhaseSignals, []);
assert.deepEqual(passing.missingPhaseArtifacts, []);
assert.deepEqual(passing.prohibitedMatches, []);

const missingP5Signal = evaluateArtifactContent({
  contract,
  artifacts: artifacts.map((artifact) => artifact.phase === 5 ? { ...artifact, text: artifact.text.replace(/shadow registry remains unsupported/iu, "") } : artifact),
});
assert.equal(missingP5Signal.ok, false);
assert.ok(missingP5Signal.missingPhaseSignals.includes("p5_execution:shadow_registry"));

const missingPhase = evaluateArtifactContent({ contract, artifacts: artifacts.filter((artifact) => artifact.phase !== 2) });
assert.equal(missingPhase.ok, false);
assert.deepEqual(missingPhase.missingPhaseArtifacts, [{ phase: 2, minimum: 1, actual: 0 }]);

const disclosure = evaluateArtifactContent({
  contract,
  artifacts: [{ ...artifacts[0], text: `${artifacts[0].text} tower_cmdb_cis` }, ...artifacts.slice(1)],
});
assert.equal(disclosure.ok, false);
assert.deepEqual(disclosure.prohibitedMatches, ["internal_table_reference"]);

console.log("moves artifact content contract tests passed");
