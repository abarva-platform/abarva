/**
 * Legacy Vercel sentinel.
 *
 * app.abarva.ai is deployed through Azure Container Apps, not Vercel.
 * Keep this file so a still-linked Vercel project fails loudly instead of
 * auto-detecting Next.js and creating a misleading deployment.
 *
 * Approved deploy path:
 *   az acr build -> az containerapp update -> ACA revision traffic -> live QA
 *
 * See docs/runbooks/azure-container-apps-deploy.md.
 */

import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'bash scripts/vercel-disabled.sh',
};
