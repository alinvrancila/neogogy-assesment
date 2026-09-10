# Source documents for the Minister/Preacher persona

This persona quotes only from the documents listed in its brief, and from
Scripture in the New Living Translation. Those documents belong in this
directory:

- James Spencer, drafts from *Being Human in the Digital Age*: "Introduction:
  Discernment in the Digital Age", "Theological Dispositions in a Digital
  World", "Human Capacity and Technology", "The Quad", and "Uncoordinated: The
  Need for Discipled Content Creation and Consumption"
- Alin Vrancila, "Navigating the Agathokakological Age: Faith, Artificial
  Intelligence, and the Future of Human Flourishing" (speaker script)
- Alin Vrancila, "Faith at Work: Navigating the AI Shift", including the essay
  "Created to Create: A Theology of Technology and AI for Faithful Christian
  Living"
- Vrancila and Spencer, *In the Image of Code*, as quoted within those documents

**The documents are in place.** `originals/` holds them, and a plain text copy of
each sits beside this file for checking against. Both are git-ignored, so the
manuscripts stay on the machine rather than in the repository or on the server.

`npm run test:quotes` checks every quotation in the persona against these files:
the pointers under each question, the research lines in the dimension content,
the archetype narratives, and the closing Scripture. It fails on anything it
cannot find, and reports that it could not run if the documents are missing
rather than passing quietly.

`scripture-nlt.txt` records the New Living Translation passages used and where
each came from: some were supplied in the persona brief, others are quoted inside
the documents here. References cited without quoting their words are listed at
the end of that file, and they are cited that way because their wording could not
be checked against a source held here.

To add or re-convert documents: put them in `originals/` and run
`bash scripts/ingest-sources.sh`. PowerPoint files are skipped; export the text
if something in them needs quoting.
