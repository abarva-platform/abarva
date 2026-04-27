// /admin/architecture — alias of /platform/admin/architecture
// AdminSidebar links to this canonical path; this re-export avoids duplicating logic.
// The /platform/admin/architecture variant remains for legacy admin portal flows.
import ArchitecturePage from '@/app/(maestro)/platform/admin/architecture/page';

export const metadata = {
  title: 'Architecture | AbarVa Admin',
};

export default ArchitecturePage;
