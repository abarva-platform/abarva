#!/usr/bin/env tsx
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClerkClient } from "@clerk/backend";

import { classifyLegacyTenantLogin } from "../../src/lib/auth/legacy-tenant-sunset";

const REPO_ROOT = process.cwd();
const DEFAULT_REPORT_DIR = path.join(
  os.tmpdir(),
  `legacy-tenant-login-sunset-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

interface ClerkUserForSunset {
  id: string;
  banned?: boolean;
  publicMetadata?: unknown;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
  if (!value) {
    throw new Error(`Missing ${name}. Use local env; never commit it.`);
  }
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
  const apply = args.includes("--apply");
  const confirmed = args.includes("--confirm-disable-legacy-tenant-logins");
  return {
    apply,
    confirmed,
    limit: Number(getValue("--limit") ?? "500"),
    outDir:
      getValue("--out-dir") ??
      process.env.LEGACY_TENANT_LOGIN_SUNSET_OUT_DIR ??
      DEFAULT_REPORT_DIR,
  };
}

function primaryEmail(user: ClerkUserForSunset): string | null {
  const primary = user.primaryEmailAddress?.emailAddress;
  if (typeof primary === "string" && primary.trim()) return primary;
  const first = user.emailAddresses?.find(
    (entry) =>
      typeof entry.emailAddress === "string" && entry.emailAddress.trim(),
  )?.emailAddress;
  return first ?? null;
}

async function listAllUsers(
  clerk: ReturnType<typeof createClerkClient>,
  limit: number,
): Promise<ClerkUserForSunset[]> {
  const users: ClerkUserForSunset[] = [];
  let offset = 0;
  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    users.push(...(page.data as ClerkUserForSunset[]));
    if (page.data.length < limit) break;
    offset += limit;
  }
  return users;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs();
  if (args.apply && !args.confirmed) {
    throw new Error(
      "Refusing apply without --confirm-disable-legacy-tenant-logins.",
    );
  }

  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const users = await listAllUsers(clerk, args.limit);
  const now = new Date().toISOString();
  const results: Array<{
    userId: string;
    email: string | null;
    tenantKey: string | null;
    reason: string;
    shouldDisable: boolean;
    wasBanned: boolean;
    applied: boolean;
    action: "none" | "ban" | "already_banned" | "error";
    error?: unknown;
  }> = [];

  for (const user of users) {
    const email = primaryEmail(user);
    const decision = classifyLegacyTenantLogin({
      email,
      publicMetadata: user.publicMetadata,
    });
    let action: "none" | "ban" | "already_banned" | "error" = "none";
    let error: unknown;
    if (decision.shouldDisable) {
      if (user.banned) {
        action = "already_banned";
      } else if (args.apply) {
        try {
          const publicMetadata = isRecord(user.publicMetadata)
            ? user.publicMetadata
            : {};
          await clerk.users.updateUser(user.id, {
            publicMetadata: {
              ...publicMetadata,
              legacyTenantDisabled: true,
              legacyTenantDisabledAt: now,
              legacyTenantDisabledReason: decision.reason,
            },
          });
          await clerk.users.banUser(user.id);
          action = "ban";
        } catch (caught) {
          action = "error";
          error = caught instanceof Error ? caught.message : caught;
        }
      } else {
        action = "ban";
      }
    }
    results.push({
      userId: user.id,
      email,
      tenantKey: decision.tenantKey,
      reason: decision.reason,
      shouldDisable: decision.shouldDisable,
      wasBanned: Boolean(user.banned),
      applied: args.apply,
      action,
      error,
    });
  }

  fs.mkdirSync(args.outDir, { recursive: true });
  const report = {
    generatedAt: now,
    mode: args.apply ? "apply" : "dry-run",
    purpose:
      "Disable legacy demo tenant Clerk logins. No Knowledge foundation data mutation.",
    totals: {
      scanned: results.length,
      disableCandidates: results.filter((result) => result.shouldDisable)
        .length,
      plannedOrAppliedBans: results.filter((result) => result.action === "ban")
        .length,
      alreadyBanned: results.filter(
        (result) => result.action === "already_banned",
      ).length,
      errors: results.filter((result) => result.action === "error").length,
    },
    results,
  };
  const reportPath = path.join(args.outDir, "legacy-tenant-login-sunset.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals, null, 2));
  console.log(`Report: ${reportPath}`);
  if (report.totals.errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
