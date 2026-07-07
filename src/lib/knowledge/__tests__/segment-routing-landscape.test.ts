import {
  selectTenantEnterpriseSegments,
  isTenantEnterpriseQuestion,
} from "@/lib/knowledge/tenant-enterprise-context";

describe("enterprise-question gate recognizes data + infrastructure vocabulary", () => {
  it("treats a data/analytics question as a tenant enterprise question", () => {
    expect(
      isTenantEnterpriseQuestion(
        "What is our data and analytics stack — data warehouse, BI tools, reporting?",
      ),
    ).toBe(true);
  });
  it("treats an infrastructure question as a tenant enterprise question", () => {
    expect(
      isTenantEnterpriseQuestion(
        "What is our infrastructure estate — datacenters, virtualization, storage, network, and cloud accounts?",
      ),
    ).toBe(true);
  });
});

describe("landscape segment routing (data_estate + infrastructure)", () => {
  it("routes data/analytics questions to data_estate", () => {
    const segs = selectTenantEnterpriseSegments(
      "What is our data and analytics stack — data warehouse, BI tools, reporting?",
    );
    expect(segs).toContain("data_estate");
  });

  it("routes ampersand data landscape wording to data_estate", () => {
    const segs = selectTenantEnterpriseSegments(
      "Talk about our current data & analytics landscape — name the platforms and owners you can see in our loaded context.",
    );
    expect(segs).toContain("data_estate");
  });

  it("routes infrastructure questions to infrastructure", () => {
    const segs = selectTenantEnterpriseSegments(
      "What is our infrastructure estate — datacenters, virtualization, storage, network, and cloud accounts?",
    );
    expect(segs).toContain("infrastructure");
  });

  it("still routes app/vendor questions to it_landscape (no regression)", () => {
    const segs = selectTenantEnterpriseSegments(
      "What ERP and core applications run across our operating companies?",
    );
    expect(segs).toContain("it_landscape");
  });

  it("routes a warehouse-only phrasing to data_estate", () => {
    expect(
      selectTenantEnterpriseSegments("Which Snowflake warehouses feed our dashboards?"),
    ).toContain("data_estate");
  });

  it("routes a vmware/storage phrasing to infrastructure", () => {
    expect(
      selectTenantEnterpriseSegments("How many VMware hosts and what storage arrays do we run?"),
    ).toContain("infrastructure");
  });
});
