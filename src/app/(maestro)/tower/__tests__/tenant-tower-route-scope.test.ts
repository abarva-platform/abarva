import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("tenant Tower route scope", () => {
  const tenantTowerRoutes = [
    "src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx",
    "src/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page.tsx",
  ];

  it("renders Tower with the tenant authorized by the tenant route", () => {
    for (const file of tenantTowerRoutes) {
      const source = readRepoFile(file);

      expect(source).toContain("assertTenantAccess");
      expect(source).toContain("renderTowerPage");
      expect(source).toContain("trustedTenant");
      expect(source).toContain("clientKey: access.clientKey");
    }
  });

  it("does not route tenant Tower traffic through a generic client query param", () => {
    for (const file of tenantTowerRoutes) {
      const source = readRepoFile(file);

      expect(source).not.toContain("redirect");
      expect(source).not.toContain("/tower?");
      expect(source).not.toContain("client:");
      expect(source).not.toContain("new URLSearchParams");
    }
  });
});
