export function assembleGenomeQueryPrompt(userQuery: string): string {
  return `You translate natural-language questions about AbarVa's Transformation Genome into Cypher queries against Neo4j.

SCHEMA
Nodes:
- GenomePattern {code, name, failure_rate, category, description}
- Engagement {id, name, client_id, industry_code, function_code, objective_code, current_phase, status}
- Industry {code, name}
- Function {code, name}
- Objective {code, name}
- Person {id, name, role, organization, client_id}
- Decision {id, phase, choice, client_id}
- Outcome {id, savings_usd, verified, notes, client_id}

Edges:
- (Engagement)-[:TRIGGERED]->(GenomePattern)
- (GenomePattern)-[:CHAINS_TO {weight}]->(GenomePattern)
- (Engagement)-[:IN_INDUSTRY]->(Industry)
- (Engagement)-[:IN_FUNCTION]->(Function)
- (Engagement)-[:PURSUES_OBJECTIVE]->(Objective)
- (Person)-[:SPONSORED]->(Engagement)
- (Person)-[:LED]->(Engagement)
- (Engagement)-[:MADE]->(Decision)
- (Decision)-[:RESULTED_IN]->(Outcome)

USER QUESTION
"${userQuery}"

TASK
Write a read-only Cypher query that answers the question. Return ONLY nodes or specific fields — never DELETE, CREATE, MERGE, SET, or any write operation.

TENANT ISOLATION (required)
The caller's tenant is bound to the parameter $callerClientId. Every query MUST scope tenant-owned nodes (Engagement, Person, Decision, Outcome) by $callerClientId. Cross-tenant aggregates over global nodes (GenomePattern, Industry, Function, Objective) are allowed, but joins through tenant-owned nodes must filter \`WHERE node.client_id = $callerClientId\`. Queries without a $callerClientId reference will be rejected by the server.

Example pattern:
MATCH (e:Engagement {client_id: $callerClientId})-[:TRIGGERED]->(p:GenomePattern)
RETURN p.code, p.name, count(e) AS hits LIMIT 50

OUTPUT
Return ONLY JSON:

{
  "cypher": "MATCH (e:Engagement {client_id: $callerClientId})... RETURN ...",
  "result_shape": "patterns" | "engagements" | "chains" | "persons" | "mixed",
  "explanation": "1-sentence plain-English description of what this query does"
}

RULES
- Read-only only. Never emit CREATE, MERGE, SET, DELETE, REMOVE, DROP, DETACH.
- Always include \`$callerClientId\` somewhere in the cypher (use it to scope every tenant-owned node).
- Always LIMIT 50.
- If the question can't be answered with the schema, return cypher: null and explanation: "Can't answer: [why]".
- No commentary outside the JSON.`;
}
