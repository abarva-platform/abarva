import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { CxoIntelUploadFlow } from "@/components/cxo-intel/CxoIntelUploadFlow";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { getCxoIntelBundle } from "@/lib/cxo-intel/schemas";
import { COLORS } from "@/lib/design/design-tokens";

export const metadata = { title: "CIO Intel Bundle | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CioCxoIntelPage() {
  const tenant = await resolveAdminTenant();
  const bundle = getCxoIntelBundle("cio");

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <main style={{ padding: "32px 36px 48px", background: COLORS.cream, flex: 1 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <CxoIntelUploadFlow
            bundle={bundle}
            tenantName={tenant.tenantName}
            clientId={tenant.clientId}
          />
        </div>
      </main>
    </AdminCanonShellV2>
  );
}
