#!/usr/bin/env python3
"""
Pull one page out of a PDF as its own file, so it can be rasterised and looked
at. macOS sips converts only the first page of a document, and there is no
other rasteriser on this machine, so without this only page one of a forty five
page report could ever be inspected.

It keeps every object and rewrites the page tree to hold a single kid, then
rebuilds the cross reference table from the object offsets it finds. That is
enough for a file react-pdf produced, which uses a classic xref and no object
streams.
"""
import re, sys

def extract(src, page_index, dst):
    data = open(src, 'rb').read()
    objs = {}
    for m in re.finditer(rb'(?m)^(\d+) 0 obj\b', data):
        num = int(m.group(1))
        end = data.find(b'endobj', m.end())
        objs[num] = (m.start(), data[m.start():end + 6])

    pages_num, pages_body = None, None
    for num, (_, body) in objs.items():
        if re.search(rb'/Type\s*/Pages\b', body):
            pages_num, pages_body = num, body
            break
    if pages_num is None:
        raise SystemExit('no /Pages object found')

    kids = re.search(rb'/Kids\s*\[(.*?)\]', pages_body, re.S)
    refs = re.findall(rb'(\d+) 0 R', kids.group(1))
    if page_index >= len(refs):
        raise SystemExit(f'page {page_index} of {len(refs)}')
    keep = refs[page_index]

    new_pages = re.sub(rb'/Kids\s*\[.*?\]', b'/Kids [' + keep + b' 0 R]', pages_body, flags=re.S)
    new_pages = re.sub(rb'/Count\s+\d+', b'/Count 1', new_pages)

    out = bytearray(b'%PDF-1.7\n')
    offsets = {}
    for num in sorted(objs):
        body = new_pages if num == pages_num else objs[num][1]
        offsets[num] = len(out)
        out += body + b'\n'

    root = re.search(rb'/Root\s+(\d+) 0 R', data)
    start = len(out)
    top = max(objs) + 1
    out += b'xref\n0 ' + str(top).encode() + b'\n0000000000 65535 f \n'
    for num in range(1, top):
        off = offsets.get(num, 0)
        out += f'{off:010d} 00000 {"n" if num in offsets else "f"} \n'.encode()
    out += (b'trailer\n<< /Size ' + str(top).encode() + b' /Root ' + root.group(1) + b' 0 R >>\n'
            b'startxref\n' + str(start).encode() + b'\n%%EOF\n')
    open(dst, 'wb').write(out)

if __name__ == '__main__':
    extract(sys.argv[1], int(sys.argv[2]), sys.argv[3])
