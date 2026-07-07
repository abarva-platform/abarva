const fs = require('fs');

const stderr = fs.existsSync('depth-lint-error.log')
  ? fs.readFileSync('depth-lint-error.log', 'utf8').trim()
  : '';
const stdout = fs.existsSync('depth-lint-results.json')
  ? fs.readFileSync('depth-lint-results.json', 'utf8').trim()
  : '';

console.log(
  JSON.stringify(
    {
      results: [],
      pass: false,
      estimated_cost_usd: 0,
      error: stderr || stdout || 'Depth lint failed before producing JSON.',
    },
    null,
    2,
  ),
);
