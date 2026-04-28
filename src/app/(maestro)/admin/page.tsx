import { redirect } from 'next/navigation';

export const metadata = { title: 'Setup · AbarVa' };

export default function AdminOverviewPage() {
  redirect('/admin/connectors');
}
