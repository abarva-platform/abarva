import JSZip from "jszip";
import { renderValidatedDeck } from "../render-validated-deck";
import { goodDocument } from "../__fixtures__/ams-rfp";
import { buildGroundedArchitectureFallback } from "@/lib/visual-system/architecture-fallback";
import { ARCHITECTURE_V2_EXHIBITS } from "@/lib/visual-system/architecture-model";
import { renderArchitectureVisualExhibits } from "@/lib/visual-system/architecture-html-renderer";
import { composeArchitectureDeckPages } from "../architecture-deck-composition";
import { judgeArchitectureDeck } from "../architecture-deck-quality";

describe("architecture Office export", () => {
  it("carries the governed diagrams into a bounded board storyline, not 13 bare slides", async () => {
    const model = buildGroundedArchitectureFallback({
      engagement: "Synthetic architecture review",
      client: "Demo organization",
      contextText:
        "A governed intake and certified serving layer are proposed.",
    });
    const doc = {
      ...goodDocument(),
      title: "Target State Architecture",
      clientDisplayName: "Demo organization",
      exhibits: [],
      tables: [],
      deckSlides: [],
    };
    const rendered = await renderValidatedDeck(doc, {}, model);

    // Physical proof: the new headline 2-up, divider, and takeaway-band layouts
    // are all on-canvas (renderValidatedDeck throws / flags otherwise).
    expect(rendered.physicallyIntact).toBe(true);

    // The architecture section is the composed storyline, not a flat run.
    const archPages = composeArchitectureDeckPages(
      renderArchitectureVisualExhibits(model),
    );
    // All 13 governed visuals, plus a section divider and a reference divider.
    expect(archPages.length).toBe(ARCHITECTURE_V2_EXHIBITS.length + 2);
    expect(archPages.filter((p) => p.kind === "divider")).toHaveLength(2);
    expect(archPages.filter((p) => p.kind === "headline")).toHaveLength(5);

    const zip = await JSZip.loadAsync(rendered.buffer);
    const slides = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name),
    );
    const images = Object.keys(zip.files).filter((name) =>
      /^ppt\/media\/.*\.png$/i.test(name),
    );

    // title + story (one page per section here) + architecture storyline + closing.
    expect(slides).toHaveLength(
      doc.generatedSections.length + archPages.length + 2,
    );
    // Every governed visual is rendered exactly once — none dropped, none doubled.
    expect(images).toHaveLength(ARCHITECTURE_V2_EXHIBITS.length);
    const architectureVerdict = await judgeArchitectureDeck(
      rendered.buffer,
      model,
    );
    expect(architectureVerdict.findings).toEqual([]);
    expect(architectureVerdict.embeddedKeys.slice().sort()).toEqual(
      ARCHITECTURE_V2_EXHIBITS.slice().sort(),
    );
    const withoutDecision = {
      ...model,
      exhibitPlan: model.exhibitPlan?.map((entry) =>
        entry.id === ARCHITECTURE_V2_EXHIBITS[0]
          ? { ...entry, decisionImplication: "" }
          : entry,
      ),
    };
    expect(
      (await judgeArchitectureDeck(rendered.buffer, withoutDecision)).findings,
    ).toContain(
      `architecture_exhibit_missing_interpretation:${ARCHITECTURE_V2_EXHIBITS[0]}`,
    );

    const slideXml = await Promise.all(
      slides.map((name) => zip.file(name)!.async("string")),
    );
    const allXml = slideXml.join("\n");
    // The new section structure is present.
    expect(allXml).toContain("ARCHITECTURE");
    expect(allXml).toContain("ARCHITECTURE — REFERENCE");
    // The governed diagrams still carry their titles.
    expect(
      slideXml.some((xml) => xml.includes("conceptual architecture")),
    ).toBe(true);
    expect(slideXml.some((xml) => xml.includes("End-to-end data flow"))).toBe(
      true,
    );
  });

  it("rejects a missing exported identity even when the image count stays the same", async () => {
    const model = buildGroundedArchitectureFallback({
      engagement: "Synthetic architecture review",
      client: "Demo organization",
      contextText: "A governed serving layer is proposed.",
    });
    const doc = {
      ...goodDocument(),
      exhibits: [],
      tables: [],
      deckSlides: [],
    };
    const rendered = await renderValidatedDeck(doc, {}, model);
    const zip = await JSZip.loadAsync(rendered.buffer);
    const slideWithExhibit = (
      await Promise.all(
        Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .map(
            async (name) =>
              [name, await zip.file(name)!.async("string")] as const,
          ),
      )
    ).find(([, xml]) => xml.includes("architecture-exhibit:"));
    expect(slideWithExhibit).toBeDefined();
    const [name, xml] = slideWithExhibit!;
    zip.file(
      name,
      xml.replace("architecture-exhibit:", "unidentified-exhibit:"),
    );
    const verdict = await judgeArchitectureDeck(
      await zip.generateAsync({ type: "nodebuffer" }),
      model,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.findings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^architecture_exhibit_export_count:/),
      ]),
    );
  });
});
