import {
  buildSafeFallbackCanvas,
  coerceCxoCanvasPayload,
  parseCxoCanvasJson,
  type CxoCanvasSchemaResult,
} from "./canvasSchemas";

export type CxoCanvasValidationResult = CxoCanvasSchemaResult;

export function validateCxoCanvasPayload(
  input: unknown,
): CxoCanvasValidationResult {
  if (typeof input === "string") {
    try {
      return coerceCxoCanvasPayload(parseCxoCanvasJson(input));
    } catch {
      return {
        ok: false,
        fallback: {},
        warnings: ["CXO canvas payload is not valid JSON."],
      };
    }
  }
  return coerceCxoCanvasPayload(input);
}

export function fallbackCxoCanvasPayload(input: unknown) {
  return buildSafeFallbackCanvas(input);
}
