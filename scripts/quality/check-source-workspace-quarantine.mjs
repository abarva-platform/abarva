#!/usr/bin/env node
/**
 * The Source workspace suites that are deliberately unwired, and the assertion
 * that each one's reason has not expired.
 *
 * WHY THIS LIST EXISTS RATHER THAN THE TRIAGE RECORD ALONE (item T-763).
 * `scripts/quality/test-ci-coverage-census.mjs` credits a file as triaged in
 * exactly two shapes: a command names it and then subtracts it, or a scoped
 * `scripts/quality/*-quarantine.json` declares it. A verdict written into
 * `docs/architecture/*triage*.json` is neither, so a file somebody looked at,
 * verdicted and assigned an owner still reads as `untriaged` — and the
 * directory keeps its place on the governed-risk ranking, so the next agent to
 * draw that ranking re-derives the whole analysis. That happened once already.
 *
 * WHY THIS SHAPE AND NOT A THIRD CENSUS SHAPE. Measured on `31f6badae` before
 * choosing: of the 395 repo-wide `untriagedUnrunTestFiles`, **20** already
 * carry a verdict in a triage record and 375 carry none — so this is not a
 * repo-wide vocabulary gap. Of those 20, **3** carry a verdict that declares a
 * HOLD (`held_unwired`); the other 17 carry `wire_into_ci`, `repair`,
 * `update_with_reason_recorded`, `vacuous_control_proof` or `real`, every one
 * of which means work is owed. Teaching the census to read triage records would
 * have had to credit those 17 as well, or grow a verdict allowlist inside the
 * census — and crediting them subtracts queued work from the ranking that
 * decides what gets wired next, which is the widening T-763 forbids. So the
 * census vocabulary stays as it is and a hold must be declared where the census
 * already reads: here.
 *
 * WHAT MAKES AN ENTRY EXPIRE. Each of these is held because it is a
 * source-text scanner — it reads a source file and asserts substrings of it, so
 * a comment carrying the same substring satisfies it and wiring it would buy a
 * green check and no protection. That reason is machine-checkable: when the
 * suite stops reading source text, the entry fails and has to be removed and
 * the file wired. T-550's verdict on `contractDetailRetry.test.tsx` was correct
 * at its base, discharged four days later, never amended, and still on the
 * books when T-478 read it. An exemption that cannot expire outlives its
 * reason.
 *
 * Both directions are checked, because either one alone is satisfiable by
 * doing nothing: every `held_unwired` verdict in the tree must bring an entry
 * here, and every entry here must still carry that verdict in its record.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const listPath = path.join(here, "source-workspace-quarantine.json");

export const SCOPE = "src/app/(maestro)/source/preview/workspace/__tests__";
const TRIAGE_DIRECTORY = "docs/architecture";
const TRIAGE_RECORD_RE = /triage.*\.json$/;
const HELD_VERDICT = "held_unwired";

/**
 * Every `held_unwired` verdict in every triage record, as
 * `{ record, path, ownerItem }`. Read from the records rather than passed in,
 * so a new record file is picked up the day it lands.
 */
export function heldUnwiredVerdicts(root) {
  const directory = path.join(root, TRIAGE_DIRECTORY);
  if (!existsSync(directory)) return [];
  const verdicts = [];
  for (const file of readdirSync(directory).sort()) {
    if (!TRIAGE_RECORD_RE.test(file)) continue;
    const record = `${TRIAGE_DIRECTORY}/${file}`;
    let payload;
    try {
      payload = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    } catch {
      // A malformed record is somebody else's finding. Skipping it here would
      // hide a verdict, so it is reported as one rather than dropped.
      verdicts.push({ record, path: null, ownerItem: null, unreadable: true });
      continue;
    }
    for (const suite of Array.isArray(payload?.suites) ? payload.suites : []) {
      if (suite?.verdict !== HELD_VERDICT || typeof suite?.path !== "string") {
        continue;
      }
      verdicts.push({
        record,
        path: suite.path,
        ownerItem: suite.ownerItem ?? suite.wiredBy ?? null,
      });
    }
  }
  return verdicts;
}

/**
 * How the hold's reason is measured. The same two tokens T-478 counted when it
 * wrote the verdicts, so the assertion and the verdict describe one property
 * rather than two that happen to agree.
 */
export function scannerCounts(source) {
  return {
    readFileSyncCount: (source.match(/readFileSync/g) ?? []).length,
    toContainCount: (source.match(/toContain/g) ?? []).length,
  };
}

export function evaluateSourceWorkspaceQuarantine(
  payload,
  {
    exists = () => true,
    scannerCountsFor = () => null,
    heldUnwiredVerdicts: verdicts = [],
  } = {},
) {
  const problems = [];
  const entries = payload?.quarantined;
  if (!Array.isArray(entries)) return ["quarantined must be an array"];
  const scope = payload?.scope;
  if (scope !== SCOPE) {
    problems.push(
      `scope must be "${SCOPE}" — the census resolves an entry under its ` +
        `declared scope, and a list without one credits nothing`,
    );
  }
  if (entries.length !== payload.ceiling) {
    problems.push(
      `quarantine size ${entries.length} does not match ratchet ${payload.ceiling}`,
    );
  }

  const unreadable = verdicts.filter((verdict) => verdict.unreadable);
  for (const verdict of unreadable) {
    problems.push(`${verdict.record} could not be read as JSON`);
  }
  const held = verdicts.filter((verdict) => !verdict.unreadable);
  const heldByPath = new Map(held.map((verdict) => [verdict.path, verdict]));

  const suites = new Set();
  const claimed = new Set();
  for (const entry of entries) {
    if (!entry?.suite || suites.has(entry.suite)) {
      problems.push(`missing or duplicate suite: ${entry?.suite ?? "<missing>"}`);
      continue;
    }
    suites.add(entry.suite);
    const suitePath = `${SCOPE}/${entry.suite}`;
    claimed.add(suitePath);
    if (!exists(suitePath)) {
      problems.push(`missing suite: ${suitePath}`);
      continue;
    }
    if (!entry.owner || !entry.reason) {
      problems.push(`${entry.suite} must name an owner and reason`);
    }
    if (entry.heldBecause !== "source_text_scanner") {
      problems.push(
        `${entry.suite} must declare heldBecause "source_text_scanner" — an ` +
          `entry whose reason is not measured cannot expire`,
      );
      continue;
    }
    if (!entry.triageRecord) {
      problems.push(
        `${entry.suite} must name the triageRecord its verdict is written in`,
      );
      continue;
    }
    // The verdict must still be there. An entry whose record has moved on is
    // the T-550 shape: correct at its base, discharged later, never amended.
    const verdict = heldByPath.get(suitePath);
    if (!verdict) {
      problems.push(
        `${entry.suite}: ${entry.triageRecord} no longer carries a ` +
          `\`held_unwired\` verdict for it — discharge the entry or restore ` +
          `the verdict, and do not leave the two disagreeing`,
      );
    } else if (verdict.record !== entry.triageRecord) {
      problems.push(
        `${entry.suite} names ${entry.triageRecord} but its \`held_unwired\` ` +
          `verdict is in ${verdict.record}`,
      );
    }
    // The reason itself, re-measured rather than believed.
    const counts = scannerCountsFor(suitePath);
    if (!counts) {
      problems.push(`${entry.suite}: could not read its source to re-measure`);
      continue;
    }
    if (counts.readFileSyncCount === 0 || counts.toContainCount === 0) {
      problems.push(
        `${entry.suite} reason expired: it reads source text ` +
          `${counts.readFileSyncCount} time(s) and asserts substrings ` +
          `${counts.toContainCount} time(s), so it is no longer the ` +
          `source-text scanner this entry holds it for. Wire it into CI and ` +
          `record the discharge in ${entry.triageRecord ?? "its triage record"}.`,
      );
    }
  }

  // The other direction: a verdict alone does not declare a quarantine.
  for (const verdict of held) {
    if (claimed.has(verdict.path)) continue;
    if (!verdict.path?.startsWith(`${SCOPE}/`)) {
      problems.push(
        `${verdict.record} holds ${verdict.path} outside this list's scope: ` +
          `a \`held_unwired\` verdict there needs its own scoped quarantine list`,
      );
      continue;
    }
    problems.push(
      `${verdict.path} carries a \`held_unwired\` verdict in ` +
        `${verdict.record} but has no quarantine entry here, so the census ` +
        `still reports it as untriaged`,
    );
  }

  return problems;
}

export function evaluateRealRepository(root = repo) {
  const payload = JSON.parse(
    readFileSync(path.join(root, "scripts/quality/source-workspace-quarantine.json"), "utf8"),
  );
  return evaluateSourceWorkspaceQuarantine(payload, {
    exists: (relative) => existsSync(path.join(root, relative)),
    scannerCountsFor: (relative) => {
      const absolute = path.join(root, relative);
      if (!existsSync(absolute)) return null;
      return scannerCounts(readFileSync(absolute, "utf8"));
    },
    heldUnwiredVerdicts: heldUnwiredVerdicts(root),
  });
}

if (isDirectInvocation(import.meta.url)) {
  const problems = evaluateRealRepository();
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const { quarantined } = JSON.parse(readFileSync(listPath, "utf8"));
  console.log(
    `Source workspace quarantine is current (${quarantined.length} held suite` +
      `${quarantined.length === 1 ? "" : "s"}, every reason re-measured).`,
  );
}
