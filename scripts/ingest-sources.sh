#!/bin/bash
# Converts whatever is dropped into docs/compass/sources/pastor/originals into
# plain text alongside it, so the quotations in the pastor persona can be
# checked against the actual documents.
#
# Handles .docx, .doc, .rtf, .odt, .pages (via its preview), .txt and .md.
# PDFs are handled separately, because they need a different reader.
#
# Usage: bash scripts/ingest-sources.sh
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)/docs/compass/sources/pastor"
IN="$DIR/originals"
mkdir -p "$IN"

shopt -s nullglob nocaseglob
converted=0
for f in "$IN"/*; do
  [ "$(basename "$f")" = "PUT-THE-FILES-HERE.md" ] && continue
  base="$(basename "${f%.*}")"
  out="$DIR/$base.txt"
  case "${f##*.}" in
    docx|doc|rtf|rtfd|odt|html|htm|txt)
      if textutil -convert txt "$f" -output "$out" 2>/dev/null; then
        echo "ok    $base"
        converted=$((converted + 1))
      else
        echo "FAILED $base (textutil could not read it)"
      fi
      ;;
    pages)
      # a .pages bundle carries a text preview inside it
      if [ -f "$f/QuickLook/Preview.pdf" ]; then
        echo "note  $base is a Pages file. Export it as .docx or .txt and drop it in again."
      else
        echo "note  $base is a Pages file. Export it as .docx or .txt and drop it in again."
      fi
      ;;
    pdf)
      echo "note  $base is a PDF. Leave it here and say so; it needs a different reader."
      ;;
    *)
      echo "skip  $base (${f##*.})"
      ;;
  esac
done

echo
echo "$converted file(s) converted into $DIR"
echo "The originals stay in $IN and are not modified."
