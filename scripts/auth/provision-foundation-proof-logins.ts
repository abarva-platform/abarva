#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClerkClient } from "@clerk/backend";

import {
  FOUNDATION_PROOF_LOGINS,
  buildFoundationProofMetadata,
  type FoundationProofLogin,
  type FoundationProofTenantKey,
} from "../../src/lib/auth/foundation-proof-logins";

const REPO_ROOT = process.cwd();
const DEFAULT_REPORT_DIR = path.join(
  os.tmpdir(),
  `foundation-proof-provision-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

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
  const envFlag = (name: string): boolean => ["1", "true", "yes"].includes((process.env[name] ?? "").toLowerCase());
  return {
    apply: args.includes("--apply") || envFlag("FOUNDATION_PROOF_APPLY"),
    emitProofBundle: args.includes("--emit-proof-bundle") || envFlag("FOUNDATION_PROOF_EMIT_PROOF_BUNDLE"),
    list: args.includes("--list") || envFlag("FOUNDATION_PROOF_LIST"),
    outDir: getValue("--out-dir") ?? process.env.FOUNDATION_PROOF_OUT_DIR ?? DEFAULT_REPORT_DIR,
    tenant: (getValue("--tenant") as FoundationProofTenantKey | null) ?? (process.env.FOUNDATION_PROOF_TENANT as FoundationProofTenantKey | undefined) ?? null,
    slug: getValue("--slug") ?? process.env.FOUNDATION_PROOF_SLUG,
  };
}

function selectLogins(args: ReturnType<typeof parseArgs>): readonly FoundationProofLogin[] {
  let selected = FOUNDATION_PROOF_LOGINS;
  if (args.tenant) selected = selected.filter((login) => login.tenantKey === args.tenant);
  if (args.slug) selected = selected.filter((login) => login.slug === args.slug);
  return selected;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs();
  const selected = selectLogins(args);

  if (args.list) {
    for (const login of selected.length ? selected : FOUNDATION_PROOF_LOGINS) {
      console.log(`${login.slug}\t${login.tenantKey}\t${login.email}\t${login.personaKind}`);
    }
    return;
  }
  if (selected.length === 0) {
    throw new Error("No matching foundation proof logins. Use --list to inspect the roster.");
  }

  console.log(
    `Foundation proof login provisioning · ${args.apply ? "APPLY" : "DRY-RUN"}`,
  );
  console.log(
    "Purpose: Clerk metadata only. No foundation review/publication/baseline/projection mutation.",
  );

  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const results: Array<{
    email: string;
    slug: string;
    tenantKey: FoundationProofTenantKey;
    personaKind: FoundationProofLogin["personaKind"];
    action: "create" | "update" | "error";
    applied: boolean;
    ok: boolean;
    phoneNumber?: string | null;
    error?: unknown;
  }> = [];
  for (const login of selected) {
    try {
      const metadata = buildFoundationProofMetadata(login);
      const existing = await clerk.users.getUserList({
        emailAddress: [login.email],
        limit: 1,
      });
      const user = existing.data[0] ?? null;
      const action = user ? "update" : "create";
      let phoneNumber: string | null =
        user?.phoneNumbers?.[0]?.phoneNumber ?? null;

      if (args.apply) {
        if (user) {
          await clerk.users.updateUser(user.id, {
            firstName: login.firstName,
            lastName: login.lastName,
            publicMetadata: metadata,
          });
          if (user.banned) await clerk.users.unbanUser(user.id);
        } else {
          phoneNumber = await selectAvailablePhoneNumber(clerk, login);
          await clerk.users.createUser({
            emailAddress: [login.email],
            phoneNumber: [phoneNumber],
            firstName: login.firstName,
            lastName: login.lastName,
            publicMetadata: metadata,
            skipPasswordRequirement: true,
          });
        }
      } else if (!user) {
        phoneNumber = await selectAvailablePhoneNumber(clerk, login);
      }

      console.log(
        `${args.apply ? "[APPLIED]" : "[PLAN]"} ${action} ${login.email} · ${login.tenantKey} · ${login.personaKind} · phone=${phoneNumber ?? "existing/unset"}`,
      );
      results.push({
        email: login.email,
        slug: login.slug,
        tenantKey: login.tenantKey,
        personaKind: login.personaKind,
        action,
        applied: args.apply,
        ok: true,
        phoneNumber,
      });
    } catch (error) {
      const detail = clerkErrorDetail(error);
      console.error(`[ERROR] ${login.slug} ${login.email}: ${JSON.stringify(detail)}`);
      results.push({
        email: login.email,
        slug: login.slug,
        tenantKey: login.tenantKey,
        personaKind: login.personaKind,
        action: "error",
        applied: args.apply,
        ok: false,
        phoneNumber: null,
        error: detail,
      });
    }
  }

  fs.mkdirSync(args.outDir, { recursive: true });
  const reportPath = path.join(args.outDir, "foundation-proof-provision.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: args.apply ? "apply" : "dry-run",
        purpose: "Clerk metadata only; no foundation review/publication/baseline/projection mutation.",
        selectedTenant: args.tenant,
        selectedSlug: args.slug ?? null,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`Report: ${reportPath}`);
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

async function selectAvailablePhoneNumber(
  clerk: ReturnType<typeof createClerkClient>,
  login: FoundationProofLogin,
): Promise<string> {
  for (const phoneNumber of login.phoneNumbers) {
    const existing = await clerk.users.getUserList({
      phoneNumber: [phoneNumber],
      limit: 1,
    });
    if (existing.data.length === 0) return phoneNumber;
  }
  throw new Error(
    `No available proof phone numbers remain for ${login.slug}. Add another reserved roster number before applying.`,
  );
}

function clerkErrorDetail(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;
  const record = error as Record<string, unknown>;
  return {
    message: error instanceof Error ? error.message : String(error),
    status: record.status,
    statusCode: record.statusCode,
    clerkTraceId: record.clerkTraceId,
    errors: record.errors,
  };
}

function emitProofBundle(dir: string): void {
  const tar = spawnSync("tar", ["-czf", "-", "-C", dir, "."], { encoding: "buffer" });
  if (tar.status !== 0) {
    throw new Error(`Failed to create provision proof bundle: ${tar.stderr?.toString() || tar.stdout?.toString() || "tar failed"}`);
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
