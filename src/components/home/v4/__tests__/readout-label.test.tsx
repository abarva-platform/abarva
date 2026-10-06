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

describe("the chapter opens from where its weight is", () => {
  /** The readout for a chapter of the loaded record, as a reader meets it. */
  function openerFor(
    chapterId: string,
    tenant: "meridian-health" | "skyharbor-air",
  ) {
    const loaded = getHomeReviewBundle(tenant)!;
    const chapter = loaded.chapters.find((c) => c.chapterId === chapterId)!;
    render(
      <ChapterPage
        chapter={chapter}
        chapterNumber={7}
        signalPacket={loaded.thesis.signalPacket}
        visualDatasets={
          (
            loaded.thesis.publishedGeneration as unknown as {
              visualDatasets?: Record<string, Array<Record<string, unknown>>>;
            } | null
          )?.visualDatasets ?? {}
        }
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

  it.each(["meridian-health", "skyharbor-air"] as const)(
    "opens the leadership chapter on leadership, not on a stray remark (%s)",
    (tenant) => {
      // The defect: four counted findings about what leaders said were skipped, because being well
      // enough evidenced to count as FACT put them in the record band -- and the readout reached
      // past that band for any interpretation it could find. On one tenant it landed on the
      // programme portfolio, which is not this chapter's subject at all.
      const { heading, body } = openerFor("leadership_perspective", tenant);
      expect(heading).toBe("What the record shows");
      expect(body).toMatch(/interviewed leaders/i);
      expect(body).not.toMatch(/program portfolio|expected-value-to-budget/i);
    },
  );

  it("still opens on interpretation where interpretation is the weight", () => {
    // Strategy carries five interpretations against one counted claim; it should read as an
    // argument, not as an inventory. The rule is a comparison, not a preference for facts.
    const { heading } = openerFor("strategy_value_creation", "meridian-health");
    expect(heading).toBe("What follows from it");
  });

  it("gives a tie to the record", () => {
    // A page whose whole claim is that it asserts no more than its evidence should open with the
    // evidence when the two are level.
    const { heading } = openerFor("leadership_perspective", "skyharbor-air");
    expect(heading).toBe("What the record shows");
  });
});
