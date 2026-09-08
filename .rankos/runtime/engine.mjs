import fs from 'node:fs/promises';
import path from 'node:path';

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', 'build']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx', '.html', '.json']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const ORGANIZATION_TYPES = new Set(['Organization', 'LocalBusiness', 'Corporation']);

async function walk(dir, files = []) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return files; }
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP.has(entry.name)) await walk(path.join(dir, entry.name), files);
    if (entry.isFile()) files.push(path.join(dir, entry.name));
  }
  return files;
}
function finding(id, category, message, severity = 'warning', file = null, evidence = null) { return { id, category, message, severity, file, evidence }; }
function jsonLdBlocks(text) { return [...text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1].trim()); }
function parseJsonLd(source) { try { return JSON.parse(source); } catch { return null; } }
function flattenSchema(value) { if (!value) return []; if (Array.isArray(value)) return value.flatMap(flattenSchema); if (value['@graph']) return flattenSchema(value['@graph']); return [value]; }
function collectStaticSchemaEvidence(sourceEntries) {
  const evidence = []; const typePattern = /['"]@type['"]\s*:\s*['"](Organization|LocalBusiness|Corporation)['"]/g;
  for (const [file, text] of sourceEntries) for (const match of text.matchAll(typePattern)) {
    const nearby = text.slice(Math.max(0, match.index - 800), Math.min(text.length, match.index + 2200));
    const idMatch = nearby.match(/['"]@id['"]\s*:\s*['"]([^'"]+)['"]/); const sameAsMatch = nearby.match(/sameAs\s*:\s*\[([\s\S]*?)\]/);
    const sameAs = sameAsMatch ? [...sameAsMatch[1].matchAll(/['"](https?:\/\/[^'"]+)['"]/g)].map((item) => item[1]) : [];
    evidence.push({ '@type': match[1], ...(idMatch ? { '@id': idMatch[1] } : {}), ...(sameAs.length ? { sameAs } : {}), __rankosSourceFile: file });
  }
  return evidence;
}
function discoverRoutes(sourceEntries, root) {
  const routes = new Map();
  for (const [file, text] of sourceEntries) {
    const relative = path.relative(root, file).replaceAll(path.sep, '/');
    if (/(?:^|\/)(?:page)\.(tsx?|jsx?)$/.test(relative)) {
      let route = relative.replace(/^src\/app\//, '/').replace(/^app\//, '/').replace(/\/page\.(tsx?|jsx?)$/, '');
      route = route.replace(/\([^/]+\)\//g, '').replace(/\[[^/]+\]/g, ':param'); if (!route || route === relative) route = '/';
      routes.set(route || '/', { route: route || '/', file: relative, framework: 'next-app-router' });
    }
    for (const match of text.matchAll(/<Route\b[^>]*\bpath\s*=\s*["']([^"']+)["'][^>]*>/g)) {
      const route = match[1]; if (route === '*') continue; routes.set(route, { route, file: relative, framework: 'react-router' });
    }
  }
  if (!routes.size) {
    const publicIndex = sourceEntries.find(([file]) => path.relative(root, file).replaceAll(path.sep, '/') === 'public/index.html');
    if (publicIndex) routes.set('/', { route: '/', file: 'public/index.html', framework: 'static-shell' });
  }
  return [...routes.values()];
}
function extractHtmlShell(sourceEntries, root) {
  for (const candidate of ['public/index.html', 'index.html']) { const found = sourceEntries.find(([file]) => path.relative(root, file).replaceAll(path.sep, '/') === candidate); if (found) return { file: candidate, text: found[1] }; }
  return null;
}
function policyDefaults() { return { version: 2, entity: { organizationId: null, requiredSameAs: [], serviceRadius: null, requiredTypes: ['Organization'] }, provenance: { highTrustPaths: ['testimonial', 'gallery', 'reviews'], requireExif: false, requireGps: false }, local: { enabled: true, pathSegments: ['locations', 'service-areas'], requiredSignals: ['zip', 'county', 'city'] }, strict: false }; }
async function readPolicy(root) {
  try { const supplied = JSON.parse(await fs.readFile(path.join(root, '.rankosrc.json'), 'utf8')); const defaults = policyDefaults(); return { ...defaults, ...supplied, entity: { ...defaults.entity, ...(supplied.entity || {}) }, provenance: { ...defaults.provenance, ...(supplied.provenance || {}) }, local: { ...defaults.local, ...(supplied.local || {}) } }; } catch { return policyDefaults(); }
}
function severity(policy, defaultSeverity = 'warning') { return policy.strict ? 'blocker' : defaultSeverity; }
export async function certifyV2({ dir, output = '.rankos/report.json' }) {
  const root = path.resolve(dir); const allFiles = await walk(root); const textFiles = allFiles.filter((file) => EXTENSIONS.has(path.extname(file))); const contents = new Map();
  for (const file of textFiles) { try { contents.set(file, await fs.readFile(file, 'utf8')); } catch {} }
  const source = [...contents.entries()]; const joined = source.map(([, text]) => text).join('\n'); const policy = await readPolicy(root); const findings = []; const routes = discoverRoutes(source, root); const routeFiles = [...new Set(routes.map((route) => route.file))]; const blocks = source.flatMap(([file, text]) => jsonLdBlocks(text).map((block) => ({ file, block, parsed: parseJsonLd(block) })));
  const shell = extractHtmlShell(source, root);
  if (shell) {
    const title = shell.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''; const description = shell.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]?.trim() || ''; const canonical = /<link[^>]+rel=["']canonical["']/i.test(shell.text); const rootShell = /<div[^>]+id=["']root["'][^>]*>\s*<\/div>/i.test(shell.text);
    if (!title) findings.push(finding('metadata-title-missing', 'on-page', 'Document shell is missing a <title>.', severity(policy), shell.file));
    if (!description) findings.push(finding('metadata-description-missing', 'on-page', 'Document shell is missing a meta description.', severity(policy), shell.file));
    if (!canonical) findings.push(finding('canonical-missing', 'indexability', 'Document shell does not declare a canonical URL.', severity(policy), shell.file));
    if (routes.length > 1 && title) findings.push(finding('spa-shared-title-risk', 'rendered-seo', `${routes.length} client-side routes appear to share one static document title unless runtime metadata overrides it.`, severity(policy), shell.file, { title, routes: routes.map((item) => item.route) }));
    if (routes.length > 1 && description) findings.push(finding('spa-shared-description-risk', 'rendered-seo', `${routes.length} client-side routes appear to share one static meta description unless runtime metadata overrides it.`, severity(policy), shell.file, { description }));
    if (rootShell) findings.push(finding('client-rendered-shell', 'rendered-seo', 'Initial HTML shell contains an empty application root; crawler-visible route content must be verified with a rendered audit.', severity(policy), shell.file, { renderedVerificationRequired: true }));
  }
  if (!allFiles.some((file) => path.basename(file).toLowerCase() === 'robots.txt')) findings.push(finding('robots-file-missing', 'indexability', 'No robots.txt file was found in the repository.', severity(policy)));
  if (!allFiles.some((file) => /sitemap(?:\.xml|\.ts|\.js)?$/i.test(path.basename(file)))) findings.push(finding('sitemap-missing', 'indexability', 'No sitemap implementation was detected.', severity(policy)));
  if (blocks.length === 0 && /jsonLd|application\/ld\+json/i.test(joined)) findings.push(finding('entity-schema-dynamic-source', 'entity-schema-integrity', 'Framework-generated JSON-LD was detected; static entity evidence is used until rendered verification is available.', 'notice'));
  const literalNodes = blocks.flatMap(({ parsed }) => flattenSchema(parsed)); const staticNodes = collectStaticSchemaEvidence(source); const nodes = [...literalNodes, ...staticNodes]; const organizations = nodes.filter((node) => ORGANIZATION_TYPES.has(node?.['@type']));
  if (organizations.length) {
    const preferredOrganization = organizations.find((node) => node['@type'] === 'Organization') || organizations[0];
    if (!preferredOrganization['@id'] && !policy.entity.organizationId) findings.push(finding('entity-id-missing', 'entity-schema-integrity', 'Organization schema lacks an exact @id URI.', severity(policy), preferredOrganization.__rankosSourceFile || null));
    const sameAs = Array.isArray(preferredOrganization.sameAs) ? preferredOrganization.sameAs : [];
    for (const required of policy.entity.requiredSameAs || []) if (!sameAs.some((value) => String(value).includes(required))) findings.push(finding('entity-sameas-missing', 'entity-schema-integrity', `Organization sameAs is missing the verified profile: ${required}.`, severity(policy), preferredOrganization.__rankosSourceFile || null, { required, found: sameAs }));
  } else if (policy.entity.requiredTypes?.length) findings.push(finding('entity-node-missing', 'entity-schema-integrity', `No required entity type was resolved: ${policy.entity.requiredTypes.join(', ')}.`, severity(policy)));
  const imageFiles = allFiles.filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  for (const file of imageFiles) {
    const relative = path.relative(root, file).replaceAll(path.sep, '/'); const highTrust = policy.provenance.highTrustPaths.some((segment) => relative.toLowerCase().includes(segment)); if (!highTrust) continue; const buffer = await fs.readFile(file); const ascii = buffer.toString('latin1'); const hasExif = ascii.includes('Exif') || ascii.includes('xmp:CreatorTool'); const hasGps = /GPSLatitude|GPSLongitude|<exif:GPS/i.test(ascii); const syntheticMarker = /c2pa|stable diffusion|midjourney|dall[·-]?e|generative ai/i.test(ascii);
    if (policy.provenance.requireExif && !hasExif) findings.push(finding('media-exif-missing', 'media-provenance-guard', 'High-trust media asset lacks detectable EXIF or creator provenance metadata.', severity(policy), relative)); if (policy.provenance.requireGps && !hasGps) findings.push(finding('media-gps-missing', 'media-provenance-guard', 'Local service media asset lacks detectable GPS metadata.', severity(policy), relative)); if (syntheticMarker) findings.push(finding('media-synthetic-marker', 'media-provenance-guard', 'High-trust media asset contains a known synthetic-generation marker.', severity(policy), relative));
  }
  if (policy.local.enabled) for (const route of routes) {
    const localRoute = policy.local.pathSegments.some((segment) => route.route.includes(`/${segment}`) || route.file.includes(`/${segment}/`)); if (!localRoute) continue; const text = source.find(([file]) => path.relative(root, file).replaceAll(path.sep, '/') === route.file)?.[1] || ''; const missing = (policy.local.requiredSignals || []).filter((signal) => !new RegExp(signal, 'i').test(text)); if (missing.length) findings.push(finding('local-corridor-thin-content', 'local-corridor-verification', `Local route lacks distinct regional signals: ${missing.join(', ')}.`, severity(policy), route.file, { route: route.route, missing }));
  }
  const blockers = findings.filter((item) => item.severity === 'blocker').length; const warnings = findings.filter((item) => item.severity === 'warning').length; const notices = findings.filter((item) => item.severity === 'notice').length; const categoryNames = ['on-page', 'indexability', 'rendered-seo', 'entity-schema-integrity', 'media-provenance-guard', 'local-corridor-verification']; const categories = Object.fromEntries(categoryNames.map((category) => { const count = findings.filter((item) => item.category === category && item.severity !== 'notice').length; return [category, Math.max(0, 100 - count * 15)]; })); const score = Math.round(Object.values(categories).reduce((sum, value) => sum + value, 0) / categoryNames.length);
  const report = { version: 2, generatedAt: new Date().toISOString(), repository: path.basename(root), pagesScanned: routes.length, certification: blockers ? 'RED' : warnings ? 'AMBER' : 'GREEN', score, summary: { blockers, warnings, notices, routes: routes.length }, categories, routes, policy: { strict: policy.strict, entity: true, provenance: true, localCorridor: policy.local.enabled }, findings, evidence: { sourceFiles: source.length, routeFiles: routeFiles.length, discoveredRoutes: routes.length, frameworks: [...new Set(routes.map((route) => route.framework))], jsonLdBlocks: blocks.length, resolvedEntityNodes: nodes.length, staticEntityNodes: staticNodes.length, mediaAssets: imageFiles.length, rendered: false, performance: false }, next: blockers ? 'Fix blockers, then rerun rankos verify.' : 'Capture this report as the baseline, then run rendered and performance verification before repairs.' };
  const target = path.resolve(root, output); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, JSON.stringify(report, null, 2) + '\n'); return { report, output: target };
}
