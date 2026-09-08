import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const CATEGORIES = ['on-page', 'indexability', 'rendered-seo', 'entity-schema-integrity', 'media-provenance-guard', 'local-corridor-verification'];
const makeFinding = (id, category, message, severity = 'warning', evidence = null) => ({ id, category, message, severity, file: null, evidence });
const normalize = route => !route || route === '/' ? '/' : route.startsWith('/') ? route : `/${route}`;
const canonicalFor = (origin, route) => {
  const base = String(origin).replace(/\/$/, '');
  const pathname = normalize(route);
  return pathname === '/' ? `${base}/` : `${base}${pathname}`;
};

function recalculate(report) {
  const blockers = report.findings.filter(item => item.severity === 'blocker').length;
  const warnings = report.findings.filter(item => item.severity === 'warning').length;
  const notices = report.findings.filter(item => item.severity === 'notice').length;
  report.summary = { ...(report.summary || {}), blockers, warnings, notices, routes: report.routes?.length || report.pagesScanned || 0 };
  report.certification = blockers ? 'RED' : warnings ? 'AMBER' : 'GREEN';
  report.categories = Object.fromEntries(CATEGORIES.map(category => {
    const count = report.findings.filter(item => item.category === category && item.severity !== 'notice').length;
    return [category, Math.max(0, 100 - count * 15)];
  }));
  report.score = Math.round(Object.values(report.categories).reduce((sum, value) => sum + value, 0) / CATEGORIES.length);
}

export async function certifyRendered({ dir = process.cwd(), baseUrl, canonicalOrigin = baseUrl, reportPath = '.rankos/report.json' }) {
  if (!baseUrl) throw new Error('rankos render requires --url <deployment-url>');
  chromium.setGraphicsMode = false;
  const target = path.resolve(dir, reportPath);
  const report = JSON.parse(await fs.readFile(target, 'utf8'));
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const renderedRoutes = [];
  const skippedRoutes = [];
  try {
    for (const routeInfo of report.routes || []) {
      const route = routeInfo.route || '/';
      if (route.includes(':param')) { skippedRoutes.push({ route, reason: 'dynamic route needs fixture' }); continue; }
      const page = await browser.newPage();
      const requestedUrl = new URL(normalize(route), String(baseUrl).replace(/\/$/, '') + '/').toString();
      let response;
      try {
        response = await page.goto(requestedUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 250));
        const observed = await page.evaluate(() => ({
          title: document.title.trim(),
          description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '',
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '',
          h1: [...document.querySelectorAll('h1')].map(node => (node.textContent || '').trim()).filter(Boolean),
          textLength: (document.body?.innerText || '').trim().length,
          jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
        }));
        renderedRoutes.push({ route, requestedUrl, finalUrl: page.url(), status: response?.status() ?? null, ...observed });
      } catch (error) {
        renderedRoutes.push({ route, requestedUrl, finalUrl: page.url(), status: response?.status() ?? null, error: String(error?.message || error) });
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }

  const findings = [];
  const successful = renderedRoutes.filter(item => !item.error && item.status && item.status < 400);
  const comparable = successful.length === renderedRoutes.length && skippedRoutes.length === 0;
  for (const item of renderedRoutes) {
    if (item.error || !item.status || item.status >= 400) { findings.push(makeFinding('rendered-route-unreachable', 'rendered-seo', `Rendered route ${item.route} could not be verified.`, 'warning', item)); continue; }
    if (!item.title) findings.push(makeFinding('rendered-title-missing', 'rendered-seo', `Rendered route ${item.route} has no title.`, 'warning', item));
    if (!item.description) findings.push(makeFinding('rendered-description-missing', 'rendered-seo', `Rendered route ${item.route} has no meta description.`, 'warning', item));
    if (!item.canonical) findings.push(makeFinding('rendered-canonical-missing', 'indexability', `Rendered route ${item.route} has no canonical.`, 'warning', item));
    else {
      const expected = canonicalFor(canonicalOrigin, item.route);
      const actual = new URL(item.canonical, item.finalUrl).toString();
      if (actual !== expected) findings.push(makeFinding('rendered-canonical-mismatch', 'indexability', `Rendered canonical for ${item.route} is ${actual}; expected ${expected}.`, 'warning', { ...item, expectedCanonical: expected, actualCanonical: actual }));
    }
    if (item.textLength < 80) findings.push(makeFinding('rendered-thin-document', 'rendered-seo', `Rendered route ${item.route} exposes very little crawler-visible text.`, 'warning', item));
  }
  if (comparable && successful.length > 1) {
    const titles = new Map(), descriptions = new Map();
    for (const item of successful) {
      if (item.title) titles.set(item.title, [...(titles.get(item.title) || []), item.route]);
      if (item.description) descriptions.set(item.description, [...(descriptions.get(item.description) || []), item.route]);
    }
    for (const [title, routes] of titles) if (routes.length > 1) findings.push(makeFinding('rendered-title-duplicate', 'rendered-seo', `Rendered title duplicated across ${routes.length} routes.`, 'warning', { title, routes }));
    for (const [description, routes] of descriptions) if (routes.length > 1) findings.push(makeFinding('rendered-description-duplicate', 'rendered-seo', `Rendered description duplicated across ${routes.length} routes.`, 'warning', { description, routes }));
  }
  const clearTitle = comparable && successful.length > 1 && !findings.some(item => ['rendered-title-missing', 'rendered-title-duplicate'].includes(item.id));
  const clearDescription = comparable && successful.length > 1 && !findings.some(item => ['rendered-description-missing', 'rendered-description-duplicate'].includes(item.id));
  report.findings = (report.findings || []).filter(item => {
    if (item.id === 'spa-shared-title-risk' && clearTitle) return false;
    if (item.id === 'spa-shared-description-risk' && clearDescription) return false;
    return !item.id.startsWith('rendered-');
  });
  report.findings.push(...findings);
  report.evidence = { ...(report.evidence || {}), rendered: true, renderedAt: new Date().toISOString(), renderedBaseUrl: baseUrl, canonicalOrigin, renderedRoutes, skippedRoutes };
  recalculate(report);
  await fs.writeFile(target, JSON.stringify(report, null, 2) + '\n');
  return { report, output: target };
}
