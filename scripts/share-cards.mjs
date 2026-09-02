/**
 * Give every share card a URL that changes when the picture changes.
 *
 * Facebook, LinkedIn and X cache a preview image against its URL and hold it
 * for a long time. Replacing the artwork behind a stable filename means they go
 * on serving the picture they already have, which is exactly what happened when
 * og.jpg was swapped: the tags were right, the file was right, and the old
 * summit card kept appearing anyway.
 *
 * So the filename carries a hash of the file's own bytes. New artwork is a new
 * URL, nothing can be stale, and no debugger visit is needed for the image.
 *
 * Usage: drop a plain og-<name>.jpg in public/share, then run `npm run cards`.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DIR = path.join(process.cwd(), 'public', 'share');
const MANIFEST = path.join(DIR, 'manifest.json');
const HASHED = /^(og(?:-[a-z-]+)?)\.[0-9a-f]{8}\.jpg$/;
const PLAIN = /^(og(?:-[a-z-]+)?)\.jpg$/;

const manifest = {};
const files = fs.readdirSync(DIR);

// A plain file is new artwork: hash it, rename it, retire whatever it replaces.
for (const f of files) {
  const m = f.match(PLAIN);
  if (!m) continue;
  const base = m[1];
  const buf = fs.readFileSync(path.join(DIR, f));
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const named = `${base}.${hash}.jpg`;
  fs.renameSync(path.join(DIR, f), path.join(DIR, named));
  for (const old of files) {
    const om = old.match(HASHED);
    if (om && om[1] === base && old !== named) fs.rmSync(path.join(DIR, old));
  }
  manifest[base] = named;
  console.log(`${base.padEnd(14)} new artwork -> ${named}`);
}

// Everything already hashed keeps the URL it has.
for (const f of fs.readdirSync(DIR)) {
  const m = f.match(HASHED);
  if (m && !manifest[m[1]]) { manifest[m[1]] = f; console.log(`${m[1].padEnd(14)} unchanged   -> ${f}`); }
}

fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${Object.keys(manifest).length} cards in ${path.relative(process.cwd(), MANIFEST)}`);
