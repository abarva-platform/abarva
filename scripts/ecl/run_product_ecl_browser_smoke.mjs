#!/usr/bin/env node

import { createClerkClient } from "@clerk/backend";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || process.env.ECL_PRODUCT_BROWSER_BASE_URL || "https://app.abarva.ai";
const TENANT_KEY = process.env.E2E_ACTIVE_CLIENT || "meridian-health";
const EXPECTED_TENANT_NAME = process.env.E2E_EXPECTED_TENANT_NAME || "Meridian Health";
const EMAILS = [
  process.env.E2E_PRIVATE_PROOF_EMAIL,
  process.env.E2E_DEMO_EMAIL,
  "agent@meridian-health.example.com",
  "admin@abarva.ai",
  "cdio@meridian-health.example.com",
  "demo-meridian+clerk_test@abarva.com",
].filter(Boolean);
const OUT_DIR = path.resolve(process.env.ECL_PRODUCT_BROWSER_PROOF_DIR || "job-output/ecl-product-browser-smoke");
const EMIT_PROOF = process.env.EMIT_ACA_PROOF_BUNDLE !== "false";
const PRIVATE_PROOF_TOKEN = process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN?.trim() || null;
const FINDINGS_SPEC_PATH = path.resolve("docs/architecture/meridian-demo-findings-20260824.json");

const ROUTES = [
  {
    key: "home_preview_ecl",
    path: `/home/preview?tenant=${encodeURIComponent(TENANT_KEY)}&provider=ecl_projection_db`,
    requiredText: [
      /Meridian Health/i,
      /750\s+applications/i,
      /1350\s+data\s+flows/i,
      /230\s+contracts/i,
      /220\s+(?:infra|infrastructure)/i,
    ],
  },
  {
    key: "source_workspace_ecl",
    path: "/source/preview/workspace?provider=ecl_projection_db",
    requiredText: [/Meridian Health|Source/i, /230\s+contracts/i, /102\s+vendors/i],
  },
  {
    key: "tower_ecl",
    path: "/tower?provider=ecl_projection_db",
    requiredText: [/Tower command center projection is loaded/i, /Gate state/i],
  },
  {
    key: "intelligence_ecl",
    path: "/intelligence?provider=ecl_projection_db",
    requiredText: [
      /Intelligence context pack projection is loaded/i,
      /Permitted facts/i,
      /Blocked facts/i,
    ],
  },
];

const BUILDER_VOCABULARY = [
  /\bsynthetic[_-]/i,
  /\bsource[_-]mapped\b/i,
  /\bprojection_entry\b/i,
  /\becl_projection\b/i,
  /\bserving\.[a-z0-9_]+\b/i,
  /\bbuilder vocabulary\b/i,
];

const DEMO_FINDING_ASSERTIONS = [
  {
    id: "F1",
    routeChecks: [
      { routeKey: "source_workspace_ecl", requiredText: [/F1\b/i, /Three suppliers deliver the same capability/i] },
      { routeKey: "tower_ecl", requiredText: [/F1\b/i, /Three suppliers deliver the same capability/i] },
    ],
  },
  {
    id: "F2",
    routeChecks: [
      { routeKey: "source_workspace_ecl", requiredText: [/F2\b/i, /auto-renews inside the window/i, /no way to stop it/i] },
    ],
  },
  {
    id: "F3",
    routeChecks: [
      { routeKey: "source_workspace_ecl", requiredText: [/F3\b/i, /protects the vendor, not the client/i] },
      { routeKey: "tower_ecl", requiredText: [/F3\b/i, /protects the vendor, not the client/i] },
    ],
  },
  {
    id: "F4",
    routeChecks: [
      { routeKey: "home_preview_ecl", requiredText: [/F4\b/i, /five or more applications/i, /three or more vendors/i] },
      { routeKey: "tower_ecl", requiredText: [/F4\b/i, /five or more applications/i, /three or more vendors/i] },
    ],
  },
  {
    id: "F5",
    routeChecks: [
      { routeKey: "home_preview_ecl", requiredText: [/F5\b/i, /four or more BI technologies/i, /ungoverned row/i] },
      { routeKey: "intelligence_ecl", requiredText: [/F5\b/i, /four or more BI technologies/i, /ungoverned row/i] },
    ],
  },
  {
    id: "F6",
    routeChecks: [
      { routeKey: "home_preview_ecl", requiredText: [/F6\b/i, /appliance losing vendor support/i] },
      { routeKey: "tower_ecl", requiredText: [/F6\b/i, /appliance losing vendor support/i] },
    ],
  },
  {
    id: "F7",
    routeChecks: [
      { routeKey: "home_preview_ecl", requiredText: [/F7\b/i, /Unattributed spend/i, /named gap/i, /never as zero/i] },
      { routeKey: "tower_ecl", requiredText: [/F7\b/i, /Unattributed spend/i, /named gap/i, /never as zero/i] },
    ],
  },
  {
    id: "F8",
    routeChecks: [
      { routeKey: "tower_ecl", requiredText: [/F8\b/i, /Material value is gated/i, /every gated claim says why/i] },
    ],
  },
  {
    id: "F9",
    routeChecks: [
      { routeKey: "source_workspace_ecl", requiredText: [/F9\b/i, /Open control exceptions cluster/i] },
      { routeKey: "tower_ecl", requiredText: [/F9\b/i, /Open control exceptions cluster/i] },
    ],
  },
  {
    id: "F10",
    routeChecks: [
      { routeKey: "home_preview_ecl", requiredText: [/F10\b/i, /data flow is correctly refused/i, /cannot answer the question/i] },
    ],
  },
];

function validateDemoFindingContract() {
  const issues = [];
  const spec = JSON.parse(fs.readFileSync(FINDINGS_SPEC_PATH, "utf8"));
  const specIds = new Set((spec.findings ?? []).map((finding) => finding.id));
  const assertionIds = new Set(DEMO_FINDING_ASSERTIONS.map((finding) => finding.id));
  const routeKeys = new Set(ROUTES.map((route) => route.key));

  if (spec.denominator?.denominator !== 10) {
    issues.push("findings spec denominator must remain 10");
  }
  for (const id of specIds) {
    if (!assertionIds.has(id)) issues.push(`missing_demo_finding_assertion_${id}`);
  }
  for (const assertion of DEMO_FINDING_ASSERTIONS) {
    if (!specIds.has(assertion.id)) issues.push(`assertion_id_not_in_spec_${assertion.id}`);
    if (!assertion.routeChecks?.length) issues.push(`finding_has_no_route_checks_${assertion.id}`);
    for (const routeCheck of assertion.routeChecks ?? []) {
      if (!routeKeys.has(routeCheck.routeKey)) {
        issues.push(`finding_${assertion.id}_unknown_route_${routeCheck.routeKey}`);
      }
      if (!routeCheck.requiredText?.length) {
        issues.push(`finding_${assertion.id}_${routeCheck.routeKey}_has_no_required_text`);
      }
    }
  }
  if (assertionIds.size !== 10) {
    issues.push(`finding_assertion_count_${assertionIds.size}_expected_10`);
  }
  return {
    accepted: issues.length === 0,
    denominator: 10,
    finding_ids: [...assertionIds].sort(),
    issues,
  };
}

function routeDemoFindingChecks(routeKey, bodyText) {
  return DEMO_FINDING_ASSERTIONS.flatMap((finding) =>
    finding.routeChecks
      .filter((routeCheck) => routeCheck.routeKey === routeKey)
      .map((routeCheck) => {
        const missing = routeCheck.requiredText
          .filter((pattern) => !pattern.test(bodyText))
          .map((pattern) => String(pattern));
        return {
          id: finding.id,
          route_key: routeKey,
          accepted: missing.length === 0,
          missing,
        };
      }),
  );
}

function summarizeDemoFindings(routes) {
  const routeChecks = routes.flatMap((route) => route.demo_finding_checks ?? []);
  const checksByFinding = new Map();
  for (const check of routeChecks) {
    if (!checksByFinding.has(check.id)) checksByFinding.set(check.id, []);
    checksByFinding.get(check.id).push(check);
  }
  const findings = DEMO_FINDING_ASSERTIONS.map((finding) => {
    const checks = checksByFinding.get(finding.id) ?? [];
    const accepted = checks.length === finding.routeChecks.length && checks.every((check) => check.accepted);
    return {
      id: finding.id,
      accepted,
      checked_surface_count: checks.length,
      expected_surface_count: finding.routeChecks.length,
      issues: checks.flatMap((check) =>
        check.missing.map((missing) => `${check.route_key}: missing ${missing}`),
      ),
    };
  });
  const demonstrable = findings.filter((finding) => finding.accepted).length;
  return {
    metric: "findings demonstrable on a real surface",
    numerator: demonstrable,
    denominator: 10,
    accepted: demonstrable === 10,
    findings,
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function routeHost() {
  return new URL(BASE_URL).hostname;
}

function logStage(step, total, label) {
  console.log(`[ecl-browser-smoke] step ${step} of ${total}: ${label}`);
}

function textExcerpt(value, limit = 700) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

async function createTicket(clerk) {
  const tried = [];
  for (const email of EMAILS) {
    tried.push(email);
    const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    const user = users.data[0];
    if (!user) continue;
    const token = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 300,
    });
    return { email, token: token.token };
  }
  throw new Error(`No Clerk user found for any ECL browser smoke email: ${tried.join(", ")}`);
}

async function signInWithTicket(page, ticket) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
  await page.evaluate(async (value) => {
    const result = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket: value });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, ticket);
  await page.waitForFunction(() => Boolean(window.Clerk?.user), null, { timeout: 15_000 });

  await page.context().addCookies([
    {
      name: "abarva_active_client",
      value: TENANT_KEY,
      domain: routeHost(),
      path: "/",
      sameSite: "Lax",
      secure: BASE_URL.startsWith("https://"),
    },
  ]);
}

async function requestPrivateProofSession(email) {
  const response = await fetch(new URL("/api/auth/private-browser-proof", BASE_URL), {
    method: "POST",
    headers: {
      authorization: `Bearer ${PRIVATE_PROOF_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      proofCookieOnly: true,
    }),
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function signInWithPrivateProof(page) {
  const attempts = [];
  for (const email of EMAILS) {
    const { response, body } = await requestPrivateProofSession(email);
    attempts.push({ email, status: response.status, error: body?.error ?? null });
    if (!response.ok || !body?.proofSessionCookie || !body?.proofSessionCookieName) continue;

    await page.context().addCookies([
      {
        name: body.proofSessionCookieName,
        value: body.proofSessionCookie,
        domain: routeHost(),
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: BASE_URL.startsWith("https://"),
      },
      {
        name: "abarva_active_client",
        value: body.clientKey || TENANT_KEY,
        domain: routeHost(),
        path: "/",
        sameSite: "Lax",
        secure: BASE_URL.startsWith("https://"),
      },
    ]);
    return {
      authMethod: "private_browser_proof_cookie",
      email,
      clientKey: body.clientKey ?? null,
      attempts,
    };
  }
  throw new Error(`Private browser proof auth failed for all candidates: ${JSON.stringify(attempts)}`);
}

async function authenticate(page) {
  if (PRIVATE_PROOF_TOKEN) {
    return signInWithPrivateProof(page);
  }
  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const ticket = await createTicket(clerk);
  await signInWithTicket(page, ticket.token);
  return {
    authMethod: "clerk_sign_in_ticket",
    email: ticket.email,
    clientKey: TENANT_KEY,
    attempts: [],
  };
}

async function smokeRoute(page, route) {
  const errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (error) => errors.push(error.message));

  const url = new URL(route.path, BASE_URL).toString();
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  const title = await page.title().catch(() => "");
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  const currentUrl = page.url();
  const screenshotPath = path.join(OUT_DIR, "screenshots", `${route.key}.png`);
  const textPath = path.join(OUT_DIR, "text", `${route.key}.txt`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  fs.mkdirSync(path.dirname(textPath), { recursive: true });
  fs.writeFileSync(textPath, bodyText, "utf8");

  const issues = [];
  if (response && response.status() >= 400) issues.push(`http_status_${response.status()}`);
  if (/\/sign-in\b/.test(currentUrl)) issues.push("redirected_to_sign_in");
  if (!bodyText || bodyText.trim().length < 200) issues.push("body_text_too_short");
  if (!bodyText.includes(EXPECTED_TENANT_NAME) && route.key !== "tower_ecl" && route.key !== "intelligence_ecl") {
    issues.push(`missing_expected_tenant_${EXPECTED_TENANT_NAME}`);
  }
  for (const expected of route.requiredText) {
    if (!expected.test(bodyText)) issues.push(`missing_required_text_${expected}`);
  }
  const demoFindingChecks = routeDemoFindingChecks(route.key, bodyText);
  for (const check of demoFindingChecks) {
    for (const missing of check.missing) {
      issues.push(`missing_demo_finding_${check.id}_${missing}`);
    }
  }
  for (const pattern of BUILDER_VOCABULARY) {
    if (pattern.test(bodyText)) issues.push(`client_visible_builder_vocabulary_${pattern}`);
  }
  for (const error of errors) issues.push(`pageerror_${error}`);

  return {
    key: route.key,
    url,
    final_url: currentUrl,
    status: response?.status() ?? null,
    title,
    text_length: bodyText.length,
    screenshot: path.relative(OUT_DIR, screenshotPath),
    screenshot_sha256: sha256(screenshotPath),
    text_snapshot: path.relative(OUT_DIR, textPath),
    text_sha256: sha256(textPath),
    text_excerpt: textExcerpt(bodyText),
    demo_finding_checks: demoFindingChecks,
    issues,
    accepted: issues.length === 0,
  };
}

function emitProofBundle() {
  const parent = path.dirname(OUT_DIR);
  const rootName = path.basename(OUT_DIR);
  const tarPath = path.join(os.tmpdir(), `${rootName}.tgz`);
  execFileSync("tar", ["-czf", tarPath, "-C", parent, rootName], { stdio: "ignore" });
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let i = 0; i < encoded.length; i += 1000) console.log(encoded.slice(i, i + 1000));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
  console.log(`__SEMANTIC2_PROOF_ROOT__${rootName}`);
}

function emitStructuredSummary(summary) {
  console.log(JSON.stringify({
    structured_event: "ecl_product_browser_smoke_summary",
    accepted: summary.accepted,
    actual_browser_execution: summary.actual_browser_execution,
    actual_route_repointing: summary.actual_route_repointing,
    auth_method: summary.auth_method,
    base_url: summary.base_url,
    checked_at: summary.checked_at,
    email: summary.email,
    expected_tenant_name: summary.expected_tenant_name,
    issue_count: summary.issue_count,
    issues: summary.issues,
    provider: summary.provider,
    route_count: summary.route_count,
    findings_demonstrable_on_real_surface: summary.findings_demonstrable_on_real_surface,
    routes: summary.routes.map((route) => ({
      key: route.key,
      url: route.url,
      final_url: route.final_url,
      status: route.status,
      title: route.title,
      text_length: route.text_length,
      screenshot_sha256: route.screenshot_sha256,
      text_sha256: route.text_sha256,
      text_excerpt: route.text_excerpt,
      issue_count: route.issues.length,
      issues: route.issues,
      accepted: route.accepted,
    })),
    tenant_key: summary.tenant_key,
  }));
}

async function main() {
  const contractValidation = validateDemoFindingContract();
  if (process.argv.includes("--validate-demo-findings-contract")) {
    console.log(JSON.stringify({
      accepted: contractValidation.accepted,
      checked_at: new Date().toISOString(),
      demo_finding_contract: contractValidation,
    }, null, 2));
    if (!contractValidation.accepted) process.exitCode = 1;
    return;
  }
  if (!contractValidation.accepted) {
    throw new Error(`Demo finding assertion contract failed: ${contractValidation.issues.join("; ")}`);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  const results = [];
  let authProof = null;
  try {
    logStage(1, 5, "authenticate browser session");
    authProof = await authenticate(page);
    for (const [index, route] of ROUTES.entries()) {
      logStage(index + 2, 5, `check ${route.key}`);
      results.push(await smokeRoute(page, route));
    }
  } finally {
    await browser.close();
  }

  const summary = {
    accepted: results.every((result) => result.accepted),
    actual_browser_execution: true,
    actual_route_repointing: false,
    auth_attempts: authProof?.attempts ?? [],
    auth_method: authProof?.authMethod ?? null,
    base_url: BASE_URL,
    checked_at: new Date().toISOString(),
    email: authProof?.email ?? null,
    expected_tenant_name: EXPECTED_TENANT_NAME,
    issue_count: results.reduce((sum, result) => sum + result.issues.length, 0),
    issues: results.flatMap((result) => result.issues.map((issue) => `${result.key}: ${issue}`)),
    provider: "ecl_projection_db",
    route_count: results.length,
    routes: results,
    tenant_key: TENANT_KEY,
  };
  summary.demo_finding_contract = contractValidation;
  summary.findings_demonstrable_on_real_surface = summarizeDemoFindings(results);
  summary.accepted = summary.accepted && summary.findings_demonstrable_on_real_surface.accepted;
  summary.issue_count = summary.issues.length;
  writeJson(path.join(OUT_DIR, "ecl_product_browser_smoke_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (EMIT_PROOF) emitProofBundle();
  emitStructuredSummary(summary);
  if (!summary.accepted) process.exitCode = 1;
}

main().catch((error) => {
  writeJson(path.join(OUT_DIR, "ecl_product_browser_smoke_summary.json"), {
    accepted: false,
    actual_browser_execution: true,
    error: error?.stack || error?.message || String(error),
  });
  console.error(error);
  process.exitCode = 1;
});
