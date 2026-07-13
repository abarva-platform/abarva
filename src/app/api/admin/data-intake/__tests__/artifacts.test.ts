import { GET as getGuide } from "../guides/[guideId]/route";
import { GET as getTenantPacket } from "../tenant-packet/route";
import { GET as getTemplateDictionary } from "../templates/[templateId]/field-dictionary/route";
import { GET as getTemplateDownload } from "../templates/[templateId]/download/route";

describe("admin data-intake artifact routes", () => {
  it("returns a generated template csv", async () => {
    const response = await getTemplateDownload(new Request("https://test.local"), {
      params: Promise.resolve({ templateId: "applications-systems" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(
      "applications-systems.csv",
    );
    expect(await response.text()).toContain("Application name");
  });

  it("returns a generated field dictionary csv", async () => {
    const response = await getTemplateDictionary(
      new Request("https://test.local"),
      {
        params: Promise.resolve({ templateId: "applications-systems" }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(await response.text()).toContain("Field name,Requirement,Description");
  });

  it("returns a generated guide markdown", async () => {
    const response = await getGuide(new Request("https://test.local"), {
      params: Promise.resolve({ guideId: "new-tenant-onboarding" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(await response.text()).toContain("Uploaded evidence is not active tenant truth");
  });

  it("returns a generated tenant packet zip", async () => {
    const response = await getTenantPacket();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toContain(
      "abarva-tenant-packet.zip",
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
});
