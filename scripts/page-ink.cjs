/**
 * Where each page's content actually ends, measured from the rendered image.
 *
 * Four attempts to get this out of the PDF content stream failed, each in a
 * different way: coordinates that live in nested transforms, the running footer
 * answering for every page, clipping rectangles counted as ink, and stream order
 * that is not page order. The image is ground truth and needs none of that.
 *
 * Reports the last row of the page that carries ink, as a fraction of the text
 * frame, so a page that stops a third of the way down is visible as one.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require(path.join(process.cwd(), 'node_modules', 'pngjs'));

const dir = process.argv[2];
const TOP = 0.055, BOTTOM = 0.908;          // the text frame, as a fraction of the sheet
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const rows = [];
for (const f of files) {
  const png = PNG.sync.read(fs.readFileSync(path.join(dir, f)));
  const { width: W, height: H, data } = png;
  // The page ground is whatever colour the top-left corner is.
  const bg = [data[0], data[1], data[2]];
  const top = Math.floor(H * TOP), bottom = Math.floor(H * BOTTOM);
  let last = top;
  for (let y = top; y < bottom; y++) {
    let ink = 0;
    for (let x = Math.floor(W * 0.05); x < W * 0.95; x += 2) {
      const i = (W * y + x) << 2;
      if (Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 24) ink++;
    }
    if (ink > 2) last = y;
  }
  const fill = (last - top) / (bottom - top);
  rows.push({ f, fill });
}
const under = rows.filter((r) => r.fill < 0.6);
for (const r of rows) {
  console.log(`    ${r.f.replace('.png','')}: ${(r.fill * 100).toFixed(0).padStart(3)}%`
    + (r.fill < 0.6 ? '   <-- content stops early' : ''));
}
console.log(`\n  average: ${(rows.reduce((a, r) => a + r.fill, 0) / rows.length * 100).toFixed(0)}%`);
console.log(`  pages where content stops before 60 per cent: ${under.length}`);
