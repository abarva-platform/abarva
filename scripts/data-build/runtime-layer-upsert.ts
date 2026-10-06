export type CurrentRowConflict = {
  keys: readonly string[];
  immutable?: readonly string[];
};

export function upsertCurrentRowColumns(
  columns: readonly string[],
  conflict: CurrentRowConflict,
): string {
  const identifiers = [
    ...columns,
    ...conflict.keys,
    ...(conflict.immutable ?? []),
  ];
  if (identifiers.some((identifier) => !/^[a-z][a-z0-9_]*$/.test(identifier))) {
    throw new Error("Runtime layer upsert has an invalid column identifier.");
  }
  if (
    conflict.keys.length === 0 ||
    new Set(columns).size !== columns.length ||
    new Set(conflict.keys).size !== conflict.keys.length ||
    [...conflict.keys, ...(conflict.immutable ?? [])].some(
      (column) => !columns.includes(column),
    )
  ) {
    throw new Error(
      "Runtime layer upsert keys and immutable fields must be inserted columns.",
    );
  }
  const unchanged = new Set([...conflict.keys, ...(conflict.immutable ?? [])]);
  const mutable = columns.filter((column) => !unchanged.has(column));
  if (mutable.length === 0) {
    throw new Error("Runtime layer upsert has no mutable columns.");
  }
  return `ON CONFLICT (${conflict.keys.join(",")}) DO UPDATE SET ${mutable
    .map((column) => `${column}=excluded.${column}`)
    .join(", ")}, updated_at=now()`;
}
