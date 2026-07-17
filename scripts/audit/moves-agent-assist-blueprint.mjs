#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = "src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts";
const body = fs.readFileSync(path.join(process.cwd(), file), "utf8");

const required = [
  "healthcare_contact_center_agent_assist",
  "Healthcare Contact Center Agent Assist",
  "current_state_workflow_map",
  "contact_center_kpis",
  "crm_contact_center_system_map",
  "claims_eligibility_benefits_data_access",
  "knowledge_base_ownership_freshness",
  "call_recording_transcript_availability",
  "phi_privacy_security_controls",
  "human_in_loop_model",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
  "health|meridian|member.?service|member.?experience|contact.?center|call.?center|agent.?assist",
];

for (const token of required) {
  if (!body.includes(token)) {
    throw new Error(`Agent Assist blueprint token missing from ${file}: ${token}`);
  }
}

console.log("PASS audit:moves-agent-assist-blueprint");
