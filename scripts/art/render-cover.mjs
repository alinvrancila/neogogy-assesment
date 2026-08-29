/** Rasterises the dusk cover scene to public/ascent-cover.jpg. */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';
import { coverSvg, CW, CH } from './backdrop.svg.mjs';

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = path.join(process.cwd(), 'public', 'ascent-cover.jpg');

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0">${coverSvg()}</body>`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: out, type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: CW, height: CH } });
await browser.close();
console.log('wrote', out, fs.statSync(out).size, 'bytes');
