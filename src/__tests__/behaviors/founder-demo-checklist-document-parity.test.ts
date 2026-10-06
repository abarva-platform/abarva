import { readFileSync } from "node:fs";
import path from "node:path";

import { buildFounderDemoRouteChecklist } from "@/lib/qa/founder-demo-route-checklist";

const CHECKLIST_DOCUMENT = "docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md";

type DocumentRoute = {
  readonly route: string;
  readonly expectedComponent: string;
  readonly section: string;
};

/**
 * Parse the human-read checklist at test time. Nothing here is copied from the
 * document or from the code inventory: both sides are read on every run, so an
 * edit to either one is what this gate sees rather than a stored duplicate of
 * what they once said (item C-536).
 */
function parseChecklistDocument(markdown: string): DocumentRoute[] {
  const sections = markdown.split(/^## /m).slice(1);
  const parsed: DocumentRoute[] = [];

  for (const section of sections) {
    const heading = section.split("\n", 1)[0]?.trim() ?? "";
    const route = section.match(
      /^\|\s*\*\*Route\*\*\s*\|\s*`([^`]+)`\s*\|\s*$/m,
    )?.[1];
    const expectedComponent = section.match(
      /^\|\s*\*\*Expected Component\*\*\s*\|\s*`([^`]+)`\s*\|\s*$/m,
    )?.[1];

    if (!route && !expectedComponent) {
      continue;
    }

    if (!route || !expectedComponent) {
      throw new Error(
        `${CHECKLIST_DOCUMENT} section "${heading}" names a route or an expected component but not both ` +
          `(route=${String(route)}, expectedComponent=${String(expectedComponent)}). ` +
          "A half-parsed section would drop that route out of this gate silently.",
      );
    }

    parsed.push({ route, expectedComponent, section: heading });
  }

  return parsed;
}

function readDocumentRoutes(): DocumentRoute[] {
  return parseChecklistDocument(
    readFileSync(path.join(process.cwd(), CHECKLIST_DOCUMENT), "utf8"),
  );
}

describe("founder demo route checklist — document and code parity", () => {
  it("reads route rows out of the document rather than trusting a copied constant", () => {
    // A parser that quietly matched nothing would make the comparison below
    // vacuously true, so the population it found is asserted on its own first.
    const documentRoutes = readDocumentRoutes();
    const codeRoutes = buildFounderDemoRouteChecklist().routes;

    expect(documentRoutes.length).toBeGreaterThan(0);
    expect(codeRoutes.length).toBeGreaterThan(0);

    const shared = documentRoutes.filter((documentRoute) =>
      codeRoutes.some((codeRoute) => codeRoute.route === documentRoute.route),
    );
    expect(shared.length).toBeGreaterThan(0);
  });

  it("names the same expected component per route in both artifacts", () => {
    const documentRoutes = readDocumentRoutes();
    const codeRoutes = buildFounderDemoRouteChecklist().routes;

    const disagreements = documentRoutes
      .map((documentRoute) => {
        const codeRoute = codeRoutes.find(
          (candidate) => candidate.route === documentRoute.route,
        );
        if (!codeRoute) {
          return null;
        }
        return codeRoute.expectedComponent === documentRoute.expectedComponent
          ? null
          : {
              route: documentRoute.route,
              document: documentRoute.expectedComponent,
              code: codeRoute.expectedComponent,
            };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    expect(disagreements).toEqual([]);
  });
});
