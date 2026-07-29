#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClerkClient } from "@clerk/backend";
import { chromium, type Page } from "@playwright/test";

import {
  FOUNDATION_PROOF_LOGINS,
  type FoundationProofLogin,
  type FoundationProofTenantKey,
} from "../../src/lib/auth/foundation-proof-logins";

const REPO_ROOT = process.cwd();
const AUTH_DIR = path.join(REPO_ROOT, ".auth");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "foundation-preview-auth");
const DEFAULT_BASE_URL = process.env.BASE_URL ?? "https://app.abarva.ai";

function loadEnvFiles(): void {
  for (const candidate of [
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".env"),
  ]) {
    loadEnv({ path: candidate, override: false });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Use local env; never commit it.`);
  return value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const getValue = (name: string): string | null => {
    const inline = args.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] ?? null : null;
  };
  return {
    baseUrl: getValue("--base-url") ?? DEFAULT_BASE_URL,
    tenant: (getValue("--tenant") as FoundationProofTenantKey | null) ?? "airline-demo-new",
    slug: getValue("--slug") ?? "agent-airline-foundation",
    refresh: args.includes("--refresh"),
    models: getValue("--models") ?? "off",
  };
}

async function signInWithTicket(page: Page, baseUrl: string, userId: string): Promise<void> {
  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const token = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 30000 },
  );
  await page.evaluate(async (ticket) => {
    const win = window as unknown as Window & {
      Clerk: {
        client: {
          signIn: {
            create: (params: { strategy: "ticket"; ticket: string }) => Promise<{
              status: string;
              createdSessionId?: string | null;
            }>;
          };
        };
        setActive: (params: { session?: string | null }) => Promise<void>;
      };
    };
    const result = await win.Clerk.client.signIn.create({ strategy: "ticket", ticket });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }
    await win.Clerk.setActive({ session: result.createdSessionId });
  }, token.token);
}

function selectLogin(args: ReturnType<typeof parseArgs>): FoundationProofLogin {
  const login = FOUNDATION_PROOF_LOGINS.find(
    (candidate) => candidate.tenantKey === args.tenant && candidate.slug === args.slug,
  );
  if (!login) {
    throw new Error(`No foundation proof login for --tenant ${args.tenant} --slug ${args.slug}.`);
  }
  return login;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs();
  const login = selectLogin(args);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const storagePath = path.join(AUTH_DIR, `foundation-${login.tenantKey}-${login.slug}.json`);
  if (args.refresh) fs.rmSync(storagePath, { force: true });

  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const users = await clerk.users.getUserList({ emailAddress: [login.email], limit: 1 });
  const user = users.data[0];
  if (!user) {
    throw new Error(
      `No Clerk user for ${login.email}. Provision first: npx tsx scripts/auth/provision-foundation-proof-logins.ts --tenant ${login.tenantKey} --apply`,
    );
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: args.baseUrl, viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  try {
    await signInWithTicket(page, args.baseUrl, user.id);
    const url = new URL("/knowledge-preview", args.baseUrl);
    url.searchParams.set("provider", "http");
    url.searchParams.set("tenant", login.tenantKey);
    url.searchParams.set("models", args.models === "on" ? "on" : "off");

    const response = await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 60000 });
    const status = response?.status() ?? 0;
    const bodyText = await page.locator("body").innerText({ timeout: 30000 });
    const required = [
      "Admin canary",
      "HTTP provider",
      login.tenantKey,
      "Active baseline",
      "governed baseline",
    ];
    const missing = required.filter((needle) => !bodyText.includes(needle));
    const passed = status < 400 && missing.length === 0 && !page.url().includes("/sign-in");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(REPORT_DIR, `foundation-${login.tenantKey}-${login.slug}-${stamp}.png`);
    const reportPath = path.join(REPORT_DIR, `foundation-${login.tenantKey}-${login.slug}-${stamp}.json`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.storageState({ path: storagePath });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: args.baseUrl,
          tenantKey: login.tenantKey,
          slug: login.slug,
          email: login.email,
          url: page.url(),
          status,
          passed,
          missing,
          storagePath: path.relative(REPO_ROOT, storagePath),
          screenshotPath: path.relative(REPO_ROOT, screenshotPath),
        },
        null,
        2,
      ),
    );

    console.log(`${passed ? "[PASS]" : "[FAIL]"} ${login.slug} · ${login.tenantKey}`);
    console.log(`Storage: ${path.relative(REPO_ROOT, storagePath)}`);
    console.log(`Report: ${path.relative(REPO_ROOT, reportPath)}`);
    console.log(`Screenshot: ${path.relative(REPO_ROOT, screenshotPath)}`);
    if (!passed) process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
