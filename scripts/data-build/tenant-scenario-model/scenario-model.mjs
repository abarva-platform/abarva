#!/usr/bin/env node
// Gate 2.1 Phase B: the universal canonical scenario model. Zero-write,
// zero-runtime-wiring infrastructure -- this module is the shared engine
// every future generator (Phase C's Meridian adapter, Phase D's targeted
// enrichment, Phase E's interview redesign) builds a scenario GRAPH with,
// so that every canonical CSV row is a projection of one connected model
// instead of an independently invented row. Nothing in this file reads or
// writes datasets/tenant-inputs/active/**; it operates on in-memory graphs
// that a caller constructs and, separately, decides whether/where to write.
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/templates/universal/tenant-scenario-model/scenario-model-manifest.json",
);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

const manifest = loadManifest();

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

// --- Stable IDs: {TYPE_PREFIX}-{NNN}, zero-padded 3 digits, unique per tenant across ALL types. ---
function idPrefixFor(entityType) {
  const def = manifest.entityTypes[entityType];
  if (!def) throw new Error(`Unknown entity type "${entityType}" -- not declared in scenario-model-manifest.json`);
  return def.idPrefix;
}

function makeStableId(entityType, sequenceNumber) {
  const prefix = idPrefixFor(entityType);
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error(`makeStableId requires a positive integer sequence number, got ${sequenceNumber}`);
  }
  return `${prefix}-${String(sequenceNumber).padStart(3, "0")}`;
}

function parseStableId(id) {
  const match = /^([A-Z]+)-(\d{3,})$/.exec(String(id || ""));
  if (!match) return null;
  return { prefix: match[1], sequence: Number(match[2]) };
}

// --- Scenario graph: a plain object keyed by stable ID. Callers build this
// incrementally with addEntity(); nothing here assumes how a caller sources
// field values (deterministic generation, migrated tower-fact data, etc). ---
function createGraph(tenantKey) {
  return { tenantKey, entities: new Map(), sequenceCounters: {} };
}

function nextSequence(graph, entityType) {
  graph.sequenceCounters[entityType] = (graph.sequenceCounters[entityType] || 0) + 1;
  return graph.sequenceCounters[entityType];
}

// Adds one entity. `id` may be supplied explicitly (e.g. when an adapter is
// preserving a stable ID across regeneration); otherwise the next sequence
// number for this entity type is used. Throws on a duplicate ID -- IDs must
// be unique across the WHOLE graph, not just within one entity type.
function addEntity(graph, entityType, fields, referenceFieldValues = {}, explicitId) {
  const def = manifest.entityTypes[entityType];
  if (!def) throw new Error(`Unknown entity type "${entityType}"`);
  const id = explicitId || makeStableId(entityType, nextSequence(graph, entityType));
  if (graph.entities.has(id)) {
    throw new Error(`Duplicate stable ID "${id}" -- IDs must be unique across the entire scenario graph, not just within entity type "${entityType}"`);
  }
  const entity = { id, entityType, fields: { ...fields }, refs: { ...referenceFieldValues } };
  graph.entities.set(id, entity);
  return entity;
}

function getEntity(graph, id) {
  return graph.entities.get(id);
}

function displayNameOf(graph, id) {
  const entity = getEntity(graph, id);
  if (!entity) return "";
  const def = manifest.entityTypes[entity.entityType];
  if (def.displayField === "computed") return entity.fields.display_name || entity.id;
  return entity.fields[def.displayField] || "";
}

// --- Validation: every entity has a well-formed ID of the right type; every
// declared required reference field is present; every reference resolves to
// a real entity of an allowed type. This is what Phase C/D/G run before
// treating a generated scenario as usable -- a graph with unresolved
// references must not silently become CSV rows. ---
function validateGraph(graph) {
  const errors = [];
  for (const [id, entity] of graph.entities) {
    const def = manifest.entityTypes[entity.entityType];
    if (!def) {
      errors.push({ id, error: `entity has unknown entityType "${entity.entityType}"` });
      continue;
    }
    const parsed = parseStableId(id);
    if (!parsed || parsed.prefix !== def.idPrefix) {
      errors.push({ id, error: `ID does not match the declared idPrefix "${def.idPrefix}" for entityType "${entity.entityType}"` });
    }
    for (const refDef of def.referenceFields || []) {
      const value = entity.refs[refDef.field];
      if (refDef.required && !value) {
        errors.push({ id, error: `missing required reference field "${refDef.field}"` });
        continue;
      }
      if (!value) continue;
      const values = Array.isArray(value) ? value : [value];
      for (const refId of values) {
        const target = getEntity(graph, refId);
        if (!target) {
          errors.push({ id, error: `reference field "${refDef.field}" points to "${refId}", which does not exist in the graph` });
          continue;
        }
        const allowedTypes = refDef.refType === "any" ? null : Array.isArray(refDef.refType) ? refDef.refType : [refDef.refType];
        if (allowedTypes && !allowedTypes.includes(target.entityType)) {
          errors.push({ id, error: `reference field "${refDef.field}" points to "${refId}" (entityType "${target.entityType}"), expected one of [${allowedTypes.join(", ")}]` });
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

// --- Projection: resolve one entity's fields + reference fields into a flat
// object suitable for a CSV row, per the manifest's projectsTo.columns map.
// A mapping value like "leader_ref->display_name" resolves the reference and
// substitutes the target's display name (v3's columns are contractually
// free-text names); "->display_name[]" joins a list of references with "; ".
// A plain field name (no "->") is a direct passthrough. ---
function resolveMapping(graph, entity, mappingValue) {
  if (!mappingValue.includes("->")) {
    return entity.fields[mappingValue] ?? "";
  }
  const [refField, accessorRaw] = mappingValue.split("->");
  const isList = accessorRaw.endsWith("[]");
  const accessor = isList ? accessorRaw.slice(0, -2) : accessorRaw;
  const refValue = entity.refs[refField];
  if (!refValue) return "";
  const ids = Array.isArray(refValue) ? refValue : [refValue];
  const resolved = ids.map((refId) => {
    if (accessor === "stable_id") return refId;
    if (accessor === "display_name") return displayNameOf(graph, refId);
    if (accessor === "entity_type") return getEntity(graph, refId)?.entityType || "";
    const target = getEntity(graph, refId);
    return target?.fields[accessor] ?? displayNameOf(graph, refId);
  });
  return isList ? resolved.filter(nonBlank).join("; ") : resolved[0] || "";
}

function projectEntity(graph, entity, domainKey) {
  const def = manifest.entityTypes[entity.entityType];
  const projection = (def.projectsTo || []).find((p) => p.domain === domainKey);
  if (!projection || !projection.columns) return null;
  const row = {};
  for (const [column, mapping] of Object.entries(projection.columns)) {
    row[column] = resolveMapping(graph, entity, mapping);
  }
  return row;
}

// --- Crosswalk: the artifact that keeps stable-ID cross-referencing possible
// even for domains whose approved v3 columns are name-only. Required output
// per the manifest's requiredGeneratorOutputs. ---
function buildCrosswalk(graph) {
  const rows = [];
  for (const [id, entity] of graph.entities) {
    const def = manifest.entityTypes[entity.entityType];
    for (const projection of def.projectsTo || []) {
      rows.push({
        entity_type: entity.entityType,
        stable_id: id,
        display_name: displayNameOf(graph, id),
        projected_domain: projection.domain,
        projected_row_identity: displayNameOf(graph, id),
      });
    }
  }
  return rows;
}

export {
  manifest,
  loadManifest,
  makeStableId,
  parseStableId,
  createGraph,
  addEntity,
  getEntity,
  displayNameOf,
  validateGraph,
  projectEntity,
  resolveMapping,
  buildCrosswalk,
};
