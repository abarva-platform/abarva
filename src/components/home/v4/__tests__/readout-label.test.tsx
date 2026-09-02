/** @jest-environment jsdom */
/**
 * The readout's heading has to describe what is underneath it.
 *
 * It read "Decision this page supports" over `primaryInference ?? primaryRecord`, so a chapter with
 * no inference put a plain statement of record under a heading promising a decision. On a live
 * walkthrough most chapters were in that state: the heading said decision, the body was an excerpt.
 *
 * A reader takes the heading as the claim about what they are reading. Getting that wrong is not a
 * copy problem — it is the page asserting it has advice when it has a fact.
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import type { ChapterView } from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { ChapterPage } from "../ChapterPage";

const bundle = getHomeReviewBundle("meridian-health")!;
const signalPacket = bundle.thesis.signalPacket;

/** A chapter carrying only the statements named, so the readout's choice is the thing under test. */
function chapterWith(parts: Partial<ChapterView>): ChapterView {
  const base = bundle.chapters.find((c) => c.chapterId === "our_business")!;
  return {
    ...base,
    key_insights: [],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    limitations: [],
    ...parts,
  } as ChapterView;
}

function headingAndBody(chapter: ChapterView) {
  render(
    <ChapterPage
      chapter={chapter}
      chapterNumber={2}
      signalPacket={signalPacket}
      visualDatasets={{}}
      depth={{ tables: [], findings: [], unsupported: [] }}
      onOpenRows={() => {}}
    />,
  );
  const readout = document.querySelector("[data-chapter-readout]");
  return {
    heading: readout?.querySelector("h2")?.textContent ?? "",
    body: readout?.querySelector("p")?.textContent ?? "",
  };
}

describe("the readout heading follows the sentence under it", () => {
  it("never promises a decision, because nothing in the record declares one", () => {
    // Writing the decision each chapter supports is authored advice about a client's situation.
    // A heading that asserts it exists, over content that is an excerpt or an interpretation, is
    // the page claiming judgement it does not have.
    for (const chapter of bundle.chapters) {
      const { heading } = headingAndBody(chapter);
      expect(heading).not.toMatch(/decision this page supports/i);
    }
  });

  it("names the interpretation band when the sentence is an interpretation", () => {
    const { heading, body } = headingAndBody(
      chapterWith({
        // No claim_type of FACT or OBSERVATION, so the splitter reads it as interpretation.
        key_insights: [
          { statement: "A plain interpretation.", evidence_ids: [] },
        ] as unknown as ChapterView["key_insights"],
      }),
    );
    expect(heading).toBe("What follows from it");
    expect(body).toContain("A plain interpretation.");
  });

  it("names the record band when the sentence is a counted fact", () => {
    // The defect: this case rendered a counted fact under a heading promising a decision.
    const { heading, body } = headingAndBody(
      chapterWith({
        key_insights: [
          {
            statement: "Revenue is split sixty forty.",
            evidence_ids: [],
            claim_type: "FACT",
          },
        ] as unknown as ChapterView["key_insights"],
      }),
    );
    expect(heading).toBe("What the record shows");
    expect(body).toContain("sixty forty");
  });

  it("names the heading after the band the sentence came from", () => {
    // A reader who scrolls down finds the band with the same title, so the readout is an opening of
    // the page rather than a separate voice on top of it.
    const { heading } = headingAndBody(
      chapterWith({
        key_insights: [
          {
            statement: "Revenue is split sixty forty.",
            evidence_ids: [],
            claim_type: "FACT",
          },
        ] as unknown as ChapterView["key_insights"],
      }),
    );
    expect(document.body.textContent).toContain(heading);
  });

  it("says nothing is decided when the chapter carries neither", () => {
    const { heading, body } = headingAndBody(chapterWith({}));
    expect(heading).toBe("Nothing established here yet");
    expect(body).toContain("No executive decision should be taken");
  });
});
