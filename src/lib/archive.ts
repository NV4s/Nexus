/**
 * Turning an arbitrary file into something a model can actually read.
 *
 * The Messages API takes images, PDFs and plain text — nothing else. A .zip sent
 * as a document block is rejected; the Claude *app* unpacks archives, but that
 * happens before the API sees them. So the unpacking happens here instead, in
 * the browser, and what gets sent is text.
 *
 * ZIP reading uses DecompressionStream('deflate-raw'), which browsers ship
 * natively — a zip library would be a dependency for something the platform
 * already does. That also covers .docx and .xlsx, which are zipped XML.
 */

const decoder = new TextDecoder('utf-8', { fatal: false });

/** Extensions worth reading as text even when the browser reports no MIME type. */
const TEXT_EXTENSIONS =
  /\.(txt|md|markdown|csv|tsv|json|jsonc|ya?ml|toml|ini|cfg|conf|log|xml|svg|html?|css|scss|js|mjs|cjs|jsx|ts|tsx|py|rb|go|rs|java|kt|c|h|cpp|hpp|cs|php|sh|bash|zsh|sql|r|lua|pl|swift|dart|vue|svelte|gitignore|env|properties)$/i;

const ARCHIVE = /\.(zip|docx|xlsx|pptx|odt|ods|epub|jar)$/i;

export const isImage = (type: string) => type.startsWith('image/');
export const isPdf = (type: string, name: string) =>
  type === 'application/pdf' || /\.pdf$/i.test(name);

export const isTextLike = (type: string, name: string) =>
  type.startsWith('text/') ||
  type === 'application/json' ||
  type === 'application/xml' ||
  TEXT_EXTENSIONS.test(name);

export const isArchive = (type: string, name: string) =>
  ARCHIVE.test(name) ||
  type === 'application/zip' ||
  type.includes('officedocument') ||
  type.includes('opendocument');

type ZipEntry = { name: string; bytes: Uint8Array };

/** Reads a zip's central directory rather than scanning for local headers. */
export async function readZip(buffer: ArrayBuffer): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // End-of-central-directory record, searched backwards; the comment is at most
  // 65535 bytes, so this is a bounded scan.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('Not a zip file.');

  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break; // central directory header
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    // Directories carry no data, and the local header's own lengths are the ones
    // that describe where the payload actually starts.
    if (name.endsWith('/')) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(start, start + compressedSize);

    try {
      if (method === 0) entries.push({ name, bytes: raw });
      else if (method === 8) entries.push({ name, bytes: await inflateRaw(raw) });
      // Anything else (bzip2, lzma, encrypted) is rare enough to skip rather
      // than to ship a decoder for.
    } catch {
      /* one unreadable member should not lose the rest of the archive */
    }
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice()])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Strips XML tags, which is enough to read a .docx or .xlsx as prose. */
const stripXml = (xml: string) =>
  xml
    .replace(/<w:p[ >][^]*?<\/w:p>|<\/w:p>/g, (match) => `${match}\n`)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const OFFICE_PARTS = /(word\/document\.xml|xl\/sharedStrings\.xml|xl\/worksheets\/|ppt\/slides\/slide|content\.xml)/;

/** Per-file cap, so one enormous member cannot fill the whole request. */
const MAX_TEXT = 200_000;

/**
 * Best-effort text for anything that is not an image or a PDF.
 *
 * Returns null when nothing readable comes out, so the caller can say so rather
 * than sending an empty attachment.
 */
export async function extractText(file: File): Promise<string | null> {
  const name = file.name;

  if (isArchive(file.type, name)) {
    const entries = await readZip(await file.arrayBuffer());
    const office = entries.filter((entry) => OFFICE_PARTS.test(entry.name));

    // A .docx is a zip, but its useful content is a couple of known parts.
    if (office.length) {
      const text = office
        .map((entry) => stripXml(decoder.decode(entry.bytes)))
        .filter(Boolean)
        .join('\n\n');
      return text.slice(0, MAX_TEXT) || null;
    }

    const readable = entries.filter((entry) => isTextLike('', entry.name));
    const listing = entries.map((entry) => `${entry.name} (${entry.bytes.length} bytes)`).join('\n');
    const bodies = readable
      .map((entry) => `\n\n===== ${entry.name} =====\n${decoder.decode(entry.bytes)}`)
      .join('');

    // The listing goes in even when nothing inside is text: knowing what an
    // archive contains is often the actual question.
    return `Archive: ${name}\n${entries.length} files\n\n${listing}${bodies}`.slice(0, MAX_TEXT);
  }

  if (isTextLike(file.type, name)) {
    const text = (await file.text()).slice(0, MAX_TEXT);
    return text.trim() ? text : null;
  }

  return null;
}
