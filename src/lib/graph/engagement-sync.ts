import { getGraphDriver } from './driver';

export interface SyncEngagementArgs {
  graph_node_id: string;
  name: string;
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string;
  sponsor_graph_node_id: string;
  maestro_graph_node_id?: string | null;
}

export async function syncEngagementToGraph(args: SyncEngagementArgs): Promise<void> {
  const driver = getGraphDriver();
  const session = driver.session();
  try {
    await session.run(
      `MERGE (e:Engagement {id: $eid})
       SET e.name = $name, e.industry_code = $industry, e.function_code = $fn,
           e.objective_code = $obj, e.topic_code = $topic, e.current_phase = 0,
           e.status = 'active', e.created_at = datetime()
       WITH e
       MATCH (i:Industry {code: $industry}) MERGE (e)-[:IN_INDUSTRY]->(i)
       WITH e
       MATCH (f:Function {code: $fn}) MERGE (e)-[:IN_FUNCTION]->(f)
       WITH e
       MATCH (o:Objective {code: $obj}) MERGE (e)-[:PURSUES_OBJECTIVE]->(o)
       WITH e
       MATCH (s:Person {id: $sponsor_id})
       MERGE (s)-[:SPONSORED {role: 'primary_sponsor'}]->(e)`,
      {
        eid: args.graph_node_id,
        name: args.name,
        industry: args.industry_code,
        fn: args.function_code,
        obj: args.objective_code,
        topic: args.topic_code,
        sponsor_id: args.sponsor_graph_node_id,
      },
    );

    if (args.maestro_graph_node_id) {
      await session.run(
        `MATCH (e:Engagement {id: $eid}), (m:Person {id: $mid})
         MERGE (m)-[:LED {role: 'maestro'}]->(e)`,
        { eid: args.graph_node_id, mid: args.maestro_graph_node_id },
      );
    }
  } finally {
    await session.close();
  }
}
