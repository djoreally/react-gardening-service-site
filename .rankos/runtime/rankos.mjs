#!/usr/bin/env node
import process from 'node:process';
import { certifyV2 } from './engine.mjs';
import { certifyRendered } from './rendered.mjs';
const args = process.argv.slice(2);
const command = args[0] || 'verify';
function option(name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? args[index + 1] : fallback; }
const dirArg = option('--dir', process.cwd());
const outputArg = option('--output', '.rankos/report.json');
function print(report, output) {
  console.log(`RankOS v${report.version} ${report.certification} · ${report.score}/100 · ${report.pagesScanned} routes scanned`);
  console.log(`Findings: ${report.summary.blockers} blockers, ${report.summary.warnings} warnings, ${report.summary.notices || 0} notices`);
  console.log(`Frameworks: ${(report.evidence.frameworks || []).join(', ') || 'unknown'}`);
  console.log(`Entity nodes: ${report.evidence.resolvedEntityNodes} · Media assets: ${report.evidence.mediaAssets}`);
  if (report.evidence.rendered) console.log(`Rendered routes: ${report.evidence.renderedRoutes?.length || 0} · skipped: ${report.evidence.skippedRoutes?.length || 0}`);
  console.log(`Evidence: ${output}`);
  for (const item of report.findings) console.log(`- [${item.severity}] ${item.id}: ${item.message}${item.file ? ` (${item.file})` : ''}`);
}
if (command === 'verify') {
  const { report, output } = await certifyV2({ dir: dirArg, output: outputArg });
  print(report, output);
  if (report.summary.blockers > 0) process.exitCode = 1;
} else if (command === 'render') {
  const baseUrl = option('--url', null);
  const canonicalOrigin = option('--canonical-origin', baseUrl);
  const { report, output } = await certifyRendered({ dir: dirArg, baseUrl, canonicalOrigin, reportPath: outputArg });
  print(report, output);
  if (report.summary.blockers > 0) process.exitCode = 1;
} else {
  console.error(`Unknown command: ${command}. Use verify or render.`);
  process.exitCode = 1;
}
