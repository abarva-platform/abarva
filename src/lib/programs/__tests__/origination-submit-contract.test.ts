import fs from 'node:fs';
import path from 'node:path';

describe('origination submit insert contract', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/programs/origination-submit.ts'),
      'utf8',
    );
  });

  it('writes legacy-compatible engagement fields required by older live schemas', () => {
    expect(source).toContain('buildEngagementGraphNodeId(input.programName)');
    expect(source).toContain('graph_node_id: graphNodeId');
    expect(source).toContain('let legacySolutionSlot = input.programName');
    expect(source).toContain('solution: legacySolutionSlot');
    expect(source).toContain('idx_engagements_one_active');
    expect(source).toContain('engagementInsertPayload.solution = legacySolutionSlot');
    expect(source).toContain('value_projected_low_usd: parsedValueRange?.low ?? null');
    expect(source).toContain('value_projected_high_usd: parsedValueRange?.high ?? null');
    expect(source).toContain('value_verified_status: parsedValueRange ? "pending" : null');
    expect(source).toContain('value_currency: "USD"');
    expect(source).toContain('value_assumptions_jsonb: valueAssumptions');
  });

  it('writes charter JSONB to engagement at P0 origination', () => {
    // charter must be computed and written in the same insert
    expect(source).toContain('buildOriginationCharter(');
    expect(source).toContain('charter,');
    // charter helper must capture all 7 scaffold fields
    expect(source).toContain('problem_statement: input.problemStatement');
    expect(source).toContain('archetype: input.classification ?? programArchetype');
    expect(source).toContain('resolved_program_archetype: programArchetype');
    expect(source).toContain('sponsor_candidate: input.sponsor');
    expect(source).toContain('resolved_sponsor_candidate:');
    expect(source).toContain('scope_boundary: input.scopeBoundary');
    expect(source).toContain('evidence_family: input.evidenceFamily');
    expect(source).toContain('value_hypothesis: input.targetOutcome');
    expect(source).toContain('foundation_readiness: input.timeline');
    // initiative context must be preserved
    expect(source).toContain('initiative_context: input.fromInitiativeId');
  });

  it('wires the Wave 2 modules into the origination charter (Slices 2.2 / 2.3 / 2.5)', () => {
    // Adapter composed from the single Slice 2.1 suitability result.
    expect(source).toContain('originationCharterExtensions');
    expect(source).toContain('const suitabilityResult = assessOriginationBrief(');
    expect(source).toContain(
      'const charterExtensions = originationCharterExtensions(suitabilityResult)',
    );
    // Suitability fragment still wired from the same shared result.
    expect(source).toContain('suitabilityCharterFragment(suitabilityResult)');
    // All three additive Wave 2 charter JSONB fields.
    expect(source).toContain(
      'workflow_decomposition: charterExtensions.workflow_decomposition',
    );
    expect(source).toContain(
      'solution_architecture: charterExtensions.solution_architecture',
    );
    expect(source).toContain(
      'control_eval_matrix: charterExtensions.control_eval_matrix',
    );
  });

  it('dual-writes the function pack key — the column AND charter.functionPackKey', () => {
    // The first-class column promotion (function_pack_key). Origination must
    // DUAL-WRITE: the new `engagements.function_pack_key` /
    // `function_pack_confidence` columns AND keep the legacy
    // `charter.functionPackKey` so a rollback to the pre-column code is safe.

    // (1) The classified identity is promoted out of the charter builder.
    expect(source).toContain('functionPackIdentity');
    expect(source).toContain(
      'const { charter, functionPackIdentity } = buildOriginationCharter(',
    );

    // (2) The new columns are set on the engagements insert from that identity.
    expect(source).toContain(
      'function_pack_key: functionPackIdentity?.functionPackKey ?? null',
    );
    expect(source).toContain(
      'function_pack_confidence:',
    );
    expect(source).toContain('functionPackIdentity?.functionPackConfidence ?? null');

    // (3) The legacy charter key is STILL written — the rollback safety net.
    expect(source).toContain('CHARTER_FUNCTION_PACK_KEY');
    expect(source).toContain('CHARTER_FUNCTION_PACK_CONFIDENCE_KEY');
    expect(source).toContain('[CHARTER_FUNCTION_PACK_KEY]: functionPackIdentity.functionPackKey');
  });

  it('accepts and persists origination chat turns to turns table', () => {
    // Input type must include turns
    expect(source).toContain('originationTurns?: OriginationTurn[] | null');
    // Turns must be written to DB after engagement creation
    expect(source).toContain('persistOriginationTurns(');
    expect(source).toContain('sender: t.role === "assistant" ? "agent" : "user"');
    // Phase 0 — origination phase
    expect(source).toContain('phase: 0');
  });

  it('creates the Packet 22 decision thread during Intelligence-originated Move submit', () => {
    expect(source).toContain('import { ensureThreadForMove } from "@/lib/decisions/auto-linker"');
    expect(source).toContain('originatingIntelligenceSessionId?: string | null');
    expect(source).toContain('decisionThreadTitle?: string | null');
    expect(source).toContain('decisionThreadOwnerRole?: string | null');
    expect(source).toContain('originatingIntelligenceSessionId: optionalText(');
    expect(source).toContain('const decisionThread = await ensureThreadForMove({');
    expect(source).toContain('intelligenceSessionId:');
    expect(source).toContain('input.originatingIntelligenceSessionId ?? undefined');
    expect(source).toContain('linkReason: input.originatingIntelligenceSessionId');
    expect(source).toContain('decisionThreadId: decisionThread.id');
    expect(source).toContain('dossierUrl: `/dossier/${decisionThread.id}`');
  });

  it('requires and persists Intelligence pattern promotion approval evidence', () => {
    expect(source).toContain('@/lib/programs/intelligence-promotion-approval');
    expect(source).toContain('validateIntelligencePromotionApproval');
    expect(source).toContain('normalizePromotionRationale');
    expect(source).toContain('optionalStringArray');
    expect(source).toContain('humanPromotionAccepted?: boolean | null');
    expect(source).toContain('humanPromotionRationale?: string | null');
    expect(source).toContain('promotionEvidenceRefs?: string[] | null');
    expect(source).toContain('"intelligence_promotion_approval_required"');
    expect(source).toContain('briefSnapshot.intelligence_promotion_gate');
    expect(source).toContain('source: "intelligence_thread"');
    expect(source).toContain('source_thread_id: input.originatingIntelligenceSessionId');
    expect(source).toContain('selected_pattern_key: input.matchedPatternId');
    expect(source).toContain('human_promotion_accepted: input.humanPromotionAccepted === true');
    expect(source).toContain('human_promotion_rationale: promotionApproval.rationale');
    expect(source).toContain('evidence_refs: promotionApproval.evidenceRefs');
    expect(source).toContain('accepted_by_user_id: tenancy.userId');
  });

  it('accepts extended scaffold fields scopeBoundary and evidenceFamily', () => {
    expect(source).toContain('scopeBoundary?: string | null');
    expect(source).toContain('evidenceFamily?: string | null');
    expect(source).toContain('fromInitiativeId?: string | null');
    expect(source).toContain('fromGapUsd?: number | null');
  });
});
