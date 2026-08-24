# Changelog

## 2.0.0, Formation Compass 2.0

A full replacement of the assessment engine, item content, classification model, results experience,
PDF and API.

### What respondents see

- **A ten stage continuum instead of a four box quadrant.** Placement is continuous, shows a
  borderline zone when you are within three index points of a boundary, and explains itself when a
  gate holds you below the stage your index would otherwise reach.
- **Nine archetypes instead of four personas.** The previous model put roughly two thirds of
  respondents into a single residual bucket. No archetype now absorbs anywhere near that share.
- **A roadmap assembled from your own answers.** Recommendations are built from detected risk
  signals and your bottleneck, not looked up by persona. Two people with the same label and
  different weaknesses get different advice.
- **Honest confidence labelling.** Preliminary and insufficient confidence appear prominently, not
  as a footnote, and dimensions with thin evidence say so instead of showing a default score as
  though it were a measurement.
- **Nothing is manufactured.** Strength and vulnerability lists are empty when nothing crosses their
  thresholds. A healthy profile is told it is healthy and given maintenance work rather than
  template alarm.
- **Usage volume no longer decides anything.** How often you use AI never multiplies or dampens a
  score and never forecloses a stage. Deliberate, selective low use is recognised as such.
- **Behaviour outweighs self-description.** Situational answers carry more weight than claims, and
  when the two disagree the claim is discounted and the disagreement is reported to you.
- **Questions written for your situation.** Four separate item banks: student, teacher, parent,
  administrator. No shared engagement ladder across dimensions.

### Under the hood

- New engine at `src/engine/`, isomorphic and pure, with a 29 check validation suite.
- Report prose lives in one place and is rendered by both the screen and the PDF.
- Submissions are validated against the item model itself, so unknown, out of range and
  cross-persona answers are rejected.
- Stored records carry `engineVersion`. Everything that reads results branches on it.

### Rollback

v1 records are untouched by this release. Their `persona`, `personaName`, `resilience`, `readiness`
and `overall` fields remain exactly as written, and rescoring adds the v2 view beside them rather
than replacing it. The v1 engine and content bank were removed in this release and are recoverable
from git history at the commit tagged "Phase 1: adopt v2 engine and item banks" and earlier.
