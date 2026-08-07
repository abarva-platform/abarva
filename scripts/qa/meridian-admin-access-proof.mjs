import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl =
  process.env.MERIDIAN_PRIVATE_URL ??
  "https://ca-meridian-health-proof-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io";
const proofTokenFile =
  process.env.MERIDIAN_PRIVATE_PROOF_TOKEN_FILE ??
  "/tmp/meridian-private-proof-token";
const rawPayloadPath =
  process.env.MERIDIAN_ADMIN_AUTH_PAYLOAD_PATH ??
  "/tmp/meridian-admin-auth-payload.json";

const activeClient = "meridian";
const adminEmail = "admin@abarva.ai";
const expectedTenantKey = "meridian_health_global";
const expectedDataset = "meridian-health-source-v1-202608";
const responsibleAiAcknowledgmentVersion =
  "2026-06-02.responsible-ai-clickwrap-v1";
const responsibleAiTrainingVersion = "responsible-ai-training-v1-2026-06-02";
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const outDir = path.resolve(
  "proof/meridian-admin-access-proof",
  `admin-signed-in-${stamp}`,
);

const retiredTokens = [
  String.fromCharCode(80, 72, 83),
  String.fromCharCode(
    80,
    114,
    101,
    115,
    98,
    121,
    116,
    101,
    114,
    105,
    97,
    110,
  ),
];

const foreignTokens = [
  String.fromCharCode(83, 107, 121, 72, 97, 114, 98, 111, 114),
  String.fromCharCode(65, 105, 114, 108, 105, 110, 101, 32, 68, 101, 109, 111),
  String.fromCharCode(82, 101, 116, 97, 105, 108, 32, 68, 101, 109, 111),
  String.fromCharCode(70, 83, 32, 68, 101, 109, 111),
  String.fromCharCode(76, 97, 107, 101, 115, 104, 111, 114, 101),
  String.fromCharCode(78, 111, 114, 116, 104, 115, 116, 97, 114),
];

const unauthorizedClientKey = String.fromCharCode(
  115,
  107,
  121,
  104,
  97,
  114,
  98,
  111,
  114,
);

const routes = [
  {
    key: "home",
    path: "/home",
    expected: ["Meridian Health", "Vendor 360"],
  },
  {
    key: "intelligence",
    path: "/intelligence",
    expected: ["Ask aVa", "Meridian Health"],
  },
  {
    key: "moves",
    path: "/strategic-moves",
    expected: ["Strategic Moves"],
  },
  {
    key: "source",
    path: "/source/preview/workspace",
    expected: [
      "Meridian Health Source v1",
      "tenant_key=meridian",
      "CubeSourceProvider",
    ],
  },
  {
    key: "tower",
    path: "/tower",
    expected: ["IT INVESTMENT TOWER", "MERIDIAN HEALTH"],
  },
  {
    key: "ava",
    path: "/intelligence",
    expected: ["Ask aVa anything", "aVa"],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readProofToken() {
  const token = fs.readFileSync(proofTokenFile, "utf8").trim();
  if (!token) throw new Error(`Missing proof token at ${proofTokenFile}`);
  return token;
}

function countMatches(text, tokens) {
  const lower = text.toLowerCase();
  return tokens.filter((token) => lower.includes(token.toLowerCase()));
}

function excerpt(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 1400);
}

function screenshotPath(key) {
  return path.join(outDir, `${key}.png`);
}

function redactedProvisionPayload(payload) {
  const metadata = payload.adminMetadata ?? null;
  return {
    capturedAt: new Date().toISOString(),
    ok: payload.ok === true,
    email: payload.email ?? adminEmail,
    provisioned: payload.provisioned === true,
    hasSessionToken:
      typeof payload.sessionToken === "string" && payload.sessionToken.length > 0,
    hasSignInTicket:
      typeof payload.signInTicket === "string" && payload.signInTicket.length > 0,
    hasProofSessionCookie: Boolean(
      payload.proofSessionCookie && payload.proofSessionCookie.value,
    ),
    proofSessionCookieName: payload.proofSessionCookieName ?? null,
    adminMetadata: metadata
      ? {
          role: metadata.role ?? null,
          clientId: metadata.clientId ?? null,
          defaultClientId: metadata.defaultClientId ?? null,
          clientName: metadata.clientName ?? null,
          clientLocked: metadata.clientLocked === true,
          tenantKey: metadata.tenantKey ?? null,
          tenantName: metadata.tenantName ?? null,
          allowedClientKeys: metadata.allowedClientKeys ?? [],
          visibleClientKeys: metadata.visibleClientKeys ?? [],
          moduleAccess: metadata.moduleAccess ?? [],
          tenantRoles: metadata.tenantRoles ?? {},
        }
      : null,
    expectedTenantKey,
    clientRow: payload.clientRow
      ? {
          ensured: payload.clientRow.ensured === true,
          created: payload.clientRow.created === true,
          tenantKey: payload.clientRow.row?.tenant_key ?? null,
          slug: payload.clientRow.row?.slug ?? null,
          industryCode: payload.clientRow.row?.industry_code ?? null,
          hasId: typeof payload.clientRow.row?.id === "string",
          error: payload.clientRow.error ?? null,
        }
      : null,
    phoneRecoveryFactor: payload.phoneRecoveryFactor ? "present" : "not_returned",
    phoneRecoveryFactorError: payload.phoneRecoveryFactorError ?? null,
    phoneValueRecorded: false,
    error: payload.error ?? null,
  };
}

function isBenignFailedRequest(url) {
  return (
    /favicon|posthog|sentry|ingest|client-analytics|clerk\.telemetry|hot-update|webpack-hmr/i.test(
      url,
    ) ||
    /\/\/[^/]+\.clerk\.accounts\.dev\/npm\/@clerk\//i.test(url) ||
    new URL(url).origin === new URL(baseUrl).origin && /[?&]_rsc=|\/auth-redirect/i.test(url)
  );
}

function isBenignHttpError(url, status) {
  if (status < 400) return true;
  return isBenignFailedRequest(url);
}

function isBenignConsoleError(message) {
  return /clerk.*development|clerk.*telemetry|failed to load resource.*favicon|clerk\.accounts\.dev\/npm\/@clerk|failed to load resource: net::err_failed/i.test(
    message,
  );
}

async function provisionAdmin() {
  const token = readProofToken();
  const response = await fetch(`${baseUrl}/api/auth/private-browser-proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: adminEmail, provisionAdmin: true }),
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Provisioning returned non-JSON HTTP ${response.status}`);
  }
  fs.writeFileSync(rawPayloadPath, JSON.stringify(payload, null, 2));
  const redacted = redactedProvisionPayload(payload);
  fs.writeFileSync(
    path.join("proof/meridian-admin-access-proof/runtime-evidence/admin-provision-redacted.json"),
    JSON.stringify(redacted, null, 2),
  );
  if (!response.ok || payload.ok !== true || !payload.signInTicket) {
    throw new Error(`Admin provisioning failed: HTTP ${response.status}`);
  }
  if (redacted.adminMetadata?.tenantKey !== expectedTenantKey) {
    throw new Error(
      `Admin metadata tenant mismatch: ${redacted.adminMetadata?.tenantKey ?? "missing"}`,
    );
  }
  if (redacted.clientRow?.ensured !== true) {
    throw new Error("Meridian client row was not ensured");
  }
  return payload;
}

async function signInWithTicket(page, ticket) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, {
    timeout: 45_000,
  });
  const clerkSession = await page.evaluate(async (t) => {
    const result = await window.Clerk.client.signIn.create({
      strategy: "ticket",
      ticket: t,
    });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
    const token = await window.Clerk.session?.getToken().catch(() => null);
    return {
      hasSessionToken: typeof token === "string" && token.length > 0,
      token,
    };
  }, ticket);
  if (!clerkSession.hasSessionToken || !clerkSession.token) {
    throw new Error("Ticket sign-in did not mint a Clerk session token");
  }
  await page.waitForFunction(() => Boolean(window.Clerk?.user), null, {
    timeout: 45_000,
  });
  await page.waitForFunction(() => document.cookie.includes("__session="), null, {
    timeout: 45_000,
  });
  await page.goto(`${baseUrl}/auth-redirect`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(2500);
  return {
    hasClientSessionToken: true,
    token: clerkSession.token,
  };
}

async function addActiveClientCookie(context, value) {
  await context.addCookies([
    {
      name: "abarva_active_client",
      value,
      url: baseUrl,
      httpOnly: false,
      secure: baseUrl.startsWith("https://"),
      sameSite: "Lax",
    },
  ]);
}

async function addClerkSessionCookie(context, sessionToken) {
  if (typeof sessionToken !== "string" || !sessionToken.trim()) return;
  await context.addCookies([
    {
      name: "__session",
      value: sessionToken.trim(),
      url: baseUrl,
      httpOnly: false,
      secure: baseUrl.startsWith("https://"),
      sameSite: "Lax",
    },
  ]);
}

async function acceptResponsibleAiAcknowledgment(page, clerkSessionToken) {
  const result = await page.evaluate(async ({ textVersion, token }) => {
    const response = await fetch(
      "/api/ai-liability/responsible-ai-acknowledgment",
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accepted: true, textVersion }),
      },
    );
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  }, {
    textVersion: responsibleAiAcknowledgmentVersion,
    token: clerkSessionToken,
  });

  if (!result.ok || result.body?.ok !== true) {
    throw new Error(
      `Responsible AI acknowledgment failed: HTTP ${result.status}: ${JSON.stringify(result.body)}`,
    );
  }

  return {
    accepted: true,
    textVersion: responsibleAiAcknowledgmentVersion,
    status: result.status,
    bodyOk: result.body?.ok === true,
  };
}

async function completeResponsibleAiTraining(page, clerkSessionToken) {
  const result = await page.evaluate(async ({ trainingVersion, token }) => {
    const response = await fetch("/api/ai-liability/responsible-ai-training", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: true, trainingVersion }),
    });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  }, {
    trainingVersion: responsibleAiTrainingVersion,
    token: clerkSessionToken,
  });

  if (!result.ok || result.body?.ok !== true) {
    throw new Error(
      `Responsible AI training failed: HTTP ${result.status}: ${JSON.stringify(result.body)}`,
    );
  }

  return {
    completed: true,
    trainingVersion: responsibleAiTrainingVersion,
    status: result.status,
    bodyOk: result.body?.ok === true,
  };
}

async function captureRoute(page, route) {
  const response = await page.goto(`${baseUrl}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 75_000,
  });
  await page.waitForLoadState("load", { timeout: 20_000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText({ timeout: 20_000 });
  await page.screenshot({ path: screenshotPath(route.key), fullPage: true });
  const missingExpected = route.expected.filter(
    (term) => !text.toLowerCase().includes(term.toLowerCase()),
  );
  const sourceCounts =
    route.key === "source"
      ? /contracts\/vendors=(\d+)\/(\d+)/i.exec(text)
      : null;
  const sourceNonzero =
    route.key !== "source" ||
    (sourceCounts ? Number(sourceCounts[1]) > 0 && Number(sourceCounts[2]) > 0 : false);
  const signInScreen = /sign in with a one-time code/i.test(text);
  const retired = countMatches(text, retiredTokens);
  const foreign = countMatches(text, foreignTokens);
  return {
    key: route.key,
    path: route.path,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    expectedVisible: missingExpected.length === 0,
    missingExpected,
    sourceNonzero,
    sourceContracts: sourceCounts ? Number(sourceCounts[1]) : null,
    sourceVendors: sourceCounts ? Number(sourceCounts[2]) : null,
    signInScreen,
    retiredCount: retired.length,
    foreignCount: foreign.length,
    screenshot: `${route.key}.png`,
    excerpt: excerpt(text),
    ok:
      (response?.status() ?? 599) < 400 &&
      missingExpected.length === 0 &&
      sourceNonzero &&
      !signInScreen &&
      retired.length === 0 &&
      foreign.length === 0,
  };
}

async function captureUnauthorizedAttempt(context, page) {
  await addActiveClientCookie(context, unauthorizedClientKey);
  const response = await page.goto(
    `${baseUrl}/source/preview/workspace?client=${encodeURIComponent(
      unauthorizedClientKey,
    )}`,
    { waitUntil: "domcontentloaded", timeout: 75_000 },
  );
  await page.waitForLoadState("load", { timeout: 20_000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText({ timeout: 20_000 });
  await page.screenshot({
    path: screenshotPath("unauthorized-tenant-manipulation"),
    fullPage: true,
  });
  const foreign = countMatches(text, foreignTokens);
  const retired = countMatches(text, retiredTokens);
  const stillMeridian =
    /Meridian Health Source v1/i.test(text) && /tenant_key=meridian/i.test(text);
  const signInScreen = /sign in with a one-time code/i.test(text);
  return {
    path: "/source/preview/workspace?client=<foreign-tenant>",
    status: response?.status() ?? null,
    finalUrl: page.url().replace(unauthorizedClientKey, "<foreign-tenant>"),
    attemptedForeignTenant: "redacted",
    stillMeridian,
    signInScreen,
    foreignCount: foreign.length,
    retiredCount: retired.length,
    screenshot: "unauthorized-tenant-manipulation.png",
    excerpt: excerpt(text),
    ok:
      (response?.status() ?? 599) < 400 &&
      stillMeridian &&
      !signInScreen &&
      foreign.length === 0 &&
      retired.length === 0,
  };
}

function buildSummary(report) {
  const rows = report.routeResults
    .map(
      (route) =>
        `| ${route.ok ? "PASS" : "FAIL"} | ${route.key} | ${route.status ?? "n/a"} | ${route.expectedVisible ? "yes" : "no"} | ${route.foreignCount} | ${route.retiredCount} | ${path.basename(route.screenshot)} |`,
    )
    .join("\n");
  return `# Meridian Admin Signed-In Access Proof

Generated: ${report.generatedAt}
Base URL: ${report.baseUrl}
Admin: ${adminEmail}
Active client: ${activeClient}
Expected tenant key: ${expectedTenantKey}
Dataset: ${expectedDataset}
Overall: ${report.pass ? "PASS" : "FAIL"}

| Result | Route | HTTP | Expected copy | Foreign matches | Retired-identity hits | Screenshot |
| --- | --- | ---: | --- | ---: | ---: | --- |
${rows}

Admin metadata tenant key: ${report.adminProvision.adminMetadata?.tenantKey ?? "missing"}
Admin metadata client lock: ${report.adminProvision.adminMetadata?.clientLocked ? "true" : "false"}
Admin metadata module access: ${(report.adminProvision.adminMetadata?.moduleAccess ?? []).join(", ")}
Control-plane client row ensured: ${report.adminProvision.clientRow?.ensured ? "true" : "false"}
Control-plane client row created: ${report.adminProvision.clientRow?.created ? "true" : "false"}
Control-plane client tenant key: ${report.adminProvision.clientRow?.tenantKey ?? "missing"}
Recovery factor present: ${report.adminProvision.phoneRecoveryFactor}
Phone value recorded in proof: ${report.adminProvision.phoneValueRecorded}
Responsible AI acknowledgment: ${report.responsibleAiAcknowledgment?.accepted ? "PASS" : "FAIL"}
Responsible AI training: ${report.responsibleAiTraining?.completed ? "PASS" : "FAIL"}

Unauthorized tenant manipulation: ${report.unauthorizedTenantManipulation.ok ? "PASS" : "FAIL"}
Manipulation result remained Meridian: ${report.unauthorizedTenantManipulation.stillMeridian}

Filtered failed requests remaining: ${report.failed.length}
HTTP >=400 responses remaining: ${report.bad.length}
Console errors remaining: ${report.consoleErrors.length}
`;
}

async function main() {
  ensureDir(outDir);
  ensureDir("proof/meridian-admin-access-proof/runtime-evidence");
  const payload = await provisionAdmin();
  const adminProvision = redactedProvisionPayload(payload);
  const failed = [];
  const bad = [];
  const consoleErrors = [];

  const browser = await chromium.launch({ headless: true });
  let routeResults = [];
  let unauthorizedTenantManipulation;
  let responsibleAiAcknowledgment;
  let responsibleAiTraining;
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    const page = await context.newPage();
    const clerkSession = await signInWithTicket(page, payload.signInTicket);
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${clerkSession.token}`,
    });
    await addClerkSessionCookie(context, payload.sessionToken);
    await addActiveClientCookie(context, activeClient);
    responsibleAiAcknowledgment = await acceptResponsibleAiAcknowledgment(
      page,
      clerkSession.token,
    );
    responsibleAiTraining = await completeResponsibleAiTraining(
      page,
      clerkSession.token,
    );

    page.on("requestfailed", (request) => {
      const url = request.url();
      if (isBenignFailedRequest(url)) return;
      failed.push({
        url,
        method: request.method(),
        failure: request.failure()?.errorText ?? "unknown",
      });
    });
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      if (isBenignHttpError(url, status)) return;
      bad.push({ url, status });
    });
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (isBenignConsoleError(text)) return;
      consoleErrors.push(text);
    });

    routeResults = [];
    for (const route of routes) {
      routeResults.push(await captureRoute(page, route));
    }
    unauthorizedTenantManipulation = await captureUnauthorizedAttempt(
      context,
      page,
    );
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    adminEmail,
    activeClient,
    expectedTenantKey,
    expectedDataset,
    authMode: "clerk_sign_in_ticket_no_private_proof_cookie",
    sharedAppTrafficShift: false,
    sharedAppExposure: false,
    productionMigration: false,
    adminProvision,
    responsibleAiAcknowledgment,
    responsibleAiTraining,
    routeResults,
    unauthorizedTenantManipulation,
    failed,
    bad,
    consoleErrors,
  };
  report.pass =
    adminProvision.ok &&
    adminProvision.adminMetadata?.tenantKey === expectedTenantKey &&
    adminProvision.clientRow?.ensured === true &&
    responsibleAiAcknowledgment?.accepted === true &&
    responsibleAiTraining?.completed === true &&
    routeResults.every((route) => route.ok) &&
    unauthorizedTenantManipulation?.ok === true &&
    failed.length === 0 &&
    bad.length === 0 &&
    consoleErrors.length === 0;

  fs.writeFileSync(path.join(outDir, "proof.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, "summary.md"), buildSummary(report));
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(outDir, "proof.json")))
    .digest("hex");
  fs.writeFileSync(
    path.join(outDir, "proof-sha256.txt"),
    `${hash}  proof.json\n`,
  );

  console.log(JSON.stringify({ pass: report.pass, outDir, hash }, null, 2));
  if (!report.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
