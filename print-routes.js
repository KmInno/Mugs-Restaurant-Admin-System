// Script to scan src/routes/*.js and src/app.js to list declared routes and mounted prefixes.
// Run with: node print-routes.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach(entry => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(p));
    else if (entry.isFile() && p.endsWith('.js')) results.push(p);
  });
  return results;
}

function scanRouteFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const routes = [];
  const re = /router\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const method = m[1];
    const routePath = m[2];
    routes.push({ method: method.toUpperCase(), path: routePath });
  }
  return routes;
}

function scanAppMounts(appFile) {
  if (!fs.existsSync(appFile)) return [];
  const content = fs.readFileSync(appFile, 'utf8');
  const mounts = [];
  // match app.use('/prefix', routerVariable)
  const re = /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([a-zA-Z0-9_\.\[\]'"\)]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    mounts.push({ prefix: m[1], handler: m[2].trim() });
  }
  return mounts;
}

const routesDir = path.join(__dirname, 'src', 'routes');
if (!fs.existsSync(routesDir)) {
  console.error('No src/routes directory found.');
  process.exit(1);
}

const files = walk(routesDir);
let any = false;
console.log('Scanning route files in src/routes...');
files.forEach(f => {
  const rel = path.relative(process.cwd(), f);
  const routes = scanRouteFile(f);
  if (routes.length) {
    any = true;
    console.log(`\nFile: ${rel}`);
    routes.forEach(r => console.log(`  ${r.method.padEnd(6)} ${r.path}`));
  }
});

const mounts = scanAppMounts(path.join(__dirname, 'src', 'app.js'));
if (mounts.length) {
  console.log('\nMounts found in src/app.js:');
  mounts.forEach(m => console.log(`  prefix=${m.prefix}  handler=${m.handler}`));
}

if (!any && !mounts.length) console.log('No routes or mounts found by scanner.');

