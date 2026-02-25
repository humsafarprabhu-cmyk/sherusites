import { listAllSites, getSiteData } from '../bot/db.js';
import { renderSite } from '../bot/template-renderer.js';
import fs from 'fs';
import path from 'path';

const slugs = listAllSites();
for (const slug of slugs) {
  const data = getSiteData(slug);
  if (!data) { console.log(`SKIP ${slug} — no data`); continue; }
  const html = renderSite(data);
  const dir = path.join('public', 'site', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ ${slug}`);
}
console.log(`Done — ${slugs.length} sites`);
