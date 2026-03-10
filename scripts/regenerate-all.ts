/**
 * Regenerate all sites with latest template (ads + SEO)
 * Usage: npx tsx scripts/regenerate-all.ts
 */
import { renderSite } from '../bot/template-renderer.ts';
import { getDb, getSiteData, listAllSites } from '../bot/db.ts';

const slugs = listAllSites();
console.log(`Found ${slugs.length} sites to regenerate...`);

let success = 0;
let failed = 0;

for (const slug of slugs) {
  try {
    const site = getSiteData(slug);
    if (!site) { failed++; continue; }
    renderSite(site as any);
    success++;
    if (success % 50 === 0) console.log(`  ...${success} done`);
  } catch (e: any) {
    console.error(`FAILED: ${slug} — ${e.message}`);
    failed++;
  }
}

console.log(`\nDone! ✅ ${success} success, ❌ ${failed} failed out of ${slugs.length} total`);
