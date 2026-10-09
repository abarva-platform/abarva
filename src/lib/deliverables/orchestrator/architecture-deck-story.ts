import type { RenderableDeckSlide } from "./types";

function completeNotes(slide: RenderableDeckSlide): string {
  if (slide.speakerNotes?.startsWith("Architecture source statements:")) {
    return slide.speakerNotes;
  }
  return [
    "Architecture source statements:",
    slide.title,
    slide.governingMessage,
    ...(slide.points ?? []),
    slide.speakerNotes,
    slide.citationsUsed?.length
      ? `Citations: [${slide.citationsUsed.join(", ")}]`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Merge adjacent authored beats without losing evidence or visual identity.
 * Complete source text moves to notes and stays in the Word companion. */
export function compactArchitectureDeckSlides(
  slides: readonly RenderableDeckSlide[],
  maxPages: number,
): RenderableDeckSlide[] {
  const compact = slides.map((slide) => ({ ...slide }));
  while (compact.length > maxPages && maxPages > 0) {
    let index = -1;
    let smallestPair = Number.POSITIVE_INFINITY;
    for (let i = 0; i < compact.length - 1; i += 1) {
      const left = compact[i];
      const right = compact[i + 1];
      if (left.exhibitKey && right.exhibitKey) continue;
      const size = completeNotes(left).length + completeNotes(right).length;
      if (size < smallestPair) {
        smallestPair = size;
        index = i;
      }
    }
    if (index < 0) break;
    const left = compact[index];
    const right = compact[index + 1];
    compact.splice(index, 2, {
      ...left,
      points: [...(left.points ?? []), ...(right.points ?? [])].slice(0, 3),
      exhibitKey: left.exhibitKey ?? right.exhibitKey,
      speakerNotes: `${completeNotes(left)}\n\n${completeNotes(right)}`,
      citationsUsed: [
        ...new Set([
          ...(left.citationsUsed ?? []),
          ...(right.citationsUsed ?? []),
        ]),
      ],
    });
  }
  return compact;
}
