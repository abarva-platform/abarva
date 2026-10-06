import { createTxSession, type TxSessionRunner } from "../read-adapters/azureSession";

export interface SetDeclaredDiscoveryArchetypeInput {
  readonly programId: string;
  readonly clientId: string;
  readonly expectedProgramArchetype: string;
  readonly expectedFunctionPackKey: string | null;
  readonly archetypeId: string;
}

export interface DiscoveryArchetypeWriteAdapter {
  setDeclaredArchetype(
    input: SetDeclaredDiscoveryArchetypeInput,
  ): Promise<{ updated: boolean }>;
}

/**
 * Atomically merge only charter.classification.archetype for one tenant row.
 * The WHERE clause refuses a changed legacy classification or function pack;
 * the JSONB expression preserves every other charter field.
 */
export function createAzureDiscoveryArchetypeWriteAdapter(
  session: TxSessionRunner = createTxSession("abarva-moves-archetype-write"),
): DiscoveryArchetypeWriteAdapter {
  return {
    async setDeclaredArchetype(input) {
      const rows = await session(async (run) => {
        await run(
          "SELECT set_config('statement_timeout', $1, true), " +
            "set_config('lock_timeout', $2, true)",
          ["60000", "15000"],
        );
        return run<{ id: string }>(
          "UPDATE engagements " +
            "SET charter = jsonb_set(" +
            "  COALESCE(charter, '{}'::jsonb), " +
            "  '{classification}', " +
            "  (CASE " +
            "    WHEN jsonb_typeof(charter->'classification') = 'object' " +
            "      THEN charter->'classification' " +
            "    ELSE '{}'::jsonb " +
            "  END) || jsonb_build_object('archetype', $5::text), " +
            "  true" +
            "), updated_at = now() " +
            "WHERE id = $1 AND client_id = $2 " +
            "  AND program_archetype IS NOT DISTINCT FROM $3::text " +
            "  AND function_pack_key IS NOT DISTINCT FROM $4::text " +
            "  AND (charter IS NULL OR jsonb_typeof(charter) = 'object') " +
            "  AND (charter->'classification' IS NULL " +
            "    OR jsonb_typeof(charter->'classification') IN ('null', 'object')) " +
            "  AND (NULLIF(BTRIM(charter #>> '{classification,archetype}'), '') IS NULL " +
            "    OR charter #>> '{classification,archetype}' = $5) " +
            "RETURNING id",
          [
            input.programId,
            input.clientId,
            input.expectedProgramArchetype,
            input.expectedFunctionPackKey,
            input.archetypeId,
          ],
        );
      });
      return { updated: rows.some((row) => row.id === input.programId) };
    },
  };
}
