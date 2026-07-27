export function evaluateSemanticGateRecords({ entities = [], facts = [], relationships = [] } = {}) {
  const blockers = [];
  const entityRefs = new Set(entities.map((entity) => entity.entity_ref ?? entity.entityRef).filter(Boolean));

  for (const fact of facts) {
    const ref = fact.fact_ref ?? fact.candidate_ref ?? "unknown_fact";
    const availability = fact.availability_state ?? fact.availabilityState;
    const authority = fact.authority_state ?? fact.authorityState;
    const reviewState = fact.review_state ?? fact.reviewState;
    const value = fact.fact_value ?? fact.factValue ?? fact.metric_value ?? fact.metricValue;
    const sourceValue = fact.source_value ?? fact.sourceValue;
    const disclosureMode = fact.disclosure_mode ?? fact.disclosureMode;

    if (availability === "not_loaded" && (value === 0 || value === "0") && (sourceValue === null || sourceValue === undefined || sourceValue === "")) {
      blockers.push({ code: "missing_coerced_to_zero", objectRef: ref });
    }
    if (disclosureMode === "withheld" && availability !== "withheld") {
      blockers.push({ code: "withheld_not_marked_withheld", objectRef: ref });
    }
    if ((reviewState === "not_reviewed" || reviewState === "quarantined") && (authority === "accepted" || authority === "published")) {
      blockers.push({ code: "candidate_marked_accepted", objectRef: ref });
    }
  }

  for (const relationship of relationships) {
    const ref = relationship.relationship_ref ?? relationship.candidate_ref ?? "unknown_relationship";
    const from = relationship.from_entity_ref ?? relationship.fromEntityRef ?? relationship.from_candidate_ref;
    const to = relationship.to_entity_ref ?? relationship.toEntityRef ?? relationship.to_candidate_ref;
    const currentTarget = relationship.current_target_state ?? relationship.currentTargetState;
    const payload = relationship.relationship_payload ?? relationship.payload ?? {};

    if (currentTarget === "target" && (payload.current === true || payload.state === "current")) {
      blockers.push({ code: "target_reinterpreted_as_current", objectRef: ref });
    }
    if (entityRefs.size > 0 && (!entityRefs.has(from) || !entityRefs.has(to))) {
      blockers.push({ code: "broken_relationship_endpoint", objectRef: ref, from, to });
    }
  }

  return {
    passed: blockers.length === 0,
    blockers,
  };
}

