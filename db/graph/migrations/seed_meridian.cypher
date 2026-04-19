// Meridian — the live engagement
MERGE (sarah:Person {id:'person_sarah_chen'}) ON CREATE SET sarah.name='Sarah Chen', sarah.role='CIO', sarah.organization='Meridian Health', sarah.email='sarah.chen@meridian-health.com', sarah.familiarity='first_meeting';
MERGE (meridian:Engagement {id:'eng_meridian_analytics_mod'}) ON CREATE SET meridian.name='Meridian Analytics Modernization', meridian.current_phase=0, meridian.industry_code='HEALTHCARE_IDN', meridian.function_code='MIDDLE_OFFICE', meridian.objective_code='OPTIMISE', meridian.status='active', meridian.created_at=datetime();

MATCH (sarah:Person {id:'person_sarah_chen'}), (e:Engagement {id:'eng_meridian_analytics_mod'}) MERGE (sarah)-[:SPONSORED]->(e);
MATCH (e:Engagement {id:'eng_meridian_analytics_mod'}), (i:Industry {code:'HEALTHCARE_IDN'}) MERGE (e)-[:IN_INDUSTRY]->(i);
MATCH (e:Engagement {id:'eng_meridian_analytics_mod'}), (f:Function {code:'MIDDLE_OFFICE'}) MERGE (e)-[:IN_FUNCTION]->(f);
MATCH (e:Engagement {id:'eng_meridian_analytics_mod'}), (o:Objective {code:'OPTIMISE'}) MERGE (e)-[:HAS_OBJECTIVE]->(o);
MATCH (e:Engagement {id:'eng_meridian_analytics_mod'}), (p:GenomePattern {code:'F007'}) MERGE (e)-[r:TRIGGERED]->(p) ON CREATE SET r.observed_at = datetime();
MATCH (e:Engagement {id:'eng_meridian_analytics_mod'}), (p:GenomePattern {code:'F008'}) MERGE (e)-[r:TRIGGERED]->(p) ON CREATE SET r.observed_at = datetime();

// Historical comparable engagements — healthcare IDN, analytics modernization, Phase 2 Epic timing trade-off
// Five in total — three chose to slip, two chose to honor. The split matters for the agent's framing.

MERGE (h1:Engagement {id:'eng_hist_riverside_2024'}) ON CREATE SET h1.name='Riverside Health Analytics Mod', h1.industry_code='HEALTHCARE_IDN', h1.function_code='MIDDLE_OFFICE', h1.objective_code='OPTIMISE', h1.status='completed', h1.completed_at=datetime('2024-10-15T00:00:00Z');
MERGE (d1:Decision {id:'dec_riverside_slip'}) ON CREATE SET d1.name='Slip Epic integration 2 weeks for architecture', d1.phase=2, d1.choice='slip_for_architecture', d1.made_at=datetime('2024-04-12T00:00:00Z');
MERGE (o1:Outcome {id:'out_riverside_clean'}) ON CREATE SET o1.name='Clean post-go-live', o1.verified=true, o1.savings_usd=38000000, o1.measured_at=datetime('2024-11-01T00:00:00Z');
MATCH (h1:Engagement {id:'eng_hist_riverside_2024'}), (d1:Decision {id:'dec_riverside_slip'}), (o1:Outcome {id:'out_riverside_clean'}), (p:GenomePattern {code:'F007'}), (i:Industry {code:'HEALTHCARE_IDN'})
  MERGE (h1)-[:MADE]->(d1)
  MERGE (d1)-[:RESULTED_IN]->(o1)
  MERGE (h1)-[:TRIGGERED]->(p)
  MERGE (h1)-[:IN_INDUSTRY]->(i);

MERGE (h2:Engagement {id:'eng_hist_northbay_2024'}) ON CREATE SET h2.name='Northbay IDN Analytics', h2.industry_code='HEALTHCARE_IDN', h2.status='completed';
MERGE (d2:Decision {id:'dec_northbay_slip'}) ON CREATE SET d2.phase=2, d2.choice='slip_for_architecture';
MERGE (o2:Outcome {id:'out_northbay_clean'}) ON CREATE SET o2.verified=true, o2.savings_usd=44000000;
MATCH (h2:Engagement {id:'eng_hist_northbay_2024'}), (d2:Decision {id:'dec_northbay_slip'}), (o2:Outcome {id:'out_northbay_clean'}), (p:GenomePattern {code:'F007'}), (i:Industry {code:'HEALTHCARE_IDN'})
  MERGE (h2)-[:MADE]->(d2)
  MERGE (d2)-[:RESULTED_IN]->(o2)
  MERGE (h2)-[:TRIGGERED]->(p)
  MERGE (h2)-[:IN_INDUSTRY]->(i);

MERGE (h3:Engagement {id:'eng_hist_lakeside_2023'}) ON CREATE SET h3.name='Lakeside Analytics', h3.industry_code='HEALTHCARE_IDN', h3.status='completed';
MERGE (d3:Decision {id:'dec_lakeside_slip'}) ON CREATE SET d3.phase=2, d3.choice='slip_for_architecture';
MERGE (o3:Outcome {id:'out_lakeside_partial'}) ON CREATE SET o3.verified=true, o3.savings_usd=22000000, o3.notes='Underperformed baseline — scope cut mid-execution';
MATCH (h3:Engagement {id:'eng_hist_lakeside_2023'}), (d3:Decision {id:'dec_lakeside_slip'}), (o3:Outcome {id:'out_lakeside_partial'}), (i:Industry {code:'HEALTHCARE_IDN'})
  MERGE (h3)-[:MADE]->(d3)
  MERGE (d3)-[:RESULTED_IN]->(o3)
  MERGE (h3)-[:IN_INDUSTRY]->(i);

MERGE (h4:Engagement {id:'eng_hist_eastpoint_2023'}) ON CREATE SET h4.name='Eastpoint IDN Mod', h4.industry_code='HEALTHCARE_IDN', h4.status='completed';
MERGE (d4:Decision {id:'dec_eastpoint_honor'}) ON CREATE SET d4.phase=2, d4.choice='honor_deadline';
MERGE (o4:Outcome {id:'out_eastpoint_rebuild'}) ON CREATE SET o4.verified=true, o4.savings_usd=-12000000, o4.notes='18-month post-go-live rebuild required';
MATCH (h4:Engagement {id:'eng_hist_eastpoint_2023'}), (d4:Decision {id:'dec_eastpoint_honor'}), (o4:Outcome {id:'out_eastpoint_rebuild'}), (f7:GenomePattern {code:'F007'}), (f12:GenomePattern {code:'F012'}), (i:Industry {code:'HEALTHCARE_IDN'})
  MERGE (h4)-[:MADE]->(d4)
  MERGE (d4)-[:RESULTED_IN]->(o4)
  MERGE (h4)-[:TRIGGERED]->(f7)
  MERGE (h4)-[:TRIGGERED]->(f12)
  MERGE (h4)-[:IN_INDUSTRY]->(i);

MERGE (h5:Engagement {id:'eng_hist_summit_2023'}) ON CREATE SET h5.name='Summit Health Analytics', h5.industry_code='HEALTHCARE_IDN', h5.status='completed';
MERGE (d5:Decision {id:'dec_summit_honor'}) ON CREATE SET d5.phase=2, d5.choice='honor_deadline';
MERGE (o5:Outcome {id:'out_summit_stabilized'}) ON CREATE SET o5.verified=true, o5.savings_usd=18000000, o5.notes='Stabilized within 9 months';
MATCH (h5:Engagement {id:'eng_hist_summit_2023'}), (d5:Decision {id:'dec_summit_honor'}), (o5:Outcome {id:'out_summit_stabilized'}), (i:Industry {code:'HEALTHCARE_IDN'})
  MERGE (h5)-[:MADE]->(d5)
  MERGE (d5)-[:RESULTED_IN]->(o5)
  MERGE (h5)-[:IN_INDUSTRY]->(i);
