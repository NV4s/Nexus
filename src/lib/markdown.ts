

export type Span =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'boldItalic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strike'; text: string }
  | { kind: 'link'; text: string; href: string };

export type Block =
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'heading'; level: number; spans: Span[] }
  | { kind: 'list'; ordered: boolean; items: Span[][] }
  | { kind: 'quote'; spans: Span[] }
  | { kind: 'code'; text: string; language: string }
  | { kind: 'rule' };


const INLINE: { re: RegExp; make: (m: RegExpExecArray) => Span }[] = [
  { re: /`([^`\n]+)`/, make: (m) => ({ kind: 'code', text: m[1] }) },
  {
    re: /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/,
    make: (m) => ({ kind: 'link', text: m[1], href: m[2] }),
  },
  { re: /\*\*\*([^\n]+?)\*\*\*/, make: (m) => ({ kind: 'boldItalic', text: m[1] }) },
  { re: /\*\*([^\n]+?)\*\*/, make: (m) => ({ kind: 'bold', text: m[1] }) },
  { re: /__([^\n]+?)__/, make: (m) => ({ kind: 'bold', text: m[1] }) },
  { re: /~~([^\n]+?)~~/, make: (m) => ({ kind: 'strike', text: m[1] }) },


  { re: /\*(?!\s)([^*\n]+?)(?<!\s)\*/, make: (m) => ({ kind: 'italic', text: m[1] }) },
  { re: /(?<![A-Za-z0-9_])_(?!\s)([^_\n]+?)(?<!\s)_(?![A-Za-z0-9_])/, make: (m) => ({ kind: 'italic', text: m[1] }) },
];


export function inline(source: string): Span[] {
  const spans: Span[] = [];
  let rest = source;

  while (rest) {
    let at = -1;
    let chosen: { match: RegExpExecArray; make: (m: RegExpExecArray) => Span } | null = null;

    for (const rule of INLINE) {
      const match = rule.re.exec(rest);
      if (!match) continue;

      if (at < 0 || match.index < at) {
        at = match.index;
        chosen = { match, make: rule.make };
      }
    }

    if (!chosen) {
      spans.push({ kind: 'text', text: rest });
      break;
    }

    if (chosen.match.index > 0) {
      spans.push({ kind: 'text', text: rest.slice(0, chosen.match.index) });
    }
    spans.push(chosen.make(chosen.match));
    rest = rest.slice(chosen.match.index + chosen.match[0].length);
  }

  return spans;
}

const BULLET = /^\s{0,3}[-*+]\s+(.*)$/;
const NUMBER = /^\s{0,3}\d+[.)]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const RULE = /^\s{0,3}(?:---+|\*\*\*+|___+)\s*$/;


export function parse(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: 'paragraph', spans: inline(paragraph.join(' ')) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fence = /^\s{0,3}```(.*)$/.exec(line);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s{0,3}```/.test(lines[i])) body.push(lines[i++]);
      blocks.push({ kind: 'code', text: body.join('\n'), language: fence[1].trim() });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    if (RULE.test(line)) {
      flush();
      blocks.push({ kind: 'rule' });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, spans: inline(heading[2]) });
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flush();
      blocks.push({ kind: 'quote', spans: inline(quote[1]) });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = NUMBER.exec(line);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const items: Span[][] = [];

      while (i < lines.length) {
        const next = (ordered ? NUMBER : BULLET).exec(lines[i]);
        if (!next) break;
        items.push(inline(next[1]));
        i++;
      }
      i--;
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    paragraph.push(line.trim());
  }

  flush();
  return blocks;
}
