import JSZip from "jszip";

import {
  ADMIN_DATA_INTAKE_GUIDES,
  ADMIN_TEMPLATE_CATALOG,
  buildAdminFieldDictionaryCsv,
  buildAdminGuideMarkdown,
  buildAdminTemplateCsv,
  buildAdminTenantPacketManifest,
} from "@/lib/admin/data-intake-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET() {
  const zip = new JSZip();

  zip.file(
    "manifest.json",
    `${JSON.stringify(buildAdminTenantPacketManifest(), null, 2)}\n`,
  );

  for (const template of ADMIN_TEMPLATE_CATALOG) {
    zip.file(`templates/${template.id}.csv`, buildAdminTemplateCsv(template));
    zip.file(
      `field-dictionaries/${template.id}-field-dictionary.csv`,
      buildAdminFieldDictionaryCsv(template),
    );
  }

  for (const guide of ADMIN_DATA_INTAKE_GUIDES) {
    zip.file(`guides/${guide.id}.md`, buildAdminGuideMarkdown(guide));
  }

  const bytes = Buffer.from(await zip.generateAsync({ type: "uint8array" }));

  return new Response(bytes, {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="abarva-tenant-packet.zip"',
    },
  });
}
