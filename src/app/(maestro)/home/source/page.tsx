import { redirect } from 'next/navigation';

export default function LegacyHomeSourceRedirect() {
  redirect('/source');
}
