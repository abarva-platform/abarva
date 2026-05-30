/**
 * Registry invariants.
 *
 * - Every archetypeKey is unique.
 * - Every entry in the registry matches an authored archetype file under
 *   `src/lib/atlas/iac/archetypes/`.
 * - Retrieval helpers (`getArchetype`, `listArchetypes`,
 *   `findArchetypeByLooseMatch`) are pure and deterministic.
 */

import fs from 'node:fs';
import path from 'node:path';

import { INITIATIVE_ARCHETYPES } from '../registry';
import {
  findArchetypeByLooseMatch,
  getArchetype,
  listArchetypes,
} from '../retrieval';

const ARCHETYPES_DIR = path.resolve(__dirname, '..', 'archetypes');

describe('IAC registry', () => {
  it('every archetypeKey is unique', () => {
    const keys = INITIATIVE_ARCHETYPES.map((a) => a.archetypeKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('every registry entry has a matching authored file in /archetypes', () => {
    const entries = fs
      .readdirSync(ARCHETYPES_DIR)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    expect(entries.length).toBeGreaterThan(0);

    // Convert filename (kebab-case) to archetypeKey (snake_case).
    const filenameKeys = new Set(
      entries.map((f) => f.replace(/\.ts$/, '').replace(/-/g, '_')),
    );

    for (const archetype of INITIATIVE_ARCHETYPES) {
      expect(filenameKeys.has(archetype.archetypeKey)).toBe(true);
    }
  });

  it('listArchetypes returns the same set as INITIATIVE_ARCHETYPES', () => {
    const list = listArchetypes();
    expect(list.length).toBe(INITIATIVE_ARCHETYPES.length);
    const listKeys = new Set(list.map((a) => a.archetypeKey));
    const regKeys = new Set(INITIATIVE_ARCHETYPES.map((a) => a.archetypeKey));
    expect(listKeys).toEqual(regKeys);
  });

  it('listArchetypes returns a copy — mutating the result does not mutate the registry', () => {
    const list = listArchetypes();
    const beforeCount = INITIATIVE_ARCHETYPES.length;
    list.pop();
    expect(INITIATIVE_ARCHETYPES.length).toBe(beforeCount);
  });

  it('getArchetype returns the entry for a known key', () => {
    const first = INITIATIVE_ARCHETYPES[0];
    expect(first).toBeDefined();
    const result = getArchetype(first.archetypeKey);
    expect(result).not.toBeNull();
    expect(result?.archetypeKey).toBe(first.archetypeKey);
  });

  it('getArchetype returns null for unknown keys, empty strings, and non-strings', () => {
    expect(getArchetype('nonexistent_archetype_key')).toBeNull();
    expect(getArchetype('')).toBeNull();
    // @ts-expect-error — runtime guard for non-string input
    expect(getArchetype(undefined)).toBeNull();
    // @ts-expect-error — runtime guard for non-string input
    expect(getArchetype(null)).toBeNull();
  });

  it('findArchetypeByLooseMatch matches on archetypeKey', () => {
    const result = findArchetypeByLooseMatch(
      'I want to know about github_copilot adoption',
    );
    expect(result?.archetypeKey).toBe('github_copilot');
  });

  it('findArchetypeByLooseMatch matches on label tokens (case-insensitive)', () => {
    const result = findArchetypeByLooseMatch('What is the industry doing with GitHub Copilot?');
    expect(result?.archetypeKey).toBe('github_copilot');
  });

  it('findArchetypeByLooseMatch matches Claude Code by label', () => {
    const result = findArchetypeByLooseMatch('Tell me about Claude Code rollouts');
    expect(result?.archetypeKey).toBe('claude_code');
  });

  it('findArchetypeByLooseMatch returns null on empty / whitespace / no-match input', () => {
    expect(findArchetypeByLooseMatch('')).toBeNull();
    expect(findArchetypeByLooseMatch('   ')).toBeNull();
    expect(findArchetypeByLooseMatch('a topic the corpus has not yet covered')).toBeNull();
    // @ts-expect-error — runtime guard for non-string input
    expect(findArchetypeByLooseMatch(undefined)).toBeNull();
  });

  it('retrieval functions are deterministic across calls', () => {
    const a = listArchetypes().map((x) => x.archetypeKey);
    const b = listArchetypes().map((x) => x.archetypeKey);
    expect(a).toEqual(b);
  });
});
