#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function pass(name, detail = "") {
  checks.push({ name, status: "pass", detail });
}

function fail(name, detail) {
  checks.push({ name, status: "fail", detail });
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`file.${relativePath}`, "missing");
    return "";
  }
  pass(`file.${relativePath}`);
  return fs.readFileSync(fullPath, "utf8");
}

function requireText(relativePath, body, snippet) {
  if (body.includes(snippet)) {
    pass(`snippet.${relativePath}.${snippet}`);
  } else {
    fail(`snippet.${relativePath}.${snippet}`, "missing snippet");
  }
}

function requireEqual(name, actual, expected) {
  if (actual === expected) {
    pass(name, String(actual));
  } else {
    fail(name, `expected ${expected}, received ${actual}`);
  }
}

const manifestPath = "config/sso/fakeclient-entra-clerk-rehearsal.json";
const runbookPath = "docs/runbooks/fakeclient-entra-sso-rehearsal.md";
const buildPath = "docs/build/FAKECLIENT_SSO_REHEARSAL_2026-06-03.md";
const releasePath = "docs/releases/records/2026-06-03-fakeclient-sso-rehearsal.md";
const packagePath = "package.json";

const manifestBody = read(manifestPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);
const packageJson = read(packagePath);

let manifest = null;
try {
  manifest = JSON.parse(manifestBody);
  pass("manifest.valid-json");
} catch (error) {
  fail("manifest.valid-json", error.message);
}

if (manifest) {
  requireEqual("manifest.clientKey", manifest.clientKey, "fakeclient");
  requireEqual(
    "manifest.clerkOrganization.required",
    manifest.clerkOrganization?.required,
    true,
  );
  requireEqual(
    "manifest.clerkOrganization.scimRequired",
    manifest.clerkOrganization?.scimRequired,
    true,
  );
  requireEqual(
    "manifest.claimsContract.platformAdminMappingAllowed",
    manifest.claimsContract?.platformAdminMappingAllowed,
    false,
  );
  requireEqual(
    "manifest.syntheticUsers.minimumTotal",
    manifest.syntheticUsers?.minimumTotal,
    10,
  );

  const groups = manifest.entraGroups ?? [];
  const roleSet = new Set(groups.map((group) => group.tenantRole));
  for (const role of ["tenant_admin", "sponsor", "sme", "viewer"]) {
    if (roleSet.has(role)) {
      pass(`manifest.role.${role}`);
    } else {
      fail(`manifest.role.${role}`, "missing role group");
    }
  }

  const minimumUsers = groups.reduce(
    (sum, group) => sum + Number(group.minimumUsers ?? 0),
    0,
  );
  if (minimumUsers >= 10) {
    pass("manifest.group-minimum-users", String(minimumUsers));
  } else {
    fail("manifest.group-minimum-users", `expected >=10, received ${minimumUsers}`);
  }

  const routeSmokes = groups.flatMap((group) => group.routeSmoke ?? []);
  for (const route of ["/admin", "/admin/users-access", "/admin/ops", "/home"]) {
    if (routeSmokes.includes(route)) {
      pass(`manifest.route-smoke.${route}`);
    } else {
      fail(`manifest.route-smoke.${route}`, "missing route smoke");
    }
  }

  for (const evidence of [
    "SAML metadata URL or OIDC issuer URL",
    "SCIM provisioning proof",
    "tenant isolation probe output",
    "rollback transcript",
  ]) {
    if (manifest.requiredEvidence?.includes(evidence)) {
      pass(`manifest.evidence.${evidence}`);
    } else {
      fail(`manifest.evidence.${evidence}`, "missing evidence");
    }
  }
}

[
  "Microsoft Entra ID dev tenant",
  "SAML 2.0 or OIDC",
  "SCIM provisioning",
  "publicMetadata.clientId = fakeclient",
  "no IdP group maps to AbarVa platform admin",
  "tenant-isolation probe",
  "T138 and T140 remain `In progress`",
].forEach((snippet) => requireText(runbookPath, runbook, snippet));

[
  "T138",
  "T140",
  "10 synthetic users",
  "No live Entra or Clerk changes are performed by this repository artifact",
].forEach((snippet) => requireText(buildPath, build, snippet));

[
  "2026-06-03-fakeclient-sso-rehearsal",
  "internal-admin",
  "Pass: `npm run auth:fakeclient-sso:verify`",
  "T138 and T140 remain `In progress`",
].forEach((snippet) => requireText(releasePath, release, snippet));

requireText(
  packagePath,
  packageJson,
  '"auth:fakeclient-sso:verify": "node scripts/auth/verify-fakeclient-sso-rehearsal.mjs"',
);

const failed = checks.filter((check) => check.status === "fail");
const report = {
  audit: "fakeclient-sso-rehearsal",
  status: failed.length === 0 ? "pass" : "fail",
  summary: {
    pass: checks.length - failed.length,
    fail: failed.length,
  },
  checks,
};

console.log(JSON.stringify(report, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
