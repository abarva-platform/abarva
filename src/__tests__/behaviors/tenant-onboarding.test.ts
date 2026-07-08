/**
 * P0-1 (synthetic pilot rehearsal 2026-05-22): tenant onboarding script.
 *
 * Verifies that `src/scripts/tenants/add-tenant.ts` produces correct,
 * idempotent updates to all four hardcoded registries:
 *   1. src/lib/client-config.ts
 *   2. src/lib/tenant/aliases.ts
 *   3. src/lib/tenants/demo-tenant-data-tiers.ts
 *   4. src/lib/auth/canonical-auth-roster.ts
 *
 * Tests operate on temp copies of the registries so the real files are
 * never touched.
 */

import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "fs";
import { tmpdir } from "os";
import * as path from "path";

import {
  executeAddTenant,
  patchActiveClient,
  patchCanonicalAuthRoster,
  patchClientConfig,
  patchDemoTenantDataTiers,
  validateInput,
  parseArgv,
  normalizeAdminEmail,
  VALID_INDUSTRIES,
} from "@/scripts/tenants/add-tenant";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const REGISTRY_FILES: Record<string, string> = {
  clientConfig: "src/lib/client-config.ts",
  activeClient: "src/lib/tenant/aliases.ts",
  demoTenantDataTiers: "src/lib/tenants/demo-tenant-data-tiers.ts",
  canonicalAuthRoster: "src/lib/auth/canonical-auth-roster.ts",
};

function snapshotRegistries(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, rel] of Object.entries(REGISTRY_FILES)) {
    out[k] = readFileSync(path.join(REPO_ROOT, rel), "utf8");
  }
  return out;
}

function makeSandboxRepo(originals: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "add-tenant-test-"));
  for (const [k, rel] of Object.entries(REGISTRY_FILES)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, originals[k], "utf8");
  }
  // package.json sentinel so resolveRepoRoot lookups would still work, though
  // we always pass repoRoot explicitly in tests.
  writeFileSync(path.join(root, "package.json"), "{}", "utf8");
  return root;
}

const ORIGINALS = snapshotRegistries();

describe("add-tenant — validateInput", () => {
  it("rejects empty key", () => {
    expect(() =>
      validateInput({
        name: "X",
        industry: "RETAIL",
        adminEmail: "a@b.example.com",
      }),
    ).toThrow(/--key is required/);
  });

  it("rejects key with dash", () => {
    expect(() =>
      validateInput({
        key: "north-wind",
        name: "X",
        industry: "RETAIL",
        adminEmail: "a@b.example.com",
      }),
    ).toThrow(/lowercase letters\/digits/);
  });

  it("rejects key with uppercase", () => {
    expect(() =>
      validateInput({
        key: "Northwind",
        name: "X",
        industry: "RETAIL",
        adminEmail: "a@b.example.com",
      }),
    ).toThrow(/lowercase letters\/digits/);
  });

  it("rejects reserved keys", () => {
    for (const reserved of ["apexretail", "meridian", "arcturus"]) {
      expect(() =>
        validateInput({
          key: reserved,
          name: "X",
          industry: "RETAIL",
          adminEmail: "a@b.example.com",
        }),
      ).toThrow(/reserved canonical key/);
    }
  });

  it("rejects invalid industry", () => {
    expect(() =>
      validateInput({
        key: "northwind",
        name: "X",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        industry: "OTHER" as any,
        adminEmail: "a@b.example.com",
      }),
    ).toThrow(/--industry must be one of/);
  });

  it("accepts all supported valid industries", () => {
    for (const industry of VALID_INDUSTRIES) {
      expect(() =>
        validateInput({
          key: "northwind",
          name: "Northwind",
          industry,
          adminEmail: "a@b.example.com",
        }),
      ).not.toThrow();
    }
  });

  it("rejects admin-email without @", () => {
    expect(() =>
      validateInput({
        key: "northwind",
        name: "Northwind",
        industry: "RETAIL",
        adminEmail: "noatsign",
      }),
    ).toThrow(/must contain '@'/);
  });
});

describe("add-tenant — normalizeAdminEmail", () => {
  it("expands short form (cdo@northwind-retail) to *.example.com", () => {
    const { email, domain } = normalizeAdminEmail("cdo@northwind-retail");
    expect(email).toBe("cdo@northwind-retail.example.com");
    expect(domain).toBe("northwind-retail.example.com");
  });

  it("leaves a fully-qualified email alone", () => {
    const { email, domain } = normalizeAdminEmail(
      "CDO@Northwind-Retail.Example.com",
    );
    expect(email).toBe("cdo@northwind-retail.example.com");
    expect(domain).toBe("northwind-retail.example.com");
  });
});

describe("add-tenant — parseArgv", () => {
  it("parses long flags with values", () => {
    const r = parseArgv([
      "--key",
      "northwind",
      "--name",
      "Northwind Retail",
      "--industry",
      "RETAIL",
      "--admin-email",
      "cdo@northwind-retail",
    ]);
    expect(r.key).toBe("northwind");
    expect(r.name).toBe("Northwind Retail");
    expect(r.industry).toBe("RETAIL");
    expect(r.adminEmail).toBe("cdo@northwind-retail");
  });

  it("parses --dry-run boolean", () => {
    const r = parseArgv(["--dry-run", "--key", "x"]);
    expect(r.dryRun).toBe(true);
    expect(r.key).toBe("x");
  });
});

describe("add-tenant — patchClientConfig (string patcher)", () => {
  const input = {
    key: "northwind",
    name: "Northwind Retail",
    shortName: "Northwind",
    industry: "RETAIL" as const,
    adminEmail: "cdo@northwind-retail",
    color: "#94A3B8",
  };

  it("adds ClientOption to ALL_CLIENTS", () => {
    const r = patchClientConfig(ORIGINALS.clientConfig, input);
    expect(r.changed).toBe(true);
    expect(r.content).toMatch(/id: 'northwind'/);
    expect(r.content).toMatch(/name: 'Northwind Retail'/);
    expect(r.content).toMatch(/vertical: 'Retail'/);
  });

  it("adds CLIENT_KEY_TO_DB_NAME entry", () => {
    const r = patchClientConfig(ORIGINALS.clientConfig, input);
    // The northwind entry should appear inside the CLIENT_KEY_TO_DB_NAME record.
    const sectionStart = r.content.indexOf("CLIENT_KEY_TO_DB_NAME");
    const sectionEnd = r.content.indexOf("};", sectionStart);
    const section = r.content.slice(sectionStart, sectionEnd);
    expect(section).toMatch(/northwind: \['Northwind Retail'\]/);
  });

  it("adds CLIENT_KEY_TO_INDUSTRY_CODE entry", () => {
    const r = patchClientConfig(ORIGINALS.clientConfig, input);
    const sectionStart = r.content.indexOf("CLIENT_KEY_TO_INDUSTRY_CODE");
    const sectionEnd = r.content.indexOf("};", sectionStart);
    const section = r.content.slice(sectionStart, sectionEnd);
    expect(section).toMatch(/northwind: 'RETAIL'/);
  });

  it("adds EMAIL_DOMAIN_TO_CLIENT_KEY entry", () => {
    const r = patchClientConfig(ORIGINALS.clientConfig, input);
    expect(r.content).toMatch(
      /\['northwind-retail\.example\.com', 'northwind'\]/,
    );
  });

  it("is idempotent (re-running produces no change)", () => {
    const first = patchClientConfig(ORIGINALS.clientConfig, input);
    const second = patchClientConfig(first.content, input);
    expect(second.changed).toBe(false);
    expect(second.content).toBe(first.content);
  });
});

describe("add-tenant — patchActiveClient", () => {
  const input = {
    key: "northwind",
    name: "Northwind Retail",
    industry: "RETAIL" as const,
    adminEmail: "cdo@northwind-retail",
  };

  it("adds TENANT_ALIAS_PROFILES entry with app key, canonical key, broker key, and aliases", () => {
    const r = patchActiveClient(ORIGINALS.activeClient, input);
    expect(r.changed).toBe(true);
    expect(r.content).toMatch(/appClientKey: 'northwind'/);
    expect(r.content).toMatch(/canonicalKey: 'northwind-retail'/);
    expect(r.content).toMatch(/brokerKey: 'northwind-retail'/);
    expect(r.content).toMatch(
      /aliases: \['northwind', 'northwind-retail', 'northwind retail'\]/,
    );
  });

  it("is idempotent", () => {
    const first = patchActiveClient(ORIGINALS.activeClient, input);
    const second = patchActiveClient(first.content, input);
    expect(second.changed).toBe(false);
  });
});

describe("add-tenant — patchDemoTenantDataTiers", () => {
  const input = {
    key: "northwind",
    name: "Northwind Retail",
    industry: "RETAIL" as const,
    adminEmail: "cdo@northwind-retail",
  };

  it("adds a shell_only tier entry by default", () => {
    const r = patchDemoTenantDataTiers(ORIGINALS.demoTenantDataTiers, input);
    expect(r.changed).toBe(true);
    expect(r.content).toMatch(/tenantSlug: 'northwind'/);
    expect(r.content).toMatch(/tenantName: 'Northwind Retail'/);
    expect(r.content).toMatch(/richness: 'shell_only'/);
  });

  it('declares all 5 surfaces with availability="unavailable" and routeHint=null', () => {
    const r = patchDemoTenantDataTiers(ORIGINALS.demoTenantDataTiers, input);
    // The new block must declare all 5 surfaces, all marked unavailable, all
    // with null routeHint — critical for the P0-2 fix: a brand-new tenant
    // never carries a routeHint pointing at another tenant.
    const block = r.content.slice(r.content.indexOf("tenantSlug: 'northwind'"));
    for (const surface of [
      "programs",
      "source",
      "intelligence",
      "control_tower",
      "admin",
    ]) {
      expect(block).toContain(`surface: '${surface}'`);
    }
    expect(block.match(/availability: 'unavailable'/g)?.length).toBe(5);
    expect(block.match(/routeHint: null/g)?.length).toBe(5);
  });

  it("is idempotent", () => {
    const first = patchDemoTenantDataTiers(
      ORIGINALS.demoTenantDataTiers,
      input,
    );
    const second = patchDemoTenantDataTiers(first.content, input);
    expect(second.changed).toBe(false);
  });
});

describe("add-tenant — patchCanonicalAuthRoster", () => {
  const input = {
    key: "northwind",
    name: "Northwind Retail",
    industry: "RETAIL" as const,
    adminEmail: "cdo@northwind-retail",
  };

  it("adds the admin email to CANONICAL_AUTH_EMAILS and CANONICAL_CLIENT_ADMIN_EMAILS", () => {
    const r = patchCanonicalAuthRoster(ORIGINALS.canonicalAuthRoster, input);
    expect(r.changed).toBe(true);
    // Both arrays must include the canonicalized email.
    const authSection = r.content.slice(
      r.content.indexOf("CANONICAL_AUTH_EMAILS"),
      r.content.indexOf("CANONICAL_CLIENT_ADMIN_EMAILS"),
    );
    expect(authSection).toContain("'cdo@northwind-retail.example.com'");

    const adminSection = r.content.slice(
      r.content.indexOf("CANONICAL_CLIENT_ADMIN_EMAILS"),
    );
    expect(adminSection).toContain("'cdo@northwind-retail.example.com'");
  });

  it("is idempotent", () => {
    const first = patchCanonicalAuthRoster(
      ORIGINALS.canonicalAuthRoster,
      input,
    );
    const second = patchCanonicalAuthRoster(first.content, input);
    expect(second.changed).toBe(false);
  });
});

describe("add-tenant — executeAddTenant (end-to-end on temp repo)", () => {
  it("writes all four registries on first run, no-ops on re-run", () => {
    const sandbox = makeSandboxRepo(ORIGINALS);
    const input = validateInput({
      key: "northwind",
      name: "Northwind Retail",
      industry: "RETAIL",
      adminEmail: "cdo@northwind-retail",
    });

    const first = executeAddTenant(input, { repoRoot: sandbox });
    expect(first.patches.every((p) => p.changed)).toBe(true);
    expect(first.key).toBe("northwind");
    expect(first.industry).toBe("RETAIL");
    expect(first.adminEmail).toBe("cdo@northwind-retail.example.com");
    expect(first.emailDomain).toBe("northwind-retail.example.com");
    expect(first.nextSteps.length).toBeGreaterThan(0);

    // Verify each file was actually written.
    for (const rel of Object.values(REGISTRY_FILES)) {
      const written = readFileSync(path.join(sandbox, rel), "utf8");
      expect(written).toContain("northwind");
    }

    // Re-run: should be a no-op on every registry.
    const second = executeAddTenant(input, { repoRoot: sandbox });
    expect(second.patches.every((p) => !p.changed)).toBe(true);
  });

  it("does not break existing tenants: apex-retail, meridian, arcturus stay intact", () => {
    const sandbox = makeSandboxRepo(ORIGINALS);
    const input = validateInput({
      key: "northwind",
      name: "Northwind Retail",
      industry: "RETAIL",
      adminEmail: "cdo@northwind-retail",
    });
    executeAddTenant(input, { repoRoot: sandbox });

    // client-config: ALL_CLIENTS still has apexretail/meridian/arcturus.
    const clientConfig = readFileSync(
      path.join(sandbox, REGISTRY_FILES.clientConfig),
      "utf8",
    );
    expect(clientConfig).toMatch(/id: ['"]apexretail['"]/);
    expect(clientConfig).toMatch(/id: ['"]meridian['"]/);
    expect(clientConfig).toMatch(/id: ['"]arcturus['"]/);

    // canonical-auth-roster: launch identities for each existing tenant still present.
    const roster = readFileSync(
      path.join(sandbox, REGISTRY_FILES.canonicalAuthRoster),
      "utf8",
    );
    expect(roster).toContain("anand.sundaram+apex@thesundaram.com");
    expect(roster).toContain("anand.sundaram+firstcapital@thesundaram.com");
    expect(roster).toContain("anand.sundaram+meridian@thesundaram.com");
    expect(roster).toContain("anand.sundaram+skyharbor@thesundaram.com");
    expect(roster).toContain("anand.sundaram+lakeshore@thesundaram.com");
  });

  it("--dry-run does not modify any files", () => {
    const sandbox = makeSandboxRepo(ORIGINALS);
    const input = validateInput({
      key: "northwind",
      name: "Northwind Retail",
      industry: "RETAIL",
      adminEmail: "cdo@northwind-retail",
    });
    const result = executeAddTenant(input, { repoRoot: sandbox, dryRun: true });
    // Reported as changed, but the disk content should still be the original.
    expect(result.patches.some((p) => p.changed)).toBe(true);
    for (const [k, rel] of Object.entries(REGISTRY_FILES)) {
      const onDisk = readFileSync(path.join(sandbox, rel), "utf8");
      expect(onDisk).toBe(ORIGINALS[k]);
    }
  });

  it("rejects re-using a reserved canonical key", () => {
    expect(() =>
      validateInput({
        key: "apexretail",
        name: "Conflicting Tenant",
        industry: "RETAIL",
        adminEmail: "admin@conflict.example.com",
      }),
    ).toThrow(/reserved canonical key/);
  });
});

describe("add-tenant — sandbox sanity", () => {
  it("the sandbox repo includes valid copies of all four registries", () => {
    const sandbox = makeSandboxRepo(ORIGINALS);
    for (const rel of Object.values(REGISTRY_FILES)) {
      expect(existsSync(path.join(sandbox, rel))).toBe(true);
    }
  });
});
