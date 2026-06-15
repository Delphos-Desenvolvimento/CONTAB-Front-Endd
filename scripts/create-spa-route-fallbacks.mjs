import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const indexPath = join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error(`Missing build output: ${indexPath}`);
}

const routes = [
  'admin',
  'admin/login',
  'noticias',
  'equipe',
  'links-uteis',
];

for (const route of routes) {
  const routeDir = join(distDir, route);
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(indexPath, join(routeDir, 'index.html'));
}

console.log(`Created SPA fallbacks for ${routes.length} routes.`);

const legacyBundleNames = ['index-d3394580.js'];
const indexHtml = readFileSync(indexPath, 'utf8');
const currentBundleMatch = indexHtml.match(/\/assets\/(index-[^"']+\.js)/);

if (currentBundleMatch) {
  const currentBundlePath = join(distDir, 'assets', currentBundleMatch[1]);

  for (const legacyBundleName of legacyBundleNames) {
    const legacyBundlePath = join(distDir, 'assets', legacyBundleName);
    copyFileSync(currentBundlePath, legacyBundlePath);
  }

  console.log(`Created ${legacyBundleNames.length} legacy bundle alias.`);
}
