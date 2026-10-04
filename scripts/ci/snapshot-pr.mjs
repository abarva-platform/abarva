#!/usr/bin/env node
/**
 * Decide whether a failed `gh pr create` is this repository refusing Actions
 * the capability, or a real error (item C-593).
 *
 * `ai-cost-daily.yml` collects the Anthropic cost report, emails the digest,
 * commits the snapshot and pushes its branch — and then asks GitHub Actions to
 * open a pull request, which this repository does not allow
 * (`can_approve_pull_request_reviews: false`). Measured on 2026-10-04, that one
 * step failed all 73 of the workflow's scheduled runs, which is its entire
 * scheduled history: never once green since 2026-07-23. The residue is 73
 * orphan `automation/ai-cost-daily-snapshot-*` branches and no snapshot pull
 * request, ever.
 *
 * The repair is NOT to swallow the step's failures. It is to stop demanding a
 * capability the repository denies, while leaving every other failure fatal:
 *
 *   - exit 0           -> created (or already open). Say nothing.
 *   - the refusal      -> warn loudly, name the branch, the compare URL and the
 *                         setting that would permit it, and exit 0. The commit
 *                         is already pushed, so nothing is lost by not opening
 *                         the pull request — only the convenience of the link.
 *   - anything else    -> re-emit the error and exit non-zero.
 *
 * Both wrong answers have teeth, which is why the branch is a module with a
 * suite rather than a line of workflow bash: classify everything as the refusal
 * and a genuine break is green forever; classify the refusal as a break and the
 * job is red forever, which is exactly where it has been since July.
 *
 * Usage, from the workflow step that ran `gh pr create`:
 *   node scripts/ci/snapshot-pr.mjs --status "$rc" --stderr-file err.txt \
 *     --branch "$SNAPSHOT_BRANCH" --repo "$GITHUB_REPOSITORY"
 */

import fs from "node:fs";

import { isDirectInvocation } from "../exec/cli-entry.mjs";

/**
 * The condition, matched on the sentence GitHub returns rather than on the
 * whole line: `gh` has changed its envelope before (`HTTP 403:` versus
 * `pull request create failed: GraphQL:`), and the subject of the sentence is
 * what identifies the refusal. Anchored on "is not permitted" so that a
 * diagnostic merely mentioning the setting — including the remediation this
 * very file prints — is not read back as the refusal itself.
 */
export const ACTIONS_PR_REFUSAL =
  /Actions is not permitted to create or approve pull requests/i;

/** The repository setting whose absence produces that refusal. */
export const SETTING_LABEL =
  "Settings -> Actions -> General -> Workflow permissions -> " +
  "Allow GitHub Actions to create and approve pull requests";

/**
 * @param {{ status: number, stderr?: string }} outcome
 * @returns {{ kind: "created" | "forbidden-by-repo" | "error" }}
 */
export function classifyPrCreateFailure({ status, stderr }) {
  if (status === 0) return { kind: "created" };
  if (ACTIONS_PR_REFUSAL.test(stderr ?? "")) return { kind: "forbidden-by-repo" };
  return { kind: "error" };
}

/**
 * The step summary a reader gets instead of the pull request. A warning that
 * does not say where the snapshot landed is noise, so this names the branch,
 * the compare URL that opens the pull request by hand, and the one setting that
 * would let the job open it unattended.
 */
export function refusalSummary({ branch, repo, serverUrl = "https://github.com" }) {
  const compare = `${serverUrl}/${repo}/compare/main...${branch}?expand=1`;
  return [
    "### Snapshot pushed; pull request not opened",
    "",
    `The daily snapshot is committed and pushed to \`${branch}\`.`,
    "",
    "GitHub refused the pull request because this repository does not let",
    "Actions create one. Nothing is lost — the commit is on the branch — but",
    "the pull request has to be opened by a person, or the setting changed.",
    "",
    `- Open it: ${compare}`,
    `- Or allow the job to: ${SETTING_LABEL}`,
    "",
  ].join("\n");
}

function valueAfter(flag, argv = process.argv) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function runCli() {
  const statusRaw = valueAfter("--status");
  const status = Number(statusRaw);
  if (statusRaw === undefined || !Number.isInteger(status)) {
    process.stderr.write(
      "snapshot-pr: --status <exit code of gh pr create> is required.\n",
    );
    process.exit(2);
  }

  const branch = valueAfter("--branch") ?? "";
  const repo = valueAfter("--repo") ?? "";
  const stderrFile = valueAfter("--stderr-file");

  let stderrText = "";
  if (status !== 0) {
    // Reading nothing must never be mistaken for reading no refusal: that
    // would turn a broken step into a green one, which is the inversion this
    // whole item is about.
    if (!stderrFile) {
      process.stderr.write(
        "snapshot-pr: --stderr-file is required when --status is non-zero; " +
          "refusing to classify a failure whose output was not read.\n",
      );
      process.exit(2);
    }
    try {
      stderrText = fs.readFileSync(stderrFile, "utf8");
    } catch (error) {
      process.stderr.write(
        `snapshot-pr: could not read ${stderrFile}: ${error.message}\n` +
          "Refusing to classify a failure whose output was not read.\n",
      );
      process.exit(2);
    }
  }

  const { kind } = classifyPrCreateFailure({ status, stderr: stderrText });

  if (kind === "created") process.exit(0);

  if (kind === "error") {
    process.stderr.write(stderrText.endsWith("\n") ? stderrText : `${stderrText}\n`);
    process.stderr.write(
      `snapshot-pr: gh pr create failed with exit ${status} for a reason that is ` +
        "not the repository's create-pull-request refusal. Failing the step.\n",
    );
    process.exit(1);
  }

  process.stdout.write(
    `::warning::Snapshot branch ${branch} is pushed, but GitHub Actions is not ` +
      "permitted to open its pull request in this repository. Open it by hand, " +
      "or change the workflow-permissions setting.\n",
  );
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  const summary = refusalSummary({ branch, repo });
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${summary}\n`);
  } else {
    process.stdout.write(`${summary}\n`);
  }
  process.exit(0);
}

if (isDirectInvocation(import.meta.url)) runCli();
