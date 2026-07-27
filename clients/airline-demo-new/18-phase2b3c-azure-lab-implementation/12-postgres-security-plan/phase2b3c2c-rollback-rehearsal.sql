\set ON_ERROR_STOP on

-- Rollback rehearsal for Airline Demo New. Plan-only until an independent migration review authorizes execution.
do $$
begin
  if current_database() <> 'abarva_airline_demo_new_knowledge_lab' then
    raise exception 'wrong database target: %, expected abarva_airline_demo_new_knowledge_lab', current_database();
  end if;
end $$;

select audit.assert_airdn_tenant('airline-demo-new');

-- Rehearsal posture: prove rollback is explicit and bounded. No tables are dropped here.
revoke insert, update, delete on all tables in schema publication, consumption from airline_demo_new_ingest, airline_demo_new_reviewer;
revoke all on schema working from airline_demo_new_reader;
revoke all on all tables in schema working from airline_demo_new_reader;
