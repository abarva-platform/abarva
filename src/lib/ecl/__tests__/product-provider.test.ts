import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";

const ORIGINAL_DEFAULT = process.env.ECL_PRODUCT_DEFAULT_PROVIDER;
const ORIGINAL_LEGACY_OVERRIDE =
  process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE;

afterEach(() => {
  process.env.ECL_PRODUCT_DEFAULT_PROVIDER = ORIGINAL_DEFAULT;
  process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE =
    ORIGINAL_LEGACY_OVERRIDE;
});

describe("ECL product provider resolver", () => {
  it("defaults product routes to the governed ECL serving provider", () => {
    delete process.env.ECL_PRODUCT_DEFAULT_PROVIDER;

    expect(resolveEclProductProvider()).toBe("ecl_projection_db");
    expect(isEclProductProvider(resolveEclProductProvider())).toBe(true);
  });

  it("keeps the explicit ECL proof query compatible", () => {
    process.env.ECL_PRODUCT_DEFAULT_PROVIDER = "legacy";

    expect(resolveEclProductProvider("ecl_projection_db")).toBe(
      "ecl_projection_db",
    );
  });

  it("allows legacy only through the named diagnostic override", () => {
    delete process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE;

    expect(resolveEclProductProvider("legacy")).toBe("ecl_projection_db");

    process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE = "true";

    expect(resolveEclProductProvider("legacy")).toBe("legacy");
  });

  it("supports an environment rollback to the legacy provider", () => {
    process.env.ECL_PRODUCT_DEFAULT_PROVIDER = "legacy";

    expect(resolveEclProductProvider()).toBe("legacy");
  });
});
