import { NextResponse } from "next/server";

import {
  buildAdminFieldDictionaryCsv,
  getAdminTemplateById,
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
  context: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await context.params;
  const template = getAdminTemplateById(templateId);

  if (!template) {
    return NextResponse.json(
      { ok: false, error: "admin_template_not_found", templateId },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  return new Response(buildAdminFieldDictionaryCsv(template), {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.id}-field-dictionary.csv"`,
    },
  });
}
