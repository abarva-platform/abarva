import type { Metadata } from 'next';
import { InviteCollaboratorPage } from '@/components/setup/InviteCollaboratorPage';

export const metadata: Metadata = { title: 'Invite Collaborator · Setup' };

export default function Page() {
  return <InviteCollaboratorPage />;
}
