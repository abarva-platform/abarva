#!/usr/bin/env node
// Azure lab L11 observability and cost audit.
//
// This is intentionally advisory by default. It verifies that the lab has the
// operational evidence plane expected for parallel run and first-pilot readiness:
// Log Analytics, Application Insights, activity-log alerting, action group, budget,
// and Container Apps diagnostics. Use --strict to fail on attention items.

import { execFileSync } from 'node:child_process';

const STRICT = process.argv.includes('--strict');

const LAB = {
  subscriptionId: '701a8554-a166-46e9-bf13-743bc50e3b20',
  observabilityRg: 'rg-abarva-observability-lab-eastus',
  controlPlaneRg: 'rg-abarva-controlplane-lab-eastus',
  resources: {
    logAnalytics: 'log-abarva-observability-lab-eastus',
    appInsights: 'appi-abarva-observability-lab-eastus',
    actionGroup: 'ag-abarva-observability-lab-eastus',
    deploymentFailureAlert: 'ala-subscription-deployment-failures',
    budget: 'budget-abarva-lab-monthly',
    containerAppsEnvironment: 'cae-abarva-scale-lab-eastus',
    webApp: 'ca-abarva-web-lab-eastus',
  },
};

function az(args) {
  const output = execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 10,
  }).trim();
  if (!output) return null;
  return JSON.parse(output);
}

function tryAz(args) {
  try {
    return { ok: true, value: az(args) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function result(name, severity, status, detail, evidence = undefined) {
  return { name, severity, status, detail, ...(evidence ? { evidence } : {}) };
}

function pass(name, detail, evidence) {
  return result(name, 'info', 'pass', detail, evidence);
}

function warn(name, detail, evidence) {
  return result(name, 'warn', 'attention', detail, evidence);
}

function fail(name, detail, evidence) {
  return result(name, 'fail', 'fail', detail, evidence);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function auditLogAnalytics() {
  const workspace = tryAz([
    'monitor', 'log-analytics', 'workspace', 'show',
    '-g', LAB.observabilityRg,
    '-n', LAB.resources.logAnalytics,
    '--query', '{name:name,provisioningState:provisioningState,retentionInDays:retentionInDays,sku:sku.name,customerId:customerId}',
    '-o', 'json',
  ]);
  if (!workspace.ok) {
    return [fail('observability.log_analytics.exists', 'Log Analytics workspace could not be read.', workspace)];
  }

  const checks = [
    workspace.value?.provisioningState === 'Succeeded'
      ? pass('observability.log_analytics.provisioned', 'Log Analytics workspace is provisioned.', workspace.value)
      : fail('observability.log_analytics.provisioned', 'Log Analytics workspace is not provisioned successfully.', workspace.value),
  ];

  const retention = Number(workspace.value?.retentionInDays ?? 0);
  checks.push(retention >= 30
    ? pass('observability.log_analytics.retention', `Log Analytics retention is ${retention} days.`, { retentionInDays: retention })
    : warn('observability.log_analytics.retention', `Log Analytics retention is ${retention} days; use at least 30 days for pilot evidence.`, { retentionInDays: retention }));

  return checks;
}

function auditAppInsights() {
  const app = tryAz([
    'monitor', 'app-insights', 'component', 'show',
    '-g', LAB.observabilityRg,
    '-a', LAB.resources.appInsights,
    '--query', '{name:name,provisioningState:provisioningState,workspaceResourceId:workspaceResourceId,appId:appId,kind:kind}',
    '-o', 'json',
  ]);
  if (!app.ok) {
    return [fail('observability.app_insights.exists', 'Application Insights component could not be read.', app)];
  }

  const checks = [
    app.value?.provisioningState === 'Succeeded'
      ? pass('observability.app_insights.provisioned', 'Application Insights component is provisioned.', app.value)
      : fail('observability.app_insights.provisioned', 'Application Insights component is not provisioned successfully.', app.value),
  ];

  checks.push(app.value?.workspaceResourceId
    ? pass('observability.app_insights.workspace_link', 'Application Insights is workspace-backed.', { workspaceResourceId: app.value.workspaceResourceId })
    : warn('observability.app_insights.workspace_link', 'Application Insights is not workspace-backed; prefer workspace mode for central evidence.', app.value));

  return checks;
}

function auditActionGroupAndAlert() {
  const actionGroup = tryAz([
    'monitor', 'action-group', 'show',
    '-g', LAB.observabilityRg,
    '-n', LAB.resources.actionGroup,
    '--query', '{name:name,enabled:enabled,emailReceivers:emailReceivers,webhookReceivers:webhookReceivers,armRoleReceivers:armRoleReceivers}',
    '-o', 'json',
  ]);
  const checks = [];
  if (!actionGroup.ok) {
    checks.push(fail('observability.action_group.exists', 'Action group could not be read.', actionGroup));
  } else {
    checks.push(actionGroup.value?.enabled === true
      ? pass('observability.action_group.enabled', 'Action group is enabled.', actionGroup.value)
      : fail('observability.action_group.enabled', 'Action group is disabled.', actionGroup.value));

    const receiverCount = toArray(actionGroup.value?.emailReceivers).length
      + toArray(actionGroup.value?.webhookReceivers).length
      + toArray(actionGroup.value?.armRoleReceivers).length;
    checks.push(receiverCount > 0
      ? pass('observability.action_group.receivers', `Action group has ${receiverCount} receiver(s).`, { receiverCount })
      : warn('observability.action_group.receivers', 'Action group has no receivers; deployment failures will not notify anyone.', actionGroup.value));
  }

  const alert = tryAz([
    'monitor', 'activity-log', 'alert', 'show',
    '-g', LAB.observabilityRg,
    '-n', LAB.resources.deploymentFailureAlert,
    '--query', '{name:name,enabled:enabled,scopes:scopes,condition:condition,actions:actions}',
    '-o', 'json',
  ]);
  if (!alert.ok) {
    checks.push(fail('observability.deployment_failure_alert.exists', 'Deployment failure activity-log alert could not be read.', alert));
  } else {
    checks.push(alert.value?.enabled === true
      ? pass('observability.deployment_failure_alert.enabled', 'Deployment failure activity-log alert is enabled.', alert.value)
      : fail('observability.deployment_failure_alert.enabled', 'Deployment failure activity-log alert is disabled.', alert.value));
  }

  return checks;
}

function auditCostBudget() {
  const budget = tryAz([
    'consumption', 'budget', 'show',
    '--budget-name', LAB.resources.budget,
    '--query', '{name:name,timeGrain:timeGrain,amount:amount,notifications:notifications}',
    '-o', 'json',
  ]);
  if (!budget.ok) {
    return [fail('cost.budget.exists', 'Cost Management budget could not be read.', budget)];
  }

  const checks = [
    budget.value?.name === LAB.resources.budget
      ? pass('cost.budget.exists', 'Monthly lab budget exists.', budget.value)
      : fail('cost.budget.exists', 'Monthly lab budget response did not match expected budget.', budget.value),
  ];

  const notifications = Object.values(budget.value?.notifications ?? {});
  const hasEightyPercent = notifications.some((notification) => Number(notification?.threshold ?? 0) <= 80);
  checks.push(hasEightyPercent
    ? pass('cost.budget.notifications', 'Budget has an alert threshold at or below 80%.', budget.value.notifications)
    : warn('cost.budget.notifications', 'Budget does not show an alert threshold at or below 80%.', budget.value.notifications));

  return checks;
}

function auditContainerAppsDiagnostics() {
  const environment = tryAz([
    'containerapp', 'env', 'show',
    '-g', LAB.controlPlaneRg,
    '-n', LAB.resources.containerAppsEnvironment,
    '--query', '{name:name,provisioningState:properties.provisioningState,logAnalytics:properties.appLogsConfiguration.logAnalyticsConfiguration}',
    '-o', 'json',
  ]);
  const checks = [];
  if (!environment.ok) {
    checks.push(fail('observability.containerapps_env.exists', 'Container Apps environment could not be read.', environment));
  } else {
    checks.push(environment.value?.provisioningState === 'Succeeded'
      ? pass('observability.containerapps_env.provisioned', 'Container Apps environment is provisioned.', environment.value)
      : fail('observability.containerapps_env.provisioned', 'Container Apps environment is not provisioned successfully.', environment.value));
    checks.push(environment.value?.logAnalytics
      ? pass('observability.containerapps_env.logs', 'Container Apps environment is configured for Log Analytics.', environment.value.logAnalytics)
      : warn('observability.containerapps_env.logs', 'Container Apps environment does not expose Log Analytics configuration in the audit response.', environment.value));
  }

  const app = tryAz([
    'containerapp', 'show',
    '-g', LAB.controlPlaneRg,
    '-n', LAB.resources.webApp,
    '--query', '{name:name,provisioningState:properties.provisioningState,latestReadyRevisionName:properties.latestReadyRevisionName,template:properties.template}',
    '-o', 'json',
  ]);
  if (!app.ok) {
    checks.push(fail('observability.web_app.exists', 'Web Container App could not be read.', app));
  } else {
    checks.push(app.value?.provisioningState === 'Succeeded'
      ? pass('observability.web_app.provisioned', 'Web Container App is provisioned.', {
        name: app.value.name,
        latestReadyRevisionName: app.value.latestReadyRevisionName,
      })
      : fail('observability.web_app.provisioned', 'Web Container App is not provisioned successfully.', app.value));

    const containers = toArray(app.value?.template?.containers);
    const envVars = containers.flatMap((container) => toArray(container?.env));
    const hasAppInsightsEnv = envVars.some((env) => ['APPLICATIONINSIGHTS_CONNECTION_STRING', 'APPINSIGHTS_CONNECTION_STRING'].includes(env?.name));
    checks.push(hasAppInsightsEnv
      ? pass('observability.web_app.app_insights_env', 'Web app has an Application Insights connection-string env binding.', { envName: 'APPLICATIONINSIGHTS_CONNECTION_STRING' })
      : warn('observability.web_app.app_insights_env', 'Web app does not expose an Application Insights connection-string env binding yet.', {
        envNames: envVars.map((env) => env?.name).filter(Boolean),
      }));
  }

  return checks;
}

function summarize(checks) {
  return checks.reduce((summary, check) => {
    summary[check.status] = (summary[check.status] ?? 0) + 1;
    return summary;
  }, { pass: 0, attention: 0, fail: 0 });
}

const checks = [
  ...auditLogAnalytics(),
  ...auditAppInsights(),
  ...auditActionGroupAndAlert(),
  ...auditCostBudget(),
  ...auditContainerAppsDiagnostics(),
];

const summary = summarize(checks);
const status = summary.fail > 0 ? 'fail' : summary.attention > 0 ? 'attention' : 'pass';

console.log(JSON.stringify({
  audit: 'azure-l11-observability',
  status,
  strict: STRICT,
  summary,
  checks,
}, null, 2));

if (summary.fail > 0 || (STRICT && summary.attention > 0)) {
  process.exit(1);
}
