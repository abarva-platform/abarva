# MODEL1 - Azure-Routed Claude Validation

Slice ID: MODEL1
Backlog task: T163 - Validate Marketplace + Azure-routed Claude story (no Vercel migration needed)
Document type: Architecture / provider-route validation
Status: candidate
Authored: 2026-06-02
Release lane: internal-admin
Type: Specification / validation document only. No application code, no runtime
modification, no migrations, no infrastructure-as-code, no provisioning, no
model calls.

This document validates the architecture story for routing Claude model calls
through Microsoft Foundry while keeping AbarVa's current Vercel-hosted app
control plane. It is not a claim that a live Claude-on-Foundry endpoint is
already provisioned for a pilot tenant.

---

## 1. Decision

AbarVa does not need to migrate the application control plane from Vercel just
to support an Azure-routed Claude option.

The supported target posture is:

1. Vercel continues to run the Next.js app/control plane, as recorded in
   `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`.
2. AbarVa application code calls the model gateway / AI egress boundary, not
   provider SDKs directly from product surfaces.
3. The model gateway resolves the tenant policy and routes eligible Claude
   calls to a Microsoft Foundry Claude endpoint when that route is approved for
   the tenant.
4. Azure Marketplace / Microsoft Foundry subscription, region, authentication,
   data-processing, and procurement requirements are treated as readiness gates
   before the route is sold as production-ready.

This keeps the control-plane/data-plane split intact: hosting the app on Vercel
does not prevent a tenant's model egress route from terminating at a Microsoft
Foundry Claude endpoint.

## 2. Primary-source validation snapshot

As of 2026-06-02, Microsoft documentation supports the following facts:

| Fact | Architecture implication |
| --- | --- |
| Microsoft Foundry documents Claude model deployment and use in preview. | The route is viable as a candidate provider route, but should be described as preview until Microsoft removes that status. |
| Claude models in Foundry require a paid Azure subscription, a Foundry project in supported regions, Azure Marketplace access for partner/community model subscriptions, and RBAC such as Contributor or Owner for deployment. | AbarVa must treat subscription type, billing account, region, Marketplace permission, and RBAC as onboarding gates. |
| Foundry Claude endpoints expose an Anthropic-style Messages API path under `https://<resource-name>.services.ai.azure.com/anthropic/v1/messages`. | The provider adapter can be implemented as a gateway dispatch target without changing Vercel routing or product UI. |
| Microsoft documents both Microsoft Entra ID and API-key authentication for Claude Messages API endpoints. | Enterprise preference should be Microsoft Entra ID where possible; API keys remain a fallback requiring Key Vault / env inventory controls. |
| Microsoft distinguishes Foundry Models sold by Azure from partner/community models. Anthropic Claude is listed as a partner/community model, with partner terms and support implications. | Security and legal review must not describe Claude-on-Foundry as an Azure-direct model. |
| Microsoft states that for Claude in Foundry, Anthropic acts as data processor for prompts and outputs, while Microsoft manages API deployment infrastructure and certain billing/usage processing. | The subprocessor, DPA, model-risk, and customer-disclosure story must name both Microsoft and Anthropic roles accurately. |
| Microsoft states prompts and outputs for Anthropic Claude API may be processed outside the region for operational purposes. | Do not claim strict region residency for Claude-on-Foundry without a separate contractual and technical confirmation. |

## 3. What This Validates

This validates a route-level story:

```text
AbarVa app on Vercel
  -> AI egress / model gateway boundary
  -> tenant policy and audit
  -> Microsoft Foundry Claude endpoint
  -> Claude response returned to the app
```

The app can remain on Vercel because the model route is an outbound provider
call from the application or gateway boundary. The runtime host and the model
provider endpoint are separable.

## 4. What This Does Not Validate

This document does not prove:

- a live customer Foundry resource exists;
- AbarVa has subscribed to a Claude offer in Azure Marketplace;
- a pilot tenant has a paid subscription and supported billing account;
- the route satisfies customer-specific data residency, ZDR, BYOK, or private
  networking requirements;
- current runtime code already dispatches Claude calls through Foundry;
- Foundry Claude is approved by legal, procurement, model-risk, or a client
  security team;
- all Claude models, regions, and subscription types are supported for the
  pilot.

## 5. Required Readiness Gates

Before AbarVa offers Azure-routed Claude as a production pilot capability, the
following gates must be complete:

1. Azure subscription gate: paid Azure subscription, supported billing account,
   supported region, and customer or AbarVa owner identified.
2. Marketplace gate: Azure Marketplace permission to subscribe to the
   Anthropic Claude model offering, including acceptance of Anthropic terms.
3. Foundry resource gate: Microsoft Foundry resource/project created in a
   supported region and deployment created for the target Claude model.
4. Authentication gate: Microsoft Entra ID route preferred; API key route
   allowed only with documented secret storage, rotation, and audit handling.
5. Gateway gate: runtime provider adapter added behind
   `src/lib/integrations/ai-egress/call-model.ts` or the successor gateway
   boundary, with no direct product-surface SDK imports.
6. Tenant policy gate: tenant AI policy names the allowed route, data classes,
   approval requirements, retention expectations, and fallback behavior.
7. Data-processing disclosure gate: customer-facing material names Microsoft
   and Anthropic processing roles accurately and does not call Claude-on-Foundry
   an Azure-direct model.
8. Residency gate: any region-residency or no-cross-region-processing claim is
   blocked until Microsoft/Anthropic contractual evidence supports it.
9. Audit gate: every call records tenant, user, workflow, model route, prompt
   hash, response hash, policy decision, and error/refusal outcome.
10. Fallback gate: define whether failure falls back to direct Anthropic,
    Azure OpenAI, kernel-only mode, or honest refusal.

## 6. Marketplace Clarification

Two marketplace concepts must not be collapsed:

- Azure Marketplace / Microsoft commercial marketplace is the relevant
  subscription and terms path for partner/community models in Microsoft
  Foundry, including Anthropic Claude.
- Vercel Marketplace can be useful for provisioning Vercel-side integrations,
  but it is not required to make Microsoft Foundry Claude available and does
  not change the Vercel control-plane decision.

The concise buyer story should be: "AbarVa can keep the app on Vercel while
model calls route through the customer's approved Microsoft Foundry Claude
endpoint, subject to Azure Marketplace, region, auth, and data-processing
readiness gates."

## 7. Implementation Contract

When the runtime implementation lands, the provider adapter should preserve the
existing egress boundary shape:

- `src/lib/integrations/ai-egress/call-model.ts` remains the policy/audit
  wrapper for model egress.
- `src/lib/integrations/ai-egress/anthropic-direct.ts` remains the direct
  Anthropic route and should not be repurposed as the Foundry route.
- A new Foundry-specific adapter can use the deployed endpoint base URL and
  either Microsoft Entra ID token acquisition or API-key authentication.
- Product surfaces should call the gateway boundary, not
  `@anthropic-ai/foundry-sdk`, `@anthropic-ai/sdk`, `fetch`, or Azure auth
  clients directly.
- Tenant policy should distinguish `anthropic-direct` from
  `azure-foundry-claude`.

## 8. Recommended Status Language

Use:

"Azure-routed Claude is a validated candidate route. It lets AbarVa keep the
Vercel app/control plane while routing approved model calls through Microsoft
Foundry. Production use requires Azure Marketplace, supported subscription and
region, Foundry deployment, auth, data-processing disclosure, tenant policy,
and audit gates."

Do not use:

- "Claude stays entirely inside the customer's Azure region."
- "Microsoft is the sole processor for Claude prompts and outputs."
- "Foundry Claude is the same as an Azure-direct model."
- "No legal or procurement review is needed because it is in Azure."
- "The route is live for pilots today."

## 9. References

- `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`
- `docs/architecture/VERCEL1_PER_CUSTOMER_VERCEL_OPTION.md`
- `docs/architecture/ABARVA_MODEL_GATEWAY_AND_TOOL_PLANE.md`
- `docs/architecture/ai/ENTERPRISE-AI-READINESS-ROADMAP.md`
- `src/lib/integrations/ai-egress/call-model.ts`
- `src/lib/integrations/ai-egress/anthropic-direct.ts`
- Microsoft Learn: `https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-claude`
- Microsoft Learn: `https://learn.microsoft.com/en-us/azure/foundry-classic/concepts/foundry-models-overview`
- Microsoft Learn: `https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/claude-models/data-privacy?view=foundry-classic`
- Vercel Marketplace: `https://vercel.com/marketplace`
