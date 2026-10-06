#!/usr/bin/env node

/**
 * The `Layer Impact` section of a release record has to name the release lane the
 * change ships in. AGENTS.md declares five, and it is the only place they are
 * defined, so this module derives them from that file rather than restating them.
 * A hand-copied list here would drift from AGENTS.md silently, which is the same
 * failure mode this guard exists to close.
 *
 * Why this module exists at all: the rule it replaces was `/lane\b/` over the
 * section body. `plane` contains `lane` followed by a word boundary, so
 * "Data plane: no schema changes" satisfied a check meant to require a release
 * lane, and three of the five declared lanes — `internal-admin`, `public-demo`
 * and `experimental` — do not contain the word `lane` at all, so naming one of
 * them correctly and alone was refused.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const AGENTS_DOC_PATH = path.resolve(moduleDir, '..', '..', 'AGENTS.md');

const LANE_LIST_HEADING = 'Use these lanes consistently:';
const LANE_BULLET = /^-\s+`([a-z0-9][a-z0-9-]*)`\s*:/;

/**
 * Read the declared release lanes out of AGENTS.md prose: the bullet list that
 * follows the "Use these lanes consistently:" line, up to the next blank-line
 * break in the list.
 */
export function collectReleaseLanesFromAgentsDoc(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === LANE_LIST_HEADING);
  if (start < 0) return [];

  const lanes = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (lanes.length > 0) break;
      continue;
    }
    const match = LANE_BULLET.exec(trimmed);
    if (!match) break;
    lanes.push(match[1]);
  }

  return lanes;
}

export function loadReleaseLanes(agentsDocPath = AGENTS_DOC_PATH) {
  if (!existsSync(agentsDocPath)) {
    throw new Error(
      `Release lane guard cannot read its lane vocabulary: ${agentsDocPath} does not exist.`,
    );
  }

  const lanes = collectReleaseLanesFromAgentsDoc(readFileSync(agentsDocPath, 'utf8'));
  if (lanes.length === 0) {
    throw new Error(
      `Release lane guard derived no lanes from ${agentsDocPath}. ` +
        `Expected a bullet list of \`lane-id\`: entries under "${LANE_LIST_HEADING}".`,
    );
  }

  return lanes;
}

/**
 * A lane may be written as its identifier (`global-control-lane`) or in ordinary
 * prose with spaces ("global control lane"), in any case, inside a code span or
 * not. What it may not be is absent.
 */
function laneMatcher(lane) {
  const body = lane.split('-').map(escapeRegExp).join('[\\s-]');
  return new RegExp(`(^|[^a-z0-9-])${body}([^a-z0-9-]|$)`, 'i');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findReleaseLanesNamed(layerImpactBody, lanes) {
  return lanes.filter((lane) => laneMatcher(lane).test(layerImpactBody ?? ''));
}

export function namesReleaseLane(layerImpactBody, lanes) {
  return findReleaseLanesNamed(layerImpactBody, lanes).length > 0;
}

export function validateLayerImpactLane(file, layerImpactBody, lanes) {
  if (namesReleaseLane(layerImpactBody, lanes)) return [];
  return [
    `${file}: Layer Impact must name the release lane this change ships in. ` +
      `Declared lanes (AGENTS.md): ${lanes.join(', ')}.`,
  ];
}
