import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_PURPOSE_HEADLINE_TAILS,
  isGeneratedPurposeHeadline,
} from "@/lib/source/contract-purpose-refusal";

/**
 * A generated purpose fallback reached the contract page heading.
 *
 * When `purpose_summary_json` is empty the migrations build the story headline
 * as `<vendor>: contract purpose …`. The header accepted a headline under 60
 * characters that did not match a blocklist of phrasings — and migration
 * `20260911150000` reworded the tail to "requires reviewed context", which no
 * listed phrase matches. At 58 characters for a short vendor name it passed
 * both conditions, so a sentence about the ABSENCE of a reviewed purpose was
 * rendered as the contract's headline.
 */

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const header = read(
  "src/app/(maestro)/source/preview/workspace/Contract360Surfaces.tsx",
);

const migration = (file: string) =>
  read(`supabase/migrations/${file}`).replace(/\s+/g, " ");

describe("a generated purpose fallback never becomes the contract headline", () => {
  // The fixture is the string the database actually emits, not a paraphrase of
  // it. A guard tested against invented text is what failed here.
  it.each(GENERATED_PURPOSE_HEADLINE_TAILS)(
    "refuses the emitted fallback %s",
    (tail) => {
      expect(isGeneratedPurposeHeadline(`Kyndryl, Inc.: ${tail}`, "Kyndryl, Inc.")).toBe(true);
    },
  );

  // The defect was length-dependent: the same sentence was blocked for a long
  // vendor name and rendered for a short one, so it appeared on some contracts
  // and not others.
  it("refuses it for a vendor name short enough to pass the length gate", () => {
    const headline = "IMS Health: contract purpose requires reviewed context.";
    expect(headline.length).toBeLessThanOrEqual(60);
    expect(isGeneratedPurposeHeadline(headline, "IMS Health")).toBe(true);
  });

  it("refuses it when the stored vendor name is absent or differs", () => {
    const headline = "IMS Health: contract purpose requires reviewed context.";
    expect(isGeneratedPurposeHeadline(headline, null)).toBe(true);
    expect(isGeneratedPurposeHeadline(headline, "Some Other Entity")).toBe(true);
  });

  // Keys on the generator's shape, so rewording the tail again cannot defeat
  // it the way rewording defeated the phrasing blocklist.
  it("still refuses a tail nobody has written yet", () => {
    expect(
      isGeneratedPurposeHeadline(
        "Kyndryl, Inc.: contract purpose awaits a reviewed characterisation.",
        "Kyndryl, Inc.",
      ),
    ).toBe(true);
  });

  // Each branch is pinned with the other NOT satisfying it, or a mutation that
  // removes one passes on the strength of the other. A control keyed on the
  // exact tails survived until this case existed: the vendor branch was
  // answering every novel-tail case, so nothing measured the shape match.
  it("refuses a reworded tail even when the vendor name does not match", () => {
    expect(
      isGeneratedPurposeHeadline(
        "Kyndryl, Inc.: contract purpose awaits a reviewed characterisation.",
        "Some Other Entity",
      ),
    ).toBe(true);
    expect(
      isGeneratedPurposeHeadline(
        "Kyndryl, Inc.: contract purpose awaits a reviewed characterisation.",
        null,
      ),
    ).toBe(true);
  });

  it("keeps reviewed prose about the contract", () => {
    for (const headline of [
      "Kyndryl, Inc. runs application managed services for the legacy estate.",
      "Renewal lands inside the notice window with no benchmark on file.",
      "Databricks, Inc.: platform consumption is committed three years ahead.",
    ]) {
      expect(isGeneratedPurposeHeadline(headline, "Kyndryl, Inc.")).toBe(false);
    }
  });

  it("treats a blank headline as nothing to refuse, not as a fallback", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(isGeneratedPurposeHeadline(value, "Kyndryl, Inc.")).toBe(false);
    }
  });

  it("is applied by the contract header, not merely exported", () => {
    expect(header).toContain("isGeneratedPurposeHeadline(story.headline");
    // Control: the slice really is the header's own gate, so the assertion
    // above cannot be passing against an unrelated mention.
    expect(header).toContain("story.headline.length <= 60");
    // The pre-existing phrasing check is kept, not replaced.
    expect(header).toContain("not (?:yet )?reviewed");
  });

  it("names the tails the migrations emit, and both are still emitted", () => {
    expect(migration("20260911150000_source_contract_intelligence_record.sql")).toContain(
      "contract purpose requires reviewed context.",
    );
    expect(migration("20260910203000_source_contract_tab_intelligence.sql")).toContain(
      "contract purpose is not yet reviewed.",
    );
    // Both phrasings exist in the schema, which is why the control cannot key
    // on either one alone.
    expect(GENERATED_PURPOSE_HEADLINE_TAILS).toHaveLength(2);
  });
});
