export type ValueCaseRead =
  | { status: "ready"; value: Record<string, unknown> }
  | { status: "empty"; detail: string }
  | { status: "failed"; detail: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Only the value route's named absent-model refusal is an authoritative empty state. */
export async function valueCaseRead(response: Promise<Response>, moveId: string): Promise<ValueCaseRead> {
  try {
    const result = await response;
    const body: unknown = await result.json();
    if (!isObject(body)) return { status: "failed", detail: "Value case returned an unreadable result." };
    if (result.status === 404 && body.ok === false && body.error === "value_model_absent") {
      return { status: "empty", detail: "No value levers yet; add them in P4 Step 3." };
    }
    if (!result.ok || body.ok !== true || body.programId !== moveId)
      return { status: "failed", detail: "Value case could not be read." };
    return { status: "ready", value: body };
  } catch {
    return { status: "failed", detail: "Value case could not be read." };
  }
}
