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
  NOT_REQUIRED,
  NOT_RUN,
  NO_REGISTER_LINE,
  OBTAINED,
  OWED,
  RAN,
  REQUIRED,
  SILENT,
  UNDECLARED,
  parseRecord,
  parseSignedInRequirement,
  parseStatedRunState,
  pullRequestIds,
  reconcile,
  reconcileRecord,
  recordBullets,
  registerEntries,
  registerSignedInVerdict,
} from "./signed-in-proof-reconcile.mjs";

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

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
