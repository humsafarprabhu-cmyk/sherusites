/**
 * Stock Photo Picker
 * Randomly assigns curated stock photos to new sites (hero + gallery)
 * Zero cost, instant, looks professional
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOCK_DIR = path.join(__dirname, '..', 'public', 'stock');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function listImages(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
}

export interface StockPhotoResult {
  hero: { url: string; caption: string; type: 'hero' }[];
  gallery: { url: string; caption: string; type: 'gallery' }[];
}

/**
 * Pick random stock photos for a category
 * @param category - business category (restaurant, salon, etc.)
 * @param galleryCount - number of gallery images (default 6)
 * @returns hero + gallery photo arrays with /stock/ URLs
 */
export function pickStockPhotos(
  category: string,
  businessName: string,
  galleryCount: number = 6
): StockPhotoResult {
  const catDir = path.join(STOCK_DIR, category);
  
  // Hero: pick 1 random from 3
  const heroImages = listImages(path.join(catDir, 'hero'));
  const heroFile = heroImages.length > 0
    ? heroImages[Math.floor(Math.random() * heroImages.length)]
    : null;

  // Gallery: pick N random from 10 (shuffled)
  const galleryImages = shuffle(listImages(path.join(catDir, 'gallery')));
  const selectedGallery = galleryImages.slice(0, galleryCount);

  const hero = heroFile
    ? [{ url: `/stock/${category}/hero/${heroFile}`, caption: businessName, type: 'hero' as const }]
    : [];

  const gallery = selectedGallery.map((file, i) => ({
    url: `/stock/${category}/gallery/${file}`,
    caption: `${businessName}`,
    type: 'gallery' as const,
  }));

  return { hero, gallery };
}

/**
 * Get stock photos as a flat array (ready to assign to siteData.photos)
 */
export function getStockPhotos(category: string, businessName: string, galleryCount: number = 6): any[] {
  const { hero, gallery } = pickStockPhotos(category, businessName, galleryCount);
  return [...hero, ...gallery];
}
