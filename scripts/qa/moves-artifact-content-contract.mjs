import fs from "node:fs";

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function compileRule(rule, label) {
  if (!rule || typeof rule !== "object") throw new Error(`${label} must be an object`);
  const key = assertString(rule.key, `${label}.key`);
  const pattern = assertString(rule.pattern, `${label}.pattern`);
  const flags = rule.flags ?? "iu";
  try {
    return { key, label: assertString(rule.label, `${label}.label`), pattern: new RegExp(pattern, flags) };
  } catch (error) {
    throw new Error(`${label}.pattern is not a valid regular expression: ${error.message}`);
  }
}

export function loadContract(contractPath) {
  const raw = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  if (!raw || typeof raw !== "object") throw new Error("Contract must be a JSON object");

  const signals = (raw.signals ?? []).map((rule, index) => compileRule(rule, `signals[${index}]`));
  const signalKeys = new Set(signals.map((signal) => signal.key));
  if (signalKeys.size !== signals.length) throw new Error("Contract signal keys must be unique");

  const phaseRequirements = (raw.phaseRequirements ?? []).map((requirement, index) => {
    const label = `phaseRequirements[${index}]`;
    if (!requirement || typeof requirement !== "object") throw new Error(`${label} must be an object`);
    const key = assertString(requirement.key, `${label}.key`);
    const phase = Number(requirement.phase);
    if (!Number.isInteger(phase) || phase < 0) throw new Error(`${label}.phase must be a non-negative integer`);
    const requiredSignals = [...new Set(requirement.signals ?? [])];
    if (requiredSignals.length === 0) throw new Error(`${label}.signals must not be empty`);
    for (const signalKey of requiredSignals) {
      if (!signalKeys.has(signalKey)) throw new Error(`${label} references unknown signal ${signalKey}`);
    }
    return { key, label: assertString(requirement.label, `${label}.label`), phase, signals: requiredSignals };
  });

  const phaseKeys = new Set(phaseRequirements.map((requirement) => requirement.key));
  if (phaseKeys.size !== phaseRequirements.length) throw new Error("Phase requirement keys must be unique");

  const minimumArtifactsByPhase = Object.fromEntries(
    Object.entries(raw.minimumArtifactsByPhase ?? {}).map(([phase, minimum]) => {
      const phaseNumber = Number(phase);
      const minimumNumber = Number(minimum);
      if (!Number.isInteger(phaseNumber) || phaseNumber < 0 || !Number.isInteger(minimumNumber) || minimumNumber < 1) {
        throw new Error("minimumArtifactsByPhase must contain positive integer values keyed by phase");
      }
      return [String(phaseNumber), minimumNumber];
    }),
  );

  return {
    id: assertString(raw.id, "id"),
    version: raw.version ?? 1,
    signals,
    phaseRequirements,
    minimumArtifactsByPhase,
    prohibited: (raw.prohibited ?? []).map((rule, index) => compileRule(rule, `prohibited[${index}]`)),
  };
}

function excerptAround(text, index) {
  const start = Math.max(0, index - 140);
  const end = Math.min(text.length, index + 220);
  return text.slice(start, end).replace(/\s+/gu, " ").trim();
}

function findHits(rule, artifacts, predicate = () => true) {
  const hits = [];
  for (const artifact of artifacts) {
    if (!predicate(artifact)) continue;
    rule.pattern.lastIndex = 0;
    const match = artifact.text.match(rule.pattern);
    if (!match) continue;
    hits.push({
      artifactId: artifact.artifactId,
      phase: artifact.phase,
      title: artifact.title,
      excerpt: excerptAround(artifact.text, match.index ?? 0),
    });
  }
  return hits;
}

export function evaluateArtifactContent({ contract, artifacts }) {
  const normalizedArtifacts = artifacts.map((artifact) => ({
    ...artifact,
    phase: artifact.phase == null ? null : Number(artifact.phase),
    text: String(artifact.text ?? ""),
  }));
  const signals = contract.signals.map((rule) => {
    const artifactsForSignal = findHits(rule, normalizedArtifacts);
    return { key: rule.key, label: rule.label, found: artifactsForSignal.length > 0, count: artifactsForSignal.length, artifacts: artifactsForSignal };
  });
  const signalByKey = new Map(signals.map((signal) => [signal.key, signal]));
  const phaseSignals = [];
  for (const requirement of contract.phaseRequirements) {
    for (const signalKey of requirement.signals) {
      const signal = signalByKey.get(signalKey);
      const artifactsForSignal = (signal?.artifacts ?? []).filter((artifact) => artifact.phase === requirement.phase);
      phaseSignals.push({
        key: `${requirement.key}:${signalKey}`,
        requirementKey: requirement.key,
        label: `${requirement.label}: ${signalKey}`,
        phase: requirement.phase,
        signalKey,
        found: artifactsForSignal.length > 0,
        count: artifactsForSignal.length,
        artifacts: artifactsForSignal,
      });
    }
  }
  const phaseArtifactCounts = Object.fromEntries(
    Object.keys(contract.minimumArtifactsByPhase).map((phase) => [phase, normalizedArtifacts.filter((artifact) => artifact.phase === Number(phase)).length]),
  );
  const missingPhaseArtifacts = Object.entries(contract.minimumArtifactsByPhase)
    .filter(([phase, minimum]) => (phaseArtifactCounts[phase] ?? 0) < minimum)
    .map(([phase, minimum]) => ({ phase: Number(phase), minimum, actual: phaseArtifactCounts[phase] ?? 0 }));
  const disclosure = contract.prohibited.map((rule) => {
    const artifactsForRule = findHits(rule, normalizedArtifacts);
    return { key: rule.key, label: rule.label, found: artifactsForRule.length > 0, artifacts: artifactsForRule };
  });
  const missingSignals = signals.filter((signal) => !signal.found).map((signal) => signal.key);
  const missingPhaseSignals = phaseSignals.filter((signal) => !signal.found).map((signal) => signal.key);
  const prohibitedMatches = disclosure.filter((rule) => rule.found).map((rule) => rule.key);
  return {
    ok: normalizedArtifacts.length > 0 && missingSignals.length === 0 && missingPhaseSignals.length === 0 && missingPhaseArtifacts.length === 0 && prohibitedMatches.length === 0,
    signals,
    phaseSignals,
    phaseArtifactCounts,
    disclosure,
    missingSignals,
    missingPhaseSignals,
    missingPhaseArtifacts,
    prohibitedMatches,
  };
}
