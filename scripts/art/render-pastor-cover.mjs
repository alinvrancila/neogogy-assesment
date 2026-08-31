/** Rasterises the chapel window scene to public/minister-cover.jpg. */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';
import { ministerCoverSvg, MW as PW, MH as PH } from './minister-cover.svg.mjs';

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = path.join(process.cwd(), 'public', 'minister-cover.jpg');

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: PW, height: PH }, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0">${ministerCoverSvg()}</body>`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: out, type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: PW, height: PH } });
await browser.close();
console.log('wrote', out, fs.statSync(out).size, 'bytes');
