# Organisation logos

The four supplied logos, in place. They are used as supplied: cropped to their
own ink and rescaled, never redrawn, re-typeset or approximated.

    ican.png          ICAN                       www.ican.ph
    life-college.png  Life College International www.life.edu.ph
    neogogy.png       Neogogy.ai                 www.neogogy.ai
    lifex.png         LifeX                      www.lifex.ph

Names, links and stored aspect ratios live in `src/brand.ts`, which the page,
the results and the report all read from, so the four appear in the same order
with the same links everywhere. To replace one, drop the new file in at the same
path and update `w` and `h` to the new pixel dimensions: the page sizes each
logo by height and the report by width, so the aspect has to be true or the
artwork distorts.

`pdfW` is that logo's width in points on the report's closing page. The four are
tuned so a tall seal and a wide wordmark carry the same optical weight rather
than the same bounding box.

`lifex.png` is the current lockup: the LIFEX wordmark with the X reversed out of
a maroon square and "[SKILLS] FOR WHAT'S NEXT" set inside it. It replaced a
superseded version carrying "Get where you want to be, faster". Because that
tagline sits inside the artwork, it is never repeated as separate text beside
the logo, which is why the LifeX entry in `src/brand.ts` carries a description
rather than a tagline. Supplied at 3200 by 1102 and resampled to 1400 by 482;
the ink already reached all four edges, so nothing was cropped.

