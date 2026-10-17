/** Every refusal the financial-model download can give, each with the sentence a person reads. */
export const FINANCIAL_MODEL_REFUSAL = {
  forbidden: { status: 403, detail: "You can see this Move but not its financial model." },
  figures_withheld: { status: 403, detail: "The financial model shows every amount, and figures are withheld for your access level. Ask a Move owner or a finance viewer to download it." },
  case_blocked: { status: 409, detail: "The value case is blocked by an input that is not resolved. Resolve it in P4 Step 3, then download the model." },
  model_unreadable: { status: 409, detail: "The saved value model could not be read as a structured model. Open P4 Step 3 to repair it." },
  model_changed: { status: 409, detail: "The value model changed while the workbook was being built. Download it again." },
  model_failed: { status: 500, detail: "The financial model could not be built. Nothing was stored; try again." },
} as const;
export type FinancialModelRefusal = keyof typeof FINANCIAL_MODEL_REFUSAL;
