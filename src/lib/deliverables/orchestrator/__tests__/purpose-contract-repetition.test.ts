/**
 * The writer is told each thing once, and where it is said once the renderer says it.
 *
 * Four fresh-writing outputs stalled between 72 and 74 against an 85 bar across more than twenty
 * regenerations, and the reviewer's most frequent finding on the charter was repetition: the same
 * status stem in every cell of a column. The writer was following its instructions. The contract
 * asked for a "Proposed completion evidence:" prefix in each action-register cell, while the
 * renderer already printed that phrase as the column header -- and the same contract also told the
 * writer to keep a meaning-changing qualification "next to that claim", which it applied per row.
 * Anti-repetition lost to the more specific per-claim rules every time.
 *
 * The prefix is only safe to drop because the header carries the proposal status. That coupling is
 * the second half of this suite: if the header ever stops saying "Proposed", the status is gone.
 */
import JSZip from "jszip";
import { Packer } from "docx";

import { purposeFixture } from "../__fixtures__/purpose-pages";
import { purposePhasePrompt } from "../purpose-story-contract";
import { renderDeliverableDocx } from "../renderers";

describe("the writer is not told to repeat a status the header carries", () => {
  const charter = purposePhasePrompt("charter");

  it("does not ask for a status prefix inside each action-register cell", () => {
    expect(charter).not.toContain("'Proposed completion evidence:");
    expect(charter).toMatch(/do not repeat 'Proposed'/);
  });

  it("states the completion test as the test itself", () => {
    expect(charter).toContain("written as the test itself");
  });
});

describe("a qualification shared by every row is said once", () => {
  it.each(["charter", "discovery_readout"])("is in the %s contract", (type) => {
    const prompt = purposePhasePrompt(type);
    expect(prompt).toContain(
      "When the same qualification applies to every row of a table, state it once",
    );
  });

  it("keeps the per-claim rule for a qualification that applies to one claim", () => {
    // The fix narrows the rule; it does not remove it. A caveat that changes one claim's meaning
    // still sits beside that claim.
    expect(purposePhasePrompt("charter")).toContain(
      "Qualifications that change a claim's meaning stay visible next to that claim",
    );
  });
});

describe("the proposal status survives without the cell prefix", () => {
  it("is carried by the action-register column header", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.exhibits = [];
    doc.tables = [];
    doc.recommendation = "Review the evidence before the next decision.";
    // Written as the new contract asks: the completion test alone, no status prefix.
    doc.actionRegister = [
      {
        owner: "Finance lead",
        action: "Reconcile the baseline",
        evidence: "Reviewed baseline signed by the finance lead",
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");

    // The cell no longer says it; the header must, or the entry reads as a record that exists.
    expect(xml).toContain("Reviewed baseline signed by the finance lead");
    expect(xml).toContain("Proposed completion evidence");
    expect(xml).not.toContain("Proposed completion evidence: Reviewed");
  });
});
