/**
 * Rasterises the painted backdrop to public/ascent-backdrop.png.
 * Run with: npm run art:backdrop
 * Requires Google Chrome, which is used purely as a renderer.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';
import { backdropSvg, W, H } from './backdrop.svg.mjs';

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = path.join(process.cwd(), 'public', 'ascent-backdrop.jpg');

const svg = backdropSvg();
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(
  `<body style="margin:0">${svg}</body>`,
  { waitUntil: 'networkidle' }
);
await page.waitForTimeout(600);
// JPEG: the backdrop is photographic and needs no alpha, and a 2.8 MB PNG
// made every emailed report roughly 3 MB.
await page.screenshot({
  path: out, type: 'jpeg', quality: 82,
  clip: { x: 0, y: 0, width: W, height: H },
});
await browser.close();
console.log('wrote', out, fs.statSync(out).size, 'bytes');
