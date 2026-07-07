const fs = require('fs');

const report = JSON.parse(fs.readFileSync('depth-lint-results.json', 'utf8'));
const results = report.results || [report];
const rows = results.map(
  (result) =>
    `| ${result.artifact_id} | ${result.rubric_type} | ${result.total_score}/10 | ${
      result.pass ? 'PASS' : 'BLOCK'
    } |`,
);

console.log('## Depth lint scores');
console.log('');

if (rows.length > 0) {
  console.log('| Artifact | Rubric | Score | Result |');
  console.log('|---|---:|---:|---|');
  console.log(rows.join('\n'));
} else {
  console.log('Depth lint failed before producing artifact scores.');
  console.log('');
  console.log('```');
  console.log(report.error || 'Unknown depth lint failure.');
  console.log('```');
}

console.log('');
console.log(`Estimated run cost: $${Number(report.estimated_cost_usd || 0).toFixed(4)}`);
