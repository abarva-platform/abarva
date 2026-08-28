#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || process.env.ECL_PRODUCT_BROWSER_BASE_URL || "https://app.abarva.ai";
const TENANT_KEY = process.env.E2E_ACTIVE_CLIENT || "meridian-health";
const EXPECTED_TENANT_NAME = process.env.E2E_EXPECTED_TENANT_NAME || "Meridian Health";
const OUT_DIR = path.resolve(
  process.env.ECL_PHS_MOVES_BROWSER_PROOF_DIR || "job-output/meridian-phs-moves-browser-smoke",
);
const PRIVATE_PROOF_TOKEN = process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN?.trim() || null;
const EMIT_PROOF = process.env.EMIT_ACA_PROOF_BUNDLE !== "false";
const MOVE_ID_OVERRIDE = process.env.ECL_PHS_MOVES_MOVE_ID?.trim() || null;
const EMAILS = [
  process.env.E2E_PRIVATE_PROOF_EMAIL,
  process.env.E2E_DEMO_EMAIL,
  "agent@meridian-health.example.com",
  "admin@abarva.ai",
  "cdio@meridian-health.example.com",
  "demo-meridian+clerk_test@abarva.com",
].filter(Boolean);

const STATIC_SURFACES = [
  {
    surface_key: "moves_index",
    route_template: "/strategic-moves",
    requiredText: [/Strategic Moves|Moves/i, /Meridian Health|Active tenant/i],
  },
  {
    surface_key: "moves_detail_redirect",
    route_template: "/strategic-moves/{moveId}",
    requiredText: [/phase|workspace|Move|Strategic/i],
    expectsRedirectToPhase: true,
  },
  {
    surface_key: "moves_phase_workspace",
    route_template: "/strategic-moves/{moveId}/phase/{phaseNum}",
    requiredText: [/Phase|workspace|evidence|gate/i],
  },
  {
    surface_key: "moves_evidence",
    route_template: "/strategic-moves/{moveId}/evidence",
    requiredText: [/Phase Documents|Documents|Evidence/i],
  },
  {
    surface_key: "moves_trace",
    route_template: "/strategic-moves/{moveId}/trace",
    requiredText: [
      /Intelligence/i,
      /Move/i,
      /Source/i,
      /Tower/i,
      /4\s+of\s+4\s+steps\s+linked/i,
      /Every cross-module hand-off in this decision is wired/i,
      /Move action: Instrument Tower baseline/i,
      /Next gate: baseline_measurement/i,
    ],
  },
  {
    surface_key: "moves_workspace",
    route_template: "/strategic-moves/{moveId}/workspace",
    requiredText: [/workspace|Workspace/i],
    featureOptional: true,
  },
];

const BANNED_VISIBLE_TEXT = [
  /\bNaN\b/,
  /No governed Tower data/i,
  /No governed rows/i,
  /Unhandled Runtime Error/i,
  /Application error/i,
  /\bsource_record_id\b/i,
  /\becl_projection\b/i,
  /\bprojection_entry\b/i,
];

function validateContract() {
  const issues = [];
  const keys = STATIC_SURFACES.map((surface) => surface.surface_key);
  if (STATIC_SURFACES.length !== 6) {
    issues.push(`moves_surface_count_${STATIC_SURFACES.length}_expected_6`);
  }
  if (new Set(keys).size !== keys.length) {
    issues.push("moves_surface_keys_must_be_unique");
  }
  for (const surface of STATIC_SURFACES) {
    if (!surface.route_template.startsWith("/strategic-moves")) {
      issues.push(`${surface.surface_key}_route_must_start_with_strategic_moves`);
    }
    if (!surface.requiredText?.length) {
      issues.push(`${surface.surface_key}_must_have_required_text`);
    }
  }
  return {
    accepted: issues.length === 0,
    denominator: 6,
    surface_keys: keys,
    issues,
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function routeHost() {
  return new URL(BASE_URL).hostname;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function textExcerpt(value, limit = 700) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function routePath(template, move) {
  return template
    .replace("{moveId}", encodeURIComponent(move.moveId))
    .replace("{phaseNum}", encodeURIComponent(String(move.phaseNum)));
}

function moveFromHref(href) {
  const match = String(href).match(/\/strategic-moves\/([^/?#]+)(?:\/phase\/([0-5]))?/);
  if (!match) return null;
  return {
    moveId: decodeURIComponent(match[1]),
    phaseNum: match[2] ? Number(match[2]) : 0,
  };
}

async function discoverMove(page) {
  if (MOVE_ID_OVERRIDE) return { moveId: MOVE_ID_OVERRIDE, phaseNum: Number(process.env.ECL_PHS_MOVES_PHASE ?? 0) };

  const links = await page
    .locator("a")
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") || ""))
    .catch(() => []);
  for (const href of links) {
    const move = moveFromHref(href);
    if (move && !["new", "manage", "living"].includes(move.moveId)) {
      return move;
    }
  }

  throw new Error("No strategic Move link found on /strategic-moves; set ECL_PHS_MOVES_MOVE_ID to run a targeted proof.");
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
  throw new Error(`No Clerk user found for any Moves browser smoke email: ${tried.join(", ")}`);
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
  const { createClerkClient } = await import("@clerk/backend");
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

async function smokeSurface(page, surface, move) {
  const errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (error) => errors.push(error.message));

  const targetPath = routePath(surface.route_template, move);
  const url = new URL(targetPath, BASE_URL).toString();
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  const finalUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 }).catch(() => "");
  const screenshotPath = path.join(OUT_DIR, "screenshots", `${surface.surface_key}.png`);
  const textPath = path.join(OUT_DIR, "text", `${surface.surface_key}.txt`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  fs.mkdirSync(path.dirname(textPath), { recursive: true });
  fs.writeFileSync(textPath, bodyText, "utf8");

  const issues = [];
  const status = response?.status() ?? null;
  const featureExcluded = surface.featureOptional && status === 404;
  if (status && status >= 400 && !featureExcluded) issues.push(`http_status_${status}`);
  if (/\/sign-in\b/.test(finalUrl)) issues.push("redirected_to_sign_in");
  if (!featureExcluded && bodyText.trim().length < 200) issues.push("body_text_too_short");
  if (surface.expectsRedirectToPhase && !/\/phase\/[0-5]/.test(finalUrl)) {
    issues.push("detail_route_did_not_redirect_to_phase");
  }
  if (!featureExcluded) {
    for (const expected of surface.requiredText) {
      if (!expected.test(bodyText)) issues.push(`missing_required_text_${expected}`);
    }
    for (const banned of BANNED_VISIBLE_TEXT) {
      if (banned.test(bodyText)) issues.push(`banned_visible_text_${banned}`);
    }
  }
  for (const error of errors) issues.push(`pageerror_${error}`);

  return {
    surface_key: surface.surface_key,
    route_template: surface.route_template,
    url,
    final_url: finalUrl,
    status,
    feature_excluded: featureExcluded,
    text_length: bodyText.length,
    screenshot: fs.existsSync(screenshotPath) ? path.relative(OUT_DIR, screenshotPath) : null,
    screenshot_sha256: fs.existsSync(screenshotPath) ? sha256(screenshotPath) : null,
    text_snapshot: path.relative(OUT_DIR, textPath),
    text_sha256: sha256(textPath),
    text_excerpt: textExcerpt(bodyText),
    accepted: issues.length === 0,
    issues,
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
  const contract = validateContract();
  if (process.argv.includes("--validate-contract")) {
    console.log(JSON.stringify(contract, null, 2));
    if (!contract.accepted) process.exitCode = 1;
    return;
  }
  if (!contract.accepted) {
    throw new Error(`Moves browser smoke contract failed: ${contract.issues.join("; ")}`);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const results = [];
  let authProof = null;
  let move = null;

  try {
    authProof = await authenticate(page);
    const indexSurface = STATIC_SURFACES[0];
    const indexResult = await smokeSurface(page, indexSurface, { moveId: MOVE_ID_OVERRIDE || "unknown", phaseNum: 0 });
    results.push(indexResult);
    if (!indexResult.accepted) {
      throw new Error(`Moves index failed before move discovery: ${indexResult.issues.join("; ")}`);
    }
    move = await discoverMove(page);
    for (const surface of STATIC_SURFACES.slice(1)) {
      results.push(await smokeSurface(page, surface, move));
    }
  } finally {
    await browser.close();
  }

  const proven = results.filter((result) => result.accepted && !result.feature_excluded).length;
  const excluded = results.filter((result) => result.feature_excluded).length;
  const summary = {
    accepted: results.every((result) => result.accepted),
    actual_browser_execution: true,
    base_url: BASE_URL,
    checked_at: new Date().toISOString(),
    auth_method: authProof?.authMethod ?? null,
    email: authProof?.email ?? null,
    tenant_key: TENANT_KEY,
    expected_tenant_name: EXPECTED_TENANT_NAME,
    move,
    moves_surfaces_browser_proven: {
      metric: "Moves surfaces browser-proven",
      numerator: proven,
      denominator: STATIC_SURFACES.length,
      excluded,
      accepted: proven + excluded === STATIC_SURFACES.length && results.every((result) => result.accepted),
    },
    issue_count: results.reduce((total, result) => total + result.issues.length, 0),
    issues: results.flatMap((result) => result.issues.map((issue) => `${result.surface_key}: ${issue}`)),
    surfaces: results,
  };
  writeJson(path.join(OUT_DIR, "meridian_phs_moves_browser_smoke_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (EMIT_PROOF) emitProofBundle();
  if (!summary.accepted || !summary.moves_surfaces_browser_proven.accepted) process.exitCode = 1;
}

main().catch((error) => {
  writeJson(path.join(OUT_DIR, "meridian_phs_moves_browser_smoke_summary.json"), {
    accepted: false,
    actual_browser_execution: true,
    error: error?.stack || error?.message || String(error),
  });
  console.error(error);
  process.exitCode = 1;
});
