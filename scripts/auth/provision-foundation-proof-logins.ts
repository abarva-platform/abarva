#!/usr/bin/env tsx
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
    apply: args.includes("--apply"),
    list: args.includes("--list"),
    tenant: (getValue("--tenant") as FoundationProofTenantKey | null) ?? null,
    slug: getValue("--slug"),
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
  for (const login of selected) {
    const metadata = buildFoundationProofMetadata(login);
    const existing = await clerk.users.getUserList({
      emailAddress: [login.email],
      limit: 1,
    });
    const user = existing.data[0] ?? null;
    const action = user ? "update" : "create";

    if (args.apply) {
      if (user) {
        await clerk.users.updateUser(user.id, {
          firstName: login.firstName,
          lastName: login.lastName,
          publicMetadata: metadata,
        });
        if (user.banned) await clerk.users.unbanUser(user.id);
      } else {
        await clerk.users.createUser({
          emailAddress: [login.email],
          firstName: login.firstName,
          lastName: login.lastName,
          publicMetadata: metadata,
          skipPasswordRequirement: true,
        });
      }
    }

    console.log(
      `${args.apply ? "[APPLIED]" : "[PLAN]"} ${action} ${login.email} · ${login.tenantKey} · ${login.personaKind}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
