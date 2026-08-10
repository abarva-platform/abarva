import { readFile } from "node:fs/promises";
import path from "node:path";

const REVIEW_SVG_DIR = path.join(
  process.cwd(),
  "reports/home-claude-architecture-generation/generated-svg",
);

const REVIEW_DIAGRAM_FILES = new Map([
  [
    "patterns-enterprise-operating-system",
    "patterns-enterprise-operating-system.svg",
  ],
  ["economics-value-control", "economics-value-control.svg"],
  ["posture-evidence-authority", "posture-evidence-authority.svg"],
  ["coherence-domain-architecture-index", "coherence-domain-architecture-index.svg"],
  ["trajectory-executive-shifts", "trajectory-executive-shifts.svg"],
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ diagramId: string }> },
): Promise<Response> {
  const { diagramId } = await params;
  const filename = REVIEW_DIAGRAM_FILES.get(diagramId);

  if (!filename) {
    return Response.json(
      {
        error: "not_found",
        detail: "Review-only architecture diagram was not found.",
      },
      { status: 404 },
    );
  }

  try {
    const svg = await readFile(path.join(REVIEW_SVG_DIR, filename), "utf8");
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        "x-home-review-only": "true",
      },
    });
  } catch {
    return Response.json(
      {
        error: "not_found",
        detail: "Review-only architecture diagram file is unavailable.",
      },
      { status: 404 },
    );
  }
}
