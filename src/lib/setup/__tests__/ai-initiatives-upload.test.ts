import {
  looksLikeSetupAiInitiativesUpload,
  parseSetupAiInitiativesCsv,
} from "@/lib/setup";

describe("Setup AI Initiatives upload parser", () => {
  it("parses valid onboarding rows and rejects invalid archetypes", () => {
    const csv = [
      "initiative_id,name,archetype,status,owner_role,sponsor_role,started_at,vendor,linked_program_id,target_outcome_name,target_value,unit,target_date,risk_description,tags",
      "upload-agent,Prior Auth Agent,agent_rollout,at-risk,RCM Owner,CRCO,2026-05-01,ServiceNow,,Clean packets,90,%,2026-12-31,Payer rules incomplete,rcm;prior-auth",
      "bad-row,Bad Row,not_real,active,Owner,Sponsor,2026-05-01,,,,,,,,",
    ].join("\n");
    const parsed = parseSetupAiInitiativesCsv(csv, "meridian-health");
    expect(parsed.tenantKey).toBe("meridian-health");
    expect(parsed.accepted).toHaveLength(1);
    expect(parsed.rejected).toHaveLength(1);
    expect(parsed.accepted[0]).toMatchObject({
      initiativeId: "upload-agent",
      tenantKey: "meridian-health",
      archetype: "agent_rollout",
      status: "at-risk",
      source: "setup_upload",
      tags: ["rcm", "prior-auth"],
    });
  });

  it("requires financial visibility before accepting financial upload columns", () => {
    const csv = [
      "initiative_id,name,archetype,status,owner_role,sponsor_role,started_at,vendor,budget_amount",
      "upload-copilot,Copilot,copilot_rollout,active,Owner,Sponsor,2026-05-01,Microsoft,1000",
    ].join("\n");
    expect(() => parseSetupAiInitiativesCsv(csv, "apex-retail")).toThrow(
      "Financial columns require financialVisibility=true",
    );
    expect(
      parseSetupAiInitiativesCsv(csv, "apex-retail", {
        financialVisibility: true,
      }).accepted[0].budgetAmount,
    ).toBe(1000);
  });

  it("detects AI initiative upload labels", () => {
    expect(
      looksLikeSetupAiInitiativesUpload(
        "customer-ai-initiatives.csv",
        "Initial portfolio registry",
      ),
    ).toBe(true);
    expect(looksLikeSetupAiInitiativesUpload("metrics.csv", "KPI upload")).toBe(
      false,
    );
  });
});
