import { getGraphDriver } from './driver';

export interface SyncPersonNodeArgs {
  graph_node_id: string;
  name: string;
  role: string;
  organization: string;
  email?: string | null;
}

export async function syncPersonToGraph(args: SyncPersonNodeArgs): Promise<void> {
  const driver = getGraphDriver();
  const session = driver.session();
  try {
    await session.run(
      `MERGE (p:Person {id: $id})
       SET p.name = $name, p.role = $role, p.organization = $organization,
           p.email = $email, p.familiarity = 'first_meeting',
           p.last_seen_at = datetime()`,
      {
        id: args.graph_node_id,
        name: args.name,
        role: args.role,
        organization: args.organization,
        email: args.email ?? null,
      }
    );
  } finally {
    await session.close();
  }
}
