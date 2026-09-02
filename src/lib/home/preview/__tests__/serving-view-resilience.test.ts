/**
 * One absent serving view must cost its own family and nothing else.
 *
 * The reader used to name every view in a single UNION under `missingTable: "empty"`. Postgres
 * fails the whole statement when any one relation in a union is missing, and that option turned the
 * failure into an empty result — so a single absent view returned zero rows out of thousands and
 * the page fell back to the reviewed snapshot with nothing to say why.
 *
 * It happened: two views were added to the reader in the same change as the migrations that create
 * them, the application deployed before the migrations were applied, and 3,375 valid rows read as
 * none. Reader and view have a deployment order just as reader and rows do, and only one of the two
 * was being observed.
 */
import fs from "node:fs";

import "@/components/home/v4/test-support/text-encoder-polyfill";

const query = jest.fn();
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: (...args: unknown[]) => query(...args) },
}));

import { getHomeEclProjectionBundle } from "../ecl-projection-bundle";

/** Every view except the ones named, as the catalogue would report them. */
function catalogueWithout(absent: string[]) {
  const source = fs.readFileSync(
    "src/lib/home/preview/ecl-projection-bundle.ts",
    "utf8",
  );
  const block = source.slice(
    source.indexOf("const HOME_SERVING_VIEWS"),
    source.indexOf("] as const;"),
  );
  return [...block.matchAll(/"(serving\.home_[a-z_]+)"/g)]
    .map((m) => m[1])
    .filter((view) => !absent.includes(view))
    .map((full_name) => ({ full_name }));
}

const ROW = {
  page_key: "applications_systems",
  row_key: "app-1",
  row_type: "application",
  title: "Claims Platform",
  summary: null,
  display_payload_json: { application_name: "Claims Platform" },
};

beforeEach(() => query.mockReset());

describe("a serving view this database does not have", () => {
  it("does not collapse the rows the other views do return", async () => {
    query
      .mockResolvedValueOnce(catalogueWithout(["serving.home_relationships"]))
      .mockResolvedValueOnce([ROW]);
    const bundle = await getHomeEclProjectionBundle("meridian-health");
    expect(bundle.provenance.canonical_snapshot_hash).toContain(
      "serving.home_*:1",
    );
  });

  it("is left out of the union rather than named and failed on", async () => {
    query
      .mockResolvedValueOnce(catalogueWithout(["serving.home_relationships"]))
      .mockResolvedValueOnce([ROW]);
    await getHomeEclProjectionBundle("meridian-health");
    const sql = String(query.mock.calls[1][0]);
    expect(sql).not.toContain("serving.home_relationships");
    expect(sql).toContain("serving.home_applications_systems");
  });

  it("names the absent view when there is nothing at all to render", async () => {
    // The old message said only "no serving Home rows", which sent everyone to look at the data
    // when the answer was that a relation had never been created.
    query
      .mockResolvedValueOnce(
        catalogueWithout([
          "serving.home_relationships",
          "serving.home_executive_interviews",
        ]),
      )
      .mockResolvedValueOnce([]);
    await expect(getHomeEclProjectionBundle("meridian-health")).rejects.toThrow(
      /No serving view for: .*relationships/,
    );
  });

  it("still reads everything when the database has every view", async () => {
    query
      .mockResolvedValueOnce(catalogueWithout([]))
      .mockResolvedValueOnce([ROW]);
    const bundle = await getHomeEclProjectionBundle("meridian-health");
    expect(bundle).toBeTruthy();
    const sql = String(query.mock.calls[1][0]);
    expect(sql).toContain("serving.home_relationships");
    expect(sql).toContain("serving.home_executive_interviews");
  });

  it("asks the catalogue before it asks for rows", async () => {
    // The order matters: the union cannot be built until the answer is known, and building it from
    // a hardcoded list is the thing that broke.
    query
      .mockResolvedValueOnce(catalogueWithout([]))
      .mockResolvedValueOnce([ROW]);
    await getHomeEclProjectionBundle("meridian-health");
    expect(String(query.mock.calls[0][0])).toContain(
      "information_schema.views",
    );
  });
});
