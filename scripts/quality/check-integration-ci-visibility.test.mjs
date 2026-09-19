import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateVisibility,
  expandWorkflowCommands,
  extractWorkflowRunCommands,
  isIntegrationTestRegistered,
  parseChangedIntegrationTests,
} from "./check-integration-ci-visibility.mjs";

const TEST_PATH = "src/__tests__/integration/source/example.test.ts";

test("parses added, modified, and renamed integration suites but skips deletes", () => {
  assert.deepEqual(
    parseChangedIntegrationTests(
      [
        `A\t${TEST_PATH}`,
        "M\tsrc/__tests__/integration/atlas/grounding.test.ts",
        "D\tsrc/__tests__/integration/old.test.ts",
        "R100\tsrc/__tests__/integration/old-name.test.ts\tsrc/__tests__/integration/new-name.test.ts",
        "M\tsrc/lib/agent/retrieval.ts",
      ].join("\n"),
    ),
    [
      "src/__tests__/integration/atlas/grounding.test.ts",
      "src/__tests__/integration/new-name.test.ts",
      TEST_PATH,
    ],
  );
});

test("extracts run commands without counting workflow comments", () => {
  const commands = extractWorkflowRunCommands(`
jobs:
  test:
    steps:
      # run: npx jest ${TEST_PATH}
      - name: Test
        run: >-
          npx jest
          src/__tests__/integration/atlas/grounding.test.ts
          --runInBand
`);
  assert.equal(commands.length, 1);
  assert.match(commands[0], /atlas\/grounding\.test\.ts/);
  assert.doesNotMatch(commands[0], /source\/example\.test\.ts/);
});

test("extracts a one-line run command from a YAML sequence step", () => {
  const commands = extractWorkflowRunCommands(`
jobs:
  test:
    steps:
      - run: npx jest ${TEST_PATH} --runInBand
`);

  assert.deepEqual(commands, [`npx jest ${TEST_PATH} --runInBand`]);
});

test("accepts an exact suite or a containing directory in a CI test command", () => {
  assert.equal(
    isIntegrationTestRegistered(TEST_PATH, [
      `npx jest --runTestsByPath ${TEST_PATH}`,
    ]),
    true,
  );
  assert.equal(
    isIntegrationTestRegistered(TEST_PATH, [
      "jest src/__tests__/integration/source",
    ]),
    true,
  );
  assert.equal(
    isIntegrationTestRegistered(TEST_PATH, [`cat ${TEST_PATH}`]),
    false,
  );
});

test("expands only npm scripts reached from workflow commands", () => {
  const commands = expandWorkflowCommands(["npm run ci:source"], {
    "ci:source": "npm run test:source",
    "test:source": `jest ${TEST_PATH}`,
    "test:local-only": "jest src/__tests__/integration/local-only.test.ts",
  });
  assert.equal(isIntegrationTestRegistered(TEST_PATH, commands), true);
  assert.equal(
    isIntegrationTestRegistered(
      "src/__tests__/integration/atlas/local-only.test.ts",
      commands,
    ),
    false,
  );
});

test("reports a changed suite missing when it appears only in a local npm script", () => {
  const result = evaluateVisibility({
    changed: `M\t${TEST_PATH}`,
    workflowCommands: ["npm run unrelated"],
    packageScripts: {
      unrelated: "jest src/__tests__/behaviors",
      "test:integration": `jest ${TEST_PATH}`,
    },
  });
  assert.deepEqual(result.missing, [TEST_PATH]);
});
