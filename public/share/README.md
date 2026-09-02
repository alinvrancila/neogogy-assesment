# Share cards

The picture a link shows when it is posted. One per assessment, plus the site
card, all at **1200 by 630, JPEG**, which is the frame Facebook, LinkedIn, X,
WhatsApp and iMessage all crop from.

## Replacing one

1. Drop the new file in here with its plain name: `og.jpg` for the site,
   `og-student.jpg`, `og-teacher.jpg`, `og-parent.jpg`, `og-leader.jpg`,
   `og-minister.jpg`, `og-business.jpg` for the six assessments.
2. Run `npm run cards`.
3. Commit and deploy.

The script renames the file to carry a hash of its own bytes, for example
`og-student.cdf02623.jpg`, records it in `manifest.json`, and deletes the
version it replaces. `src/lib/shareCard.ts` reads that manifest, so the routes
follow automatically.

**Why the hash.** The networks cache a preview image against its URL and keep it
for a long time. Replace artwork behind a stable filename and they go on serving
the picture they already have: correct tags, correct file on the server, old
card in the post. New artwork now means a new URL, so a stale image is not
possible.

The page's own cache is separate. After changing a card, re-scrape the URL once
in the Facebook Sharing Debugger or the LinkedIn Post Inspector so the network
re-reads the tags; the picture it then fetches will be the new one.

## What the card is not

The card is only the picture. The title and description beside it come from that
persona's content in `src/content/personas.ts`, and for the homepage from
`src/app/layout.tsx`, so the words stay true to what each assessment asks.
