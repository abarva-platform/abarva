import { buildVendorResponseMveProfiles } from "../proposal-intelligence";
import { SOURCE_GOLDEN_EVENT_IDS } from "../constants";
import { buildSourceVendorResponseCompleteness } from "../vendor-response-completeness";
import {
  deriveVendorResponseSeedInputsFromProfiles,
  resolveVendorResponseSeedInputs,
} from "../vendor-response-completeness-from-profiles";

const NON_SEEDED_EVENT = {
  id: "65ee81ba-7bbc-4673-b0dd-13c08c5ca9ba",
  code: "SKYH-APPLICATION-MANAGED-SERVICES-2026-81A644CC",
  name: "Application managed services",
  accountName: "SkyHarbor Air",
};

describe("vendor response completeness from profiles", () => {
  it("leaves seeded events on their seed", () => {
    const profiles = buildVendorResponseMveProfiles({
      id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
      code: "digital-app-build",
      name: "Digital app build partner selection",
      accountName: "Demo account",
    });

    expect(
      resolveVendorResponseSeedInputs(
        SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        profiles,
      ),
    ).toBeUndefined();
  });

  it("derives vendors for an event that has parsed profiles but no seed", () => {
    const profiles = buildVendorResponseMveProfiles(NON_SEEDED_EVENT);
    expect(profiles?.profiles.length ?? 0).toBeGreaterThan(0);

    const derived = resolveVendorResponseSeedInputs(
      NON_SEEDED_EVENT.id,
      profiles,
    );
    expect(derived).toBeDefined();
    expect(derived).toHaveLength(profiles?.profiles.length ?? 0);

    for (const record of derived ?? []) {
      expect(record.responseStatus).toBe("submitted");
      expect(record.requiredSections.length).toBeGreaterThan(0);
      // Submitted sections are a subset of required sections, never invented.
      for (const section of record.submittedSections) {
        expect(record.requiredSections).toContain(section);
      }
    }
  });

  it("produces a completeness read model that reports the parsed vendors", () => {
    const profiles = buildVendorResponseMveProfiles(NON_SEEDED_EVENT);

    const before = buildSourceVendorResponseCompleteness({
      event: {
        id: NON_SEEDED_EVENT.id,
        name: NON_SEEDED_EVENT.name,
        currentStageKey: "responses",
      },
    });
    expect(before.records).toHaveLength(0);

    const after = buildSourceVendorResponseCompleteness({
      event: {
        id: NON_SEEDED_EVENT.id,
        name: NON_SEEDED_EVENT.name,
        currentStageKey: "responses",
        vendorResponses: resolveVendorResponseSeedInputs(
          NON_SEEDED_EVENT.id,
          profiles,
        ),
      },
    });

    expect(after.records).toHaveLength(profiles?.profiles.length ?? 0);
    expect(after.summary.totalVendors).toBe(after.records.length);
    expect(after.records.map((record) => record.vendorName)).toEqual(
      profiles?.profiles.map((profile) => profile.vendorName),
    );
  });

  it("does not claim a section the parser could not find", () => {
    const profiles = buildVendorResponseMveProfiles(NON_SEEDED_EVENT);
    const derived = deriveVendorResponseSeedInputsFromProfiles(profiles);

    for (const record of derived) {
      const profile = profiles?.profiles.find(
        (item) => item.vendorId === record.vendorId,
      );
      const pricingExhibit = profile?.exhibits.find(
        (item) => item.kind === "pricing_workbook",
      );
      if (pricingExhibit?.status === "missing") {
        expect(record.submittedSections).not.toContain("Pricing template");
        expect(record.pricingTemplateStatus).toBe("missing");
      }
    }
  });

  it("returns no vendors when there are no profiles and no seed", () => {
    expect(
      resolveVendorResponseSeedInputs("event-with-nothing-at-all", null),
    ).toBeUndefined();
    expect(deriveVendorResponseSeedInputsFromProfiles(null)).toEqual([]);
  });
});
