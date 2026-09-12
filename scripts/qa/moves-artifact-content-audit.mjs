#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createClerkClient } from "@clerk/backend";
import { chromium } from "@playwright/test";
import mammoth from "mammoth";
import { evaluateArtifactContent, loadContract } from "./moves-artifact-content-contract.mjs";

const repoRoot = path.resolve(new URL(".", import.meta.url).pathname, "../..");

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const [key, inline] = arg.split("=", 2);
  if (inline !== undefined) args.set(key, inline);
  else {
    args.set(key, process.argv[i + 1]);
    i += 1;
  }
}

loadDotEnv(path.join(repoRoot, ".env.local"));
loadDotEnv(path.join(repoRoot, ".env"));

const baseUrl = String(args.get("--base-url") ?? "https://app.abarva.ai").replace(/\/+$/u, "");
const moveId = String(args.get("--move-id") ?? "").trim();
if (!moveId) throw new Error("--move-id is required");
const clientKey = String(args.get("--client") ?? process.env.ABARVA_CLIENT_KEY ?? "").trim();
const contractPath = path.resolve(repoRoot, String(args.get("--contract") ?? "docs/qa/moves-rich-context-synthetic-acceptance-contract.json"));
const contract = loadContract(contractPath);
const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
const outDir = path.resolve(repoRoot, String(args.get("--out-dir") ?? path.join("audit-artifacts", "moves-artifact-content-audit", timestamp)));
const emailCandidates = [args.get("--email"), process.env.E2E_DEMO_EMAIL].filter(Boolean);
if (emailCandidates.length === 0) throw new Error("--email or E2E_DEMO_EMAIL is required");

fs.mkdirSync(outDir, { recursive: true });

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function log(event, detail = {}) {
  console.log(JSON.stringify({ at: new Date().toISOString(), event, ...detail }));
}

async function createTestingToken(clerk) {
  try {
    const token = await clerk.testingTokens.createTestingToken();
    return token.token;
  } catch {
    return null;
  }
}

function decodeJwtPayload(jwt) {
  const [, payload] = String(jwt).split(".");
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

async function installClerkTestingTokenInterceptor(context, testingToken) {
  if (!testingToken) return;
  await context.addInitScript(
    ({ param, token }) => {
      const shouldTag = (input) => {
        try {
          const url = new URL(input, window.location.href);
          return (
            url.hostname.endsWith(".clerk.accounts.dev") ||
            url.hostname.endsWith(".clerk.com") ||
            url.pathname.startsWith("/__clerk")
          );
        } catch {
          return false;
        }
      };
      const appendTestingToken = (input) => {
        if (!shouldTag(input)) return input;
        const url = new URL(input, window.location.href);
        if (!url.searchParams.has(param)) url.searchParams.set(param, token);
        return url.toString();
      };
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        if (typeof input === "string") return originalFetch(appendTestingToken(input), init);
        if (input instanceof Request) return originalFetch(new Request(appendTestingToken(input.url), input), init);
        return originalFetch(input, init);
      };
      const OriginalXMLHttpRequest = window.XMLHttpRequest;
      window.XMLHttpRequest = class extends OriginalXMLHttpRequest {
        open(method, url, async = true, username, password) {
          return super.open(method, appendTestingToken(String(url)), async, username ?? undefined, password ?? undefined);
        }
      };
    },
    { param: "__clerk_testing_token", token: testingToken },
  );
}

async function readJsonResponse(response, label) {
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 2000) };
  }
  if (!response.ok()) {
    throw new Error(`${label} returned ${response.status()}: ${JSON.stringify(payload).slice(0, 2000)}`);
  }
  return payload;
}

async function signedInBrowser() {
  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not available");
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  let selectedUser = null;
  let selectedEmail = null;
  for (const candidate of emailCandidates) {
    const users = await clerk.users.getUserList({ emailAddress: [String(candidate)], limit: 1 });
    if (users.data[0]) {
      selectedUser = users.data[0];
      selectedEmail = String(candidate);
      break;
    }
  }
  if (!selectedUser) throw new Error(`No Clerk user found for candidates: ${emailCandidates.join(", ")}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 1000 } });
  const testingToken = await createTestingToken(clerk);
  await installClerkTestingTokenInterceptor(context, testingToken);
  const url = new URL(baseUrl);
  try {
    const session = await clerk.sessions.createSession({ userId: selectedUser.id });
    const sessionToken = await clerk.sessions.getToken(session.id);
    const payload = decodeJwtPayload(sessionToken.jwt);
    const clerkOrigin = typeof payload.iss === "string" ? new URL(payload.iss) : null;
    const baseCookies = [
      { name: "__session", value: sessionToken.jwt },
      { name: "__client_uat", value: String(payload.iat ?? Math.floor(Date.now() / 1000)) },
      ...(testingToken ? [{ name: "__clerk_db_jwt", value: testingToken }] : []),
    ];
    const cookieDefaults = {
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
    };
    await context.addCookies(
      [
        ...baseCookies.map((cookie) => ({
          ...cookie,
          ...cookieDefaults,
          domain: url.hostname,
          httpOnly: cookie.name === "__session",
        })),
        ...(clerkOrigin
          ? baseCookies.map((cookie) => ({
              ...cookie,
              ...cookieDefaults,
              domain: clerkOrigin.hostname,
              httpOnly: cookie.name === "__session",
              secure: true,
            }))
          : []),
      ],
    );
  } catch (err) {
    log("server_session_auth_fallback", { reason: err instanceof Error ? err.message : String(err) });
    const token = await clerk.signInTokens.createSignInToken({
      userId: selectedUser.id,
      expiresInSeconds: 300,
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
    await page.evaluate(async (ticket) => {
      const result = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket });
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error(`Ticket sign-in failed with status ${result.status}`);
      }
      await window.Clerk.setActive({ session: result.createdSessionId });
    }, token.token);
    await page.waitForFunction(() => Boolean(window.Clerk?.session?.id || window.Clerk?.user?.id), null, {
      timeout: 30_000,
    });
    await page.waitForFunction(() => document.cookie.includes("__session="), null, { timeout: 30_000 });
    await page.close();
  }
  if (clientKey) {
    await context.addCookies([
      {
        name: "abarva_active_client",
        value: clientKey,
        domain: url.hostname,
        path: "/",
        sameSite: "Lax",
        secure: url.protocol === "https:",
      },
    ]);
  }
  return { browser, context, selectedEmail };
}

function htmlToText(html) {
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/gu, " ")
    .replace(/&amp;/gu, "&")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&#39;/gu, "'")
    .replace(/&quot;/gu, '"')
    .replace(/\s+/gu, " ")
    .trim();
}

function isZipBuffer(buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

async function responseToText(response, contentType) {
  const body = await response.body();
  if (contentType.includes("html")) return { text: htmlToText(body.toString("utf8")), extraction: "html" };
  if (isZipBuffer(body)) {
    const result = await mammoth.extractRawText({ buffer: body });
    return { text: result.value.replace(/\s+/gu, " ").trim(), extraction: "docx" };
  }
  return { text: body.toString("utf8"), extraction: "plain" };
}

function safeFilePart(value) {
  return String(value).replace(/[^a-z0-9._-]+/giu, "-").replace(/^-+|-+$/gu, "").slice(0, 80) || "artifact";
}

async function main() {
  const { browser, context, selectedEmail } = await signedInBrowser();
  try {
    log("authenticated", { selectedEmail });
    const listResponse = await context.request.get(`${baseUrl}/api/v1/programs/${moveId}/artifacts?currentOnly=1`);
    const list = await readJsonResponse(listResponse, "artifact list");
    const generated = (list.artifacts ?? [])
      .filter((artifact) => artifact.family === "generated_deliverable")
      .filter((artifact) => artifact.lifecycleState == null || artifact.lifecycleState === "current")
      .filter((artifact) => artifact.status !== "quarantined")
      .sort((a, b) => {
        const phase = Number(a.phase ?? 99) - Number(b.phase ?? 99);
        if (phase !== 0) return phase;
        return String(a.title).localeCompare(String(b.title));
      });
    log("artifact_list", {
      totalArtifacts: list.artifacts?.length ?? 0,
      generatedCurrent: generated.length,
    });

    const textByArtifact = [];
    for (const artifact of generated) {
      const url = `${baseUrl}${artifact.downloadUrl}${artifact.downloadUrl.includes("?") ? "&" : "?"}format=html`;
      const response = await context.request.get(url, { timeout: 90_000 });
      const contentType = response.headers()["content-type"] ?? "";
      if (!response.ok()) {
        const raw = await response.text();
        throw new Error(`download ${artifact.artifactId} returned ${response.status()}: ${raw.slice(0, 500)}`);
      }
      const { text, extraction } = await responseToText(response, contentType);
      const textPath = path.join(
        outDir,
        `${String(artifact.phase ?? "x").padStart(2, "0")}-${safeFilePart(artifact.artifactType)}-${artifact.artifactId}.txt`,
      );
      fs.writeFileSync(textPath, text, "utf8");
      textByArtifact.push({
        artifactId: artifact.artifactId,
        artifactType: artifact.artifactType,
        title: artifact.title,
        phase: artifact.phase,
        status: artifact.status,
        qualityScore: artifact.qualityScore,
        downloadUrl: artifact.downloadUrl,
        contentType,
        extraction,
        textChars: text.length,
        textPath,
        text,
      });
      log("artifact_downloaded", {
        artifactId: artifact.artifactId,
        phase: artifact.phase,
        title: artifact.title,
        textChars: text.length,
      });
    }

    const allText = textByArtifact.map((artifact) => `# ${artifact.title}\n${artifact.text}`).join("\n\n");
    const allTextPath = path.join(outDir, "all-generated-artifacts.txt");
    fs.writeFileSync(allTextPath, allText, "utf8");

    const evaluated = evaluateArtifactContent({ contract, artifacts: textByArtifact });
    const report = {
      ok: evaluated.ok && list.ok === true,
      checkedAt: new Date().toISOString(),
      baseUrl,
      moveId,
      contract: { id: contract.id, version: contract.version, path: contractPath },
      selectedEmail,
      artifactList: {
        ok: list.ok === true,
        totalArtifacts: list.artifacts?.length ?? 0,
        generatedCurrentCount: generated.length,
      },
      artifacts: textByArtifact.map(({ text: _text, ...artifact }) => artifact),
      ...evaluated,
      allTextPath,
    };
    const reportPath = path.join(outDir, "generated-artifact-content-audit.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    log("audit_written", {
      ok: report.ok,
      report: reportPath,
      allText: allTextPath,
      generatedCurrentCount: generated.length,
      missingSignals: evaluated.missingSignals,
      missingPhaseSignals: evaluated.missingPhaseSignals,
      missingPhaseArtifacts: evaluated.missingPhaseArtifacts,
      prohibitedMatches: evaluated.prohibitedMatches,
    });
    if (!report.ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
