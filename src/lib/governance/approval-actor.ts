const PERSON_NAME =
  /^\p{Lu}[\p{L}'’.-]*(?: [\p{L}'’.-]+)* \p{Lu}[\p{L}'’.-]*$/u;
export const NON_PERSON_APPROVER =
  /\b(?:codex|claude|cursor|copilot|gpt|gemini|agent|assistant|bot|automation|automated|operator|reviewer|owner|team|engineering|delegat\w*|authori[sz]\w*|approval)\b/i;

export function namesAPerson(value: string): boolean {
  return PERSON_NAME.test(value) && !NON_PERSON_APPROVER.test(value);
}
