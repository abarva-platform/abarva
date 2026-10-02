#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function writeWebhookJobSpec({ path, secret, jobName, environmentId, identityId, clientId, image }) {
  if (!path || typeof secret !== 'string' || !secret || secret.includes('\0')) {
    throw new Error('webhook job secret required');
  }
  if (!/^nda-hmac-[0-9]+$/.test(jobName) ||
      !environmentId?.endsWith('/cae-abarva-scale-lab-eastus') ||
      !identityId?.includes('/providers/Microsoft.ManagedIdentity/userAssignedIdentities/') ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(clientId ?? '') ||
      !/^acrabarvalab001\.azurecr\.io\/abarva\/web@sha256:[0-9a-f]{64}$/.test(image ?? '')) {
    throw new Error('invalid private operator job configuration');
  }
  const spec = {
    name: jobName,
    resourceGroup: 'rg-abarva-controlplane-lab-eastus',
    identity: { type: 'UserAssigned', userAssignedIdentities: { [identityId]: {} } },
    properties: {
      environmentId,
      configuration: {
        triggerType: 'Manual', replicaRetryLimit: 0, replicaTimeout: 300,
        manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 },
        secrets: [{ name: 'webhook-hmac', value: secret }],
        registries: [{ server: 'acrabarvalab001.azurecr.io', identity: identityId }],
      },
      template: {
        containers: [{
          name: 'webhook-secret-bootstrap', image, imageType: 'ContainerImage',
          command: ['node'], args: ['/app/scripts/ops/docusign-lab-webhook-secret.mjs'],
          env: [
            { name: 'AZURE_CLIENT_ID', value: clientId },
            { name: 'DOCUSIGN_ENV', value: 'demo' },
            { name: 'DOCUSIGN_WEBHOOK_BOOTSTRAP_CONFIRM', value: 'STORE_LAB_WEBHOOK_SECRET' },
            { name: 'SOURCE_NDA_DEMO_WEBHOOK_HMAC', secretRef: 'webhook-hmac' },
          ],
          resources: { cpu: 0.5, memory: '1Gi' },
        }],
        workloadProfileName: 'Consumption',
      },
    },
  };
  await writeFile(path, JSON.stringify(spec), { flag: 'wx', mode: 0o600 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeWebhookJobSpec({
    path: process.argv[2],
    secret: process.env.SOURCE_NDA_DEMO_WEBHOOK_HMAC,
    jobName: process.env.JOB_NAME,
    environmentId: process.env.ENVIRONMENT_ID,
    identityId: process.env.IDENTITY_ID,
    clientId: process.env.CLIENT_ID,
    image: process.env.IMAGE,
  }).catch(() => {
    process.exitCode = 1;
  });
}
