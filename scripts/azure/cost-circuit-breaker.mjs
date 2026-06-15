#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUTPUT_DIR = 'docs/build/azure/cost-circuit-breaker';
const DEFAULT_THRESHOLDS = {
  watch: 50,
  warn: 80,
  breach: 100,
};

function parseArgs(argv) {
  const args = {
    outputDir: DEFAULT_OUTPUT_DIR,
    subscriptions: [],
    failOnBreach: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--output') {
      args.outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--subscriptions') {
      args.subscriptions = parseSubscriptions(argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (arg === '--fail-on-breach') {
      args.failOnBreach = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.subscriptions.length === 0 && process.env.AZURE_COST_SUBSCRIPTIONS) {
    args.subscriptions = parseSubscriptions(process.env.AZURE_COST_SUBSCRIPTIONS);
  }

  if (args.subscriptions.length === 0) {
    throw new Error('Provide --subscriptions "label=subscription-id[,label=subscription-id]"');
  }

  return args;
}

function parseSubscriptions(raw) {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label, subscriptionId] = entry.split('=');
      if (!label || !subscriptionId) {
        throw new Error(`Invalid subscription entry "${entry}". Use label=subscription-id.`);
      }
      return {
        label: label.trim(),
        subscriptionId: subscriptionId.trim(),
      };
    });
}

function printHelp() {
  console.log(`AbarVa Azure Cost Circuit Breaker (read-only)

Usage:
  node scripts/azure/cost-circuit-breaker.mjs \\
    --subscriptions "lab=<subscription-id>,product-dev=<subscription-id>" \\
    --output docs/build/azure/<run-folder>

Default behavior is read-only and exits 0 even when a budget is breached.
Use --fail-on-breach only for CI or scheduled checks that should fail on breach.`);
}

function runAz(args) {
  return execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runAzJson(args) {
  const stdout = runAz([...args, '--output', 'json']);
  return JSON.parse(stdout);
}

function safeAzJson(args) {
  try {
    return { ok: true, value: runAzJson(args) };
  } catch (error) {
    return {
      ok: false,
      error: String(error.stderr || error.message || error),
    };
  }
}

function budgetUrl(subscriptionId) {
  return `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Consumption/budgets?api-version=2023-11-01`;
}

function percent(amount, budget) {
  if (!Number.isFinite(amount) || !Number.isFinite(budget) || budget <= 0) return null;
  return Number(((amount / budget) * 100).toFixed(1));
}

function classify(currentPercent, forecastPercent, hasBudget) {
  if (!hasBudget) return 'NO_BUDGET';
  const maxPercent = Math.max(currentPercent ?? 0, forecastPercent ?? 0);
  if (maxPercent >= DEFAULT_THRESHOLDS.breach) return 'BREACH';
  if (maxPercent >= DEFAULT_THRESHOLDS.warn) return 'WARN';
  if (maxPercent >= DEFAULT_THRESHOLDS.watch) return 'WATCH';
  return 'OK';
}

function normalizeBudget(rawBudget) {
  const properties = rawBudget.properties ?? {};
  const amount = Number(properties.amount);
  const currentSpend = Number(properties.currentSpend?.amount ?? 0);
  const forecastSpend = Number(properties.forecastSpend?.amount ?? Number.NaN);
  const currentPercent = percent(currentSpend, amount);
  const forecastPercent = percent(forecastSpend, amount);
  return {
    id: rawBudget.id,
    name: rawBudget.name,
    category: properties.category,
    amount,
    timeGrain: properties.timeGrain,
    timePeriod: properties.timePeriod,
    currentSpend,
    forecastSpend: Number.isFinite(forecastSpend) ? forecastSpend : null,
    currentPercent,
    forecastPercent,
    status: classify(currentPercent, forecastPercent, true),
    notifications: Object.entries(properties.notifications ?? {}).map(([name, notification]) => ({
      name,
      enabled: notification.enabled,
      operator: notification.operator,
      threshold: notification.threshold,
      thresholdType: notification.thresholdType,
      contactEmails: notification.contactEmails ?? [],
    })),
  };
}

function summarizeSubscription(subscription) {
  const accountResult = safeAzJson(['account', 'show', '--subscription', subscription.subscriptionId]);
  const budgetsResult = safeAzJson(['rest', '--method', 'get', '--url', budgetUrl(subscription.subscriptionId)]);

  if (!accountResult.ok || !budgetsResult.ok) {
    return {
      ...subscription,
      status: 'INACCESSIBLE',
      subscriptionName: accountResult.value?.name ?? null,
      error: accountResult.error || budgetsResult.error,
      budgets: [],
    };
  }

  const rawBudgets = budgetsResult.value?.value ?? [];
  const budgets = rawBudgets.map(normalizeBudget);
  const status = budgets.length === 0 ? 'NO_BUDGET' : worstStatus(budgets.map((budget) => budget.status));

  return {
    ...subscription,
    subscriptionName: accountResult.value?.name ?? null,
    tenantId: accountResult.value?.tenantId ?? null,
    state: accountResult.value?.state ?? null,
    status,
    budgets,
  };
}

function worstStatus(statuses) {
  const order = ['OK', 'WATCH', 'WARN', 'BREACH', 'NO_BUDGET', 'INACCESSIBLE'];
  return statuses.reduce((worst, status) => (order.indexOf(status) > order.indexOf(worst) ? status : worst), 'OK');
}

function summarizeOverall(subscriptions) {
  const overallStatus = worstStatus(subscriptions.map((subscription) => subscription.status));
  return {
    status: overallStatus,
    totalSubscriptions: subscriptions.length,
    counts: subscriptions.reduce((acc, subscription) => {
      acc[subscription.status] = (acc[subscription.status] ?? 0) + 1;
      return acc;
    }, {}),
    triggeredActions: recommendedActions(overallStatus),
  };
}

function recommendedActions(status) {
  if (status === 'BREACH') {
    return [
      'Notify admin@abarva.ai and alerts@abarva.ai.',
      'Review cost analysis by service and resource group.',
      'Pause nonessential jobs only after explicit human approval.',
      'Do not delete resources or rotate secrets as an automated cost action.',
    ];
  }
  if (status === 'WARN') {
    return [
      'Review daily run-rate and forecast.',
      'Inspect long-running jobs, ACA revisions, and high-cost AI/search usage.',
      'Prepare a human approval request before any pause or scale-down action.',
    ];
  }
  if (status === 'WATCH') {
    return ['Watch spend trajectory and verify alerts are reaching corporate inboxes.'];
  }
  if (status === 'NO_BUDGET') {
    return ['Create a budget before runtime workloads are allowed in the subscription.'];
  }
  if (status === 'INACCESSIBLE') {
    return ['Fix Azure RBAC or login context before relying on cost guard evidence.'];
  }
  return ['No action required beyond scheduled monitoring.'];
}

function markdownReport(report) {
  const lines = [
    '# AbarVa Azure Cost Circuit Breaker Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'This is a read-only cost guard. It queries Azure budgets and emits evidence. It does not create, update, stop, delete, scale, pause, or mutate Azure resources.',
    '',
    'Budgets are alerting controls, not hard spending caps. Real surge protection also needs quota, policy, SKU, scaling, job-timeout, and human-approved pause controls.',
    '',
    '## Overall',
    '',
    `- Status: ${report.overall.status}`,
    `- Subscriptions checked: ${report.overall.totalSubscriptions}`,
    `- Counts: ${JSON.stringify(report.overall.counts)}`,
    '',
    '## Recommended Actions',
    '',
    ...report.overall.triggeredActions.map((action) => `- ${action}`),
    '',
    '## Subscription Results',
    '',
    '| Label | Subscription | Status | Budget | Current | Forecast | Alerts |',
    '| --- | --- | --- | ---: | ---: | ---: | --- |',
  ];

  for (const subscription of report.subscriptions) {
    if (subscription.budgets.length === 0) {
      lines.push(
        `| ${subscription.label} | ${subscription.subscriptionName ?? subscription.subscriptionId} | ${subscription.status} | n/a | n/a | n/a | n/a |`,
      );
      continue;
    }
    for (const budget of subscription.budgets) {
      const alertEmails = [...new Set(budget.notifications.flatMap((notification) => notification.contactEmails))].join(', ');
      lines.push(
        `| ${subscription.label} | ${subscription.subscriptionName ?? subscription.subscriptionId} | ${budget.status} | $${budget.amount.toFixed(2)} | $${budget.currentSpend.toFixed(2)} (${budget.currentPercent ?? 'n/a'}%) | ${
          budget.forecastSpend === null ? 'n/a' : `$${budget.forecastSpend.toFixed(2)} (${budget.forecastPercent ?? 'n/a'}%)`
        } | ${alertEmails || 'none'} |`,
      );
    }
  }

  lines.push(
    '',
    '## Manual Escalation Path',
    '',
    '1. Confirm the subscription and budget in Azure Cost Management.',
    '2. Identify the top service/resource group cost driver.',
    '3. If the cost driver is a nonessential job, prepare a one-line human approval request to pause it.',
    '4. If the cost driver is production/client runtime, escalate before taking any action.',
    '5. Record the action and reversal owner in the environment execution ledger.',
    '',
    '## Explicit Non-Actions',
    '',
    '- No automatic deletion.',
    '- No automatic resource scaling.',
    '- No automatic job disablement.',
    '- No secret or RBAC changes.',
    '- No DNS or traffic changes.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const subscriptions = args.subscriptions.map(summarizeSubscription);
  const report = {
    version: '2026-06',
    generatedAt,
    mode: 'read-only',
    thresholds: DEFAULT_THRESHOLDS,
    overall: summarizeOverall(subscriptions),
    subscriptions,
  };

  fs.mkdirSync(args.outputDir, { recursive: true });
  fs.writeFileSync(path.join(args.outputDir, 'cost-circuit-breaker-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(args.outputDir, 'cost-circuit-breaker-report.md'), markdownReport(report));

  console.log(JSON.stringify(report, null, 2));
  if (args.failOnBreach && ['BREACH', 'NO_BUDGET', 'INACCESSIBLE'].includes(report.overall.status)) {
    process.exit(2);
  }
}

main();
