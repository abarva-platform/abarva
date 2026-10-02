/**
 * `/home` serves any preview tenant to any signed-in user, and defaults an unresolved user to the
 * first preview tenant. That is the demo's design, and it is acceptable only while every preview
 * tenant is declared a synthetic demo tenant. This is the tripwire for the day one is not: it does
 * not change who may see what, it stops a non-demo tenant being added while the page has no
 * tenancy check.
 *
 * A tenant is a demo tenant because the tenant input registry declares it one, on the packets it
 * registers -- never because of what its key or its name looks like.
 */
import fs from "node:fs";
import path from "node:path";

import { HOME_PREVIEW_TENANT_KEYS } from "@/lib/home/preview/golden-snapshot";

const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";
const SYNTHETIC_DEMO = "synthetic-demo";

const CONSTRAINT =
  "`/home` serves any preview tenant to any signed-in user and defaults an unresolved one to the " +
  "first, so every key in HOME_PREVIEW_TENANT_KEYS must be declared a synthetic demo tenant in " +
  `${REGISTRY_PATH}. The page must gain a tenancy check, as ` +
  "src/app/api/home/walkthrough-export/route.ts has, before a non-demo tenant is added.";

interface RegistryTenant {
  tenantKey: string;
  packets?: Array<{ classification?: string }>;
}

/** The preview keys the registry does not declare as synthetic demo tenants, each with why. */
function notDeclaredSyntheticDemo(
  previewKeys: readonly string[],
  activeTenants: readonly RegistryTenant[],
): Array<{ tenantKey: string; why: string }> {
  return previewKeys.flatMap((tenantKey) => {
    const declared = activeTenants.find(
      (tenant) => tenant.tenantKey === tenantKey,
    );
    if (!declared) {
      return [{ tenantKey, why: "not an active tenant in the registry" }];
    }
    const classifications = (declared.packets ?? []).map(
      (packet) => packet.classification ?? "(none)",
    );
    if (classifications.length === 0) {
      return [{ tenantKey, why: "registers no packets" }];
    }
    const other = classifications.filter((value) => value !== SYNTHETIC_DEMO);
    return other.length > 0
      ? [{ tenantKey, why: `registers packets classified ${other.join(", ")}` }]
      : [];
  });
}

describe("Home preview tenants and the tenant input registry", () => {
  it("has only registry-declared synthetic demo tenants on the preview list", () => {
    const registry = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), REGISTRY_PATH), "utf8"),
    ) as { activeTenants: RegistryTenant[] };
    expect(HOME_PREVIEW_TENANT_KEYS.length).toBeGreaterThan(0);

    const offenders = notDeclaredSyntheticDemo(
      HOME_PREVIEW_TENANT_KEYS,
      registry.activeTenants,
    );

    if (offenders.length > 0) {
      throw new Error(
        `${CONSTRAINT}\n${offenders
          .map(({ tenantKey, why }) => `  ${tenantKey}: ${why}`)
          .join("\n")}`,
      );
    }
  });

  it("would catch a preview key the registry does not declare a demo tenant", () => {
    const activeTenants: RegistryTenant[] = [
      { tenantKey: "demo", packets: [{ classification: SYNTHETIC_DEMO }] },
      { tenantKey: "client", packets: [{ classification: "client-intake" }] },
      {
        tenantKey: "mixed",
        packets: [
          { classification: SYNTHETIC_DEMO },
          { classification: "client-intake" },
        ],
      },
      { tenantKey: "empty", packets: [] },
      { tenantKey: "unclassified", packets: [{}] },
    ];

    expect(
      notDeclaredSyntheticDemo(
        ["demo", "client", "mixed", "empty", "unclassified", "absent"],
        activeTenants,
      ),
    ).toEqual([
      {
        tenantKey: "client",
        why: "registers packets classified client-intake",
      },
      { tenantKey: "mixed", why: "registers packets classified client-intake" },
      { tenantKey: "empty", why: "registers no packets" },
      { tenantKey: "unclassified", why: "registers packets classified (none)" },
      { tenantKey: "absent", why: "not an active tenant in the registry" },
    ]);
  });
});
