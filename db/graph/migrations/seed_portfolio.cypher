// Portfolio seed · Anand (Maestro), James Park + Maria Delgado (sponsors),
// Arcturus + Apex engagements. Idempotent via MERGE.

// ── Persons ──
MERGE (a:Person {id: 'person_anand_sundaram'})
ON CREATE SET a.familiarity = 'frequent_collaborator'
SET a.name = 'Anand Sundaram', a.role = 'maestro', a.organization = 'AbarVa',
    a.email = 'anand+clerk_test@abarva.com', a.last_seen_at = datetime();

MERGE (j:Person {id: 'person_james_park'})
ON CREATE SET j.familiarity = 'returning_recent'
SET j.name = 'James Park', j.role = 'sponsor_cxo', j.organization = 'First Capital Financial',
    j.email = 'james.park@firstcapital.example', j.last_seen_at = datetime();

MERGE (m:Person {id: 'person_maria_delgado'})
ON CREATE SET m.familiarity = 'first_meeting'
SET m.name = 'Maria Delgado', m.role = 'sponsor_cxo', m.organization = 'Apex Retail Group',
    m.email = 'maria.delgado@apexretail.example', m.last_seen_at = datetime();

// ── Engagements ──
MERGE (arc:Engagement {id: 'eng_arcturus_wealth_platform'})
ON CREATE SET arc.created_at = datetime()
SET arc.name = 'Arcturus Wealth Platform Modernization',
    arc.industry_code = 'FINSERV', arc.function_code = 'MIDDLE_OFFICE',
    arc.objective_code = 'OPTIMISE', arc.topic_code = 'wealth_platform_modernization',
    arc.current_phase = 3, arc.status = 'active';

MERGE (apex:Engagement {id: 'eng_apex_retail_hr_erp'})
ON CREATE SET apex.created_at = datetime()
SET apex.name = 'Apex Retail HR ERP Replacement',
    apex.industry_code = 'RETAIL', apex.function_code = 'BACK_OFFICE',
    apex.objective_code = 'OPTIMISE', apex.topic_code = 'hr_erp_replacement',
    apex.current_phase = 2, apex.status = 'active';

// ── Sponsor edges ──
MATCH (j:Person {id: 'person_james_park'}), (arc:Engagement {id: 'eng_arcturus_wealth_platform'})
MERGE (j)-[r1:SPONSORED]->(arc) SET r1.role = 'primary_sponsor';

MATCH (m:Person {id: 'person_maria_delgado'}), (apex:Engagement {id: 'eng_apex_retail_hr_erp'})
MERGE (m)-[r2:SPONSORED]->(apex) SET r2.role = 'primary_sponsor';

// ── Maestro edges (Anand leads all three) ──
MATCH (a:Person {id: 'person_anand_sundaram'}), (arc:Engagement {id: 'eng_arcturus_wealth_platform'})
MERGE (a)-[r3:LED]->(arc) SET r3.role = 'maestro';

MATCH (a:Person {id: 'person_anand_sundaram'}), (apex:Engagement {id: 'eng_apex_retail_hr_erp'})
MERGE (a)-[r4:LED]->(apex) SET r4.role = 'maestro';

MATCH (a:Person {id: 'person_anand_sundaram'}), (mer:Engagement {id: 'eng_meridian_analytics_mod'})
MERGE (a)-[r5:LED]->(mer) SET r5.role = 'maestro';

// ── Industry / Function / Objective edges ──
MATCH (arc:Engagement {id: 'eng_arcturus_wealth_platform'}), (i:Industry {code: 'FINSERV'})
MERGE (arc)-[:IN_INDUSTRY]->(i);

MATCH (arc:Engagement {id: 'eng_arcturus_wealth_platform'}), (f:Function {code: 'MIDDLE_OFFICE'})
MERGE (arc)-[:IN_FUNCTION]->(f);

MATCH (arc:Engagement {id: 'eng_arcturus_wealth_platform'}), (o:Objective {code: 'OPTIMISE'})
MERGE (arc)-[:PURSUES_OBJECTIVE]->(o);

MATCH (apex:Engagement {id: 'eng_apex_retail_hr_erp'}), (i:Industry {code: 'RETAIL'})
MERGE (apex)-[:IN_INDUSTRY]->(i);

MATCH (apex:Engagement {id: 'eng_apex_retail_hr_erp'}), (f:Function {code: 'BACK_OFFICE'})
MERGE (apex)-[:IN_FUNCTION]->(f);

MATCH (apex:Engagement {id: 'eng_apex_retail_hr_erp'}), (o:Objective {code: 'OPTIMISE'})
MERGE (apex)-[:PURSUES_OBJECTIVE]->(o);
