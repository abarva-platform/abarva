import { selectSourcingWorkItemsReadAdapter } from "../sourcingWorkItemsReadAdapter";

describe("selectSourcingWorkItemsReadAdapter", () => {
  const original = process.env.ABARVA_DATA_PLANE;

  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it("keeps the legacy Supabase default when no tenant is supplied", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourcingWorkItemsReadAdapter().name).toBe("supabase");
  });

  it("routes governed foundation tenants to Azure when the env is unset", () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(
      selectSourcingWorkItemsReadAdapter(undefined, "airline-demo-new").name,
    ).toBe("azure-postgres");
  });

  it("fails closed when a governed foundation tenant is forced to Supabase", () => {
    expect(() =>
      selectSourcingWorkItemsReadAdapter("supabase", "airline-demo-new"),
    ).toThrow(/airline-demo-new.*Azure PostgreSQL/i);
  });
});
