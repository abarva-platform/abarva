import {
  ProgramPatternAuthorityError,
  resolvePromotedProgramPatternKey,
} from "../pattern-authority";

describe("Programs pattern authority", () => {
  it.each(["published", "validated", "active"] as const)(
    "accepts a key promoted as %s",
    async (promotionState) => {
      await expect(
        resolvePromotedProgramPatternKey(" PAT-VALID-001 ", async () => ({
          topic_key: "PAT-VALID-001",
          promotion_state: promotionState,
        })),
      ).resolves.toBe("PAT-VALID-001");
    },
  );

  it("allows an omitted optional key without a catalog lookup", async () => {
    const lookup = jest.fn();

    await expect(resolvePromotedProgramPatternKey(null, lookup)).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects an unknown key", async () => {
    await expect(
      resolvePromotedProgramPatternKey("PAT-INVENTED-001", async () => null),
    ).rejects.toMatchObject({
      code: "program_pattern_not_promoted",
    } satisfies Partial<ProgramPatternAuthorityError>);
  });

  it("rejects a catalog row that is not promoted", async () => {
    await expect(
      resolvePromotedProgramPatternKey("PAT-DRAFT-001", async () => ({
        topic_key: "PAT-DRAFT-001",
        promotion_state: "draft",
      })),
    ).rejects.toMatchObject({
      code: "program_pattern_not_promoted",
    } satisfies Partial<ProgramPatternAuthorityError>);
  });
});
