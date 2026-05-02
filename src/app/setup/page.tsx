// Compatibility bridge: the product navigation calls this surface "Setup",
// while the canonical protected route tree is /admin/*.
import { redirect } from 'next/navigation';

export default function SetupRedirectPage() {
  redirect('/admin');
}
