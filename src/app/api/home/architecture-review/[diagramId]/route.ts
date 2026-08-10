import { HOME_CLAUDE_REVIEW_SVG_ASSETS } from "@/lib/home/claude-architecture-review-svg-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ diagramId: string }> },
): Promise<Response> {
  const { diagramId } = await params;
  const svg =
    HOME_CLAUDE_REVIEW_SVG_ASSETS[
      diagramId as keyof typeof HOME_CLAUDE_REVIEW_SVG_ASSETS
    ];

  if (!svg) {
    return Response.json(
      {
        error: "not_found",
        detail: "Review-only architecture diagram was not found.",
      },
      { status: 404 },
    );
  }

  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-store",
      "x-home-review-only": "true",
    },
  });
}
