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
  process.env.E2E_DEMO_EMAIL,
  "cdio@meridian-health.example.com",
  "demo-meridian+clerk_test@abarva.com",
].filter(Boolean);
const OUT_DIR = path.resolve(process.env.ECL_PRODUCT_BROWSER_PROOF_DIR || "job-output/ecl-product-browser-smoke");
const EMIT_PROOF = process.env.EMIT_ACA_PROOF_BUNDLE !== "false";

const ROUTES = [
  {
    key: "home_preview_ecl",
    path: "/home/preview?provider=ecl_projection_db",
    requiredText: [/Meridian Health/i, /750|applications/i],
  },
  {
    key: "source_workspace_ecl",
    path: "/source/preview/workspace?provider=ecl_projection_db",
    requiredText: [/Meridian Health|Source/i, /contract|vendor|event/i],
  },
  {
    key: "tower_ecl",
    path: "/tower?provider=ecl_projection_db",
    requiredText: [/Tower|Portfolio|Command/i],
  },
  {
    key: "intelligence_ecl",
    path: "/intelligence?provider=ecl_projection_db",
    requiredText: [/Intelligence|context|advisory/i],
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

async function signIn(page, ticket) {
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

  const host = new URL(BASE_URL).hostname;
  await page.context().addCookies([
    {
      name: "abarva_active_client",
      value: TENANT_KEY,
      domain: host,
      path: "/",
      sameSite: "Lax",
      secure: BASE_URL.startsWith("https://"),
    },
  ]);
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

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const ticket = await createTicket(clerk);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  const results = [];
  try {
    await signIn(page, ticket.token);
    for (const route of ROUTES) {
      results.push(await smokeRoute(page, route));
    }
  } finally {
    await browser.close();
  }

  const summary = {
    accepted: results.every((result) => result.accepted),
    actual_browser_execution: true,
    actual_route_repointing: false,
    base_url: BASE_URL,
    checked_at: new Date().toISOString(),
    email: ticket.email,
    expected_tenant_name: EXPECTED_TENANT_NAME,
    issue_count: results.reduce((sum, result) => sum + result.issues.length, 0),
    issues: results.flatMap((result) => result.issues.map((issue) => `${result.key}: ${issue}`)),
    provider: "ecl_projection_db",
    route_count: results.length,
    routes: results,
    tenant_key: TENANT_KEY,
  };
  writeJson(path.join(OUT_DIR, "ecl_product_browser_smoke_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (EMIT_PROOF) emitProofBundle();
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
