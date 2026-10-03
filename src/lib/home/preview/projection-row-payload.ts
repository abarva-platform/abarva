export function homeProjectionPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const outer = value as Record<string, unknown>;
  const nested = outer.display_payload_json;
  if (!nested || typeof nested !== "object" || Array.isArray(nested))
    return outer;
  return { ...outer, ...(nested as Record<string, unknown>) };
}
