import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead } from '@/lib/storage';
import { generateNeogogyPdfFromInputs } from '@/lib/reportPdf';
import type { Answers, Baseline } from '@/lib/engine';

export const runtime = 'nodejs';

const safeFilePart = (value: string) =>
  value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Result';

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { dosDate, dosTime };
};

type ZipFile = { name: string; data: Buffer };

const makeZip = (files: ZipFile[]): Buffer => {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.name, 'utf-8');
    const data = file.data;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
};

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = (await request.json().catch(() => ({}))) as { ids?: string[] };
  const ids = Array.from(new Set((body.ids || []).map((id) => String(id).trim()).filter(Boolean)));
  if (!ids.length) {
    return new Response(JSON.stringify({ error: 'No submissions selected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const files: ZipFile[] = [];
  for (const id of ids) {
    const lead = await getLead(id);
    if (!lead?.answers) continue;
    const pdf = await generateNeogogyPdfFromInputs({
      name: lead.name || '',
      role: lead.role || '',
      modality: lead.modality || '',
      answers: lead.answers as Answers,
      baseline: (lead.baseline as Baseline | null | undefined) ?? null,
      usageVal: lead.usageVal ?? null
    });
    files.push({
      name: `${String(files.length + 1).padStart(2, '0')}_${safeFilePart(lead.name)}_${safeFilePart(lead.personaName || lead.persona)}.pdf`,
      data: pdf
    });
  }

  if (!files.length) {
    return new Response(JSON.stringify({ error: 'Selected submissions do not have stored answers' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const zip = new Uint8Array(makeZip(files));
  return new Response(zip, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="neogogy-selected-pdf-reports-${new Date().toISOString().slice(0, 10)}.zip"`
    }
  });
}
