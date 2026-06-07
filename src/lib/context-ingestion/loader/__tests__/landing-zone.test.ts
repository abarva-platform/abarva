import { scanLandingZone, landingPrefix } from "../landing-zone";
import type { LandingZoneLister, LandingZoneObject } from "../landing-zone";

describe("landing-zone scan", () => {
  it("builds a tenant-scoped prefix", () => {
    expect(landingPrefix("apex-retail")).toBe("landing/apex-retail/");
  });

  it("lists objects under the tenant prefix and strips the uuid filename prefix", async () => {
    const lister: LandingZoneLister = {
      async list(_container, prefix) {
        const all: LandingZoneObject[] = [
          {
            objectKey: `${prefix}inbox/123e4567-e89b-12d3-a456-426614174000-org-chart.csv`,
            filename: "123e4567-e89b-12d3-a456-426614174000-org-chart.csv",
            bytes: 2048,
            contentType: "text/csv",
            lastModified: "2026-06-07T00:00:00.000Z",
          },
        ];
        return all;
      },
    };
    const out = await scanLandingZone({ tenantKey: "apex-retail", lister });
    expect(out.container).toBe("context-landing");
    expect(out.prefix).toBe("landing/apex-retail/");
    expect(out.objects).toHaveLength(1);
    expect(out.objects[0]!.bytes).toBe(2048);
  });

  it("defensively drops objects outside the tenant prefix", async () => {
    const lister: LandingZoneLister = {
      async list() {
        return [
          { objectKey: "landing/apex-retail/inbox/a.csv", filename: "a.csv", bytes: 1 },
          { objectKey: "landing/meridian-health/inbox/b.csv", filename: "b.csv", bytes: 1 },
        ];
      },
    };
    const out = await scanLandingZone({ tenantKey: "apex-retail", lister });
    expect(out.objects.map((o) => o.objectKey)).toEqual(["landing/apex-retail/inbox/a.csv"]);
  });
});
