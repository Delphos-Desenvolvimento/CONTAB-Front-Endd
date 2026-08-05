import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const indexPath = join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error(`Missing build output: ${indexPath}`);
}

const routes = [
  'admin',
  'admin/login',
  'admin/prefeituras',
  'prefeituras',
  'login',
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
