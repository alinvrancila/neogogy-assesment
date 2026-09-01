# Share cards

`og.jpg` is the site card, used for the homepage and as the fallback for any
assessment that has no card of its own yet.

Each assessment can carry its own. Drop the file in here at exactly this name
and the route picks it up on the next build, with no code change:

    og-student.jpg     assessment.neogogy.ai/student
    og-teacher.jpg     assessment.neogogy.ai/teacher
    og-parent.jpg      assessment.neogogy.ai/parent
    og-leader.jpg      assessment.neogogy.ai/leader
    og-minister.jpg    assessment.neogogy.ai/minister
    og-business.jpg    assessment.neogogy.ai/business

**1200 by 630 pixels, JPEG.** That is the frame Facebook, LinkedIn, X, WhatsApp
and iMessage all crop from. Keep anything that must survive the crop inside the
middle 1000 by 520: several clients trim the edges, and X trims most.

Text on the card should be large. It is often previewed at around 500 pixels
wide, so body-sized type disappears. A name and a short line is the most that
reads.

The card is only the picture. The title and the description that appear beside
it come from the persona's own content in `src/content/personas.ts`, so they
stay true to what the assessment actually asks.
