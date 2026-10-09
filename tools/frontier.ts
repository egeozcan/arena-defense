import { mkdirSync, writeFileSync } from 'node:fs';
import { frontierAudit } from './vehicle-frontier';

const reports = (['easy', 'medium', 'hard'] as const).map(frontierAudit);
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/vehicle-frontier.json', JSON.stringify(reports, null, 2));
for (const report of reports) {
  console.log(JSON.stringify(report));
  if (report.dominated.length || report.deadUpgrades.length) process.exitCode = 1;
}
