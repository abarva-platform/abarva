// /source/learn — legacy entry point. The Source primer has been
// folded into the unified user guide at /home/learn so all training
// lives under a single nav. Bookmarks land at the new welcome page.

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SourceLearnRedirect() {
  redirect('/home/learn/source/welcome');
}
