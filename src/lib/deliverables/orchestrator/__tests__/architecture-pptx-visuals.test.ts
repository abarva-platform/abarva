import JSZip from "jszip";
import { renderValidatedDeck } from "../render-validated-deck";
import { goodDocument } from "../__fixtures__/ams-rfp";
import { buildGroundedArchitectureFallback } from "@/lib/visual-system/architecture-fallback";
import { ARCHITECTURE_V2_EXHIBITS } from "@/lib/visual-system/architecture-model";

describe("architecture Office export", () => {
  it("carries the governed preview diagrams into the final PPTX", async () => {
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
    expect(rendered.physicallyIntact).toBe(true);
    const firstVisualSlide = doc.generatedSections.length + 2;
    const lastVisualSlide =
      firstVisualSlide + ARCHITECTURE_V2_EXHIBITS.length - 1;
    expect(
      rendered.verdict.findings.filter(
        (finding) =>
          "slide" in finding &&
          finding.slide >= firstVisualSlide &&
          finding.slide <= lastVisualSlide,
      ),
    ).toEqual([]);
    const zip = await JSZip.loadAsync(rendered.buffer);
    const slides = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name),
    );
    const images = Object.keys(zip.files).filter((name) =>
      /^ppt\/media\/.*\.png$/i.test(name),
    );
    expect(slides).toHaveLength(
      doc.generatedSections.length + ARCHITECTURE_V2_EXHIBITS.length + 2,
    );
    expect(images).toHaveLength(ARCHITECTURE_V2_EXHIBITS.length);
    const slideXml = await Promise.all(
      slides.map((name) => zip.file(name)!.async("string")),
    );
    expect(
      slideXml.some((xml) => xml.includes("conceptual architecture")),
    ).toBe(true);
    expect(slideXml.some((xml) => xml.includes("End-to-end data flow"))).toBe(
      true,
    );
  });
});
