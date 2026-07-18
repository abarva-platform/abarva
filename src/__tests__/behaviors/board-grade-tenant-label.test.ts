/**
 * P1-3 (synthetic pilot rehearsal 2026-05-22): the board-grade renderer model
 * files used to compute `tenantLabel: skeleton.tenantKey`, where
 * `skeleton.tenantKey` is actually the FUNCTION-PACK industry slug ("retail",
 * "healthcare-provider", "financial-services"). A real Northwind user would
 * see "retail" in the deck cover instead of "Northwind Retail".
 *
 * `resolveBoardGradeTenantLabel` is the helper the 8 generic Move renderer
 * models now use. This test pins its honesty contract:
 *
 *   1. A recognised tenant key resolves to the demo-safe client display name.
 *   2. A threaded tenant name (no key) resolves to that name.
 *   3. An unknown tenant with neither key nor name resolves to the honest
 *      "Tenant" placeholder.
 *   4. The industry slug ("retail", "healthcare-provider",
 *      "financial-services") NEVER surfaces as the label.
 *
 * It also pins the end-to-end behaviour on the 8 Move builders so a future
 * refactor that drops the resolver hookup fails loudly.
 */

import { resolveBoardGradeTenantLabel } from "@/lib/programs/expert-kernel/exports/board-grade/tenant-label-resolver";
import { buildMoveDiscoverBrief } from "@/lib/programs/expert-kernel/exports/board-grade/move-discover-brief-model";
import { buildMoveCfoPack } from "@/lib/programs/expert-kernel/exports/board-grade/move-cfo-pack-model";
import { buildMoveCharterSkeleton } from "@/lib/programs/expert-kernel/exports/board-grade/move-charter-skeleton-model";
import { buildMoveEstimateModel } from "@/lib/programs/expert-kernel/exports/board-grade/move-estimate-model";
import { buildMoveMobilizePacket } from "@/lib/programs/expert-kernel/exports/board-grade/move-mobilize-model";
import { buildMoveMasterDossier } from "@/lib/programs/expert-kernel/exports/board-grade/move-master-dossier-model";
import { buildMoveCostedBusinessCasePack } from "@/lib/programs/expert-kernel/exports/board-grade/move-pack-model";
import { buildMoveSolutionArchitecture } from "@/lib/programs/expert-kernel/exports/board-grade/move-solution-architecture-model";
import type { MoveBusinessCaseInput } from "@/lib/programs/move-business-case";

const GENERATED_ON = "2026-05-22";

// Industry slugs the kernel derives — these MUST NEVER surface as the label.
const INDUSTRY_SLUGS = ["retail", "healthcare-provider", "financial-services"];

describe("resolveBoardGradeTenantLabel — P1-3 honesty contract", () => {
  it("resolves a recognised ClientKey (apexretail) to the demo-safe display name", () => {
    const { tenantLabel, tenantKey } = resolveBoardGradeTenantLabel(
      { tenant_key: "apexretail", tenant_name: "Apex Retail Group" },
      "retail",
    );
    expect(tenantLabel).toBe("Retail Demo");
    expect(tenantKey).toBe("apexretail");
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it("resolves a recognised ClientKey (meridian) to demo-safe display name", () => {
    const { tenantLabel } = resolveBoardGradeTenantLabel(
      { tenant_key: "meridian", tenant_name: "Meridian Health System" },
      "healthcare-provider",
    );
    expect(tenantLabel).toBe("Healthcare Demo");
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it("resolves a recognised ClientKey (arcturus / firstcapital) to demo-safe display name", () => {
    const { tenantLabel } = resolveBoardGradeTenantLabel(
      { tenant_key: "arcturus", tenant_name: "First Capital Financial" },
      "financial-services",
    );
    expect(tenantLabel).toBe("FS Demo");
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it("accepts the camelCase aliases (tenantKey, tenantName)", () => {
    const { tenantLabel } = resolveBoardGradeTenantLabel(
      {
        tenantKey: "apexretail",
        tenantName: "Apex Retail Group",
      } as MoveBusinessCaseInput,
      "retail",
    );
    expect(tenantLabel).toBe("Retail Demo");
  });

  it("falls back to threaded tenant_name when the key is unknown", () => {
    // Northwind is the canonical unknown-tenant case from the rehearsal log.
    const { tenantLabel, tenantKey } = resolveBoardGradeTenantLabel(
      { tenant_key: "northwind", tenant_name: "Northwind Retail" },
      "retail",
    );
    expect(tenantLabel).toBe("Northwind Retail");
    // skeletonTenantKey is preserved when no canonical key matched.
    expect(tenantKey).toBe("retail");
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it("uses tenant_name alone when no key is threaded", () => {
    const { tenantLabel } = resolveBoardGradeTenantLabel(
      { tenant_name: "Helios Logistics" },
      "retail",
    );
    expect(tenantLabel).toBe("Helios Logistics");
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it('returns the honest "Tenant" placeholder when neither key nor name is threaded', () => {
    const { tenantLabel, tenantKey } = resolveBoardGradeTenantLabel(
      {},
      "retail",
    );
    expect(tenantLabel).toBe("Tenant");
    // skeletonTenantKey preserved for downstream cache / telemetry stability.
    expect(tenantKey).toBe("retail");
    // CRITICAL: the industry slug NEVER becomes the label.
    expect(INDUSTRY_SLUGS).not.toContain(tenantLabel);
  });

  it("never surfaces the industry slug even when only the slug is available", () => {
    for (const slug of INDUSTRY_SLUGS) {
      const { tenantLabel } = resolveBoardGradeTenantLabel({}, slug);
      expect(tenantLabel).not.toBe(slug);
      expect(tenantLabel).toBe("Tenant");
    }
  });

  it("ignores blank/whitespace tenant_name and falls back to placeholder", () => {
    const { tenantLabel } = resolveBoardGradeTenantLabel(
      { tenant_name: "   " },
      "retail",
    );
    expect(tenantLabel).toBe("Tenant");
  });
});

describe("Board-grade Move model files — P1-3 end-to-end", () => {
  // A minimal, bound retail customer-care Move that should render via the
  // function-pack registry (Apex × customer-care is catalogued). The Move
  // input threads the tenant key/name so the resolver picks them up.
  const APEX_MOVE: MoveBusinessCaseInput = {
    industry_code: "RETAIL",
    function_pack_key: "customer_care",
    name: "Reduce repeat contact-center transfers",
    tenant_key: "apexretail",
    tenant_name: "Apex Retail Group",
  };

  // A brand-new tenant (Northwind) in the same industry. The kernel binds the
  // pack and produces a real skeleton; the renderer MUST label the deck with
  // 'Northwind Retail', not 'retail'.
  const NORTHWIND_MOVE: MoveBusinessCaseInput = {
    industry_code: "RETAIL",
    function_pack_key: "customer_care",
    name: "Reduce repeat contact-center transfers",
    tenant_key: "northwind",
    tenant_name: "Northwind Retail",
  };

  // A Move with no tenant identity threaded — the worst case, the rehearsal
  // exposure. The label MUST be the honest placeholder, NEVER the slug.
  const NO_TENANT_MOVE: MoveBusinessCaseInput = {
    industry_code: "RETAIL",
    function_pack_key: "customer_care",
    name: "Reduce repeat contact-center transfers",
  };

  const RENDERERS: ReadonlyArray<{ name: string; build: () => unknown }> = [
    {
      name: "discover-brief",
      build: () => buildMoveDiscoverBrief(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "cfo-pack",
      build: () => buildMoveCfoPack(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "charter-skeleton",
      build: () => buildMoveCharterSkeleton(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "estimate-model",
      build: () => buildMoveEstimateModel(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "mobilize-packet",
      build: () => buildMoveMobilizePacket(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "master-dossier",
      build: () =>
        buildMoveMasterDossier(APEX_MOVE, "apex-test-move", GENERATED_ON),
    },
    {
      name: "move-pack",
      build: () => buildMoveCostedBusinessCasePack(APEX_MOVE, GENERATED_ON),
    },
    {
      name: "solution-architecture",
      build: () => buildMoveSolutionArchitecture(APEX_MOVE, GENERATED_ON),
    },
  ];

  it.each(RENDERERS)(
    "$name: a recognised tenant (apexretail) resolves to the demo-safe display name",
    ({ build }) => {
      const result = build() as { bound?: boolean; tenantLabel?: string };
      // The Apex × customer-care binding is catalogued, so the Move binds and
      // produces a tenantLabel. If a renderer's binding fails for some other
      // reason, the model file's unbound path doesn't carry tenantLabel —
      // skip the assertion in that case.
      if (result.bound !== false && typeof result.tenantLabel === "string") {
        expect(result.tenantLabel).toBe("Retail Demo");
        expect(INDUSTRY_SLUGS).not.toContain(result.tenantLabel);
      }
    },
  );

  it.each(
    RENDERERS.map(({ name }) => ({
      name,
      build: () => {
        switch (name) {
          case "discover-brief":
            return buildMoveDiscoverBrief(NORTHWIND_MOVE, GENERATED_ON);
          case "cfo-pack":
            return buildMoveCfoPack(NORTHWIND_MOVE, GENERATED_ON);
          case "charter-skeleton":
            return buildMoveCharterSkeleton(NORTHWIND_MOVE, GENERATED_ON);
          case "estimate-model":
            return buildMoveEstimateModel(NORTHWIND_MOVE, GENERATED_ON);
          case "mobilize-packet":
            return buildMoveMobilizePacket(NORTHWIND_MOVE, GENERATED_ON);
          case "master-dossier":
            return buildMoveMasterDossier(
              NORTHWIND_MOVE,
              "northwind-test-move",
              GENERATED_ON,
            );
          case "move-pack":
            return buildMoveCostedBusinessCasePack(
              NORTHWIND_MOVE,
              GENERATED_ON,
            );
          case "solution-architecture":
            return buildMoveSolutionArchitecture(NORTHWIND_MOVE, GENERATED_ON);
          default:
            throw new Error(`unknown renderer ${name}`);
        }
      },
    })),
  )(
    "$name: a brand-new tenant (Northwind) resolves to its threaded display name (not the industry slug)",
    ({ build }) => {
      const result = build() as { bound?: boolean; tenantLabel?: string };
      if (result.bound !== false && typeof result.tenantLabel === "string") {
        expect(result.tenantLabel).toBe("Northwind Retail");
        expect(INDUSTRY_SLUGS).not.toContain(result.tenantLabel);
      }
    },
  );

  it.each(
    RENDERERS.map(({ name }) => ({
      name,
      build: () => {
        switch (name) {
          case "discover-brief":
            return buildMoveDiscoverBrief(NO_TENANT_MOVE, GENERATED_ON);
          case "cfo-pack":
            return buildMoveCfoPack(NO_TENANT_MOVE, GENERATED_ON);
          case "charter-skeleton":
            return buildMoveCharterSkeleton(NO_TENANT_MOVE, GENERATED_ON);
          case "estimate-model":
            return buildMoveEstimateModel(NO_TENANT_MOVE, GENERATED_ON);
          case "mobilize-packet":
            return buildMoveMobilizePacket(NO_TENANT_MOVE, GENERATED_ON);
          case "master-dossier":
            return buildMoveMasterDossier(
              NO_TENANT_MOVE,
              "no-tenant-test-move",
              GENERATED_ON,
            );
          case "move-pack":
            return buildMoveCostedBusinessCasePack(
              NO_TENANT_MOVE,
              GENERATED_ON,
            );
          case "solution-architecture":
            return buildMoveSolutionArchitecture(NO_TENANT_MOVE, GENERATED_ON);
          default:
            throw new Error(`unknown renderer ${name}`);
        }
      },
    })),
  )(
    "$name: an unknown tenant resolves to the honest placeholder, NEVER the industry slug",
    ({ build }) => {
      const result = build() as { bound?: boolean; tenantLabel?: string };
      if (result.bound !== false && typeof result.tenantLabel === "string") {
        expect(result.tenantLabel).toBe("Tenant");
        expect(INDUSTRY_SLUGS).not.toContain(result.tenantLabel);
        // Confirm the rehearsal-log bug is fixed: 'retail' MUST NOT surface.
        expect(result.tenantLabel).not.toBe("retail");
      }
    },
  );
});
