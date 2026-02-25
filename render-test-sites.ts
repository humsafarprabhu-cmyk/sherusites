import { getSiteData } from './bot/db.ts';
import { renderSite } from './bot/template-renderer.ts';

console.log('🔨 Rendering test sites...');

// Render wedding site
const weddingData = getSiteData('sharma-wedding');
if (weddingData) {
  console.log('📄 Rendering wedding site:', weddingData.businessName);
  const weddingHtml = renderSite(weddingData);
  console.log('✅ Wedding site rendered to sites/sharma-wedding/index.html');
} else {
  console.log('❌ Wedding site data not found');
}

// Render event site
const eventData = getSiteData('tech-meetup-patna');
if (eventData) {
  console.log('📄 Rendering event site:', eventData.businessName);
  const eventHtml = renderSite(eventData);
  console.log('✅ Event site rendered to sites/tech-meetup-patna/index.html');
} else {
  console.log('❌ Event site data not found');
}

console.log('✅ Test sites rendering completed');