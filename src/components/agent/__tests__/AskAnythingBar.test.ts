import { shouldShowResponseTranscript } from "@/components/agent/AskAnythingBar";

describe("shouldShowResponseTranscript", () => {
  it("shows the streamed transcript until a governed answer exists", () => {
    expect(shouldShowResponseTranscript(false)).toBe(true);
  });

  it("replaces the transcript with the authoritative governed answer", () => {
    expect(shouldShowResponseTranscript(true)).toBe(false);
  });
});
