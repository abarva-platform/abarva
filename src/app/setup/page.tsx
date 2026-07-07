// Compatibility bridge: legacy /setup links resolve to the canonical
// protected Admin route tree under /admin/*.
import { redirect } from 'next/navigation';

export default function SetupRedirectPage() {
  redirect('/admin');
}
