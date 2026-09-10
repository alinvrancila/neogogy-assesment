# Drop the source documents in this folder

Word files, RTF, plain text, or exported PDFs. They are never modified.

Then run, from the project root:

    bash scripts/ingest-sources.sh

That writes a plain text copy of each one into the folder above this, which is
what the quotations get checked against.

Nothing here is committed except this note: the folder is ignored by git, so the
manuscripts do not end up in the repository or on the deployed server.
