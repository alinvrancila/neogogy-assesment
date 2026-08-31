/** Rasterises the crimson dial scene to public/business-cover.jpg. */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';
import { businessCoverSvg, BW, BH } from './business-cover.svg.mjs';

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = path.join(process.cwd(), 'public', 'business-cover.jpg');

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: BW, height: BH }, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0">${businessCoverSvg()}</body>`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: out, type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: BW, height: BH } });
await browser.close();
console.log('wrote', out, fs.statSync(out).size, 'bytes');
