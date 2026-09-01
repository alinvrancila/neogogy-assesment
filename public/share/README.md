# Share cards

The picture a link shows when it is posted. All seven are in place.

    og.jpg             assessment.neogogy.ai            the site card
    og-student.jpg     assessment.neogogy.ai/student
    og-teacher.jpg     assessment.neogogy.ai/teacher
    og-parent.jpg      assessment.neogogy.ai/parent
    og-leader.jpg      assessment.neogogy.ai/leader
    og-minister.jpg    assessment.neogogy.ai/minister
    og-business.jpg    assessment.neogogy.ai/business

**1200 by 630, JPEG.** That is the frame Facebook, LinkedIn, X, WhatsApp and
iMessage all crop from. The supplied artwork is used as composed: these are
converted from the supplied PNGs, never re-cropped or re-framed.

They are JPEG rather than PNG on purpose. The same card is around 950KB as a
PNG and around 150KB as a JPEG, and WhatsApp and iMessage quietly skip a preview
image they consider too heavy. The weight is the difference between a card
appearing and no card appearing.

To replace one, drop the new 1200 by 630 file in at the same name. A route with
no card of its own falls back to `og.jpg` rather than to nothing, so a new
assessment can ship before its artwork does. Resolution lives in
`src/lib/shareCard.ts`; the title and description beside the picture come from
that persona's own content in `src/content/personas.ts`.

Cards are resolved when the site is built, so a new file goes live on the next
deploy. Networks also cache aggressively: after a card changes, re-scrape the
URL in the platform's own debugger or the old picture can persist for days.
