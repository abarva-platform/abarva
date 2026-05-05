-- Knowledge Layer Inventory Queries
-- Date: 2026-05-05
-- Status: read-only inspection only. No writes, no mutations.
-- Run these against the Supabase service-role connection to audit
-- current state of the knowledge / pattern substrate.
-- Reference: docs/design/knowledge-layer/KNOWLEDGE_LAYER_INVENTORY_2026-05-05.md

-- ============================================================
-- SECTION 1 · Pattern packs overview
-- ============================================================

-- 1.1 All pattern packs, by tenant
SELECT
    pp.id,
    pp.tenant_id,
    pp.title,
    pp.confidence_level,
    pp.version,
    pp.last_updated,
    jsonb_array_length(COALESCE(pp.sector_applicability::jsonb, '[]'::jsonb)) AS sector_count,
    jsonb_array_length(COALESCE(pp.trigger_symptoms::jsonb, '[]'::jsonb)) AS symptom_count,
    jsonb_array_length(COALESCE(pp.diagnostic_questions::jsonb, '[]'::jsonb)) AS question_count
FROM pattern_packs pp
ORDER BY pp.tenant_id, pp.confidence_level DESC;

-- 1.2 Cross-industry (foundational) pattern packs
SELECT
    fpp.id,
    fpp.title,
    fpp.confidence_level,
    COUNT(fpv.id) AS variant_count
FROM foundational_pattern_packs fpp
LEFT JOIN foundational_pattern_variants fpv ON fpv.pattern_pack_id = fpp.id
GROUP BY fpp.id, fpp.title, fpp.confidence_level
ORDER BY fpp.confidence_level DESC;

-- 1.3 Patterns with unset / null required jsonb fields (data quality check)
SELECT
    id,
    tenant_id,
    title,
    (detection_signals IS NULL)       AS missing_detection_signals,
    (likely_root_causes IS NULL)      AS missing_root_causes,
    (intervention_options IS NULL)    AS missing_interventions,
    (evidence_requirements IS NULL)   AS missing_evidence_requirements,
    (common_failure_modes IS NULL)    AS missing_failure_modes
FROM pattern_packs
WHERE detection_signals IS NULL
   OR likely_root_causes IS NULL
   OR intervention_options IS NULL
   OR evidence_requirements IS NULL
   OR common_failure_modes IS NULL
ORDER BY tenant_id, title;


-- ============================================================
-- SECTION 2 · Engagement topics (programs pattern/topic catalog)
-- ============================================================

-- 2.1 All engagement topics with key stats
SELECT
    et.id,
    et.topic_key,
    et.deployment_count,
    et.successful_deployment_count,
    et.promotion_state,
    array_length(et.key_patterns, 1) AS key_pattern_count,
    array_length(et.industries, 1)   AS industry_count
FROM engagement_topics et
ORDER BY et.deployment_count DESC NULLS LAST;

-- 2.2 Topics with no key patterns (orphaned topics)
SELECT id, topic_key, promotion_state
FROM engagement_topics
WHERE key_patterns IS NULL OR array_length(key_patterns, 1) = 0;

-- 2.3 Topic to engagement mapping counts
SELECT
    et.topic_key,
    COUNT(etm.engagement_id) AS engagement_count
FROM engagement_topics et
LEFT JOIN engagement_topics_map etm ON etm.topic_id = et.id
GROUP BY et.topic_key
ORDER BY engagement_count DESC;


-- ============================================================
-- SECTION 3 · Pattern match classifier telemetry
-- ============================================================

-- 3.1 Classifier usage by pattern key, last 30 days
SELECT
    pattern_key,
    COUNT(*) AS match_count,
    AVG(match_confidence) AS avg_confidence,
    MAX(created_at) AS last_matched_at
FROM pattern_match_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY pattern_key
ORDER BY match_count DESC
LIMIT 50;

-- 3.2 Classifier confidence distribution
SELECT
    CASE
        WHEN match_confidence >= 0.8 THEN 'high (≥0.8)'
        WHEN match_confidence >= 0.4 THEN 'medium (0.4-0.8)'
        ELSE 'below threshold (<0.4)'
    END AS band,
    COUNT(*) AS count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM pattern_match_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 2 DESC;

-- 3.3 Patterns that have never matched (dead patterns in the classifier)
-- Note: this compares engagement_topics.topic_key, not PatternSeed IDs.
-- Adjust join key if your pattern_match_logs.pattern_key maps differently.
SELECT et.topic_key
FROM engagement_topics et
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_match_logs pml WHERE pml.pattern_key = et.topic_key
)
ORDER BY et.topic_key;


-- ============================================================
-- SECTION 4 · Genome patterns (Layer 3)
-- ============================================================

-- 4.1 Genome pattern distribution by type and vertical
SELECT
    pattern_type,
    vertical,
    COUNT(*) AS count,
    AVG(confidence) AS avg_confidence,
    AVG(source_count) AS avg_source_count
FROM genome_patterns
GROUP BY pattern_type, vertical
ORDER BY count DESC;

-- 4.2 High-confidence genome patterns (potential promotions to TS corpus)
SELECT id, pattern_type, vertical, confidence, source_count
FROM genome_patterns
WHERE confidence >= 0.8
ORDER BY confidence DESC, source_count DESC
LIMIT 20;


-- ============================================================
-- SECTION 5 · Signal catalog
-- ============================================================

-- 5.1 Signals with recommended patterns count
SELECT
    id,
    signal_key,
    array_length(recommended_pattern_keys, 1) AS recommended_count
FROM signal_catalog
ORDER BY recommended_count DESC NULLS LAST;

-- 5.2 Signals with no recommended patterns (orphaned signals)
SELECT id, signal_key
FROM signal_catalog
WHERE recommended_pattern_keys IS NULL
   OR array_length(recommended_pattern_keys, 1) = 0;


-- ============================================================
-- SECTION 6 · Emergent patterns
-- ============================================================

-- 6.1 Emergent patterns by industry and tier
SELECT
    industry,
    tier,
    COUNT(*) AS count,
    MAX(created_at) AS latest
FROM emergent_patterns
GROUP BY industry, tier
ORDER BY count DESC;


-- ============================================================
-- SECTION 7 · Engagement phase distribution (current state)
-- ============================================================

-- 7.1 Engagement count by current_phase (shows any phase > 5 if migration not applied)
SELECT
    current_phase,
    status,
    COUNT(*) AS count
FROM engagements
GROUP BY current_phase, status
ORDER BY current_phase, status;

-- 7.2 Engagements still at phase > 5 (should be 0 after PR #1517 migration)
SELECT id, current_phase, status, client_id
FROM engagements
WHERE current_phase > 5
ORDER BY current_phase DESC;

-- 7.3 Deliverable types with applicable_phases containing values > 5
-- (should be empty after the remap migration in PR #1517)
SELECT id, name, applicable_phases
FROM deliverable_types
WHERE EXISTS (
    SELECT 1 FROM unnest(applicable_phases) AS p WHERE p > 5
)
ORDER BY name;


-- ============================================================
-- SECTION 8 · Pattern usage in Intelligence and Source surfaces
-- ============================================================

-- 8.1 Most-retrieved patterns in Intelligence Ask (last 30 days)
-- Adjust table/column names to match your intelligence_* schema.
SELECT
    unnest(retrieved_pattern_ids) AS pattern_id,
    COUNT(*) AS retrieval_count
FROM intelligence_artifacts   -- adjust table name if different
WHERE created_at > NOW() - INTERVAL '30 days'
  AND retrieved_pattern_ids IS NOT NULL
GROUP BY 1
ORDER BY retrieval_count DESC
LIMIT 30;

-- 8.2 Patterns cited vs retrieved ratio (citation coverage)
-- Patterns frequently retrieved but rarely cited may be irrelevant to prompts.
WITH retrieved AS (
    SELECT unnest(retrieved_pattern_ids) AS pid, COUNT(*) AS r_count
    FROM intelligence_artifacts WHERE retrieved_pattern_ids IS NOT NULL
    GROUP BY 1
),
cited AS (
    SELECT unnest(cited_pattern_ids) AS pid, COUNT(*) AS c_count
    FROM intelligence_artifacts WHERE cited_pattern_ids IS NOT NULL
    GROUP BY 1
)
SELECT
    r.pid AS pattern_id,
    r.r_count AS retrieved,
    COALESCE(c.c_count, 0) AS cited,
    ROUND(100.0 * COALESCE(c.c_count, 0) / NULLIF(r.r_count, 0), 1) AS cite_rate_pct
FROM retrieved r
LEFT JOIN cited c ON c.pid = r.pid
ORDER BY r.r_count DESC
LIMIT 30;

-- 8.3 Source artifacts: patterns used per artifact
SELECT
    sa.id AS artifact_id,
    sa.artifact_type,
    sa.tenant_id,
    array_length(sa.used_pattern_ids, 1) AS pattern_count,
    sa.created_at
FROM source_artifacts sa
WHERE used_pattern_ids IS NOT NULL
  AND array_length(used_pattern_ids, 1) > 0
ORDER BY pattern_count DESC
LIMIT 20;


-- ============================================================
-- SECTION 9 · Reasoning telemetry: pattern correlation with outcomes
-- ============================================================

-- 9.1 Pattern IDs appearing in reasoning events, with event type distribution
SELECT
    rte.pattern_id,
    rte.event_type,
    COUNT(*) AS count,
    AVG(CASE WHEN rte.outcome = 'success' THEN 1 ELSE 0 END) AS success_rate
FROM reasoning_telemetry_events rte
WHERE rte.pattern_id IS NOT NULL
  AND rte.created_at > NOW() - INTERVAL '30 days'
GROUP BY rte.pattern_id, rte.event_type
ORDER BY count DESC
LIMIT 30;
