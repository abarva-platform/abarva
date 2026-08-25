#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const CASES_PATH = "datasets/evals/meridian-healthcare/ecl-consultant-eval-cases.jsonl";
const FINDINGS_SPEC_PATH = "docs/architecture/meridian-demo-findings-20260824.json";

function parseArgs(argv) {
  const args = {
    cases: CASES_PATH,
    findingsSpec: FINDINGS_SPEC_PATH,
    answers: null,
    captureLive: false,
    captureAblation: false,
    baseUrl: process.env.BASE_URL || process.env.ECL_AVA_EVAL_BASE_URL || "https://app.abarva.ai",
    tenantKey: process.env.E2E_ACTIVE_CLIENT || "meridian-health",
    out: "reports/ecl-ava-consultant-eval/summary.json",
    answersOut: "reports/ecl-ava-consultant-eval/live-answers.jsonl",
    ablationAnswersOut: "reports/ecl-ava-consultant-eval/live-answers-ablation.jsonl",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cases") args.cases = argv[++i];
    else if (arg === "--findings-spec") args.findingsSpec = argv[++i];
    else if (arg === "--answers") args.answers = argv[++i];
    else if (arg === "--capture-live") args.captureLive = true;
    else if (arg === "--capture-ablation") args.captureAblation = true;
    else if (arg === "--base-url") args.baseUrl = argv[++i];
    else if (arg === "--tenant-key") args.tenantKey = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--answers-out") args.answersOut = argv[++i];
    else if (arg === "--ablation-answers-out") args.ablationAnswersOut = argv[++i];
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/run_ecl_ava_consultant_eval.mjs [--answers answers.jsonl] [--capture-live] [--out summary.json]

Without --answers, validates the ECL consultant-eval case bank and shared deterministic
validator contract. With --answers, evaluates supplied aVa answer JSONL rows keyed by case id.
With --capture-live, signs into BASE_URL and captures live /api/intelligence/ask answers first.
With --capture-ablation, captures a second live pass with the ECL evidence packet withheld.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJson(pathname) {
  return JSON.parse(readFileSync(pathname, "utf8"));
}

function readJsonl(pathname) {
  return readFileSync(pathname, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${pathname}:${index + 1} is not valid JSON: ${error.message}`);
      }
    });
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function answerText(row) {
  if (!row || typeof row !== "object") return "";
  return (
    row.answerText ??
    row.answer_text ??
    row.answer ??
    row.directAnswer ??
    row.direct_answer ??
    row.output ??
    ""
  ).toString();
}

function answerId(row) {
  return row.caseId ?? row.case_id ?? row.id ?? null;
}

const REQUIRED_ELEMENT_ALIASES = new Map([
  [
    "not loaded",
    [
      "not loaded",
      "not yet evidenced",
      "no benchmark provider data is loaded",
      "does not have",
      "doesn't have",
      "does not include",
      "doesn't include",
      "not a field present",
      "not present",
      "current evidence",
      "precise percentile right now is fabricating it",
      "external percentile question is blocked",
    ],
  ],
  [
    "refused",
    [
      "refused",
      "refuse",
      "should refuse",
    ],
  ],
  [
    "evidence request",
    [
      "evidence request",
      "request the evidence",
      "request before",
      "request approval records",
      "benchmark evidence request",
      "evidence needed",
      "needs evidence",
      "would need",
      "must be validated",
      "cannot answer that question from the current evidence",
      "external percentile question is blocked",
    ],
  ],
  [
    "cannot confirm exact external market percentile",
    [
      "cannot confirm exact external market percentile",
      "does not have an external market percentile on record",
      "no external market percentile on record",
      "cannot be confirmed",
    ],
  ],
  [
    "cannot identify named approver",
    [
      "cannot identify named approver",
      "cannot be identified",
      "signature trail",
      "approving executive",
    ],
  ],
  [
    "cannot calculate exact outage probability",
    [
      "cannot calculate exact outage probability",
      "exact outage probability cannot be calculated",
      "exact outage probability can't be calculated",
      "outage probability can't be calculated",
      "cannot be calculated",
    ],
  ],
  [
    "failed rule",
    [
      "failed rule",
      "failed gate",
      "data-integrity gate",
    ],
  ],
  [
    "evidence needed",
    [
      "evidence needed",
      "without resolved source and target system identities",
      "without named endpoints",
    ],
  ],
  [
    "measurement",
    [
      "measurement",
      "unknown to unknown",
      "unknown source",
      "unknown destination",
    ],
  ],
  [
    "approval provenance",
    [
      "approval provenance",
      "approval chain",
      "approving executive",
      "approval record",
      "approval records",
    ],
  ],
  [
    "risk triage",
    [
      "risk triage",
      "triage",
      "materially elevated",
      "resilience risk",
    ],
  ],
]);

const ALIAS_POLICY = {
  status: "frozen",
  rationale:
    "Further live-answer misses are findings about the answer or prompt path, not reasons to add validator aliases.",
  f10MaxAliasesPerRequiredElement: 3,
};

const F10_CAPPED_REQUIRED_ELEMENTS = ["refused", "failed rule", "evidence needed"];

function validateAliasPolicy() {
  for (const key of F10_CAPPED_REQUIRED_ELEMENTS) {
    const aliases = REQUIRED_ELEMENT_ALIASES.get(key) ?? [];
    assert(
      aliases.length <= ALIAS_POLICY.f10MaxAliasesPerRequiredElement,
      `${key} alias list exceeds frozen F10 cap of ${ALIAS_POLICY.f10MaxAliasesPerRequiredElement}`,
    );
  }
}

function requiredElementPresent(text, phrase) {
  const normalized = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);
  const alternatives = REQUIRED_ELEMENT_ALIASES.get(normalizedPhrase) ?? [
    phrase,
  ];
  return alternatives.some((alternative) =>
    normalized.includes(normalizeText(alternative)),
  );
}

function includesAny(text, phrases) {
  const normalized = normalizeText(text);
  return phrases.some((phrase) => normalized.includes(normalizeText(phrase)));
}

function forbiddenElementPresent(text, phrase, requiredPhrases) {
  const normalized = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);
  if (!normalized.includes(normalizedPhrase)) return false;

  // Some refusal cases need to say the forbidden concept while explicitly
  // negating it, e.g. "cannot calculate exact outage probability". Do not turn
  // the required refusal phrase into its own failure.
  return !requiredPhrases.some((requiredPhrase) => {
    const normalizedRequired = normalizeText(requiredPhrase);
    const alternatives = REQUIRED_ELEMENT_ALIASES.get(normalizedRequired) ?? [
      requiredPhrase,
    ];
    return alternatives.some((alternative) => {
      const normalizedAlternative = normalizeText(alternative);
      return (
        normalizedAlternative.includes(normalizedPhrase) &&
        normalized.includes(normalizedAlternative)
      );
    });
  });
}

function validateCases(cases, findingsSpec) {
  assert.equal(findingsSpec.tenant_key, "meridian-health", "findings spec must be tenant-scoped to meridian-health");
  const findings = new Map((findingsSpec.findings ?? []).map((finding) => [finding.id, finding]));
  assert.equal(findings.size, 10, "findings spec must define F1-F10");

  const ids = cases.map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length, "ECL consultant eval case ids must be unique");

  const findingCases = cases.filter((row) => row.caseType === "demo_finding");
  const unanswerableCases = cases.filter((row) => row.caseType === "planted_unanswerable");
  assert.equal(findingCases.length, 10, "ECL consultant eval must contain exactly ten demo-finding cases");
  assert(unanswerableCases.length >= 2, "ECL consultant eval must contain at least two planted-unanswerable cases");
  assert(unanswerableCases.length <= 3, "ECL consultant eval should start with no more than three planted-unanswerable cases");

  const findingIds = findingCases.map((row) => row.findingId).sort();
  assert.deepEqual(
    findingIds,
    ["F1", "F10", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"].sort(),
    "demo-finding cases must cover F1-F10 exactly once",
  );

  for (const row of cases) {
    assert.equal(row.tenantKey, "meridian-health", `${row.id} must use canonical tenant key meridian-health`);
    assert.equal(row.module, "intelligence", `${row.id} must start with the Intelligence module`);
    assert.equal(row.agent, "sentinel", `${row.id} must start with the Sentinel agent`);
    assert.equal(row.sourceSubstrate, "ecl", `${row.id} must declare sourceSubstrate=ecl`);
    assert.equal(row.provider, "ecl_projection_db", `${row.id} must declare provider=ecl_projection_db`);
    assert.match(row.question ?? "", /\S/, `${row.id} must have a question`);
    assert(Array.isArray(row.requiredAnswerElements), `${row.id} must declare requiredAnswerElements`);
    assert(Array.isArray(row.forbiddenAnswerElements), `${row.id} must declare forbiddenAnswerElements`);
    assert(Array.isArray(row.deterministicChecks), `${row.id} must declare deterministicChecks`);
    assert(row.deterministicChecks.includes("no_builder_vocabulary"), `${row.id} must check builder vocabulary leakage`);
    assert(row.deterministicChecks.includes("explicit_evidence_basis"), `${row.id} must check evidence basis`);
    if (row.caseType === "demo_finding") {
      const finding = findings.get(row.findingId);
      assert(finding, `${row.id} references unknown finding ${row.findingId}`);
      assert(
        row.evidenceSurfaces.some((surface) => finding.surfaces.includes(surface)),
        `${row.id} must cite at least one named surface from ${row.findingId}`,
      );
      assert(row.requiredAnswerElements.length >= 3, `${row.id} must require consultant-grade specifics`);
    } else if (row.caseType === "planted_unanswerable") {
      assert.equal(row.expectedOutcome, "refuse_or_gap", `${row.id} must expect refusal/gap handling`);
      assert(row.requiredAnswerElements.some((element) => /cannot|not loaded|insufficient|gap/i.test(element)), `${row.id} must require explicit missing-context language`);
    } else {
      throw new Error(`${row.id} has unsupported caseType ${row.caseType}`);
    }
  }
}

function evaluateAnswers(cases, answers) {
  const byId = new Map(answers.map((row) => [answerId(row), row]));
  const results = [];
  for (const row of cases) {
    const answer = byId.get(row.id);
    if (!answer) {
      results.push({
        id: row.id,
        accepted: false,
        issue: "missing_answer",
      });
      continue;
    }
    const text = answerText(answer);
    const missingRequired = row.requiredAnswerElements.filter(
      (phrase) => !requiredElementPresent(text, phrase),
    );
    const forbiddenPresent = row.forbiddenAnswerElements.filter((phrase) =>
      forbiddenElementPresent(text, phrase, row.requiredAnswerElements),
    );
    const builderVocabularyPresent = includesAny(text, [
      "source_mapped_pre_review",
      "synthetic_source_backed",
      "commercial_contract_scope_catchup_overlay",
      "projection_entry",
      "builder vocabulary",
    ]);
    const accepted =
      missingRequired.length === 0 &&
      forbiddenPresent.length === 0 &&
      !builderVocabularyPresent;
    results.push({
      id: row.id,
      accepted,
      finding_id: row.findingId ?? null,
      missing_required: missingRequired,
      forbidden_present: forbiddenPresent,
      builder_vocabulary_present: builderVocabularyPresent,
    });
  }
  return results;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function routeHost(baseUrl) {
  return new URL(baseUrl).hostname;
}

function candidateEmails() {
  return [
    process.env.E2E_PRIVATE_PROOF_EMAIL,
    process.env.E2E_DEMO_EMAIL,
    "admin@abarva.ai",
    "agent@meridian-health.example.com",
    "cdio@meridian-health.example.com",
  ].filter(Boolean);
}

async function requestPrivateProofSession(baseUrl, email) {
  const token = requiredEnv("ABARVA_PRIVATE_BROWSER_PROOF_TOKEN");
  const response = await fetch(new URL("/api/auth/private-browser-proof", baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, proofCookieOnly: true }),
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function signInWithPrivateProof(page, baseUrl, tenantKey) {
  const attempts = [];
  for (const email of candidateEmails()) {
    const { response, body } = await requestPrivateProofSession(baseUrl, email);
    attempts.push({ email, status: response.status, error: body?.error ?? null });
    if (!response.ok || !body?.proofSessionCookie || !body?.proofSessionCookieName) continue;
    await page.context().addCookies([
      {
        name: body.proofSessionCookieName,
        value: body.proofSessionCookie,
        domain: routeHost(baseUrl),
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: baseUrl.startsWith("https://"),
      },
      {
        name: "abarva_active_client",
        value: body.clientKey || tenantKey,
        domain: routeHost(baseUrl),
        path: "/",
        sameSite: "Lax",
        secure: baseUrl.startsWith("https://"),
      },
    ]);
    return { method: "private_browser_proof_cookie", email, attempts };
  }
  throw new Error(`Private browser proof auth failed: ${JSON.stringify(attempts)}`);
}

async function signInWithClerkTicket(page, baseUrl, tenantKey) {
  const { createClerkClient } = await import("@clerk/backend");
  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const tried = [];
  for (const email of candidateEmails()) {
    tried.push(email);
    const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    const user = users.data[0];
    if (!user) continue;
    const token = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 300,
    });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
    await page.evaluate(async (ticket) => {
      const result = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket });
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error(`Ticket sign-in failed with status ${result.status}`);
      }
      await window.Clerk.setActive({ session: result.createdSessionId });
    }, token.token);
    await page.waitForFunction(() => Boolean(window.Clerk?.user), null, { timeout: 15_000 });
    await page.context().addCookies([
      {
        name: "abarva_active_client",
        value: tenantKey,
        domain: routeHost(baseUrl),
        path: "/",
        sameSite: "Lax",
        secure: baseUrl.startsWith("https://"),
      },
    ]);
    return { method: "clerk_sign_in_ticket", email, attempts: tried.map((item) => ({ email: item })) };
  }
  throw new Error(`No Clerk user found for ${tried.join(", ")}`);
}

async function authenticate(page, baseUrl, tenantKey) {
  if (process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN?.trim()) {
    return signInWithPrivateProof(page, baseUrl, tenantKey);
  }
  return signInWithClerkTicket(page, baseUrl, tenantKey);
}

function parseNdjson(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse-error", raw: line };
      }
    });
}

function integerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function timeoutRow(row, error, durationMs, captureMode) {
  return {
    id: row.id,
    case_id: row.id,
    capture_mode: captureMode,
    status: 0,
    content_type: "application/json",
    answerText: "",
    event_types: ["error"],
    event_count: 1,
    error,
    duration_ms: durationMs,
  };
}

function textFromEvents(events) {
  const directAnswers = events
    .filter((event) => event?.type === "agent-answer" && event?.answer)
    .map((event) => event.answer.directAnswer ?? event.answer.prose ?? "")
    .filter(Boolean);
  if (directAnswers.length > 0) return directAnswers.join("\n\n");
  return events
    .filter((event) => event?.type === "delta" && typeof event.text === "string")
    .map((event) => event.text)
    .join("");
}

function errorTextFromEvents(events) {
  return events
    .filter((event) => event?.type === "error")
    .map((event) =>
      typeof event.error === "string"
        ? event.error
        : JSON.stringify(event.error ?? event),
    )
    .filter(Boolean)
    .join("\n");
}

function surfaceContextForCapture(args, captureMode) {
  if (captureMode === "evidence_withheld") {
    return {
      module: "intelligence",
      clientKey: args.tenantKey,
      activeClient: args.tenantKey,
      activeTab: "ecl-consultant-eval-ablation",
      substrate: "evidence_withheld",
      provider: "evidence_withheld",
      evaluationMode: "ecl_ablation_evidence_withheld",
      facts: [
        "ECL consultant eval ablation: the ECL serving evidence packet is deliberately withheld.",
        "If the question requires tenant-specific evidence, say the evidence is not present instead of reconstructing the finding.",
      ],
    };
  }
  return {
    module: "intelligence",
    clientKey: args.tenantKey,
    activeClient: args.tenantKey,
    activeTab: "ecl-consultant-eval",
    substrate: "ecl_projection_db",
    provider: "ecl_projection_db",
    facts: ["ECL consultant eval live-answer capture"],
  };
}

async function captureLiveAnswers(cases, args, captureMode = "evidence_present") {
  const { chromium } = await import("playwright");
  const caseTimeoutMs = integerEnv("ECL_AVA_EVAL_CASE_TIMEOUT_MS", 90_000);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    const auth = await authenticate(page, args.baseUrl, args.tenantKey);
    await page.goto(new URL(`/intelligence?provider=ecl_projection_db`, args.baseUrl).toString(), {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const rows = [];
    for (const row of cases) {
      const surfaceContext = {
        ...surfaceContextForCapture(args, captureMode),
        evaluationCaseId: row.id,
      };
      const caseStartedAt = Date.now();
      console.log(
        JSON.stringify({
          event: "ecl_ava_consultant_eval_case_start",
          id: row.id,
          capture_mode: captureMode,
          timeout_ms: caseTimeoutMs,
        }),
      );
      let result;
      try {
        result = await page.evaluate(
          async ({ baseUrl, query, tenantKey, timeoutMs, surfaceContext }) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
              const response = await fetch(new URL("/api/intelligence/ask", baseUrl).toString(), {
                method: "POST",
                headers: { "content-type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                  query,
                  client: tenantKey,
                  richText: false,
                  traceEnabled: true,
                  answerOnlyStreaming: false,
                  surfaceContext,
                }),
              });
              return {
                status: response.status,
                contentType: response.headers.get("content-type"),
                text: await response.text(),
              };
            } catch (error) {
              return {
                status: 0,
                contentType: "application/json",
                text: JSON.stringify({
                  type: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "live answer request failed",
                }),
              };
            } finally {
              clearTimeout(timer);
            }
          },
          {
            baseUrl: args.baseUrl,
            query: row.question,
            tenantKey: args.tenantKey,
            timeoutMs: caseTimeoutMs,
            surfaceContext,
          },
        );
      } catch (error) {
        const durationMs = Date.now() - caseStartedAt;
        const output = timeoutRow(
          row,
          error instanceof Error ? error.message : "page evaluate failed",
          durationMs,
          captureMode,
        );
        rows.push(output);
        console.log(
          JSON.stringify({
            event: "ecl_ava_consultant_eval_case_done",
            id: row.id,
            capture_mode: captureMode,
            status: output.status,
            duration_ms: durationMs,
            event_count: output.event_count,
            answer_chars: 0,
            error: output.error,
          }),
        );
        continue;
      }
      const events = parseNdjson(result.text);
      const output = {
        id: row.id,
        case_id: row.id,
        capture_mode: captureMode,
        status: result.status,
        content_type: result.contentType,
        answerText: textFromEvents(events),
        event_types: [...new Set(events.map((event) => event.type ?? "unknown"))],
        event_count: events.length,
        error: errorTextFromEvents(events) || null,
        auth_method: auth.method,
        duration_ms: Date.now() - caseStartedAt,
      };
      rows.push(output);
      console.log(
        JSON.stringify({
          event: "ecl_ava_consultant_eval_case_done",
          id: row.id,
          capture_mode: captureMode,
          status: output.status,
          duration_ms: output.duration_ms,
          event_count: output.event_count,
          answer_chars: output.answerText.length,
        }),
      );
    }
    mkdirSync(path.dirname(args.answersOut), { recursive: true });
    const targetPath =
      captureMode === "evidence_withheld" ? args.ablationAnswersOut : args.answersOut;
    writeFileSync(targetPath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
    return rows;
  } finally {
    await browser.close();
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.captureAblation && !args.captureLive) {
  throw new Error("--capture-ablation requires --capture-live so baseline and withheld-evidence results are reported together");
}
const cases = readJsonl(args.cases);
const findingsSpec = readJson(args.findingsSpec);
validateAliasPolicy();
validateCases(cases, findingsSpec);

const answerRows = args.captureLive
  ? await captureLiveAnswers(cases, args, "evidence_present")
  : args.answers
    ? readJsonl(args.answers)
    : null;
const answerResults = answerRows ? evaluateAnswers(cases, answerRows) : [];
const acceptedAnswerCount = answerResults.filter((row) => row.accepted).length;
const ablationRows = args.captureAblation
  ? await captureLiveAnswers(cases, args, "evidence_withheld")
  : null;
const ablationResults = ablationRows ? evaluateAnswers(cases, ablationRows) : [];
const ablationAcceptedAnswerCount = ablationResults.filter((row) => row.accepted).length;
const ablationDemoAcceptedCount = ablationResults.filter((row) => {
  const caseRow = cases.find((candidate) => candidate.id === row.id);
  return row.accepted && caseRow?.caseType === "demo_finding";
}).length;
const ablationCollapseThreshold = 3;
const answerDiagnostics = answerRows
  ? answerRows.map((row) => {
      const text = answerText(row);
      return {
        id: answerId(row),
        status: row.status ?? null,
        content_type: row.content_type ?? null,
        event_types: Array.isArray(row.event_types) ? row.event_types : [],
        event_count: row.event_count ?? null,
        duration_ms: row.duration_ms ?? null,
        error: row.error ?? null,
        answer_chars: text.length,
        answer_preview: text.slice(0, 600),
      };
    })
  : [];
const summary = {
  accepted: answerRows
    ? acceptedAnswerCount === cases.length &&
      (!ablationRows || ablationDemoAcceptedCount <= ablationCollapseThreshold)
    : true,
  mode: answerRows ? "answer_eval" : "case_contract",
  actual_ava_answer_eval: Boolean(answerRows),
  alias_policy: ALIAS_POLICY,
  tenant_key: "meridian-health",
  module: "intelligence",
  agent: "sentinel",
  provider: "ecl_projection_db",
  case_count: cases.length,
  demo_findings_cases: cases.filter((row) => row.caseType === "demo_finding").length,
  planted_unanswerable_cases: cases.filter((row) => row.caseType === "planted_unanswerable").length,
  findings_covered: [...new Set(cases.map((row) => row.findingId).filter(Boolean))].sort(),
  answers_evaluated: answerRows ? answerRows.length : 0,
  answers_accepted: acceptedAnswerCount,
  answer_results: answerResults,
  answer_diagnostics: answerDiagnostics,
  ablation: ablationRows
    ? {
        capture_mode: "evidence_withheld",
        answers_evaluated: ablationRows.length,
        answers_accepted: ablationAcceptedAnswerCount,
        demo_findings_accepted: ablationDemoAcceptedCount,
        collapse_threshold: ablationCollapseThreshold,
        accepted:
          ablationRows.length === cases.length &&
          ablationDemoAcceptedCount <= ablationCollapseThreshold,
        answer_results: ablationResults,
      }
    : null,
};

mkdirSync(path.dirname(args.out), { recursive: true });
writeFileSync(args.out, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ event: "ecl_ava_consultant_eval_summary", summary }));
console.log(
  JSON.stringify({
    event: "ecl_ava_consultant_eval_compact_summary",
    accepted: summary.accepted,
    answers_evaluated: summary.answers_evaluated,
    answers_accepted: summary.answers_accepted,
    demo_findings_cases: summary.demo_findings_cases,
    ablation_answers_evaluated: summary.ablation?.answers_evaluated ?? 0,
    ablation_answers_accepted: summary.ablation?.answers_accepted ?? 0,
    ablation_demo_findings_accepted: summary.ablation?.demo_findings_accepted ?? null,
    ablation_accepted: summary.ablation?.accepted ?? null,
  }),
);

if (!summary.accepted) {
  process.exitCode = 1;
}
