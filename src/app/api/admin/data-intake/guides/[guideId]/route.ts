import { NextResponse } from "next/server";

import {
  buildAdminGuideMarkdown,
  getAdminGuideById,
} from "@/lib/admin/data-intake-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ guideId: string }> },
) {
  const { guideId } = await context.params;
  const guide = getAdminGuideById(guideId);

  if (!guide) {
    return NextResponse.json(
      { ok: false, error: "admin_guide_not_found", guideId },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  return new Response(buildAdminGuideMarkdown(guide), {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${guide.id}.md"`,
    },
  });
}
