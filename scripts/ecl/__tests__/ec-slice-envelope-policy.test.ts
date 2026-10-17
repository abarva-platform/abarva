import assert from 'node:assert/strict';
import test from 'node:test';
import { GovernedObjectSchema, evaluateGovernedObject } from '../../../src/lib/governance/context-corpus-policy';
import { buildValidatedAgentContextBundle, type GovernedCandidate } from '../../../src/lib/governance/agent-context-bundle';
import { adaptEcPrivateCandidateV0 } from '../adapt_ec_private_candidate_v0';
import { makeEcPrivateCandidateFixture } from './ec_private_candidate_fixture';

test('every actual adapter envelope row parses as governed, blocks, and stays out of advisory context', () => {
  const fixture = makeEcPrivateCandidateFixture();
  const envelope = adaptEcPrivateCandidateV0(fixture.input,fixture.binding);
  const rows = [...envelope.source_file,...envelope.source_record,...envelope.object,...envelope.assertion,
    ...envelope.measure,...envelope.relationship,...envelope.document,...envelope.evidence_item];
  assert.ok(rows.length > 0);
  const candidates:GovernedCandidate[]=[];
  for (const row of rows) {
    const governed = GovernedObjectSchema.parse({
      id:row.id,tenant_id:null,client_key:row.tenant_key,object_type:'ec_candidate',source_layer:'tenant_context',
      industry:null,enterprise_area:null,function:null,process_area:null,use_case_category:null,
      source_basis:'fictional_private_candidate_not_client_attested',classification:'internal',compliance_basis:null,
      agent_readiness_status:row.agent_readiness_status,retrievability:'not_indexed',confidence_level:'unverified',
      confidence_rationale:null,cited_render_verified_at:null,last_reviewed_at:null,owner:null,
      measurement_method:null,provenance:null,contract_hash:null,created_at:null,updated_at:null,
    });
    const verdict=evaluateGovernedObject(governed);
    assert.equal(verdict.decision,'block');
    assert.equal(verdict.agentReady,false);
    assert.ok(verdict.errors.some(error=>error.includes('blocked')));
    candidates.push({...governed,downstream_context_policy:row.downstream_context_policy});
  }
  for (const requireAgentReady of [true,false]) {
    const result=buildValidatedAgentContextBundle(candidates,{requireAgentReady,allowSensitive:true,allowRestrictedDownstreamContext:true});
    assert.equal(result.usable.length,0);
    assert.equal(result.agentReadyCount,0);
    assert.equal(result.blocked.length,rows.length);
    assert.deepEqual(result.citations,[]);
  }
});
