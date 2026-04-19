// Migration 008 · Healthcare vertical graph — Pack I Phase 2
// Depends on 007_cross_industry.cypher (System / Team node constraints).
// Additive: adds 6 new node constraints for healthcare-specific entities.

// --- Node uniqueness constraints ------------------------------------------
CREATE CONSTRAINT rc_process_id IF NOT EXISTS
  FOR (r:RevenueCycleProcess) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT clinical_ops_id IF NOT EXISTS
  FOR (c:ClinicalOps) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT org_unit_id IF NOT EXISTS
  FOR (o:OrgUnit) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT clinician_id IF NOT EXISTS
  FOR (c:Clinician) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT workflow_id IF NOT EXISTS
  FOR (w:Workflow) REQUIRE w.id IS UNIQUE;

CREATE CONSTRAINT patient_id IF NOT EXISTS
  FOR (p:Patient) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT digital_channel_id IF NOT EXISTS
  FOR (d:DigitalChannel) REQUIRE d.id IS UNIQUE;

// --- Relationship vocabulary documented inline ---------------------------
// (:UseCase) -[:IMPACTS]->       (:RevenueCycleProcess)
// (:RevenueCycleProcess) -[:OWNS]-> (:Metric)
// (:OrgUnit) -[:RUNS]->          (:ClinicalOps)
// (:OrgUnit) -[:IS_A]->          (:Hospital|:Clinic|:ED|:OR|:ICU|:Specialty)
// (:Clinician) -[:PERFORMS]->    (:Workflow)
// (:Clinician) -[:WORKS_IN]->    (:OrgUnit)
// (:Patient) -[:USES]->          (:DigitalChannel)
// (:Patient) -[:VISITED]->       (:OrgUnit)
// (:Workflow) -[:HAS_STEP]->     (:WorkflowStep)
