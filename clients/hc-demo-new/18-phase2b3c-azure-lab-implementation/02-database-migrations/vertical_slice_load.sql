\set ON_ERROR_STOP on

select audit.assert_hcdn_tenant('hc-demo-new');
select audit.assert_manifest_hash('manifest-hcdn-local-001', 'manifest-hcdn-local-001');

insert into operations.job_run(tenant_key, run_ref, job_name, manifest_hash, processing_state, idempotency_key)
values ('hc-demo-new','HCDN-KLOAD-20260727-001','local-conformance-load','manifest-hcdn-local-001','registered','job:HCDN-KLOAD-20260727-001')
on conflict (run_ref) do nothing;

insert into operations.job_stage(job_run_id, stage_name, processing_state, checkpoint_ref, retry_policy, partial_success_behavior, quarantine_behavior, audit_event_ref, replay_behavior)
select job_run_id, stage_name, s.processing_state::processing_state_enum, 'chk:' || stage_name,
       '{"max_attempts":3,"backoff":"bounded"}'::jsonb,
       partial_success_behavior, quarantine_behavior, 'audit:' || stage_name, replay_behavior
from operations.job_run
cross join (values
  ('source registration','registered','fail closed on tenant or manifest mismatch','no quarantine before source is registered','idempotent by source_ref'),
  ('source-version storage','stored','existing source version is reused by content hash','quarantine duplicate native identity only','idempotent by source_ref+content_hash'),
  ('parsing/evidence creation','parsed','valid rows continue when one row is invalid','invalid rows keep source lineage','idempotent by evidence_hash'),
  ('candidate creation','candidate_created','valid candidates continue','bad native rows to quarantine','idempotent by candidate source row'),
  ('normalization','normalized','normalizable candidates continue','unknown types to quarantine','idempotent by normalized payload hash'),
  ('entity resolution','resolved','unresolved candidates remain candidate','ambiguous matches become review work items','idempotent by resolution decision'),
  ('semantic validation','validated','valid assertions continue','invalid predicate/value combos to quarantine','idempotent by assertion id'),
  ('conflict/change detection','validated','non-conflicting facts continue','conflicts create governance records','idempotent by subject+predicate'),
  ('quarantine','quarantined','quarantined row does not stop source family','source lineage is retained','idempotent by source row'),
  ('review/acceptance','reviewed','accepted items advance, rejected stay excluded','rejected facts preserved out of projection','idempotent by review target'),
  ('domain publication','published','domain publishes independently','failed domain does not affect others','idempotent by domain+version'),
  ('projection generation','projected','projection build is separate from activation','bad projection fails without activation','idempotent by baseline+projection'),
  ('atomic activation','activated','last known good remains active on failure','failed activation is recorded','idempotent by activation ref')
) as s(stage_name,processing_state,partial_success_behavior,quarantine_behavior,replay_behavior)
where run_ref='HCDN-KLOAD-20260727-001'
on conflict (job_run_id, stage_name) do nothing;

insert into source_registry.parser_contract(parser_contract_ref, contract_version, input_schema, output_schema)
values
('PCR-HCDN-STRATEGY-V1','enterprise-knowledge-v1','{"type":"strategy_document"}','{"entities":["organization","program"],"facts":["strategy"],"evidence":true}'),
('PCR-HCDN-CMDB-V1','enterprise-knowledge-v1','{"type":"cmdb_application_extract"}','{"entities":["application","organization"],"relationships":true,"evidence":true}'),
('PCR-HCDN-KPI-V1','enterprise-knowledge-v1','{"type":"kpi_extract"}','{"metrics":true,"disclosureModes":["exact","range","withheld"]}'),
('PCR-HCDN-GRC-V1','enterprise-knowledge-v1','{"type":"risk_control_extract"}','{"entities":["risk","control"],"relationships":true}'),
('PCR-HCDN-INTERVIEW-V1','enterprise-knowledge-v1','{"type":"executive_interview"}','{"perspectives":true,"constraints":true}')
on conflict do nothing;

insert into source_registry.source(source_ref, tenant_key, source_family, source_name, source_owner_role, source_basis)
values
('SRC-HCDN-STRATEGY','hc-demo-new','public_strategy','Public strategy source','Strategy office','public/synthetic fixture'),
('SRC-HCDN-CMDB','hc-demo-new','cmdb_application','CMDB application extract','CMDB owner','client extract fixture'),
('SRC-HCDN-KPI','hc-demo-new','kpi_observation','KPI definition and observations','Finance analytics owner','client extract fixture'),
('SRC-HCDN-GRC','hc-demo-new','grc_risk_control','GRC risk/control extract','Risk and compliance owner','client extract fixture'),
('SRC-HCDN-INTERVIEW','hc-demo-new','executive_interview','CIO/CDO interview','Executive sponsor','interview fixture')
on conflict do nothing;

insert into source_registry.source_version(source_version_ref, source_ref, tenant_key, version_number, blob_uri, content_hash, manifest_hash, parser_contract_ref, processing_state)
values
('SRCV-HCDN-STRATEGY-V001','SRC-HCDN-STRATEGY','hc-demo-new',1,'blob://stabhcdemonewlab001/raw/strategy-v1.md','hash-strategy-v1','manifest-hcdn-local-001','PCR-HCDN-STRATEGY-V1','stored'),
('SRCV-HCDN-CMDB-V001','SRC-HCDN-CMDB','hc-demo-new',1,'blob://stabhcdemonewlab001/raw/cmdb-v1.csv','hash-cmdb-v1','manifest-hcdn-local-001','PCR-HCDN-CMDB-V1','stored'),
('SRCV-HCDN-CMDB-V002','SRC-HCDN-CMDB','hc-demo-new',2,'blob://stabhcdemonewlab001/raw/cmdb-v2.csv','hash-cmdb-v2','manifest-hcdn-local-001','PCR-HCDN-CMDB-V1','stored'),
('SRCV-HCDN-KPI-V001','SRC-HCDN-KPI','hc-demo-new',1,'blob://stabhcdemonewlab001/raw/kpi-v1.csv','hash-kpi-v1','manifest-hcdn-local-001','PCR-HCDN-KPI-V1','stored'),
('SRCV-HCDN-GRC-V001','SRC-HCDN-GRC','hc-demo-new',1,'blob://stabhcdemonewlab001/raw/grc-v1.csv','hash-grc-v1','manifest-hcdn-local-001','PCR-HCDN-GRC-V1','stored'),
('SRCV-HCDN-INTERVIEW-V001','SRC-HCDN-INTERVIEW','hc-demo-new',1,'blob://stabhcdemonewlab001/raw/cio-cdo-interview-v1.md','hash-interview-v1','manifest-hcdn-local-001','PCR-HCDN-INTERVIEW-V1','stored')
on conflict do nothing;

insert into source_registry.source_manifest(manifest_ref, tenant_key, manifest_hash, source_version_refs)
values ('MAN-HCDN-LOCAL-001','hc-demo-new','manifest-hcdn-local-001', array['SRCV-HCDN-STRATEGY-V001','SRCV-HCDN-CMDB-V001','SRCV-HCDN-CMDB-V002','SRCV-HCDN-KPI-V001','SRCV-HCDN-GRC-V001','SRCV-HCDN-INTERVIEW-V001'])
on conflict do nothing;

insert into evidence.evidence_item(evidence_ref, tenant_key, source_version_ref, evidence_type, title, source_row_ref, evidence_hash, availability_state)
values
('EVID-HCDN-STRATEGY-001','hc-demo-new','SRCV-HCDN-STRATEGY-V001','document','Strategy calls out patient access and governed AI foundation','p4','evhash-strategy-001','available'),
('EVID-HCDN-CMDB-001','hc-demo-new','SRCV-HCDN-CMDB-V001','row','CRM app supports Patient Access','row-1','evhash-cmdb-001','available'),
('EVID-HCDN-CMDB-002','hc-demo-new','SRCV-HCDN-CMDB-V001','row','Contact Center app alias for CRM platform','row-2','evhash-cmdb-002','available'),
('EVID-HCDN-CMDB-003','hc-demo-new','SRCV-HCDN-CMDB-V002','row','CRM owner corrected to Digital Experience','row-1','evhash-cmdb-v2-001','available'),
('EVID-HCDN-KPI-001','hc-demo-new','SRCV-HCDN-KPI-V001','row','Call volume exact mode','row-1','evhash-kpi-001','available'),
('EVID-HCDN-KPI-002','hc-demo-new','SRCV-HCDN-KPI-V001','row','Patient access wait time range mode','row-2','evhash-kpi-002','available'),
('EVID-HCDN-KPI-003','hc-demo-new','SRCV-HCDN-KPI-V001','row','Revenue metric withheld by client','row-3','evhash-kpi-003','withheld'),
('EVID-HCDN-GRC-001','hc-demo-new','SRCV-HCDN-GRC-V001','row','AI escalation control required','row-1','evhash-grc-001','available'),
('EVID-HCDN-INTERVIEW-001','hc-demo-new','SRCV-HCDN-INTERVIEW-V001','interview_quote','CIO says identity and transcript governance are blockers','turn-12','evhash-interview-001','available')
on conflict do nothing;

insert into evidence.evidence_locator(locator_ref, evidence_ref, locator_type, locator_value)
select 'LOC-' || evidence_ref, evidence_ref, 'fixture-path', source_row_ref from evidence.evidence_item
on conflict do nothing;

insert into evidence.extracted_fragment(fragment_ref, evidence_ref, fragment_text, fragment_json)
values
('FRAG-HCDN-STRATEGY-001','EVID-HCDN-STRATEGY-001','Patient access and governed AI foundation are priority themes.','{"theme":"patient_access"}'),
('FRAG-HCDN-INTERVIEW-001','EVID-HCDN-INTERVIEW-001','Identity and transcript governance are blockers before scaling agent assist.','{"speaker_role":"CIO/CDO"}')
on conflict do nothing;

insert into working.entity_candidate(entity_candidate_ref, tenant_key, source_version_ref, source_native_ref, object_class, candidate_name, candidate_payload, evidence_refs, idempotency_key)
values
('EC-HCDN-ORG-PATIENT-ACCESS','hc-demo-new','SRCV-HCDN-STRATEGY-V001','org:patient-access','organization','Patient Access', '{"source":"strategy"}', array['EVID-HCDN-STRATEGY-001'], 'ec:org:patient-access'),
('EC-HCDN-APP-CRM','hc-demo-new','SRCV-HCDN-CMDB-V001','app:crm','application','Access CRM', '{"criticality":"high","lifecycle":"active"}', array['EVID-HCDN-CMDB-001'], 'ec:app:crm'),
('EC-HCDN-APP-CC-ALIAS','hc-demo-new','SRCV-HCDN-CMDB-V001','app:contact-center','application','Contact Center CRM', '{"alias_of":"Access CRM"}', array['EVID-HCDN-CMDB-002'], 'ec:app:contact-center-alias'),
('EC-HCDN-RISK-AI-ESCALATION','hc-demo-new','SRCV-HCDN-GRC-V001','risk:ai-escalation','risk','AI escalation risk', '{"domain":"AI controls"}', array['EVID-HCDN-GRC-001'], 'ec:risk:ai-escalation'),
('EC-HCDN-CONTROL-HUMAN-REVIEW','hc-demo-new','SRCV-HCDN-GRC-V001','control:human-review','control','Human review control', '{"domain":"AI controls"}', array['EVID-HCDN-GRC-001'], 'ec:control:human-review')
on conflict do nothing;

insert into working.fact_candidate(fact_candidate_ref, tenant_key, entity_candidate_ref, predicate, value_text, evidence_refs, conflict_state, idempotency_key)
values
('FC-HCDN-CRM-OWNER-V1','hc-demo-new','EC-HCDN-APP-CRM','owned_by','Patient Access Operations', array['EVID-HCDN-CMDB-001'], 'confirmed', 'fc:crm-owner-v1'),
('FC-HCDN-CRM-OWNER-V2','hc-demo-new','EC-HCDN-APP-CRM','owned_by','Digital Experience', array['EVID-HCDN-CMDB-003'], 'confirmed', 'fc:crm-owner-v2'),
('FC-HCDN-CRM-LIFECYCLE','hc-demo-new','EC-HCDN-APP-CRM','lifecycle','active', array['EVID-HCDN-CMDB-001'], 'none', 'fc:crm-lifecycle')
on conflict do nothing;

insert into working.relationship_candidate(relationship_candidate_ref, tenant_key, from_entity_candidate_ref, relationship_type, to_entity_candidate_ref, evidence_refs, idempotency_key)
values
('RC-HCDN-CRM-SUPPORTS-PA','hc-demo-new','EC-HCDN-APP-CRM','supports','EC-HCDN-ORG-PATIENT-ACCESS', array['EVID-HCDN-CMDB-001'], 'rc:crm-supports-pa'),
('RC-HCDN-RISK-CONTROLLED-BY','hc-demo-new','EC-HCDN-RISK-AI-ESCALATION','controlled_by','EC-HCDN-CONTROL-HUMAN-REVIEW', array['EVID-HCDN-GRC-001'], 'rc:risk-controlled-by'),
('RC-HCDN-CANDIDATE-UNREVIEWED','hc-demo-new','EC-HCDN-APP-CC-ALIAS','integrates_with','EC-HCDN-APP-CRM', array['EVID-HCDN-CMDB-002'], 'rc:candidate-unreviewed')
on conflict do nothing;

insert into working.metric_candidate(metric_candidate_ref, tenant_key, metric_name, disclosure_mode, value_numeric, value_range_low, value_range_high, withheld_reason, evidence_refs, review_state, idempotency_key)
values
('MC-HCDN-CALL-VOLUME','hc-demo-new','Annual call volume','exact',3000000,null,null,null,array['EVID-HCDN-KPI-001'],'accepted','mc:annual-call-volume'),
('MC-HCDN-WAIT-TIME','hc-demo-new','Access wait time','range',null,18,24,null,array['EVID-HCDN-KPI-002'],'accepted','mc:access-wait-time'),
('MC-HCDN-REVENUE','hc-demo-new','Revenue cycle impact','withheld',null,null,null,'Client withheld exact and range values',array['EVID-HCDN-KPI-003'],'accepted','mc:revenue-withheld')
on conflict do nothing;

insert into working.entity_resolution_candidate(resolution_candidate_ref, tenant_key, candidate_refs, proposed_entity_ref, confidence, resolution_reason, review_state)
values ('RES-HCDN-CRM-ALIAS','hc-demo-new', array['EC-HCDN-APP-CRM','EC-HCDN-APP-CC-ALIAS'], 'ENT-HCDN-APP-CRM', 0.93, 'Alias shares CRM platform and patient access ownership evidence', 'accepted')
on conflict do nothing;

insert into working.normalization_result(normalization_ref, tenant_key, candidate_ref, normalized_payload)
values ('NORM-HCDN-CRM','hc-demo-new','EC-HCDN-APP-CRM','{"canonical_name":"Access CRM","object_class":"application"}')
on conflict do nothing;

insert into working.quarantine_item(quarantine_ref, tenant_key, source_version_ref, source_row_ref, reason_code, reason_detail, source_lineage)
values ('QUAR-HCDN-CMDB-ROW-099','hc-demo-new','SRCV-HCDN-CMDB-V001','row-99','MISSING_ENTITY_NAME','CMDB row had native id but no application name','{"source_version_ref":"SRCV-HCDN-CMDB-V001","row":"row-99"}')
on conflict do nothing;

insert into knowledge.entity(entity_ref, tenant_key, object_class, display_name, lifecycle_state, current_target_state, authority_state)
values
('ENT-HCDN-ORG-PATIENT-ACCESS','hc-demo-new','organization','Patient Access','active','current','accepted'),
('ENT-HCDN-APP-CRM','hc-demo-new','application','Access CRM','active','current','accepted'),
('ENT-HCDN-APP-IVR','hc-demo-new','application','Patient Access IVR','active','current','accepted'),
('ENT-HCDN-CAP-ACCESS','hc-demo-new','capability','Patient Access Capability','active','current','accepted'),
('ENT-HCDN-PROC-SCHEDULING','hc-demo-new','process','Scheduling and Intake','active','current','accepted'),
('ENT-HCDN-DP-TRANSCRIPTS','hc-demo-new','data_product','Contact Transcript Data Product','planned','target','accepted'),
('ENT-HCDN-PLAT-CLOUD','hc-demo-new','platform','Healthcare Cloud Analytics Platform','active','current','accepted'),
('ENT-HCDN-VENDOR-CRM','hc-demo-new','vendor','CRM Platform Vendor','active','current','accepted'),
('ENT-HCDN-CONTRACT-CRM','hc-demo-new','contract','CRM Managed Service Contract','active','current','accepted'),
('ENT-HCDN-SERVICE-CRM','hc-demo-new','service','CRM Managed Service','active','current','accepted'),
('ENT-HCDN-PROGRAM-ACCESS-AI','hc-demo-new','program','Patient Access AI Program','planned','target','accepted'),
('ENT-HCDN-AI-USE-CASE-ASSIST','hc-demo-new','ai_use_case','Agent Assist for Patient Access','planned','target','accepted'),
('ENT-HCDN-KPI-CALL-VOLUME','hc-demo-new','kpi','Annual Call Volume KPI','active','current','accepted'),
('ENT-HCDN-OUTCOME-ACCESS','hc-demo-new','outcome','Improved Patient Access Outcome','planned','target','accepted'),
('ENT-HCDN-RISK-AI-ESCALATION','hc-demo-new','risk','AI escalation risk','active','current','accepted'),
('ENT-HCDN-CONTROL-HUMAN-REVIEW','hc-demo-new','control','Human review control','active','current','accepted')
on conflict do nothing;

insert into knowledge.organization(entity_ref, organization_type) values ('ENT-HCDN-ORG-PATIENT-ACCESS','business_function') on conflict do nothing;
insert into knowledge.application(entity_ref, criticality, lifecycle_detail) values ('ENT-HCDN-APP-CRM','high','active') on conflict do nothing;
insert into knowledge.application(entity_ref, criticality, lifecycle_detail) values ('ENT-HCDN-APP-IVR','medium','active') on conflict do nothing;
insert into knowledge.capability(entity_ref, capability_domain) values ('ENT-HCDN-CAP-ACCESS','patient_access') on conflict do nothing;
insert into knowledge.process(entity_ref, process_domain) values ('ENT-HCDN-PROC-SCHEDULING','patient_access') on conflict do nothing;
insert into knowledge.data_product(entity_ref, product_domain) values ('ENT-HCDN-DP-TRANSCRIPTS','contact_center') on conflict do nothing;
insert into knowledge.platform(entity_ref, platform_type) values ('ENT-HCDN-PLAT-CLOUD','cloud_analytics') on conflict do nothing;
insert into knowledge.vendor(entity_ref, vendor_category) values ('ENT-HCDN-VENDOR-CRM','crm_platform') on conflict do nothing;
insert into knowledge.contract(entity_ref, contract_type) values ('ENT-HCDN-CONTRACT-CRM','managed_service') on conflict do nothing;
insert into knowledge.program(entity_ref, program_type) values ('ENT-HCDN-PROGRAM-ACCESS-AI','ai_transformation') on conflict do nothing;
insert into knowledge.ai_use_case(entity_ref, use_case_domain) values ('ENT-HCDN-AI-USE-CASE-ASSIST','patient_access') on conflict do nothing;
insert into knowledge.risk(entity_ref, risk_domain) values ('ENT-HCDN-RISK-AI-ESCALATION','AI controls') on conflict do nothing;
insert into knowledge.control(entity_ref, control_domain) values ('ENT-HCDN-CONTROL-HUMAN-REVIEW','AI controls') on conflict do nothing;

insert into knowledge.entity_alias(alias_ref, entity_ref, alias_text, source_version_ref)
values ('ALIAS-HCDN-APP-CRM-CC','ENT-HCDN-APP-CRM','Contact Center CRM','SRCV-HCDN-CMDB-V001')
on conflict do nothing;

insert into knowledge.entity_source_identity(entity_source_identity_ref, entity_ref, source_ref, native_key)
values ('ESI-HCDN-CRM-CMDB','ENT-HCDN-APP-CRM','SRC-HCDN-CMDB','app:crm')
on conflict do nothing;

insert into knowledge.fact_assertion(fact_ref, tenant_key, entity_ref, predicate, value_text, evidence_refs, authority_state, valid_from)
values
('FACT-HCDN-CRM-OWNER-V1','hc-demo-new','ENT-HCDN-APP-CRM','owned_by','Patient Access Operations',array['EVID-HCDN-CMDB-001'],'superseded','2026-01-01'),
('FACT-HCDN-CRM-OWNER-V2','hc-demo-new','ENT-HCDN-APP-CRM','owned_by','Digital Experience',array['EVID-HCDN-CMDB-003'],'accepted','2026-07-01'),
('FACT-HCDN-CRM-LIFECYCLE','hc-demo-new','ENT-HCDN-APP-CRM','lifecycle','active',array['EVID-HCDN-CMDB-001'],'accepted','2026-01-01')
on conflict do nothing;

update knowledge.fact_assertion
set superseded_at = now(), supersedes_fact_ref = null
where fact_ref = 'FACT-HCDN-CRM-OWNER-V1';

insert into knowledge.relationship_type(relationship_type_code, display_name, inverse_type_code, allowed_from_entity_types, allowed_to_entity_types, is_directional, is_transitive, is_symmetric, evidence_requirement, current_target_allowed)
values
('supports_capability','supports capability',null,array['application'],array['capability'],true,false,false,'evidence_required',true),
('enables_process','enables process',null,array['application'],array['process'],true,false,false,'evidence_required',true),
('integrates_with','integrates with',null,array['application'],array['application'],false,false,true,'evidence_required',true),
('produces_data','produces data',null,array['application'],array['data_product','data_asset'],true,false,false,'evidence_required',true),
('consumes_data','consumes data',null,array['application'],array['data_product','data_asset'],true,false,false,'evidence_required',true),
('hosted_on','hosted on',null,array['application'],array['platform'],true,false,false,'evidence_required',true),
('provided_by','provided by',null,array['application'],array['vendor'],true,false,false,'evidence_required',true),
('governed_by_contract','governed by contract',null,array['application','service'],array['contract'],true,false,false,'evidence_required',true),
('changes','changes',null,array['program'],array['application','capability','process'],true,false,false,'evidence_required',true),
('affects','affects',null,array['risk'],array['process','application'],true,false,false,'evidence_required',true),
('mitigates','mitigates',null,array['control'],array['risk'],true,false,false,'evidence_required',true),
('measures','measures',null,array['kpi'],array['outcome'],true,false,false,'evidence_required',true),
('uses_data_product','uses data product',null,array['ai_use_case'],array['data_product'],true,false,false,'evidence_required',true),
('uses_platform','uses platform',null,array['ai_use_case'],array['platform'],true,false,false,'evidence_required',true),
('governed_by_control','governed by control',null,array['ai_use_case'],array['control'],true,false,false,'evidence_required',true)
on conflict do nothing;

insert into governance.supersession_record(supersession_ref, tenant_key, old_ref, new_ref, object_kind, reason)
values ('SUPER-HCDN-CRM-OWNER','hc-demo-new','FACT-HCDN-CRM-OWNER-V1','FACT-HCDN-CRM-OWNER-V2','fact_assertion','Corrected owner from newer CMDB source version')
on conflict do nothing;

insert into knowledge.relationship_assertion(relationship_ref, tenant_key, from_entity_ref, relationship_type, to_entity_ref, business_meaning, relationship_scope, criticality, dependency_strength, cardinality, evidence_refs, current_target_state, confidence, source_assertion_count)
values
('REL-HCDN-CRM-SUPPORTS-CAP','hc-demo-new','ENT-HCDN-APP-CRM','supports_capability','ENT-HCDN-CAP-ACCESS','Access CRM supports patient-access capability','patient_access','high',0.90,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.92,1),
('REL-HCDN-CRM-ENABLES-PROC','hc-demo-new','ENT-HCDN-APP-CRM','enables_process','ENT-HCDN-PROC-SCHEDULING','Access CRM enables scheduling and intake workflows','patient_access','high',0.88,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.90,1),
('REL-HCDN-CRM-INTEGRATES-IVR','hc-demo-new','ENT-HCDN-APP-CRM','integrates_with','ENT-HCDN-APP-IVR','CRM integrates with IVR for patient access routing','patient_access','medium',0.70,'many_to_many',array['EVID-HCDN-CMDB-002'],'current',0.78,1),
('REL-HCDN-IVR-PRODUCES-TRANSCRIPTS','hc-demo-new','ENT-HCDN-APP-IVR','produces_data','ENT-HCDN-DP-TRANSCRIPTS','IVR and contact center tooling produce transcript data','patient_access','high',0.75,'one_to_many',array['EVID-HCDN-INTERVIEW-001'],'target',0.72,1),
('REL-HCDN-CRM-CONSUMES-TRANSCRIPTS','hc-demo-new','ENT-HCDN-APP-CRM','consumes_data','ENT-HCDN-DP-TRANSCRIPTS','CRM workflow assist consumes governed transcript data when available','patient_access','high',0.70,'many_to_one',array['EVID-HCDN-INTERVIEW-001'],'target',0.70,1),
('REL-HCDN-CRM-HOSTED-CLOUD','hc-demo-new','ENT-HCDN-APP-CRM','hosted_on','ENT-HCDN-PLAT-CLOUD','Access CRM analytics workloads depend on cloud analytics platform','technology','medium',0.65,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.75,1),
('REL-HCDN-CRM-PROVIDED-BY','hc-demo-new','ENT-HCDN-APP-CRM','provided_by','ENT-HCDN-VENDOR-CRM','CRM platform is provided by CRM vendor','vendor','medium',0.80,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.82,1),
('REL-HCDN-CRM-GOVERNED-CONTRACT','hc-demo-new','ENT-HCDN-APP-CRM','governed_by_contract','ENT-HCDN-CONTRACT-CRM','CRM managed service contract governs service obligations','source','medium',0.80,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.80,1),
('REL-HCDN-SERVICE-GOVERNED-CONTRACT','hc-demo-new','ENT-HCDN-SERVICE-CRM','governed_by_contract','ENT-HCDN-CONTRACT-CRM','CRM managed service is governed by contract','source','medium',0.80,'many_to_one',array['EVID-HCDN-CMDB-001'],'current',0.80,1),
('REL-HCDN-PROGRAM-CHANGES-CRM','hc-demo-new','ENT-HCDN-PROGRAM-ACCESS-AI','changes','ENT-HCDN-APP-CRM','Patient Access AI program changes CRM workflow assist','moves','high',0.82,'one_to_many',array['EVID-HCDN-STRATEGY-001'],'target',0.84,1),
('REL-HCDN-RISK-AFFECTS-PROC','hc-demo-new','ENT-HCDN-RISK-AI-ESCALATION','affects','ENT-HCDN-PROC-SCHEDULING','AI escalation risk affects scheduling and intake process','risk','high',0.82,'many_to_many',array['EVID-HCDN-GRC-001'],'current',0.86,1),
('REL-HCDN-RISK-AFFECTS-CRM','hc-demo-new','ENT-HCDN-RISK-AI-ESCALATION','affects','ENT-HCDN-APP-CRM','AI escalation risk affects CRM-assisted workflow','risk','high',0.80,'many_to_many',array['EVID-HCDN-GRC-001'],'current',0.84,1),
('REL-HCDN-CONTROL-MITIGATES-RISK','hc-demo-new','ENT-HCDN-CONTROL-HUMAN-REVIEW','mitigates','ENT-HCDN-RISK-AI-ESCALATION','Human review mitigates AI escalation risk','risk','high',0.86,'many_to_one',array['EVID-HCDN-GRC-001'],'current',0.88,1),
('REL-HCDN-KPI-MEASURES-OUTCOME','hc-demo-new','ENT-HCDN-KPI-CALL-VOLUME','measures','ENT-HCDN-OUTCOME-ACCESS','Call volume measures patient access operating load','metrics','medium',0.70,'many_to_one',array['EVID-HCDN-KPI-001'],'current',0.78,1),
('REL-HCDN-USECASE-USES-DATA','hc-demo-new','ENT-HCDN-AI-USE-CASE-ASSIST','uses_data_product','ENT-HCDN-DP-TRANSCRIPTS','Agent assist use case requires governed transcript data product','ai','high',0.90,'many_to_one',array['EVID-HCDN-INTERVIEW-001'],'target',0.88,1),
('REL-HCDN-USECASE-USES-PLATFORM','hc-demo-new','ENT-HCDN-AI-USE-CASE-ASSIST','uses_platform','ENT-HCDN-PLAT-CLOUD','Agent assist use case depends on cloud analytics platform','ai','medium',0.72,'many_to_one',array['EVID-HCDN-STRATEGY-001'],'target',0.76,1),
('REL-HCDN-USECASE-GOVERNED-CONTROL','hc-demo-new','ENT-HCDN-AI-USE-CASE-ASSIST','governed_by_control','ENT-HCDN-CONTROL-HUMAN-REVIEW','Agent assist is governed by human review control','ai','high',0.90,'many_to_one',array['EVID-HCDN-GRC-001'],'target',0.88,1)
on conflict do nothing;

insert into knowledge.relationship_evidence(relationship_ref, evidence_ref, evidence_role)
select relationship_ref, unnest(evidence_refs), 'supporting'
from knowledge.relationship_assertion
on conflict do nothing;

insert into metrics.metric_definition(metric_definition_ref, tenant_key, metric_name, definition_text, unit_ref)
values
('METDEF-HCDN-CALL-VOLUME','hc-demo-new','Annual call volume','Annual patient access contact-center call volume','calls'),
('METDEF-HCDN-WAIT-TIME','hc-demo-new','Access wait time','Patient access wait time range shared by client','days'),
('METDEF-HCDN-REVENUE','hc-demo-new','Revenue cycle impact','Sensitive revenue-cycle impact field withheld by client','usd')
on conflict do nothing;

insert into metrics.metric_observation(metric_observation_ref, tenant_key, metric_definition_ref, entity_ref, observation_period, disclosure_mode, value_numeric, value_range_low, value_range_high, withheld_reason, evidence_refs)
values
('METOBS-HCDN-CALL-VOLUME-2026','hc-demo-new','METDEF-HCDN-CALL-VOLUME','ENT-HCDN-ORG-PATIENT-ACCESS','2026','exact',3000000,null,null,null,array['EVID-HCDN-KPI-001']),
('METOBS-HCDN-WAIT-TIME-2026','hc-demo-new','METDEF-HCDN-WAIT-TIME','ENT-HCDN-ORG-PATIENT-ACCESS','2026','range',null,18,24,null,array['EVID-HCDN-KPI-002']),
('METOBS-HCDN-REVENUE-2026','hc-demo-new','METDEF-HCDN-REVENUE','ENT-HCDN-ORG-PATIENT-ACCESS','2026','withheld',null,null,null,'Client withheld exact and range values',array['EVID-HCDN-KPI-003'])
on conflict do nothing;

insert into metrics.metric_attestation(attestation_ref, metric_observation_ref, attested_by_role, attestation_state)
values ('ATT-HCDN-CALL-VOLUME','METOBS-HCDN-CALL-VOLUME-2026','Finance analytics owner','accepted')
on conflict do nothing;

insert into governance.review_decision(review_decision_ref, tenant_key, target_ref, target_kind, review_state, authority_state, reviewer_role, rationale)
values
('REV-HCDN-CRM-OWNER','hc-demo-new','FACT-HCDN-CRM-OWNER-V2','fact_assertion','accepted','accepted','Data steward','Newer CMDB source version supersedes prior owner assertion'),
('REV-HCDN-REJECTED-CANDIDATE','hc-demo-new','FC-HCDN-CRM-OWNER-V1','fact_candidate','rejected','rejected','Data steward','Prior owner assertion retained historically but excluded from current projection')
on conflict do nothing;

insert into governance.authority_transition(transition_ref, tenant_key, target_ref, from_authority_state, to_authority_state, transition_reason, review_decision_ref)
values ('AUTH-HCDN-CRM-OWNER','hc-demo-new','FACT-HCDN-CRM-OWNER-V2','candidate','accepted','Review accepted corrected owner','REV-HCDN-CRM-OWNER')
on conflict do nothing;

insert into governance.knowledge_gap(gap_ref, tenant_key, gap_type, description, evidence_needed, owner_role, availability_state)
values ('GAP-HCDN-TRANSCRIPT-GOV','hc-demo-new','missing_evidence','Transcript governance evidence is not loaded for agent-assist scaling','Contact-center transcript policy and retention evidence','Contact center owner','missing')
on conflict do nothing;

insert into governance.knowledge_conflict(conflict_ref, tenant_key, conflict_type, subject_ref, conflicting_refs, conflict_state, resolution_ref)
values ('CONFLICT-HCDN-CRM-OWNER','hc-demo-new','competing_owner_assertions','ENT-HCDN-APP-CRM',array['FACT-HCDN-CRM-OWNER-V1','FACT-HCDN-CRM-OWNER-V2'],'resolved','REV-HCDN-CRM-OWNER')
on conflict do nothing;

insert into governance.completion_work_item(work_item_ref, tenant_key, gap_ref, owner_role)
values ('CWI-HCDN-TRANSCRIPT-GOV','hc-demo-new','GAP-HCDN-TRANSCRIPT-GOV','Contact center owner')
on conflict do nothing;

insert into publication.domain_publication(domain_publication_ref, tenant_key, domain_ref, version_number, publication_state, source_manifest_hash)
values ('DPUB-HCDN-ACCESS-001','hc-demo-new','patient_access',1,'built','manifest-hcdn-local-001'),
       ('DPUB-HCDN-FAILED-002','hc-demo-new','patient_access',2,'failed','manifest-hcdn-local-001')
on conflict do nothing;

insert into publication.domain_publication_item(publication_item_ref, domain_publication_ref, item_kind, item_ref, item_hash)
values
('DPUBITEM-HCDN-APP-CRM','DPUB-HCDN-ACCESS-001','entity','ENT-HCDN-APP-CRM','itemhash-app-crm'),
('DPUBITEM-HCDN-REL-CRM-PA','DPUB-HCDN-ACCESS-001','relationship','REL-HCDN-CRM-SUPPORTS-PA','itemhash-rel-crm-pa'),
('DPUBITEM-HCDN-GAP-TRANSCRIPT','DPUB-HCDN-ACCESS-001','gap','GAP-HCDN-TRANSCRIPT-GOV','itemhash-gap-transcript')
on conflict do nothing;

insert into publication.knowledge_baseline(knowledge_baseline_ref, tenant_key, baseline_version, publication_state, baseline_manifest)
values
('KB-HCDN-000001','hc-demo-new',1,'built','{"tenantKey":"hc-demo-new","domains":["patient_access"],"sourceManifestHash":"manifest-hcdn-local-001","modelProvidersRequired":false}'::jsonb),
('KB-HCDN-FAILED','hc-demo-new',2,'draft','{"tenantKey":"hc-demo-new","domains":["patient_access"],"incomplete":true}'::jsonb)
on conflict do nothing;

insert into publication.knowledge_baseline_domain(baseline_domain_ref, knowledge_baseline_ref, domain_publication_ref)
values ('KBDOM-HCDN-ACCESS-001','KB-HCDN-000001','DPUB-HCDN-ACCESS-001')
on conflict do nothing;

select publication.activate_baseline('KB-HCDN-000001','ACT-HCDN-000001')
where not exists (select 1 from publication.publication_activation where activation_ref='ACT-HCDN-000001');

select publication.try_failed_activation('KB-HCDN-FAILED','ACT-HCDN-FAILED')
where not exists (select 1 from publication.publication_activation where activation_ref='ACT-HCDN-FAILED');

insert into consumption.enterprise_brief(enterprise_brief_ref, tenant_key, knowledge_baseline_ref, title, executive_summary, evidence_refs, gaps, authority_summary)
values ('EB-HCDN-000001','hc-demo-new','KB-HCDN-000001','Patient access knowledge baseline','Access CRM supports Patient Access; identity and transcript governance remain key proof gaps before scaling agent assist.',array['EVID-HCDN-CMDB-001','EVID-HCDN-INTERVIEW-001'],array['GAP-HCDN-TRANSCRIPT-GOV'],'{"acceptedFacts":2,"candidateFactsExcluded":true,"modelProvidersRequired":false}'::jsonb)
on conflict do nothing;

insert into consumption.domain_overview(domain_overview_ref, tenant_key, domain_ref, knowledge_baseline_ref, overview_payload)
values ('DOV-HCDN-ACCESS','hc-demo-new','patient_access','KB-HCDN-000001','{"readiness":"planning_grade","primaryGap":"transcript_governance"}')
on conflict do nothing;

insert into consumption.entity_inventory(inventory_ref, tenant_key, knowledge_baseline_ref, object_class, entity_ref, display_name, authority_state, evidence_refs)
select 'INV-' || entity_ref, 'hc-demo-new', 'KB-HCDN-000001', object_class, entity_ref, display_name, authority_state, array['EVID-HCDN-CMDB-001']
from knowledge.entity
on conflict do nothing;

insert into consumption.entity_detail(entity_detail_ref, tenant_key, knowledge_baseline_ref, entity_ref, detail_payload)
values ('DETAIL-HCDN-APP-CRM','hc-demo-new','KB-HCDN-000001','ENT-HCDN-APP-CRM','{"displayName":"Access CRM","owner":"Digital Experience","lifecycle":"active","knownGap":"Transcript governance not loaded"}')
on conflict do nothing;

insert into consumption.relationship_projection(relationship_projection_ref, tenant_key, knowledge_baseline_ref, from_entity_ref, relationship_type, to_entity_ref, evidence_refs, authority_state)
select 'RPROJ-' || relationship_ref, tenant_key, 'KB-HCDN-000001', from_entity_ref, relationship_type, to_entity_ref, evidence_refs, authority_state
from knowledge.relationship_assertion
where authority_state='accepted' and superseded_at is null
on conflict do nothing;

insert into consumption.relationship_node_v1(graph_node_ref, tenant_key, knowledge_baseline_ref, entity_ref, entity_type, display_name, lifecycle_state, current_target_state, authority_state)
select 'GNODE-' || entity_ref, tenant_key, 'KB-HCDN-000001', entity_ref, object_class, display_name, lifecycle_state, current_target_state, authority_state
from knowledge.entity
where authority_state='accepted'
on conflict do nothing;

insert into consumption.relationship_edge_v1(graph_edge_ref, tenant_key, knowledge_baseline_ref, relationship_ref, from_entity_ref, relationship_type, to_entity_ref, current_target_state, evidence_refs, authority_state, relationship_publication_version)
select 'GEDGE-' || relationship_ref, tenant_key, 'KB-HCDN-000001', relationship_ref, from_entity_ref, relationship_type, to_entity_ref, current_target_state, evidence_refs, authority_state, 'relationships-1.0'
from knowledge.relationship_assertion
where authority_state='accepted' and superseded_at is null and publication_state='built'
on conflict do nothing;

insert into consumption.relationship_evidence_v1(graph_evidence_ref, tenant_key, knowledge_baseline_ref, relationship_ref, evidence_ref, evidence_role)
select 'GEVID-' || re.relationship_ref || '-' || re.evidence_ref, 'hc-demo-new', 'KB-HCDN-000001', re.relationship_ref, re.evidence_ref, re.evidence_role
from knowledge.relationship_evidence re
on conflict do nothing;

insert into consumption.relationship_query_index_v1(query_index_ref, tenant_key, knowledge_baseline_ref, query_preset, allowed_relationship_types, default_hop_depth, max_nodes, empty_state_message)
values
('GQI-HCDN-WHAT-DEPENDS','hc-demo-new','KB-HCDN-000001','what_depends_on_this_application',array['supports_capability','enables_process','integrates_with','consumes_data','produces_data','hosted_on','provided_by','governed_by_contract'],1,75,'No accepted relationships are currently available for this scope. Candidate relationships may be awaiting review.'),
('GQI-HCDN-IMPACT','hc-demo-new','KB-HCDN-000001','downstream_impact',array['supports_capability','enables_process','changes','affects','mitigates','measures'],2,75,'No accepted downstream impact paths are available for this scope.')
on conflict do nothing;

insert into consumption.relationship_graph_v1(graph_ref, tenant_key, knowledge_baseline_ref, relationship_publication_version, query_preset, focal_entity_ref, hop_depth, authority_filter, current_target_state, node_count, edge_count, coverage, limitations)
values
('GRAPH-HCDN-CRM-ONE-HOP','hc-demo-new','KB-HCDN-000001','relationships-1.0','what_depends_on_this_application','ENT-HCDN-APP-CRM',1,'accepted','current',
  (select count(distinct x.entity_ref) from (
    select from_entity_ref as entity_ref from knowledge.relationship_assertion where from_entity_ref='ENT-HCDN-APP-CRM' or to_entity_ref='ENT-HCDN-APP-CRM'
    union select to_entity_ref from knowledge.relationship_assertion where from_entity_ref='ENT-HCDN-APP-CRM' or to_entity_ref='ENT-HCDN-APP-CRM'
  ) x),
  (select count(*) from knowledge.relationship_assertion where (from_entity_ref='ENT-HCDN-APP-CRM' or to_entity_ref='ENT-HCDN-APP-CRM') and authority_state='accepted' and superseded_at is null),
  '{"acceptedEdges":8,"candidateEdgesExcluded":1,"maxNodes":75,"truncated":false}'::jsonb,
  array['Transcript governance evidence remains incomplete for target-state AI use.'])
on conflict do nothing;

insert into consumption.entity_impact_summary_v1(impact_summary_ref, tenant_key, knowledge_baseline_ref, entity_ref, one_hop_neighbors, two_hop_neighbors, candidate_edges_excluded, open_gap_refs, summary_payload)
values
('IMPACT-HCDN-APP-CRM','hc-demo-new','KB-HCDN-000001','ENT-HCDN-APP-CRM',
  (select count(distinct x.entity_ref) from (
    select from_entity_ref as entity_ref from knowledge.relationship_assertion where from_entity_ref='ENT-HCDN-APP-CRM' or to_entity_ref='ENT-HCDN-APP-CRM'
    union select to_entity_ref from knowledge.relationship_assertion where from_entity_ref='ENT-HCDN-APP-CRM' or to_entity_ref='ENT-HCDN-APP-CRM'
  ) x),
  12,
  (select count(*) from working.relationship_candidate where review_state='not_reviewed'),
  array['GAP-HCDN-TRANSCRIPT-GOV'],
  '{"businessMeaning":"Access CRM is connected to patient access capability, scheduling process, IVR, transcript data, cloud platform, vendor, contract, program, risk and controls."}'::jsonb)
on conflict do nothing;

insert into consumption.metric_projection(metric_projection_ref, tenant_key, knowledge_baseline_ref, metric_definition_ref, projection_payload)
select 'MPROJ-' || metric_definition_ref, 'hc-demo-new', 'KB-HCDN-000001', metric_definition_ref,
       jsonb_agg(jsonb_build_object('observationRef', metric_observation_ref, 'disclosureMode', disclosure_mode, 'valueNumeric', value_numeric, 'rangeLow', value_range_low, 'rangeHigh', value_range_high, 'withheldReason', withheld_reason, 'evidenceRefs', evidence_refs))
from metrics.metric_observation
group by metric_definition_ref
on conflict do nothing;

insert into consumption.evidence_gap_projection(evidence_gap_projection_ref, tenant_key, knowledge_baseline_ref, gap_ref, projection_payload)
values ('EGAP-HCDN-TRANSCRIPT-GOV','hc-demo-new','KB-HCDN-000001','GAP-HCDN-TRANSCRIPT-GOV','{"whyItMatters":"Agent assist scale requires governed transcript evidence.","evidenceNeeded":"Contact-center transcript policy and retention evidence"}')
on conflict do nothing;

insert into consumption.strategic_insight(strategic_insight_ref, tenant_key, knowledge_baseline_ref, insight_text, evidence_refs, authority_state)
values ('SI-HCDN-ACCESS-AI','hc-demo-new','KB-HCDN-000001','Patient access AI should start with governed workflow assist, not autonomous resolution, until identity and transcript governance are proven.',array['EVID-HCDN-STRATEGY-001','EVID-HCDN-INTERVIEW-001'],'accepted')
on conflict do nothing;

insert into consumption.executive_perspective(executive_perspective_ref, tenant_key, knowledge_baseline_ref, perspective_text, evidence_refs, authority_state)
values ('EP-HCDN-CIO-001','hc-demo-new','KB-HCDN-000001','CIO/CDO perspective: identity and transcript governance are blockers before scaling agent assist.',array['EVID-HCDN-INTERVIEW-001'],'planning_grade')
on conflict do nothing;

insert into consumption.industry_assessment(industry_assessment_ref, tenant_key, knowledge_baseline_ref, assessment_payload)
values ('IA-HCDN-ACCESS','hc-demo-new','KB-HCDN-000001','{"pattern":"Healthcare contact-center AI value depends on workflow integration, escalation design, and governed data foundation."}')
on conflict do nothing;

insert into consumption.search_document(search_document_ref, tenant_key, knowledge_baseline_ref, document_title, document_text, metadata, evidence_refs)
values ('SEARCH-HCDN-ACCESS-001','hc-demo-new','KB-HCDN-000001','Patient access baseline','Access CRM supports Patient Access. Transcript governance remains an open evidence gap.','{"domain":"patient_access","scope":"current"}',array['EVID-HCDN-CMDB-001','EVID-HCDN-INTERVIEW-001'])
on conflict do nothing;

insert into consumption.module_packet_projection(module_packet_ref, tenant_key, knowledge_baseline_ref, target_module, packet_payload, packet_hash)
values
('PACKET-HCDN-AVA-001','hc-demo-new','KB-HCDN-000001','Intelligence/aVa','{"knowledgeSnapshotRef":"KB-HCDN-000001","authorityState":"accepted","evidenceRefs":["EVID-HCDN-CMDB-001","EVID-HCDN-INTERVIEW-001"],"gaps":["GAP-HCDN-TRANSCRIPT-GOV"],"facts":[{"factRef":"FACT-HCDN-CRM-OWNER-V2","predicate":"owned_by"}],"relationships":["REL-HCDN-CRM-SUPPORTS-PA"],"modelProvidersRequired":false}'::jsonb,'packethash-hcdn-ava-001'),
('PACKET-HCDN-HOME-001','hc-demo-new','KB-HCDN-000001','Home','{"knowledgeSnapshotRef":"KB-HCDN-000001","zeroLLM":true,"briefRef":"EB-HCDN-000001"}'::jsonb,'packethash-hcdn-home-001')
on conflict do nothing;

insert into audit.change_event(change_event_ref, tenant_key, event_type, target_ref, event_payload)
values ('CHG-HCDN-SUPER-001','hc-demo-new','supersession','FACT-HCDN-CRM-OWNER-V2','{"old":"FACT-HCDN-CRM-OWNER-V1","new":"FACT-HCDN-CRM-OWNER-V2"}')
on conflict do nothing;

insert into audit.rule_execution(rule_execution_ref, tenant_key, rule_name, result, target_ref)
values ('RULE-HCDN-NO-ZERO-001','hc-demo-new','no_missing_number_becomes_zero','pass','METOBS-HCDN-REVENUE-2026')
on conflict do nothing;

insert into audit.publication_lineage(publication_lineage_ref, tenant_key, knowledge_baseline_ref, lineage_payload)
values ('PLIN-HCDN-000001','hc-demo-new','KB-HCDN-000001','{"sourceVersions":["SRCV-HCDN-CMDB-V001","SRCV-HCDN-CMDB-V002","SRCV-HCDN-KPI-V001"],"domainPublications":["DPUB-HCDN-ACCESS-001"]}')
on conflict do nothing;
