#!/usr/bin/env node
/**
 * Behavioural test for the signed-in-proof reconciliation (item C-526).
 *
 * The defect is not a wrong verdict. It is that a release record — the durable
 * artifact in the public repository — asserted a debt that did not exist and
 * hid a finding that did, and nothing compared it against the register that
 * recorded the run. So the cases that matter are not the readers:
 *
 *   - **The real corpus, not fixtures.** Every record this suite parses is a
 *     record committed to this repository, read from disk at run time. A record
 *     rewritten later makes the case that quotes it fail, which is the point:
 *     the assertions are about records, not about strings someone typed here.
 *   - **Both directions, over real rows.** Cases 14-16 drive the filed
 *     disagreement; cases 17-19 drive a REAL known-negative, a record whose
 *     replay genuinely was not run, whose register line independently says the
 *     same thing, and which must come back `agree`. A detector calibrated only
 *     on the disagreeing case cannot tell "this record is stale" from "this
 *     detector always says stale", and the second one is useless.
 *   - **The calibration defects are cases, not comments.** Four false verdicts
 *     were measured on the live corpus while this module was being written, and
 *     each is pinned here by the real record that produced it: a field whose
 *     value is the replay's SCOPE rather than a yes (case 5, which is the
 *     item's own instance and was OUTSIDE the population until it was fixed); a
 *     negation four words from its verb (case 9); `live-proven` inside a
 *     requirement read as a completed run (case 10); prose defining what a rung
 *     means read as a run (case 11); and `unproven` losing to `positive` in the
 *     same register sentence (case 22).
 *
 * The register half runs over register text quoted from the live operator
 * register, and over fixtures for the structural cases. CI cannot see the
 * operator root, so no case reads it — but a quoted sentence is an observation,
 * not an invention, and every one is attributed in the case that uses it.
 *
 * Run:  node scripts/exec/signed-in-proof-reconcile.test.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  AGREE,
  AMBIGUOUS,
  CONFLICTED,
  DISAGREE,
  NOT_OWED,
  NOT_REQUIRED,
  NOT_RUN,
  NO_REGISTER_LINE,
  OBTAINED,
  OWED,
  RAN,
  REQUIRED,
  SILENT,
  UNDECLARED,
  UNSTATED,
  compareAccounts,
  formatReport,
  parseRecord,
  parseSignedInRequirement,
  parseStatedRunState,
  pullRequestIds,
  reconcile,
  reconcileRecord,
  recordBullets,
  registerEntries,
  reviewReleaseLine,
  registerSignedInVerdict,
} from "./signed-in-proof-reconcile.mjs";
/*
 * The namespace import is deliberate (item C-540). A named import of an export
 * this module does not have is a link-time SyntaxError, which takes the whole
 * suite down to "0 passed" instead of failing the one case that asked for it —
 * and a red-first measurement cannot tell that crash from a suite that found
 * nothing. The new states are asserted THROUGH the namespace so the red run is
 * a case count, not a stack trace.
 */
import * as reconcileModule from "./signed-in-proof-reconcile.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const RECORDS = path.join(REPO, "docs", "releases", "records");
const CLI = path.join(HERE, "signed-in-proof-reconcile.mjs");

let passes = 0;
let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name}`);
  if (detail !== undefined) console.log(`        ${String(detail).replace(/\n/g, "\n        ")}`);
}

/** A record committed to this repository, by basename. Never invented here. */
function realRecord(basename) {
  const file = path.join(RECORDS, basename);
  if (!fs.existsSync(file)) {
    throw new Error(
      `${basename} is not in ${RECORDS}. This suite asserts over REAL records; ` +
        "if the record was renamed or removed, update the case rather than inventing text for it.",
    );
  }
  return { file: path.relative(REPO, file), text: fs.readFileSync(file, "utf8") };
}

function tmpdir(tag) {
  return fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? "/tmp"), `c526-${tag}-`));
}

function runCli(args, cwd = REPO) {
  try {
    const stdout = execFileSync("node", [CLI, ...args], { cwd, encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? -1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error.message ?? error),
    };
  }
}

/* ------------------------------------------------------------------------- */
/* The filed instance, and its record                                         */
/* ------------------------------------------------------------------------- */

const FILED = "2026-09-26-source-action-detail-guard.md";

// The register's release line for the filed instance, quoted from
// EXECUTION_CLAIMS.md at 2026-09-26T12:54:05Z, identity
// codex-source-cpo#20260926T121222Z, which released C-601 through PR #8502.
const FILED_REGISTER_LINE =
  "2026-09-26T12:54:05Z | codex-source-cpo#20260926T121222Z | RELEASED item C-601 on branch " +
  "`codex/source-action-detail-guard` — Merged PR #8502 and digest-pinned ACA runtime proven; " +
  "signed-in action review positive but drawer link still loops on a known detail error.";

// The register's release line for a record whose replay genuinely was not run,
// quoted from EXECUTION_CLAIMS.md at 2026-09-25T08:33:35Z, identity
// claude-code#20260925T080124Z, which released U-517 through PR #8444. This is
// the real known-negative: neither half of it was written for this suite.
const KNOWN_NEGATIVE_REGISTER_LINE =
  "2026-09-25T08:33:35Z | claude-code#20260925T080124Z | RELEASED item U-517 on branch " +
  "`claude/u-517-approval-financial-permission` — U-517 MERGED and claim RELEASED. PR #8444, " +
  "squash cfe6639b5db73c3f2dcbf4ffed9a8b816029c018; the ACA runtime invariant and the " +
  "signed-in acceptance are both OWED, not claimed.";

console.log("\nsigned-in-proof reconciliation (item C-526)\n");

/* 1-3. The record's fields, read from a real record. --------------------- */

{
  // 1. A wrapped field value is joined. `2026-09-19-advisor-prompt-citation-contradiction`
  // writes its requirement across three lines; a first-line reader saw
  // "**yes, and owed.** This edits the instructions a" and nothing after it.
  const record = realRecord("2026-09-19-advisor-prompt-citation-contradiction.md");
  const bullet = recordBullets(record.text).find((b) =>
    /^live signed[\s-]?in proof required$/i.test(b.label),
  );
  check(
    "a wrapped field value is joined across its continuation lines",
    Boolean(bullet) && /prompt changes are not fully verifiable by unit test/i.test(bullet.value),
    bullet ? bullet.value : "no such bullet",
  );

  check(
    "the joined value still classifies as a requirement",
    parseSignedInRequirement(record.text).declaration === REQUIRED,
    parseSignedInRequirement(record.text),
  );
}

{
  // 3. The multi-line reader is load-bearing, measured over the whole real
  // corpus rather than asserted. A first-line-only reader classifies records
  // whose requirement wraps differently from a reader that joins the value, and
  // every such record moves in the same direction — OUT of the population. A
  // reader that dropped them would report agreement about records it never
  // examined.
  let wrapped = 0;
  let firstLineOnlyWouldExclude = 0;
  for (const f of fs.readdirSync(RECORDS).filter((n) => n.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(RECORDS, f), "utf8");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const m = /^-\s+([^:\n]{1,90}):\s*(.*)$/.exec(lines[i]);
      if (!m || !/signed[\s-]?in/i.test(m[1])) continue;
      const continued = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (next.trim() === "" || /^\s*[-*]\s/.test(next) || /^#/.test(next)) break;
        continued.push(next.trim());
      }
      if (continued.length > 0) {
        wrapped += 1;
        const firstLineOnly = parseSignedInRequirement(`- ${m[1]}: ${m[2]}`).declaration;
        const joined = parseSignedInRequirement(
          [`- ${m[1]}: ${m[2]}`, ...continued.map((c) => `  ${c}`)].join("\n"),
        ).declaration;
        if (firstLineOnly !== joined && joined === REQUIRED) firstLineOnlyWouldExclude += 1;
      }
      break;
    }
  }
  check(
    "most real records wrap their signed-in field, so joining is the normal case",
    wrapped > 100,
    `${wrapped} wrapped`,
  );
  check(
    "and a first-line-only reader would drop real records OUT of the population",
    firstLineOnlyWouldExclude > 0,
    `${firstLineOnlyWouldExclude} record(s) of ${wrapped} wrapped`,
  );
}

/* 4-6. The declaration, including the trap the item's own instance sat in. */

{
  // 4. A record carrying TWO signed-in fields, one of them a negated label:
  // `2026-09-22-contract-purpose-review-gate` writes both `- No signed-in
  // acceptance was performed and none is owed:` and the canonical field. The
  // canonical field decides, and it opens negative, so the record stays out of
  // the population. This is the rule that actually decides these records — a
  // branch that read the answer out of the negated label was measured to decide
  // zero records in the corpus and was deleted rather than left unreachable.
  const record = realRecord("2026-09-22-contract-purpose-review-gate.md");
  const parsed = parseSignedInRequirement(record.text);
  const labels = recordBullets(record.text)
    .filter((b) => /signed[\s-]?in/i.test(b.label))
    .map((b) => b.label);
  check(
    "the record really does carry two signed-in fields, one of them a negated label",
    labels.length >= 2 && labels.some((l) => /^no\b/i.test(l)),
    JSON.stringify(labels),
  );
  check(
    "the canonical field decides, and this record is not in the population",
    parsed.declaration === NOT_REQUIRED &&
      /^live signed[\s-]?in proof required$/i.test(parsed.label ?? ""),
    JSON.stringify(parsed),
  );
}

{
  // 5. The preference is not positional. A record whose FIRST signed-in bullet
  // says a proof is required and whose canonical field says it is not must
  // follow the canonical field, or a record's own summary line overrides its
  // declaration. Ordered adversarially: the looser sibling comes first.
  const text = [
    "## Deployment Authority",
    "",
    "- Signed-in acceptance: required before calling this live-proven.",
    "- Live signed-in proof required: no. Nothing renders.",
    "",
  ].join("\n");
  const parsed = parseSignedInRequirement(text);
  check(
    "the canonical field is preferred over an earlier signed-in sibling",
    parsed.declaration === NOT_REQUIRED,
    JSON.stringify(parsed),
  );
}

{
  // 5. THE ITEM'S OWN INSTANCE. Its requirement field answers with the replay's
  // scope — "Reopen a missing-detail action and a valid detail-backed action" —
  // and contains no affirmative word at all. Until this was fixed the record
  // C-526 was filed about was classified `undeclared` and excluded from the
  // population the item measures.
  const record = realRecord(FILED);
  const parsed = parseSignedInRequirement(record.text);
  check(
    "a field answered with the replay's SCOPE still declares a requirement",
    parsed.declaration === REQUIRED,
    JSON.stringify(parsed),
  );
  check(
    "and the record is in the reconciled population, not outside it",
    reconcile({ records: [record], register: FILED_REGISTER_LINE }).population === 1,
    JSON.stringify(reconcile({ records: [record], register: FILED_REGISTER_LINE }).counts),
  );
}

{
  // 6. A record with no signed-in field and no account of a run is undeclared
  // rather than swept into the population. The control for case 5's promotion.
  const parsed = parseSignedInRequirement("## Status\n\n`candidate`\n\n- Feature flag: None.\n");
  check(
    "a record that says nothing about a signed-in proof is undeclared",
    parsed.declaration === UNDECLARED,
    JSON.stringify(parsed),
  );
}

/* 7-11. What the record says happened. ----------------------------------- */

{
  // 7. The filed instance's ORIGINAL account, which the repair does not touch.
  // Read from the real file with the appended correction removed, so this case
  // is about the assertion C-526 was filed against and stays true for as long
  // as that assertion is preserved rather than edited away.
  const record = realRecord(FILED);
  const asFiled = record.text.split(/^##\s+Post-deployment/im)[0];
  const state = parseStatedRunState(asFiled);
  check(
    "the filed record's original assertion — still on disk — says the replay was NOT run",
    state.state === NOT_RUN && /Not run:/i.test(state.evidence),
    JSON.stringify(state),
  );
  check(
    "and the correction was appended, not substituted: the original bullet survives",
    /^-\s*Not run: signed-in post-deployment replay/im.test(record.text),
    "the original QA/Validation bullet is gone — a correction here is an addition, never an edit",
  );
}

{
  // 8. The repair pattern round-trips. The correction is an APPENDED
  // post-deployment section, never a rewrite, so the repaired record carries
  // both the original "Not run" bullet and the later account. A reader that
  // preferred `not-run` would report every correctly repaired record as still
  // owing its proof.
  const record = realRecord(FILED);
  check(
    "the repaired record on disk now states the replay RAN, despite keeping the original bullet",
    parseStatedRunState(record.text).state === RAN && /Not run:/i.test(record.text),
    JSON.stringify(parseStatedRunState(record.text)),
  );
}

{
  // 9. A negation four words from its verb. `2026-09-26-u535-evaluation-fact-derived-beats`
  // writes "**No signed-in run was performed and none is claimed**", which an
  // adjacency-based negation check missed while `was performed` matched.
  const record = realRecord("2026-09-26-u535-evaluation-fact-derived-beats.md");
  const state = parseStatedRunState(record.text);
  check(
    "\"No signed-in run was performed\" is not a completed run",
    state.state !== RAN,
    JSON.stringify(state),
  );
}

{
  // 10. `live-proven` inside a requirement. `2026-09-19-source-nda-scope-validity-readiness`
  // says the proof is required "before calling this product behavior live-proven";
  // a bare `proven` pattern matched the substring and called it a run.
  const record = realRecord("2026-09-19-source-nda-scope-validity-readiness.md");
  const state = parseStatedRunState(record.text);
  check(
    "\"before calling this live-proven\" is a debt, not a run",
    state.state === NOT_RUN,
    JSON.stringify(state),
  );
}

{
  // 11. Prose that DEFINES a proof. `2026-09-22-t705-rung7-veto-negation-forms`
  // explains a rung by saying "the top rung means a signed-in check passed".
  const record = realRecord("2026-09-22-t705-rung7-veto-negation-forms.md");
  const state = parseStatedRunState(record.text);
  check(
    "prose defining what a signed-in check means is not an account of one",
    state.state !== RAN,
    JSON.stringify(state),
  );
}

{
  // 12. `live-proven` under an Audit Evidence heading, with no other marker on
  // the line. These two records are the only place in the corpus where excluding
  // bare `proven` from the completed-run pattern is DECISIVE: both write
  // "signed-in ... proof before any live-proven claim", the owed-marker check
  // does not recognise that phrasing, and with `proven` in the pattern both
  // would report a completed run. Case 10 does not pin this, because the record
  // there carries an owed marker on the same line and either guard suffices.
  const one = parseStatedRunState(
    realRecord("2026-09-22-source-new-historical-request-summary.md").text,
  );
  check(
    "\"proof before any live-proven claim\" does not report a completed run (1)",
    one.state === NOT_RUN,
    JSON.stringify(one),
  );
  const two = parseStatedRunState(
    realRecord("2026-09-22-source-stage04-supplier-acceptance.md").text,
  );
  check(
    "\"proof before any live-proven claim\" does not report a completed run (2)",
    two.state !== RAN,
    JSON.stringify(two),
  );
}

/* 12-13. The register's grammar. ----------------------------------------- */

{
  // 12. Both spellings of a pull request, and nothing that is not one. The
  // register names 33 pull requests as `pull/N` and 564 as a bare `#N`; a
  // reader that knew one spelling reported `no-register-line` for the rest,
  // which reads exactly like agreement.
  const ids = pullRequestIds("merged https://github.com/o/r/pull/8502 and #8503, item #22, 95#1");
  check(
    "both pull-request spellings are read and a two-digit item id is not one",
    ids.has(8502) && ids.has(8503) && !ids.has(22) && ids.size === 2,
    [...ids].join(","),
  );
}

{
  // 13. The record boundary is the stamp, at minute OR second precision — the
  // T-702 boundary. A reader that demanded minutes appended a seconds-stamped
  // line to the record above it, inheriting its verdict.
  const entries = registerEntries(
    [
      "2026-09-26T12:54:05Z | codex-a#1 | RELEASED through PR #8502 — signed-in review positive.",
      "  continuation of the line above",
      "2026-09-26T13:00Z | codex-b#2 | RELEASED through PR #8503 — signed-in acceptance OWED.",
    ].join("\n"),
  );
  check(
    "a seconds-precision stamp starts its own register record",
    entries.length === 2 && entries[0].prs.has(8502) && entries[1].prs.has(8503),
    JSON.stringify(entries.map((e) => [e.stamp, [...e.prs]])),
  );
  check(
    "a continuation line stays with the record it continues",
    /continuation of the line above/.test(entries[0].text),
    entries[0].text,
  );
}

/* 14-16. Direction one: the filed disagreement. -------------------------- */

{
  const record = realRecord(FILED);
  const verdict = registerSignedInVerdict(FILED_REGISTER_LINE);
  check(
    "the register line for the filed instance reports the proof OBTAINED",
    verdict.verdict === OBTAINED && /action review positive/i.test(verdict.sentence),
    JSON.stringify(verdict),
  );

  // 15. The record AS FILED — before the repair — against that register line.
  // Reconstructed by removing the appended post-deployment section from the
  // real file, so the case is about the record's original assertion, which the
  // repair does not rewrite.
  const asFiled = record.text.split(/^##\s+Post-deployment/im)[0];
  const row = reconcileRecord({
    record: parseRecord({ file: record.file, text: asFiled }),
    pr: 8502,
    entries: registerEntries(FILED_REGISTER_LINE),
  });
  check(
    "the record as filed DISAGREES with the register: it says not-run, the register says obtained",
    row.verdict === DISAGREE && row.recordSays === NOT_RUN && row.registerSays === OBTAINED,
    JSON.stringify(row, null, 2),
  );

  // 16. And the repaired record on disk agrees. The end-to-end case: the same
  // detector, the same register line, the repair being the only difference.
  const repaired = reconcileRecord({
    record: parseRecord(record),
    pr: 8502,
    entries: registerEntries(FILED_REGISTER_LINE),
  });
  check(
    "the repaired record AGREES with the same register line",
    repaired.verdict === AGREE && repaired.recordSays === RAN,
    JSON.stringify(repaired, null, 2),
  );
}

/* 17-19. Direction two: a REAL known-negative. --------------------------- */

{
  // 17. A record whose replay genuinely was not run, and a register line that
  // independently says so. Neither half was written for this suite.
  const record = realRecord("2026-09-25-u517-approval-financial-permission.md");
  const parsed = parseRecord(record);
  check(
    "the known-negative record declares a requirement and states it was not run",
    parsed.declaration === REQUIRED && parsed.recordSays === NOT_RUN,
    JSON.stringify(parsed),
  );

  const verdict = registerSignedInVerdict(KNOWN_NEGATIVE_REGISTER_LINE);
  check(
    "its register line reports the proof OWED",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );

  const row = reconcileRecord({
    record: parsed,
    pr: 8444,
    entries: registerEntries(KNOWN_NEGATIVE_REGISTER_LINE),
  });
  check(
    "so it comes back AGREE — the detector does not always say stale",
    row.verdict === AGREE,
    JSON.stringify(row, null, 2),
  );
}

/* 20-23. Precision of the join and of the register reading. -------------- */

{
  // 20. Fewest pull requests wins. One line in the live register names nine
  // pull requests while being about none of them; the newest citing line was
  // winning, and rows reported a verdict drawn from a sentence about somebody
  // else's release.
  const register = [
    "2026-09-22T02:00:00Z | codex-x#1 | RELEASED through PR #8203 — Signed-in acceptance passed.",
    "2026-09-22T09:00:00Z | codex-y#2 | Context for #8201, #8202, #8203, #8204, #8205 — " +
      "signed-in acceptance remains OWED across this family.",
  ].join("\n");
  const row = reconcileRecord({
    record: { recordSays: NOT_RUN, declaration: REQUIRED, file: "r.md", releaseId: "r" },
    pr: 8203,
    entries: registerEntries(register),
  });
  check(
    "a line naming only this pull request beats a newer line that merely cites it",
    row.registerSays === OBTAINED && row.registerLinePullRequests === 1,
    JSON.stringify(row, null, 2),
  );
}

{
  // 21. No line at all is its own verdict, never agreement. An absent register
  // line means the register is silent about the release, which is a different
  // claim from the register confirming the record.
  const row = reconcileRecord({
    record: { recordSays: NOT_RUN, declaration: REQUIRED, file: "r.md", releaseId: "r" },
    pr: 9999,
    entries: registerEntries("2026-09-22T02:00:00Z | a#1 | RELEASED through PR #8203 — signed-in passed."),
  });
  check(
    "a record with no register line is reported as such, not as agreement",
    row.verdict === NO_REGISTER_LINE && row.registerSays === null,
    JSON.stringify(row),
  );
}

{
  // 22. `unproven` against `positive` in one sentence. The clause below is
  // quoted from a live register line; it was read as obtained, because
  // `positive` is an obtained marker and nothing recognised the word that
  // negates it. That produced a false disagreement against a record that had
  // said the same thing.
  const verdict = registerSignedInVerdict("Signed-in positive supplier panel remains unproven;");
  check(
    "\"remains unproven\" is not an obtained proof, however positive the panel",
    verdict.verdict !== OBTAINED,
    JSON.stringify(verdict),
  );
}

{
  // 23. Both markers in one sentence are REPORTED, not resolved. Folding them
  // into agree hides the defect this module looks for; folding them into
  // disagree sends an auditor after records that are fine.
  const verdict = registerSignedInVerdict(
    "The signed-in replay passed on Scope, and a signed-in Files readback remains owed.",
  );
  check(
    "a line carrying both markers is conflicted, and the sentence is printed",
    verdict.verdict === CONFLICTED && typeof verdict.sentence === "string",
    JSON.stringify(verdict),
  );
  const row = reconcileRecord({
    record: { recordSays: NOT_RUN, declaration: REQUIRED, file: "r.md", releaseId: "r" },
    pr: 1,
    entries: registerEntries(
      "2026-09-22T02:00:00Z | a#1 | PR #0001 — the signed-in replay passed, and a signed-in readback remains owed.",
    ),
  });
  check(
    "and it reaches the report as ambiguous rather than as a verdict",
    row.verdict === AMBIGUOUS,
    JSON.stringify(row),
  );
}

{
  // 24. A register line that says nothing about a signed-in proof is silent,
  // and silence agrees with a record that says the proof is owed.
  const verdict = registerSignedInVerdict("Merged and deployed; digest invariant proven.");
  check(
    "a register line that never mentions a signed-in proof is silent",
    verdict.verdict === SILENT && verdict.sentence === null,
    JSON.stringify(verdict),
  );
}

/* 25-26. The census, and what the detector cannot do. -------------------- */

{
  // 25. Every scanned record is accounted for. A count that cannot be
  // reconciled to the corpus it came from is the shape this backlog repairs.
  const records = fs
    .readdirSync(RECORDS)
    .filter((f) => f.endsWith(".md"))
    .slice(0, 120)
    .map((f) => ({ file: f, pr: null, text: fs.readFileSync(path.join(RECORDS, f), "utf8") }));
  const result = reconcile({ records, register: "" });
  check(
    "population plus excluded equals scanned, over real records",
    result.population + result.outsidePopulation.length === result.scanned &&
      result.scanned === records.length,
    `${result.population} + ${result.outsidePopulation.length} vs ${result.scanned}`,
  );

  // 26. With an empty register, no row can disagree. The detector needs both
  // documents; it cannot manufacture a disagreement from records alone.
  check(
    "an empty register produces no disagreement, only no-register-line rows",
    result.counts[DISAGREE] === 0 &&
      result.counts[AMBIGUOUS] === 0 &&
      result.counts[NO_REGISTER_LINE] === result.population,
    JSON.stringify(result.counts),
  );
}

/* 27-30. The CLI refuses rather than reporting a false clean. ------------ */

{
  const bad = runCli(["--register", path.join(HERE, "signed-in-proof-reconcile.mjs"), "--release"]);
  check(
    "an unrecognised flag is refused, and nothing is reported",
    bad.status === 2 && /not a flag/i.test(bad.stderr) && bad.stdout === "",
    `exit ${bad.status}\n${bad.stderr}`,
  );
}

{
  const missing = runCli(["--register", path.join(HERE, "no-such-register.md")]);
  check(
    "an absent register is refused, not reported as agreement",
    missing.status === 2 && /no such file/i.test(missing.stderr),
    `exit ${missing.status}\n${missing.stderr}`,
  );
}

{
  const none = runCli([]);
  check(
    "a missing --register is refused",
    none.status === 2 && /--register is required/i.test(none.stderr),
    `exit ${none.status}\n${none.stderr}`,
  );
}

{
  // 30. --strict is the CI shape: exit 1 while any row disagrees. Driven over a
  // fixture repository so no case reads the operator root.
  const dir = tmpdir("strict");
  const recordDir = path.join(dir, "records");
  fs.mkdirSync(recordDir, { recursive: true });
  execFileSync("git", ["init", "-q", dir], { cwd: dir });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
  fs.writeFileSync(
    path.join(recordDir, "rec.md"),
    [
      "## Release ID",
      "",
      "`rec`",
      "",
      "## QA / Validation",
      "",
      "- Not run: signed-in post-deployment replay; required after deployment.",
      "",
      "## Deployment Authority",
      "",
      "- Live signed-in proof required: yes, after deployment.",
      "",
    ].join("\n"),
  );
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", "add a record (#4242)"], { cwd: dir });

  const register = path.join(dir, "REGISTER.md");
  fs.writeFileSync(
    register,
    "2026-09-26T12:00:00Z | a#1 | RELEASED through PR #4242 — signed-in acceptance passed.\n",
  );

  const strict = runCli(
    ["--register", register, "--repo", dir, "--records", "records", "--since", "1970-01-01", "--strict"],
    dir,
  );
  check(
    "--strict exits 1 while a row disagrees, and names the record",
    strict.status === 1 && /disagree/.test(strict.stdout) && /rec/.test(strict.stdout),
    `exit ${strict.status}\n${strict.stdout}\n${strict.stderr}`,
  );

  const lenient = runCli(
    ["--register", register, "--repo", dir, "--records", "records", "--since", "1970-01-01"],
    dir,
  );
  check(
    "without --strict the same disagreement is reported at exit 0",
    lenient.status === 0 && /disagree/.test(lenient.stdout),
    `exit ${lenient.status}\n${lenient.stdout}`,
  );

  // 32. The pull request comes from the squash subject, not from the record.
  // The record above never names #4242; the commit that added it does.
  check(
    "the join reads the pull request from the squash subject, which the record does not carry",
    !/4242/.test(fs.readFileSync(path.join(recordDir, "rec.md"), "utf8")) &&
      /pr: *4242/.test(lenient.stdout),
    lenient.stdout,
  );

  fs.rmSync(dir, { recursive: true, force: true });
}

/* 33-38. Item C-529 — why a row is `ambiguous`. -------------------------- */

/*
 * `ambiguous` is a refusal, and 61 of them are not 61 judgements. Measured on
 * the live register against `docs/releases/records` with
 * `--since 2026-09-19T00:00:00Z` (population 213), the 61 decompose into three
 * INDEPENDENT reader defects, each of which hides the next — the first
 * classification of this population was itself an artifact of defect (a), and
 * only reporting the distribution after fixing it showed what the sentences
 * actually say:
 *
 *   (a) a sentence boundary blind to markdown emphasis, so `owed.** Opened ...`
 *       is one sentence and swallows a clause about something else entirely;
 *   (b) no negation on the obtained side — `NOT signed-in proven` was read as
 *       an obtained proof, which is a FALSE OBTAINED, the costly direction, and
 *       the record side has had exactly this rule since case 9;
 *   (c) markers read per line rather than per proof, so `DEPLOY VERIFIED,
 *       SIGNED-IN ACCEPTANCE OWED` carries an obtained marker belonging to a
 *       different proof.
 *
 * Every sentence below is quoted from the live register or from a record in
 * this repository. None of these cases LOOSENS a marker: each narrows the scope
 * a marker is read in, so the count falls because rows are resolved, never
 * because a refusal was converted into a guess.
 */

{
  // 33. (a) A terminator followed by markdown emphasis ends a sentence. This
  // line is the chosen register evidence for 23 of the 61 rows; because the
  // period is followed by `**`, the reader ran it into a parenthetical about a
  // generator that `no longer exists` — an obtained marker about neither this
  // release nor any proof — and reported the row as conflicted.
  const verdict = registerSignedInVerdict(
    "no signed-in acceptance owed.** Opened C-009, T-046 (the manifest's generator " +
      "no longer exists, so it cannot be regenerated).",
  );
  check(
    "a period followed by markdown emphasis ends the sentence, so a later clause cannot contribute a marker",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 34. (b) A negated obtained marker is not an obtained proof. Quoted from
  // the live register; 21 rows of the 61 carry this exact sentence.
  const verdict = registerSignedInVerdict("Not live-proven — signed-in check owed.");
  check(
    "\"Not live-proven\" is not a proof obtained, and the line reads owed",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 35. (b) The same defect in the spelling that cost most: read as OBTAINED,
  // not merely as ambiguous. A false obtained is the direction this module
  // exists to prevent — it lets a record claiming no run agree with a register
  // the reader thinks confirms one.
  const verdict = registerSignedInVerdict("Status `deployed`, NOT signed-in proven;");
  check(
    "\"NOT signed-in proven\" is never reported as an obtained proof",
    verdict.verdict !== OBTAINED,
    JSON.stringify(verdict),
  );
}

{
  // 36. (c) Per-proof, not per-line. `verified` belongs to the deploy; `owed`
  // belongs to the signed-in acceptance. Quoted from the live register, where
  // it is the chosen evidence for 23 rows once (a) is fixed.
  const verdict = registerSignedInVerdict(
    "**DEPLOY VERIFIED, SIGNED-IN ACCEPTANCE OWED — Source 360 direct action-candidate read.",
  );
  check(
    "an obtained marker in a clause naming a different proof does not make the signed-in proof obtained",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 37. The negative control for case 36, and the reason this is scoping
  // rather than a weaker marker: a line whose obtained marker IS in the
  // clause naming the signed-in proof still reports obtained. Without this,
  // case 36 would pass just as well against a reader that had stopped reading
  // obtained markers at all.
  const verdict = registerSignedInVerdict(
    "Deploy digest pending; the signed-in replay passed on the deployed SHA.",
  );
  check(
    "an obtained marker in the clause that names the signed-in proof still reports obtained",
    verdict.verdict === OBTAINED,
    JSON.stringify(verdict),
  );
}

{
  // 38. The record side has the same negation gap, and it is reached from the
  // register fix: `docs/releases/records/c522-answer-mode-fallback-disclosure.md`
  // says its proof was NOT run, and the reader called it `ran` because
  // `has been run` matched while `no signed-in check ... has been run` matched
  // no negated form — case 9 covers `was run`, not the perfect. Left alone,
  // repairing the register side turns this record into a DISAGREE that is an
  // artifact of this reader rather than a finding about the record.
  const state = parseStatedRunState(
    "## QA / Validation\n\nNot verified, and named as not verified: no signed-in " +
      "check against a deployed build has been run.\n",
  );
  check(
    "\"no signed-in check ... has been run\" is not a completed run",
    state.state === NOT_RUN,
    JSON.stringify(state),
  );
}

{
  // 39. The negation is read from the SENTENCE, not from the clause scope of
  // case 36 — and this case exists because the clause-scoped version was
  // written first and measured. Quoted from the live register: the negator is
  // in the first clause and its target in the third, so scoping the negation
  // to the clause severed them and produced a FALSE OBTAINED on this row.
  // Marker attachment is per clause; negation scope is a span that crosses
  // clauses, and the two are not the same question.
  const verdict = registerSignedInVerdict(
    "not merged, deployed, or signed-in proven at this stamp | red-first rendered failure reproduced.",
  );
  check(
    "a negator in an earlier clause still negates an obtained marker in a later one",
    verdict.verdict !== OBTAINED,
    JSON.stringify(verdict),
  );
}

{
  // 40. The clause scoping is SYMMETRIC, and this is the mirror case that
  // decided it. Quoted from the live register: `never` belongs to a parsed
  // artifact, not to the signed-in replay named in the last clause. Scoping
  // only the obtained side — the asymmetric version, also written and
  // measured — read this line as `owed` and turned a record that says its
  // replay ran into a DISAGREE that no human should have been sent after.
  const verdict = registerSignedInVerdict(
    "Scope: remove the conflicting tenant-key equality, prove a parsed artifact on another " +
      "event can never reconcile, and signed-in replay after repo-owned deploy.",
  );
  check(
    "an owed marker in a clause naming something else does not make the signed-in proof owed",
    verdict.verdict !== OWED,
    JSON.stringify(verdict),
  );
}

/* 41-47. The owed vocabulary cannot say "not owed" (item C-534). ---------- */

{
  // 41. The sentence the item names, quoted from the live register at
  // 2026-09-22T06:59:56Z (PR #8234). `REGISTER_OWED` matches `owed` and
  // nothing distinguished this from a line asserting a debt, so a release
  // that owes nothing was reported as owing a signed-in proof.
  const verdict = registerSignedInVerdict(
    "signed-in acceptance NOT owed (pure-function refusal branch, no rendered surface).",
  );
  check(
    '"signed-in acceptance NOT owed" is a third state, not a debt',
    verdict.verdict === NOT_OWED,
    JSON.stringify(verdict),
  );
  // C-534's acceptance, in its own words: a release that needs no proof has
  // not obtained one. Folding this into `obtained` would let a record saying
  // no run happened be reported as disagreeing with a register that never
  // claimed one.
  check(
    "and it is not folded into obtained",
    verdict.verdict !== OBTAINED,
    JSON.stringify(verdict),
  );
}

{
  // 42. The second sentence the item names, quoted from the live register at
  // 2026-09-22T09:36:27Z (PRs #8241, #8240): the owed clause carries `not
  // claimed` as well. `not claimed` is an owed marker on its own, so a reader
  // that merely subtracted the negated `owed` would still report a debt from
  // the corroborating half of the same assertion.
  const verdict = registerSignedInVerdict(
    "Signed-in acceptance **NOT owed and not claimed**: nothing outside two test files, " +
      "one workflow file, one generated docs artifact and one release record is in the diff.",
  );
  check(
    '"NOT owed and not claimed" is not a debt, though "not claimed" is an owed marker alone',
    verdict.verdict === NOT_OWED,
    JSON.stringify(verdict),
  );
}

{
  // 43. THE NEGATIVE CONTROL THAT DECIDES THE SCOPE, and the reason the owed
  // negation is read ADJACENTLY while the obtained negation of case 39 is read
  // across the sentence. This is the register's most common owed phrasing — 21
  // rows carried it at C-529 — and its negator belongs to `live-proven`, three
  // words and a clause boundary away from `owed`. A span-wide owed negation,
  // written first and measured, turned every one of those rows into a false
  // "not owed" and hid 21 real debts. The two negations are not symmetric
  // because their targets are not: an obtained marker is negated by a distant
  // `not`, and an owed marker is asserted by the writer next to the word.
  const verdict = registerSignedInVerdict("Not live-proven — signed-in check owed.");
  check(
    "a negator attached to a different word does not turn an owed line into not-owed",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 43b. THE CASE THAT ACTUALLY SEPARATES ADJACENCY FROM A SPAN, and it is
  // CONSTRUCTED — no live register line has this shape, which was established
  // by measurement rather than assumed: over the whole register the adjacent and
  // span-wide owed negations disagree about exactly one distinct sentence,
  // `"**NOT signed-in accepted and none owed**"`, which adjacency should also
  // accept and does. So case 43 does NOT discriminate — the clause scoping
  // leaves its negator outside the scope, and a span rule passes it too. That
  // was believed and then falsified by widening the regex and watching case 43
  // stay green. This case is the one that goes red: a span rule strips `not
  // attempted and remains owed` and reports a release with an open signed-in
  // debt as owing nothing, which is the one error here nobody would come back
  // for.
  const verdict = registerSignedInVerdict(
    "The signed-in replay was not attempted and remains owed after the deploy.",
  );
  check(
    "a negator attached to a different verb does not cancel the owed marker after it",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 43c. And the live sentence the two rules disagreed about, quoted from the
  // register: `none` negates `owed` adjacently, so this reads not-owed under
  // either. Without `none` in the negator list, adjacency would have reported a
  // debt on a line that says there is none.
  const verdict = registerSignedInVerdict("**NOT signed-in accepted and none owed**");
  check(
    '"none owed" is a negated owed marker, not a debt',
    verdict.verdict === NOT_OWED,
    JSON.stringify(verdict),
  );
}

{
  // 44. A DEBT IN THE SAME SCOPE WINS. Constructed, and labelled as such: no
  // live register line carries both halves, which was measured over the whole
  // register rather than assumed — 103 sentences match the adjacent negation
  // and none of them leaves an un-negated debt word behind. It is here because
  // the resolution ORDER is what keeps this change conservative: a real debt is
  // never hidden by a not-owed assertion sitting beside it, so the failure mode
  // of this rule is a missed not-owed, never a missed debt.
  const verdict = registerSignedInVerdict(
    "Signed-in acceptance NOT owed for the pure helper, and a signed-in readback is owed for the panel.",
  );
  check(
    "an un-negated debt word in the same scope still reports owed",
    verdict.verdict === OWED,
    JSON.stringify(verdict),
  );
}

{
  // 45. The row the item predicted. `2026-09-22-source-evidence-review-reconciliation`
  // is a real record in this repository whose QA section says the proof RAN;
  // the register line above (case 42) says it was never owed. C-534 filed this
  // as masked — "it stops being right the moment a record says `ran`" — and on
  // the corpus as of this change it is no longer masked: the row was reported
  // as the tenth DISAGREE, which would have sent an auditor after a release
  // that owes nothing, and a repair appended to that record would have written
  // a false debt dispute into a public artifact.
  const record = realRecord("2026-09-22-source-evidence-review-reconciliation.md");
  const parsed = parseRecord({ file: record.file, text: record.text });
  check(
    "the real record still says its signed-in proof ran",
    parsed.declaration === REQUIRED && parsed.recordSays === RAN,
    JSON.stringify({ declaration: parsed.declaration, recordSays: parsed.recordSays }),
  );
  const row = reconcileRecord({
    record: parsed,
    pr: 8240,
    entries: registerEntries(
      "2026-09-22T09:36:27Z | source-backlog-executor#20260922T085600Z | RELEASED item T-460 " +
        "through PR #8240 — Signed-in acceptance **NOT owed and not claimed**: nothing outside " +
        "two test files is in the diff, so no client-visible surface can reach it.",
    ),
  });
  check(
    "a record that ran against a register line that says no proof was owed is not a disagreement",
    row.verdict !== DISAGREE && row.registerSays === NOT_OWED,
    JSON.stringify({ verdict: row.verdict, registerSays: row.registerSays }),
  );
}

{
  // 46. The masked majority, which must not move. Every instance C-534 found
  // had a record saying `not-run` against a register line saying no proof was
  // owed, and reconciled to `agree` — the right answer for the wrong reason.
  // It stays `agree`, now because neither document asserts a debt.
  const row = reconcileRecord({
    record: { recordSays: NOT_RUN, declaration: REQUIRED, file: "r.md", releaseId: "r" },
    pr: 8234,
    entries: registerEntries(
      "2026-09-22T07:35:55Z | codex#1 | RELEASED through PR #8234 — Signed-in acceptance NOT owed.",
    ),
  });
  check(
    "a record that says not-run still agrees with a register line that says no proof was owed",
    row.verdict === AGREE && row.registerSays === NOT_OWED,
    JSON.stringify({ verdict: row.verdict, registerSays: row.registerSays }),
  );
}

{
  // 47. `not-owed` is a reported state with its sentence, never a silent drop.
  // Reporting it as `no-register-line` would be the reader refusing to answer
  // about a line that answered clearly, and the row would land in a bucket
  // whose name asserts something false about the register.
  const row = reconcileRecord({
    record: { recordSays: RAN, declaration: REQUIRED, file: "r.md", releaseId: "r" },
    pr: 8234,
    entries: registerEntries(
      "2026-09-22T07:35:55Z | codex#1 | RELEASED through PR #8234 — Signed-in acceptance NOT owed.",
    ),
  });
  check(
    "the not-owed row keeps its register line, stamp and sentence",
    row.registerLines === 1 &&
      row.registerStamp === "2026-09-22T07:35:55Z" &&
      /NOT owed/i.test(String(row.registerEvidence)),
    JSON.stringify(row),
  );
}

// ---------------------------------------------------------------------------
// C-528 — the same comparison, asked one moment earlier.
//
// `reconcile` is a detector: it can only report an accumulation that already
// happened, and nine records accumulated before anything looked. The release
// step asks the same question of a line it is about to write, against the
// record that release adds — and the two callers must not be two rules, or the
// day one grows a case the other silently disagrees.
// ---------------------------------------------------------------------------

{
  // The rule is ONE function, and this pins the corpus caller to it rather than
  // asserting the pair separately: for every combination the reader can
  // produce, `reconcileRecord`'s verdict IS `compareAccounts`.
  const recordStates = [RAN, NOT_RUN, UNSTATED];
  const registerStates = [OBTAINED, OWED, NOT_OWED, CONFLICTED, SILENT];
  const mismatched = [];
  for (const recordSays of recordStates) {
    for (const registerSays of registerStates) {
      // A register line in the state under test, matched to this record by its
      // pull request, so `reconcileRecord` reaches the comparison at all.
      const sentence = {
        [OBTAINED]: "signed-in acceptance passed.",
        [OWED]: "Not live-proven — signed-in check owed.",
        [NOT_OWED]: "Signed-in acceptance NOT owed.",
        [CONFLICTED]: "signed-in acceptance passed; signed-in acceptance owed.",
        [SILENT]: "merged and deployed.",
      }[registerSays];
      const entries = registerEntries(`2026-09-22T07:00:00Z | a#1 | RELEASED #9100 — ${sentence}`);
      const direct = compareAccounts({ recordSays, registerSays: registerSignedInVerdict(sentence).verdict });
      const viaRecord = reconcileRecord({
        record: { recordSays, declaration: REQUIRED, file: "r.md", releaseId: "r" },
        pr: 9100,
        entries,
      }).verdict;
      if (direct !== viaRecord) mismatched.push(`${recordSays}/${registerSays}: ${direct} vs ${viaRecord}`);
    }
  }
  check(
    "the corpus reader and the release step share ONE comparison rule, over all 15 pairs",
    mismatched.length === 0,
    mismatched.join("\n"),
  );
}

// The record shape the nine disagreeing records share: the proof is declared
// required, and the record states — truthfully when it was written, before the
// merge — that the replay has not run.
const RELEASE_RECORD_NOT_RUN = [
  "# Release record — fixture",
  "",
  "- Live signed-in proof required: yes, before calling the behaviour live-proven.",
  "- Not run: post-deploy signed-in replay; required after the official main workflow.",
  "",
].join("\n");

{
  // The fixture is in the population FIRST. A review over records that all
  // fall outside it reports zero contradictions and passes vacuously, which is
  // the failure mode that let nine accumulate under green suites.
  const record = parseRecord({ file: "f.md", text: RELEASE_RECORD_NOT_RUN });
  check(
    "PRECONDITION: the release-step fixture declares the proof required and says not-run",
    record.declaration === REQUIRED && record.recordSays === NOT_RUN,
    JSON.stringify(record),
  );
}

{
  const review = reviewReleaseLine({
    line:
      "2026-09-26T13:26:15Z | agent#1 | RELEASED item C-900 on branch `x` — PR #9100 merged, " +
      "official ACA run proven; signed-in acceptance passed.",
    records: [{ file: "docs/releases/records/f.md", text: RELEASE_RECORD_NOT_RUN }],
  });
  check(
    "a line asserting the proof ran contradicts the record it releases, and NAMES it",
    review.contradicted.length === 1 &&
      review.contradicted[0].file === "docs/releases/records/f.md" &&
      review.contradicted[0].verdict === DISAGREE,
    JSON.stringify(review),
  );
  check(
    "the contradicted row carries both accounts, so the repair can be written from it",
    review.registerSays === OBTAINED &&
      /signed-in acceptance passed/.test(String(review.contradicted[0].registerEvidence)) &&
      review.contradicted[0].recordSays === NOT_RUN,
    JSON.stringify(review.contradicted[0]),
  );
}

{
  // The direction that matters for calibration: a line that says the proof is
  // still owed AGREES with a record that says not-run. Nearly every honest
  // release line looks like this one.
  const review = reviewReleaseLine({
    line: "2026-09-26T13:26:15Z | agent#1 | RELEASED item C-900 — Not live-proven — signed-in check owed.",
    records: [{ file: "f.md", text: RELEASE_RECORD_NOT_RUN }],
  });
  check(
    "NEGATIVE CONTROL: an owed line contradicts a not-run record in neither direction",
    review.contradicted.length === 0 && review.rows[0].verdict === AGREE,
    JSON.stringify(review),
  );
}

{
  // The other direction of the same rule, and it is a real shape: the record
  // claims the run happened and the register says it is still owed.
  // The record half quotes the shape C-526's append-only repair produced on
  // `docs/releases/records/2026-09-26-source-action-detail-guard.md`, which is
  // the one record in this corpus that states its replay ran. A phrasing
  // invented here would prove the fixture, not the reader.
  const review = reviewReleaseLine({
    line: "2026-09-26T13:26:15Z | agent#1 | RELEASED item C-900 — Not live-proven — signed-in check owed.",
    records: [
      {
        file: "f.md",
        text:
          "# r\n\n- Live signed-in proof required: yes.\n\n" +
          "## Post-deployment validation\n\n" +
          "- The signed-in post-deployment replay was run and the surface rendered as described.\n",
      },
    ],
  });
  check(
    "a record claiming the run while the line says owed is a contradiction too",
    review.contradicted.length === 1 && review.contradicted[0].recordSays === RAN,
    JSON.stringify(review),
  );
}

{
  // A record outside the population cannot be contradicted, and a line silent
  // on the proof contradicts nothing at all.
  const outside = reviewReleaseLine({
    line: "2026-09-26T13:26:15Z | agent#1 | RELEASED item C-900 — signed-in acceptance passed.",
    records: [{ file: "f.md", text: "# r\n\n- Live signed-in proof required: no; documentation only.\n" }],
  });
  const silent = reviewReleaseLine({
    line: "2026-09-26T13:26:15Z | agent#1 | RELEASED item C-900 — merged and deployed; digest pinned.",
    records: [{ file: "f.md", text: RELEASE_RECORD_NOT_RUN }],
  });
  check(
    "NEGATIVE CONTROL: neither a record outside the population nor a silent line is contradicted",
    outside.population === 0 &&
      outside.contradicted.length === 0 &&
      silent.registerSays === SILENT &&
      silent.contradicted.length === 0,
    `${JSON.stringify(outside)}\n${JSON.stringify(silent)}`,
  );
}


/* ------------------------------------------------------------------------- */
/* Inexact attribution: a line naming several pull requests (item C-540)      */
/* ------------------------------------------------------------------------- */

/*
 * `reconcileRecord` prefers the register line naming the FEWEST pull requests,
 * and that preference is right — its own docstring says why: "a line naming
 * only this pull request is about this pull request, and a line naming ten is
 * citing it". The defect is what happens when the winner of that preference
 * STILL names more than one. The row reports a verdict, the verdict reads as a
 * judgement about this record, and the number of pull requests the deciding
 * line named is computed into `registerLinePullRequests` and then never used.
 *
 * Measured on the live operator register at origin/main 2e91a64ec, with
 * --since 2026-09-19T00:00:00Z over 218 records in the population: 59 rows rest
 * on a line naming more than one pull request. The distribution is the part
 * that makes the case, because it is not a rounding error — 8 rows on a 2-pull-
 * request line, 4 on a 6, 3 on a 14, 21 reported AGREE by a line naming 118,
 * and 23 reported AMBIGUOUS by a line naming 190. A line naming 190 pull
 * requests is a bulk citation; it is not an account of the record whose verdict
 * it is setting.
 *
 * These cases are FIXTURES for the register side on purpose, and the reason is
 * item C-540's own history. The filing names its live consequence as the tenth
 * disagreement in the C-528 population — and C-528 repaired that, so the corpus
 * now reports `disagree 0`. A suite whose premise is "the live corpus contains a
 * disagreement decided by a multi-pull-request line" would have gone red on the
 * repair, which reads as a regression and invites weakening the rule. The rule
 * is asserted over constructed registers; the live magnitude is recorded above
 * as an observation and in the release record, where improving it is progress
 * rather than a failure.
 */

// The state names, pinned through the namespace rather than imported by name.
const ATTR_EXACT = "exact";
const ATTR_INEXACT = "inexact";
const ATTR_NONE = "none";
const INEXACT_ATTRIBUTION = "inexact-attribution";

{
  check(
    "the module EXPORTS the attribution states and the verdict, so a caller can select on them",
    reconcileModule.EXACT === ATTR_EXACT &&
      reconcileModule.INEXACT === ATTR_INEXACT &&
      reconcileModule.UNATTRIBUTED === ATTR_NONE &&
      reconcileModule.INEXACT_ATTRIBUTION === INEXACT_ATTRIBUTION,
    `exported: ${JSON.stringify({
      EXACT: reconcileModule.EXACT,
      INEXACT: reconcileModule.INEXACT,
      UNATTRIBUTED: reconcileModule.UNATTRIBUTED,
      INEXACT_ATTRIBUTION: reconcileModule.INEXACT_ATTRIBUTION,
    })}`,
  );
}

// One register, four kinds of line, so every case below selects a different
// deciding line out of the SAME register rather than getting its own.
const ATTRIBUTION_REGISTER = [
  // Names 9001 alone and nothing else: an exact account of that release.
  "2026-09-26T10:00:00Z | agent#a | RELEASED item C-901 via https://github.com/o/r/pull/9001 — " +
    "signed-in acceptance is owed and was not run.",
  // Names 9002 AND 9003. Whichever record this decides, it is an account of at
  // most one of them, and the row cannot say which.
  "2026-09-26T10:05:00Z | agent#a | RELEASED item C-902 via https://github.com/o/r/pull/9002 — " +
    "signed-in acceptance is owed and was not run; supersedes the account in " +
    "https://github.com/o/r/pull/9003.",
  // Names 9004 and says the proof RAN, while the record for 9004 says not-run:
  // the compared verdict here is a DISAGREE that must stay recoverable.
  "2026-09-26T10:10:00Z | agent#a | RELEASED item C-903 via https://github.com/o/r/pull/9004 — " +
    "signed-in replay ran and was positive; see also https://github.com/o/r/pull/9005.",
  // Matches 9006 but says nothing at all about a signed-in proof.
  "2026-09-26T10:15:00Z | agent#a | RELEASED item C-904 via https://github.com/o/r/pull/9006 — " +
    "merged, deployed, digest pinned.",
  // A bulk citation, standing in for the 190-pull-request line on the live
  // register. It names 9007 among many and asserts a completed proof.
  "2026-09-26T10:20:00Z | agent#a | sweep — signed-in acceptance was proven for the batch: " +
    Array.from({ length: 12 }, (_, i) => `https://github.com/o/r/pull/${9007 + i}`).join(" "),
].join("\n");

const ATTR_ENTRIES = registerEntries(ATTRIBUTION_REGISTER);

{
  // PRECONDITION. Every case below rests on this register parsing into lines
  // with the pull-request counts the comments claim. Asserted rather than
  // assumed, because a fixture that parses differently than described would
  // make the cases pass for the wrong reason.
  const sizes = ATTR_ENTRIES.map((e) => e.prs.size);
  check(
    "PRECONDITION: the attribution register parses into lines naming 1, 2, 2, 1 and 12 pull requests",
    ATTR_ENTRIES.length === 5 &&
      sizes.join(",") === "1,2,2,1,12" &&
      ATTR_ENTRIES[0].prs.has(9001) &&
      ATTR_ENTRIES[1].prs.has(9002) &&
      ATTR_ENTRIES[1].prs.has(9003) &&
      ATTR_ENTRIES[4].prs.has(9007),
    JSON.stringify(sizes),
  );
}

// The record side is the real shape the population has: proof declared
// required, and the record stating it has not run.
function attrRow(pr) {
  return reconcileRecord({
    record: parseRecord({ file: `r-${pr}.md`, text: RELEASE_RECORD_NOT_RUN }),
    pr,
    entries: ATTR_ENTRIES,
  });
}

{
  // A line naming ONE pull request is an exact account, and the verdict stands
  // as the comparison made it. This is the case that must NOT move.
  const row = attrRow(9001);
  check(
    "a deciding line naming exactly one pull request is EXACT, and its verdict is the comparison",
    row.attribution === ATTR_EXACT &&
      row.registerLinePullRequests === 1 &&
      row.verdict === AGREE &&
      row.comparedVerdict === AGREE,
    JSON.stringify(row),
  );
}

{
  // The item's rule. Two pull requests is inexact, and the row says so in its
  // own state instead of handing back a verdict that reads as a judgement.
  const row = attrRow(9002);
  check(
    "a deciding line naming TWO pull requests reports inexact attribution as its own state",
    row.attribution === ATTR_INEXACT &&
      row.registerLinePullRequests === 2 &&
      row.verdict === INEXACT_ATTRIBUTION,
    JSON.stringify(row),
  );
}

{
  // "Do not drop the row: a line naming two may well be about both." The
  // comparison the row would otherwise have reported is retained, so a reader
  // who decides the line IS about both records recovers the verdict without
  // re-running anything — and a DISAGREE is the case where losing it costs
  // most, because a disagreement is the thing this module exists to find.
  const row = attrRow(9004);
  check(
    "an inexact row RETAINS the comparison, so a disagreement is not dropped by being inexact",
    row.attribution === ATTR_INEXACT &&
      row.verdict === INEXACT_ATTRIBUTION &&
      row.comparedVerdict === DISAGREE &&
      row.registerSays === OBTAINED &&
      row.recordSays === NOT_RUN,
    JSON.stringify(row),
  );
}

{
  // The bulk line. Nothing about the magnitude changes the rule — it is still
  // one state — but the COUNT has to survive onto the row, because 2 and 12 are
  // the same verdict and not remotely the same evidence.
  const row = attrRow(9007);
  check(
    "a bulk citation is inexact and the row carries how many pull requests decided it",
    row.attribution === ATTR_INEXACT &&
      row.verdict === INEXACT_ATTRIBUTION &&
      row.registerLinePullRequests === 12,
    JSON.stringify(row),
  );
}

{
  // Two ways to have no attribution, and they must stay distinguishable.
  // `none` with matched lines means the register spoke about this pull request
  // and said nothing about its proof; `none` with no matched lines means the
  // register never mentioned it. Folding them together would hide 33 rows of
  // the live population inside 84.
  const silent = attrRow(9006);
  const absent = attrRow(9999);
  check(
    "no deciding line is its own attribution state, and a silent line stays distinct from no line",
    silent.attribution === ATTR_NONE &&
      silent.registerLines === 1 &&
      absent.attribution === ATTR_NONE &&
      absent.registerLines === 0 &&
      absent.verdict === NO_REGISTER_LINE,
    `${JSON.stringify(silent)}\n${JSON.stringify(absent)}`,
  );
}

{
  // REGRESSION GUARD on rule 1, which this change must not disturb: when an
  // exact line and an inexact line both name the record, the exact one still
  // wins and the row is EXACT. Inverting the preference makes this row inexact,
  // so the fix cannot be "call everything inexact".
  const entries = registerEntries(
    [
      "2026-09-26T11:00:00Z | agent#a | sweep — signed-in acceptance was proven for " +
        "https://github.com/o/r/pull/9100 https://github.com/o/r/pull/9101 " +
        "https://github.com/o/r/pull/9102.",
      "2026-09-26T11:01:00Z | agent#a | RELEASED item C-905 via https://github.com/o/r/pull/9100 — " +
        "signed-in acceptance is owed and was not run.",
    ].join("\n"),
  );
  const row = reconcileRecord({
    record: parseRecord({ file: "r.md", text: RELEASE_RECORD_NOT_RUN }),
    pr: 9100,
    entries,
  });
  check(
    "REGRESSION GUARD: an exact line still beats an inexact one, and that row is EXACT",
    row.attribution === ATTR_EXACT &&
      row.registerLinePullRequests === 1 &&
      row.verdict === AGREE,
    JSON.stringify(row),
  );
}

{
  // The census has to add up. The item asks for the population "per row rather
  // than as a count", and a count that cannot be reconciled to the rows it came
  // from is the shape this backlog exists to repair — so the buckets are
  // asserted to partition the population, not merely to contain the new one.
  const result = reconcile({
    records: [9001, 9002, 9004, 9006, 9007, 9999].map((pr) => ({
      file: `r-${pr}.md`,
      text: RELEASE_RECORD_NOT_RUN,
      pr,
    })),
    register: ATTRIBUTION_REGISTER,
  });
  const summed = Object.values(result.counts).reduce((a, b) => a + b, 0);
  const inexactRows = result.rows.filter((r) => r.attribution === ATTR_INEXACT);
  check(
    "reconcile counts inexact attribution as its own bucket and the buckets partition the population",
    result.counts[INEXACT_ATTRIBUTION] === 3 &&
      inexactRows.length === 3 &&
      summed === result.population &&
      result.population === 6 &&
      result.rows.every((r) => r.attribution !== undefined),
    JSON.stringify(result.counts) + ` summed=${summed} population=${result.population}`,
  );
}

{
  // The report is the only thing most readers see. An inexact row has to be
  // NAMED there with the number of pull requests that decided it and with the
  // comparison it would otherwise have reported — a bucket whose rows are
  // invisible is the count that hides them.
  //
  // TWO rows with DIFFERENT counts, and that is the whole point of the case
  // rather than thoroughness. Written first over the 2-pull-request row alone,
  // this case SURVIVED a mutation that replaced `row.registerLinePullRequests`
  // with the literal `2` — a report that prints a constant where a reader
  // expects a measurement, passing because the one row it was shown happened to
  // have that value. Asserting over 2 AND 12 in the same report means no
  // constant satisfies it.
  const result = reconcile({
    records: [
      { file: "r-9004.md", text: RELEASE_RECORD_NOT_RUN, pr: 9004 },
      { file: "r-9007.md", text: RELEASE_RECORD_NOT_RUN, pr: 9007 },
    ],
    register: ATTRIBUTION_REGISTER,
  });
  const text = formatReport(result);
  const section = text.split("\n").find((l) => l.includes(INEXACT_ATTRIBUTION));
  check(
    "formatReport names each inexact row, how many pull requests decided it, and the comparison",
    section !== undefined &&
      text.includes("r-9004.md") &&
      text.includes("r-9007.md") &&
      /named 2 pull requests/.test(text) &&
      /named 12 pull requests/.test(text) &&
      new RegExp(`would have read ${DISAGREE}`).test(text),
    text,
  );
}

{
  // NEGATIVE CONTROL, and the one that protects the other half of C-528. The
  // release-step reviewer does NO pull-request matching at all — it is handed
  // the records the branch adds — so attribution is not a question it can ask
  // and must not be one it answers. A line naming a dozen pull requests still
  // contradicts a record that says its proof did not run, because the caller,
  // not the line, established which records are in scope.
  const review = reviewReleaseLine({
    line:
      "2026-09-26T10:20:00Z | agent#a | sweep — signed-in acceptance was proven for " +
      Array.from({ length: 12 }, (_, i) => `https://github.com/o/r/pull/${9007 + i}`).join(" "),
    records: [{ file: "f.md", text: RELEASE_RECORD_NOT_RUN }],
  });
  check(
    "NEGATIVE CONTROL: attribution does not leak into the writer, which does no pull-request matching",
    review.registerSays === OBTAINED &&
      review.contradicted.length === 1 &&
      review.rows[0].verdict === DISAGREE &&
      review.rows[0].attribution === undefined,
    JSON.stringify(review),
  );
}

/* ------------------------------------------------------------------------- */
/* A deciding line that says nothing about the proof is not agreement (C-545)  */
/* ------------------------------------------------------------------------- */

/*
 * `registerSays: silent` fell through every case of `compareAccounts` and came
 * back `agree`, so *the register mentioned this release and said nothing about
 * its proof* was reported with the same word as *the register independently
 * confirms what the record says*. A false clean, and a false clean is invisible.
 *
 * Measured on `origin/main` `2301644d9` with `--since 2026-09-19T00:00:00Z`
 * over 220 records: 34 rows carried `registerSays: silent` and all 34 were
 * counted inside the 67 `agree`. Those 34 are not one defect. Two kinds, and
 * the split is why the rows are printed individually rather than totalled:
 *
 *   - `unread` (22 of 34) — the deciding line HAS a sentence about a signed-in
 *     proof and this module's markers read no verdict from it. `#8507`'s line
 *     says the signed-in answer carries the refreshed date, which reads like a
 *     run, against a record that says not-run. That row is a candidate
 *     DISAGREE and it was reported as agreement.
 *   - `unmentioned` (12 of 34) — no sentence in the deciding line mentions a
 *     signed-in proof at all. `#8513`'s line owes a "positive live Responses
 *     canvas readback", which is a proof debt in words this reader does not
 *     recognise as signed-in.
 *
 * Neither is repaired by loosening a marker: C-529 records that loosening
 * converts a refusal into a wrong answer. Both are reported, with the sentence
 * the deciding line offered where there is one, and a human reads them.
 */

// Quoted from EXECUTION_CLAIMS.md at 2026-09-26T14:48:29Z, identity
// codex-source-cpo#20260926T1416Z, releasing C-530 through PR #8507. The
// sentence about the proof is there and no marker reads a verdict from it.
const SILENT_UNREAD_LINE =
  "2026-09-26T14:48:29Z | codex-source-cpo#20260926T1416Z | RELEASED item C-530 on branch " +
  "`codex/source-contract-date-context` — PR #8507 merged at " +
  "2f1f6613a549c309eafb9fa192add3c365046968 after 35 applicable green checks; official ACA " +
  "main run 36249129151 success with digest-pinned web 100 percent revision and both workers " +
  "independently verified. Signed-in exact contract answer now carries the same date as the " +
  "refreshed page. Canonical row lineage unavailable without database URL; frozen Scope still " +
  "blocked and Stage 06 readback owed.";

// Quoted from EXECUTION_CLAIMS.md at 2026-09-26T16:40:48Z, identity
// codex-source-cpo#20260926T1558Z, releasing U-538 through PR #8513. No
// sentence in it mentions a signed-in proof.
const SILENT_UNMENTIONED_LINE =
  "2026-09-26T16:40:48Z | codex-source-cpo#20260926T1558Z | RELEASED item U-538 on branch " +
  "`codex/source-responses-fact-beats` — PR #8513 merged at " +
  "df2f15aa04bba0e4c7e066849e069002ad100f03 after 36 successful CI checks; official ACA run " +
  "36255666278 succeeded and independent web/revision/worker digest proof matched " +
  "sha256:034dce51f017bf8b43242051804f4fd496eade6b4f18fbcde9b091d76a9c47a4. Frozen Scope " +
  "remains blocked; positive live Responses canvas readback owed.";

const SILENT_ENTRIES = registerEntries([SILENT_UNREAD_LINE, SILENT_UNMENTIONED_LINE].join("\n"));

{
  // PRECONDITION, and the one that stops every case below passing vacuously.
  // Both lines must PARSE, must each name exactly the one pull request their
  // comment claims, and must both come back SILENT from the verdict reader —
  // if either resolved a verdict, the case would be testing some other state
  // under this item's name.
  const sizes = SILENT_ENTRIES.map((e) => e.prs.size);
  const verdicts = SILENT_ENTRIES.map((e) => registerSignedInVerdict(e.text));
  check(
    "PRECONDITION: both quoted lines name one pull request each and both read SILENT",
    SILENT_ENTRIES.length === 2 &&
      sizes.join(",") === "1,1" &&
      SILENT_ENTRIES[0].prs.has(8507) &&
      SILENT_ENTRIES[1].prs.has(8513) &&
      verdicts.every((v) => v.verdict === SILENT) &&
      typeof verdicts[0].sentence === "string" &&
      verdicts[1].sentence === null,
    JSON.stringify({ sizes, verdicts }),
  );
}

{
  // The states exist, asserted through the namespace so a missing export is a
  // failed case rather than a link-time crash that reads as "found nothing".
  check(
    "register-silent and the two silence kinds are exported states",
    reconcileModule.REGISTER_SILENT === "register-silent" &&
      reconcileModule.UNREAD === "unread" &&
      reconcileModule.UNMENTIONED === "unmentioned" &&
      reconcileModule.REGISTER_SILENT !== NO_REGISTER_LINE &&
      reconcileModule.REGISTER_SILENT !== AGREE,
    JSON.stringify({
      s: reconcileModule.REGISTER_SILENT,
      u: reconcileModule.UNREAD,
      m: reconcileModule.UNMENTIONED,
    }),
  );
}

{
  // The rule itself, over all three things a record can say. None of them is
  // agreement: the record's own account is not corroborated by a line that
  // said nothing about it, whichever way the record leans.
  const forRecord = (recordSays) => compareAccounts({ recordSays, registerSays: SILENT });
  check(
    "compareAccounts reports a silent deciding line as its own state for every record account",
    [NOT_RUN, RAN, UNSTATED].every(
      (says) => forRecord(says) === reconcileModule.REGISTER_SILENT,
    ) && compareAccounts({ recordSays: NOT_RUN, registerSays: null }) === NO_REGISTER_LINE,
    JSON.stringify([NOT_RUN, RAN, UNSTATED].map(forRecord)),
  );
}

{
  // The item is explicit that this must NOT be folded into `no-register-line`:
  // the register did speak about this pull request, which is a different fact
  // from never having mentioned it, and the row has to say which. So the two
  // are asserted to differ on the same record, from the same reader.
  const spoke = reconcileRecord({
    record: parseRecord(realRecord("2026-09-26-source-contract-date-context.md")),
    pr: 8507,
    entries: SILENT_ENTRIES,
  });
  const neverSpoke = reconcileRecord({
    record: parseRecord(realRecord("2026-09-26-source-contract-date-context.md")),
    pr: 9999,
    entries: SILENT_ENTRIES,
  });
  check(
    "a line that named this pull request and said nothing is NOT no-register-line",
    spoke.verdict === reconcileModule.REGISTER_SILENT &&
      spoke.registerLines === 1 &&
      neverSpoke.verdict === NO_REGISTER_LINE &&
      neverSpoke.registerLines === 0,
    `${JSON.stringify(spoke)}\n${JSON.stringify(neverSpoke)}`,
  );
}

{
  // A REAL row of the 22, and the one that shows what the false clean cost.
  // The record says its replay did not run; the deciding line's sentence reads
  // like it did. The row must carry that sentence, and the line's stamp and
  // identity, or a reader cannot go and settle it — which is the whole reason
  // the item asks for the 34 printed individually instead of counted.
  const row = reconcileRecord({
    record: parseRecord(realRecord("2026-09-26-source-contract-date-context.md")),
    pr: 8507,
    entries: SILENT_ENTRIES,
  });
  check(
    "an UNREAD silence carries the sentence the deciding line offered, with its stamp and identity",
    row.verdict === reconcileModule.REGISTER_SILENT &&
      row.registerSays === SILENT &&
      row.registerSilence === reconcileModule.UNREAD &&
      /Signed-in exact contract answer/.test(String(row.registerEvidence)) &&
      row.registerStamp === "2026-09-26T14:48:29Z" &&
      row.registerIdentity === "codex-source-cpo#20260926T1416Z" &&
      // STALE EXPECTATION, UPDATED RATHER THAN DROPPED (item C-548). This read
      // `NOT_RUN` when the case was written, and that clause was incidental:
      // the case is about the register's SILENCE, and it pinned whatever the
      // record happened to say at the time. C-548 settled this row as one of
      // eleven that report a completed run, and amended the record to say so,
      // so the record's own account is now `ran`. Flipping the constant would
      // be the weakening this suite exists against, so the clause is made
      // load-bearing instead: the row must STILL be `register-silent` with its
      // sentence, stamp and identity intact. That is the stronger claim — the
      // amendment corrected the record and did NOT paper over the fact that the
      // register never said a verdict, which is the defect C-545 exposed and
      // this change must not hide.
      row.recordSays === RAN,
    JSON.stringify(row),
  );
}

{
  // A REAL row of the 12. There is no sentence to offer, and the row says so
  // by kind rather than by an empty string — but it still carries the stamp and
  // identity, because "the register said nothing this reader recognises" is
  // only checkable if the reader can find the line.
  const row = reconcileRecord({
    record: parseRecord(realRecord("2026-09-26-source-responses-fact-beats.md")),
    pr: 8513,
    entries: SILENT_ENTRIES,
  });
  check(
    "an UNMENTIONED silence offers no sentence and still names the deciding line",
    row.verdict === reconcileModule.REGISTER_SILENT &&
      row.registerSilence === reconcileModule.UNMENTIONED &&
      row.registerEvidence === null &&
      row.registerStamp === "2026-09-26T16:40:48Z" &&
      row.registerIdentity === "codex-source-cpo#20260926T1558Z",
    JSON.stringify(row),
  );
}

{
  // The new state must not be swallowed by the C-540 attribution override:
  // `verdict` is set to `inexact-attribution` whenever attribution is inexact,
  // so if a silent deciding line were given an attribution the row would be
  // reported as a batch-citation problem instead of a silence. Silent rows keep
  // `attribution: none` and no pull-request count, which is what C-540's own
  // case on 9006 already rests on.
  const row = reconcileRecord({
    record: parseRecord(realRecord("2026-09-26-source-contract-date-context.md")),
    pr: 8507,
    entries: SILENT_ENTRIES,
  });
  check(
    "a silent row keeps attribution none, so the silence is never reported as inexact attribution",
    row.attribution === ATTR_NONE &&
      row.registerLinePullRequests === null &&
      row.verdict !== INEXACT_ATTRIBUTION,
    JSON.stringify(row),
  );
}

{
  // A silent deciding line is CHOSEN by the same two rules as any other — fewest
  // other pull requests first, then newest. Without that, the row reports the
  // stamp of whichever silent line happens to be last, and on the live register
  // a bulk line naming a dozen releases is usually the last. The exact line
  // here is the OLDER of the two, so "newest wins" alone picks the wrong one.
  const entries = registerEntries(
    [
      "2026-09-26T09:00:00Z | agent#exact | RELEASED item C-906 via " +
        "https://github.com/o/r/pull/9200 — merged, deployed, digest pinned.",
      "2026-09-26T09:30:00Z | agent#bulk | sweep — merged and deployed: " +
        Array.from({ length: 9 }, (_, i) => `https://github.com/o/r/pull/${9200 + i}`).join(" "),
    ].join("\n"),
  );
  const row = reconcileRecord({
    record: parseRecord({ file: "r.md", text: RELEASE_RECORD_NOT_RUN }),
    pr: 9200,
    entries,
  });
  check(
    "the deciding silent line is picked by fewest-pull-requests-then-newest, not merely newest",
    row.verdict === reconcileModule.REGISTER_SILENT &&
      row.registerIdentity === "agent#exact" &&
      row.registerStamp === "2026-09-26T09:00:00Z",
    JSON.stringify(row),
  );
}

{
  // The report is the only thing most readers see, and the item asks for the
  // rows individually WITH the sentence. Both kinds in one report, because a
  // report that prints one kind is a report that hides the other — and the
  // count is asserted alongside the two named rows so a constant cannot satisfy
  // it.
  const result = reconcile({
    records: [
      { ...realRecord("2026-09-26-source-contract-date-context.md"), pr: 8507 },
      { ...realRecord("2026-09-26-source-responses-fact-beats.md"), pr: 8513 },
    ],
    register: [SILENT_UNREAD_LINE, SILENT_UNMENTIONED_LINE].join("\n"),
  });
  const text = formatReport(result);
  const summed = Object.values(result.counts).reduce((a, b) => a + b, 0);
  check(
    "reconcile counts register-silent as its own bucket and the buckets still partition the population",
    result.counts[reconcileModule.REGISTER_SILENT] === 2 &&
      result.counts[AGREE] === 0 &&
      summed === result.population &&
      result.population === 2,
    JSON.stringify(result.counts) + ` summed=${summed} population=${result.population}`,
  );
  check(
    "formatReport names each silent row, its kind, and the sentence the deciding line offered",
    new RegExp(`## ${reconcileModule.REGISTER_SILENT} — 2`).test(text) &&
      text.includes("2026-09-26-source-contract-date-context") &&
      text.includes("2026-09-26-source-responses-fact-beats") &&
      new RegExp(reconcileModule.UNREAD).test(text) &&
      new RegExp(reconcileModule.UNMENTIONED).test(text) &&
      /Signed-in exact contract answer/.test(text),
    text,
  );
}

{
  // NEGATIVE CONTROL for the shared rule's second caller. `compareAccounts` is
  // also the release-step writer's comparison, so this change moves it — the
  // rows it returns for a silent line now say `register-silent`. What must NOT
  // move is the set it refuses on: `contradicted` is the disagreements, and a
  // silence is not a disagreement. If this case goes red, a reader of
  // `append-claim.mjs` is being told a line contradicts a record when all that
  // happened is that the line was quiet.
  const review = reviewReleaseLine({
    line: "2026-09-26T10:15:00Z | agent#a | RELEASED item C-907 via " +
      "https://github.com/o/r/pull/9300 — merged, deployed, digest pinned.",
    records: [{ file: "f.md", text: RELEASE_RECORD_NOT_RUN }],
  });
  check(
    "NEGATIVE CONTROL: a silent line moves the writer's verdict and not its refusal set",
    review.registerSays === SILENT &&
      review.population === 1 &&
      review.rows[0].verdict === reconcileModule.REGISTER_SILENT &&
      review.contradicted.length === 0,
    JSON.stringify(review),
  );
}


/* ------------------------------------------------------------------------- */
/* Item C-548 — the eleven records the register says were replayed            */
/* ------------------------------------------------------------------------- */

/**
 * `C-545` gave a silent deciding line its own reported state and split the
 * silent rows into `unread` and `unmentioned`. `C-548` read the `unread`
 * sentences one at a time. Eleven of them report a **completed signed-in run**
 * against a record whose own account says the run had not happened — the
 * disagreement `C-548` predicted might exist once, measured eleven times.
 *
 * The register is operator-owned and CI cannot see it, so this suite cannot
 * assert what the register says. What it CAN assert, and what the defect
 * actually is, lives in this repository: the durable public record asserted a
 * debt that the register says was discharged, and nothing made the record
 * carry it. So each row below is pinned by the record file, read from disk.
 *
 * **Red before the amendment, by construction.** Every one of these eleven
 * parsed `not-run` or `unstated` on `60bc9c7702`; the amendment is what moves
 * them, and deleting any one of them puts its case back to red. That is the
 * mutation check, and it is per record rather than against a total, because a
 * count can be satisfied by amending the wrong file twice.
 *
 * **What this case does NOT assert.** It does not assert the run passed — two
 * of the eleven report a run that FAILED, and a failed run is still a run, so
 * `ran` is the honest state for both. It does not assert this agent observed
 * anything: each amendment cites the register line's stamp and identity, and
 * the citation is required here so a future reader can tell a reconciled
 * account from a first-hand one.
 */
const C548_RECONCILED = [
  ["2026-09-26-source-360-contract-value-lineage.md", 8527, "2026-09-26T21:30:45Z"],
  ["2026-09-26-source-360-direct-impact-detail.md", 8525, "2026-09-26T21:36:20Z"],
  ["2026-09-26-source-contract-date-context.md", 8507, "2026-09-26T14:48:29Z"],
  ["2026-09-26-source-contract-context-authority.md", 8505, "2026-09-26T14:12:17Z"],
  ["2026-09-26-source-scope-readiness-message.md", 8496, "2026-09-26T10:29Z"],
  ["2026-09-23-source-new-demo-decision.md", 8333, "2026-09-23T11:36:10Z"],
  ["2026-09-22-source-recorded-approval-audit-honesty.md", 8287, "2026-09-22T20:33:16Z"],
  ["2026-09-22-source-new-completion-integrity.md", 8277, "2026-09-22T19:21:46Z"],
  ["2026-09-22-source-ava-mounted-artifact-projection.md", 8253, "2026-09-22T13:24:40Z"],
  ["2026-09-22-source-ava-event-artifact-alias-reconciliation.md", 8246, "2026-09-22T12:45:35Z"],
  ["2026-09-22-authenticated-profile-name-precedence.md", 8238, "2026-09-22T08:51:52Z"],
];

for (const [basename, pr, stamp] of C548_RECONCILED) {
  const { text } = realRecord(basename);
  const parsed = parseStatedRunState(text);
  check(
    `C-548: ${basename} reads \`ran\` after reconciliation`,
    parsed.state === RAN,
    `state=${parsed.state} evidence=${parsed.evidence ?? "(none)"}`,
  );
  check(
    `C-548: ${basename} cites the register line that reports the run`,
    text.includes(stamp) && text.includes(`C-548`) && new RegExp(`#?${pr}\\b`).test(text),
    `stamp=${stamp} pr=${pr}`,
  );
}

{
  // BOTH DIRECTIONS. The amendment is a grammar the reconciler has to read, so
  // the suite has to show the reader can still refuse. Same heading, same
  // shape, one negated clause: this must NOT come back `ran`, or the amendment
  // template is a phrase that reports a run no matter what it says — which is
  // the `C-529` failure mode (a loosened marker turns a refusal into a wrong
  // answer) reached from the writer's side instead of the reader's.
  const { text } = realRecord("2026-09-26-source-360-direct-impact-detail.md");
  const negated = text.replace(
    /^- Ran: a signed-in replay was run/m,
    "- Not run: no signed-in replay was run",
  );
  check(
    "C-548 NEGATIVE CONTROL: the amendment template negated is not read as a run",
    negated !== text && parseStatedRunState(negated).state !== RAN,
    `changed=${negated !== text} state=${parseStatedRunState(negated).state}`,
  );
}

{
  // A record the register genuinely says nothing affirmative about must not be
  // swept along. `2026-09-26-source-responses-fact-beats` is an `unmentioned`
  // silent row — its deciding line mentions no signed-in proof at all — and it
  // is deliberately NOT amended. If this goes red, the amendment pass was run
  // over the wrong set.
  const { text } = realRecord("2026-09-26-source-responses-fact-beats.md");
  check(
    "C-548 NEGATIVE CONTROL: an `unmentioned` silent row is left alone",
    !text.includes("C-548") && parseStatedRunState(text).state === NOT_RUN,
    `state=${parseStatedRunState(text).state}`,
  );
}


/* ------------------------------------------------------------------------- */
/* Item C-551 — a line that names the pull request without being about it     */
/* ------------------------------------------------------------------------- */

/**
 * `C-545` split *the register mentioned this release and said nothing* from
 * *the register never mentioned it*. Underneath both sits a third state: **the
 * register named the number while talking about something else**, and until
 * this item it was reported as the first.
 *
 * Measured on the live register at `2026-09-27T02:26Z` over the 25 `unread`
 * rows `C-548` settled: five have a deciding line whose subject is other work
 * and which names the record's pull request as a stack base (`#8260`), a
 * file-collision explanation (`#8303`), a rebase reference (`#8297`), an
 * explicit **exclusion** of that pull request's files (`#8296`), or an
 * announcement of follow-up work (`#8200`).
 *
 * **The distinguishing fact is structural, and a phrasing rule was not
 * written.** `C-529` records what loosening a marker costs, and "stacked
 * after", "rebasing onto", "exclusions", "behind open" and "follow-up for" are
 * five different phrasings of one structure. So the rule read here is the
 * register's own subject grammar — the same first-written-wins contest
 * `fossil-claims.mjs` already applies to *item ids*, for exactly this defect
 * ("register lines routinely narrate another lane's item in passing"), applied
 * to *pull requests*:
 *
 *   - A line whose message field leads with a claim declares work not yet
 *     done, so it has no subject pull request at all.
 *   - A line carrying a `branch` or `files:` field is a claim by the same
 *     reasoning — **unless** its lead asserts an outcome, which is the case
 *     that keeps a real release line from being swept up (case 8203 below).
 *   - Otherwise the subject is the FIRST pull request written in the lead
 *     field, and every other number on the line is named in passing.
 *
 * **Both directions, on real lines.** The five above must move, and the
 * genuine deciding line `RELEASED item U-599 through PR #8203 | …` — which
 * carries a file list of its own and would be caught by the claim-shape rule
 * without the outcome-lead precedence — must not.
 *
 * Each line below is quoted from `EXECUTION_CLAIMS.md`, truncated to the
 * structure the rule reads, with its stamp and identity. CI cannot see the
 * operator register, so the lines are constants here — but a truncated
 * quotation is an observation, not an invention, and the truncation is to the
 * lead field on purpose: the lead field is what decides these cases.
 */

// A claim line whose lead is `CLAIMING` and which names #8303 to explain a
// file collision. 2026-09-22T23:00:03Z, identity codex-cpo-source-new-smoke.
const C551_FILE_COLLISION =
  "CLAIMING CPO-SMOKE-INTELLIGENCE-FILES-DESTINATION behind open PR #8303 because both touch " +
  "`src/components/source/new-workspace/SourceNewWorkspace.tsx`. Signed-in failure on the " +
  "immutable carrier: Intelligence labels the next action `Review loaded evidence` but links " +
  "to the bare event URL.";

// An outcome line about #8303 which names #8297 only as a rebase base.
// 2026-09-22T22:50:14Z, identity codex-source-request-history-summary.
const C551_REBASE_NOTE =
  "PR #8303 OPEN at head `f4b1f633d2`; mergeable and squash auto-merge armed, with hosted " +
  "checks running and no bypass. Local proof after rebasing onto merged response-intake PR " +
  "#8297: focused mounted/repository/projection/page behavior 4 suites.";

// A claim line naming #8296 inside an explicit exclusion.
// 2026-09-22T22:31:27Z, identity codex-source-stage07-evaluation-bafo-smoke.
const C551_EXCLUSION =
  "CLAIMED CPO Source New Stage 07 Evaluation/BAFO mounted-path audit on branch " +
  "`codex/source-stage07-evaluation-bafo-smoke`. Scope: trace the signed-in production path " +
  "from normalized supplier responses through comparable evaluation. Explicit exclusions: all " +
  "supplier-response intake files owned by PR #8296, `SourceAnalyticsCanvas` approval controls " +
  "and tests, migrations, tenant data.";

// A claim line whose lead is not a claim verb and whose claim shape is its
// `files:` field; #8260 is its stack base.
// 2026-09-22T14:52:28Z, identity codex-source-servicenow-review.
const C551_STACK_BASE =
  "Governed ServiceNow request review-to-event handoff claimed, stacked after PR #8260 | " +
  "files: new request-review projection/component and focused tests, " +
  "`src/app/(maestro)/source/new/page.tsx` | No migration apply, data load, supplier contact, " +
  "email, external send, legal/security/finance approval, award, or signed-in proof is claimed.";

// A claim line announcing follow-up work for #8200, with `branch` and `files:`
// fields. 2026-09-22T00:40:00Z, identity codex-source-new-ava-phase-readiness.
const C551_FOLLOW_UP =
  "Source New signed-in acceptance follow-up for #8200 | branch " +
  "codex/source-new-ava-phase-readiness from current origin/main | files: " +
  "src/app/api/v1/source/[eventId]/nexus/ask/route.ts, its existing real-route test | repair " +
  "the live payload so a combined completion/evidence question uses the simplified Source New " +
  "phase label. No signed-in acceptance claim.";

// THE CONTROL, and it is a real release line, not an invented one: a genuine
// deciding line for #8203 that ALSO carries a file list and a `squash` field.
// 2026-09-22T01:02:00Z, identity codex-source-value-movement-presentation.
const C551_REAL_RELEASE =
  "RELEASED item U-599 through PR #8203 | squash cf85f75599 | repo-owned ACA run 35673375008 " +
  "completed success; runtime proof with the expected/template/active image and both governed " +
  "workers on one digest | branch codex/source-value-movement-presentation | files: the " +
  "presentation projection and its focused tests. Signed-in acceptance passed on the governed " +
  "Scope Intelligence Explorer.";

/*
 * The namespace guard of C-540 stops a link-time SyntaxError; it does not stop
 * `c551.role(...)` from throwing while the function does not
 * exist yet, and the first red run of this block did exactly that — one FAIL
 * and then a TypeError that took the remaining 112 cases with it. A red-first
 * measurement has to be a CASE COUNT, so every call below goes through these
 * wrappers and a missing export fails the case that asked for it.
 */
const c551 = {
  role: (line, pr) =>
    typeof reconcileModule.mentionRole === "function"
      ? reconcileModule.mentionRole(line, pr)
      : "(mentionRole is missing)",
  subject: (line) =>
    typeof reconcileModule.subjectPullRequest === "function"
      ? reconcileModule.subjectPullRequest(line)
      : "(subjectPullRequest is missing)",
  clause: (line, pr) =>
    typeof reconcileModule.mentionClause === "function"
      ? reconcileModule.mentionClause(line, pr)
      : null,
};

{
  // 1. The vocabulary exists. Asserted through the namespace (see C-540's note
  // above): a named import of a missing export is a link-time SyntaxError that
  // takes the suite to "0 passed", which a red-first measurement cannot tell
  // apart from a suite that found nothing.
  check(
    "C-551: the module names a passing-mention state and its two roles",
    reconcileModule.PASSING_MENTION === "passing-mention" &&
      reconcileModule.SUBJECT === "subject" &&
      reconcileModule.PASSING === "passing" &&
      typeof reconcileModule.subjectPullRequest === "function" &&
      typeof reconcileModule.mentionRole === "function" &&
      typeof reconcileModule.mentionClause === "function",
    `PASSING_MENTION=${reconcileModule.PASSING_MENTION} SUBJECT=${reconcileModule.SUBJECT} ` +
      `PASSING=${reconcileModule.PASSING} ` +
      `subjectPullRequest=${typeof reconcileModule.subjectPullRequest} ` +
      `mentionRole=${typeof reconcileModule.mentionRole} ` +
      `mentionClause=${typeof reconcileModule.mentionClause}`,
  );
}

{
  // 2-6. The five, one case each, because they differ in KIND. A rule that
  // catches the stack reference need not catch the exclusion, so a single
  // aggregate assertion over the five would let four failures hide behind one
  // pass — the defect this whole backlog exists to repair, at test scale.
  const five = [
    ["a file-collision explanation (#8303) is a passing mention", C551_FILE_COLLISION, 8303, null],
    ["a rebase note (#8297) is a passing mention", C551_REBASE_NOTE, 8297, 8303],
    ["an explicit exclusion (#8296) is a passing mention", C551_EXCLUSION, 8296, null],
    ["a stack base (#8260) is a passing mention", C551_STACK_BASE, 8260, null],
    ["a follow-up announcement (#8200) is a passing mention", C551_FOLLOW_UP, 8200, null],
  ];
  for (const [name, line, pr, subject] of five) {
    check(
      `C-551: ${name}`,
      c551.role(line, pr) === reconcileModule.PASSING &&
        c551.subject(line) === subject,
      `role=${c551.role(line, pr)} ` +
        `subject=${String(c551.subject(line))} (expected ${String(subject)})`,
    );
  }
}

{
  // 7. THE OTHER DIRECTION, and the precedence case. This line carries a
  // `files:` field and a `branch` field, so the claim-shape rule alone would
  // call it a claim and refuse the one row it genuinely decides. Its lead
  // asserts an outcome, and that is what must win.
  check(
    "C-551 BOTH DIRECTIONS: a real `RELEASED item … through PR #n` line still decides its row",
    c551.role(C551_REAL_RELEASE, 8203) === reconcileModule.SUBJECT &&
      c551.subject(C551_REAL_RELEASE) === 8203,
    `role=${c551.role(C551_REAL_RELEASE, 8203)} ` +
      `subject=${String(c551.subject(C551_REAL_RELEASE))}`,
  );

  // 8. The same line, and the number it names in passing. One line decides one
  // row and cites another; asserting only the subject would pass with a
  // classifier that answers `subject` unconditionally.
  const cited = C551_REAL_RELEASE.replace("| squash", "| stacked on PR #8199 | squash");
  check(
    "C-551 BOTH DIRECTIONS: the same outcome line names #8199 in passing",
    c551.role(cited, 8203) === reconcileModule.SUBJECT &&
      c551.role(cited, 8199) === reconcileModule.PASSING,
    `8203=${c551.role(cited, 8203)} 8199=${c551.role(cited, 8199)}`,
  );
}

{
  // 9. The clause, per row. The item requires the rows printed individually
  // *with the clause that names the pull request*, because the five differ in
  // kind and a reader settling them needs the words, not the count.
  check(
    "C-551: the clause naming the pull request is recoverable for the report",
    /rebasing onto merged response-intake PR #8297/.test(
      c551.clause(C551_REBASE_NOTE, 8297) ?? "",
    ) &&
      !/OPEN at head/.test(c551.clause(C551_REBASE_NOTE, 8297) ?? ""),
    JSON.stringify(c551.clause(C551_REBASE_NOTE, 8297)),
  );
}

{
  // 10-11. The row, end to end. A record whose only register line names its
  // pull request in passing must come back `passing-mention` — not
  // `register-silent`, which asserts the register spoke about this release, and
  // not `agree`. And the row must carry the counts that say what
  // `registerLines` was overstating.
  const register =
    `2026-09-22T00:40:00Z | codex-source-new-ava-phase-readiness | ${C551_FOLLOW_UP}`;
  const row = reconcileRecord({
    record: parseRecord({ file: "r.md", text: RELEASE_RECORD_NOT_RUN }),
    pr: 8200,
    entries: registerEntries(register),
  });
  check(
    "C-551: a row whose only line is a passing mention reports `passing-mention`",
    row.verdict === reconcileModule.PASSING_MENTION && row.registerSays == null,
    `verdict=${row.verdict} registerSays=${String(row.registerSays)} silence=${String(row.registerSilence)}`,
  );
  check(
    "C-551: the row splits `registerLines` into subject and passing, and quotes the clause",
    row.registerLines === 1 &&
      row.registerSubjectLines === 0 &&
      row.registerPassingLines === 1 &&
      /follow-up for #8200/.test(row.registerPassingClauses?.[0]?.clause ?? "") &&
      row.registerPassingClauses[0].stamp === "2026-09-22T00:40:00Z",
    JSON.stringify({
      lines: row.registerLines,
      subject: row.registerSubjectLines,
      passing: row.registerPassingLines,
      clauses: row.registerPassingClauses,
    }),
  );
}

{
  // 12. The selection, which is where four of the five actually move. #8303
  // has TWO matched lines: the claim that names it to explain a collision, and
  // the outcome line that is about it. Before this item the claim won — it is
  // the newest line naming the fewest pull requests — so the row's verdict was
  // read from a sentence about somebody else's work. A passing mention must
  // not compete for the deciding line.
  const register =
    `2026-09-22T22:50:14Z | codex-source-request-history-summary | ${C551_REBASE_NOTE}\n` +
    `2026-09-22T23:00:03Z | codex-cpo-source-new-smoke | ${C551_FILE_COLLISION}`;
  const row = reconcileRecord({
    record: parseRecord({ file: "r.md", text: RELEASE_RECORD_NOT_RUN }),
    pr: 8303,
    entries: registerEntries(register),
  });
  check(
    "C-551: a passing mention does not win the deciding line from a line about the record",
    row.registerStamp === "2026-09-22T22:50:14Z" &&
      row.registerSubjectLines === 1 &&
      row.registerPassingLines === 1 &&
      row.verdict !== reconcileModule.PASSING_MENTION,
    `stamp=${row.registerStamp} subject=${row.registerSubjectLines} ` +
      `passing=${row.registerPassingLines} verdict=${row.verdict}`,
  );
}

{
  // 13. NEGATIVE CONTROL for the whole change: a record the register decides
  // properly must be untouched. This is the suite's own known-negative from
  // case 17 — a real release line for #8444 whose record and register agree
  // that the proof is owed — and it must still read `agree` with one subject
  // line and no passing mentions. If this goes red, the classifier is
  // answering `passing` on ordinary release lines and every row in the report
  // has become unresolvable.
  const row = reconcileRecord({
    record: parseRecord({ file: "r.md", text: RELEASE_RECORD_NOT_RUN }),
    pr: 8444,
    entries: registerEntries(KNOWN_NEGATIVE_REGISTER_LINE),
  });
  check(
    "C-551 NEGATIVE CONTROL: a real release line still decides its row as before",
    row.verdict === AGREE && row.registerSubjectLines === 1 && row.registerPassingLines === 0,
    `verdict=${row.verdict} subject=${row.registerSubjectLines} passing=${row.registerPassingLines}`,
  );
}

{
  // 14. The report and the counts. A state nobody prints is a state nobody
  // reads: `C-545`'s own finding was invisible for exactly as long as the
  // report did not name it.
  const result = reconcile({
    records: [{ file: "r.md", text: RELEASE_RECORD_NOT_RUN, pr: 8200 }],
    register: `2026-09-22T00:40:00Z | codex-source-new-ava-phase-readiness | ${C551_FOLLOW_UP}`,
  });
  const report = formatReport(result);
  check(
    "C-551: the report counts passing-mention rows and prints the clause that names the PR",
    result.counts[reconcileModule.PASSING_MENTION] === 1 &&
      /passing-mention 1/.test(report) &&
      /follow-up for #8200/.test(report),
    `counts=${JSON.stringify(result.counts)}\n${report}`,
  );
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
