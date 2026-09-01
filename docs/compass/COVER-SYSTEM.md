# The six assessment covers

## Where every value comes from

Nothing on a cover is invented. One mapper, `src/lib/covers/data.ts`, reads what
the assessment already produced.

| Cover field | Source |
|---|---|
| persona | `CompassResult.persona`, mapped through `COVER_PERSONA` (administrator becomes leader, pastor becomes minister) |
| resultTitle | `result.archetype.name`, with a leading "The" trimmed |
| resultSummary | `result.archetype.tagline` |
| personName | the name given at the gate; for business, the company when one was volunteered |
| assessmentName | per persona, from `ASSESSMENT_NAME` |
| assessmentDate | the date the file is built |
| reportId | the stored record id where there is one, otherwise four digits derived from the reading |
| accessUrl | assessment.neogogy.ai |
| conceptTitle / conceptSubtitle | the artwork's own label. Decorative, and optional |

**Deliberately not on a cover:** the developmental index, the stage number, bars,
meters, and any ranking language. Those still exist everywhere else in the
report; the cover component simply does not render them.

## Structure

```
src/lib/covers/
├── data.ts      the mapper and the typed presentation model
├── kit.tsx      fonts, the readability scale, and the shared blocks
└── layouts.tsx  six distinct compositions plus the persona switch
```

The blocks are shared (`BrandMark`, `AssessmentIdentity`, `ResultBlock`,
`PersonName`, `ConceptLabel`, `CoverMetadata`). The compositions are not. Each
persona places them where its own artwork leaves room, so the six differ before
a word is read: which side the result sits on, where the identity block lands,
how much of the page the image takes, and what the single geometric gesture is.

An unknown persona throws rather than silently showing the wrong design.

## The readability rule

The scale lives in `kit.tsx` and is the thing that file exists to enforce.

- Result title: 58 / 48 / 39 pt by length, floor 36. Never below it.
- Person's name: 29 / 24 / 19 pt by length, floor 18. Never truncated, never
  ellipsised.
- Assessment name: 9 pt mono, dropping to 8 with tighter tracking when long,
  rather than being forced into unreadable capitals.
- Summary 12.5 pt sans, metadata values 10 pt semibold, labels 6.8 pt mono.

Length is classified per field, so one long value never shrinks the others, and
the whole cover is never scaled to solve an overflow.

## Production notes

**Page size.** The cover is US Letter, 612 by 792 points, as the brief
specifies. The report body is still A4. That mismatch is visible if the file is
printed, and moving the whole report to Letter is a one line change whenever it
is wanted.

**Fonts.** Source Serif 4, IBM Plex Sans and IBM Plex Mono are vendored as static
TTFs in `public/fonts` and embedded in the file. They are not fetched at run
time: a report should not depend on a third party being up. The Google Fonts
repository ships Source Serif 4 and IBM Plex Sans only as variable fonts, which
this renderer cannot resolve per weight, so the static weights come from the
fontsource packages and are converted from WOFF to TTF once.

**Artwork.** The six delivered masters and the coordinate mark live in
`public/covers`, resized to 2200px wide and saved as JPEG. They are used as
supplied: no attempt is made to redraw their people, light, or collage.

**Contrast.** Where type sits over artwork it sits over a solid or graded field
of its own, so contrast holds whatever the crop shows rather than depending on
the image being bright in the right place.

## What did not change

Assessment questions, answers, scoring, interpretation, result selection,
storage, email delivery, APIs, authentication, analytics, and the report body.
The regression dump for every persona is byte identical.


## The cover on the page

`src/components/compass/ResultCover.tsx` renders the same six compositions in
HTML at the top of the results page, for every persona, reading from the same
`toCoverData` mapper as the PDF so the two cannot say different things. The
styles live under `.rcover` in `src/app/compass.css`: one shared grammar (brand,
assessment name, result, name, concept label, metadata rail) and six placement
blocks, sized in `clamp()` against a `container-type: inline-size` box so the
cover holds its proportions from a 360px phone to full width.

Below 620px the concept label and the access column drop out, the side-plate
covers (business, leader, minister) widen their text column, and the teacher
plate shortens so the result band never runs under the artwork. The paper is US
Letter, 612x792, in `src/lib/covers/kit.tsx` and in every `Page` of the report.
