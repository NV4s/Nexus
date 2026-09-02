import { Fragment } from 'react';
import { parse, type Block, type Span } from '../lib/markdown';

/**
 * Renders a chat answer's Markdown as React elements — no HTML string is ever
 * assembled, so model output cannot inject markup. Links are re-checked here as
 * well as in the parser: two places agreeing is what stops a later parser change
 * quietly opening a hole.
 */
function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, index) => {
        switch (span.kind) {
          case 'bold':
            return <strong key={index}>{span.text}</strong>;
          case 'italic':
            return <em key={index}>{span.text}</em>;
          case 'boldItalic':
            return (
              <strong key={index}>
                <em>{span.text}</em>
              </strong>
            );
          case 'strike':
            return <s key={index}>{span.text}</s>;
          case 'code':
            return <code key={index}>{span.text}</code>;
          case 'link':
            return /^https?:\/\//i.test(span.href) ? (
              <a key={index} href={span.href} target="_blank" rel="noopener noreferrer nofollow">
                {span.text}
              </a>
            ) : (
              <Fragment key={index}>{span.text}</Fragment>
            );
          default:
            return <Fragment key={index}>{span.text}</Fragment>;
        }
      })}
    </>
  );
}

function Node({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading': {
      // Chat headings sit inside a panel, so h1 would outrank the page itself.
      const Tag = (['h4', 'h4', 'h5', 'h5', 'h6', 'h6'] as const)[block.level - 1];
      return (
        <Tag>
          <Spans spans={block.spans} />
        </Tag>
      );
    }
    case 'list':
      return block.ordered ? (
        <ol>
          {block.items.map((item, index) => (
            <li key={index}>
              <Spans spans={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>
              <Spans spans={item} />
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote>
          <Spans spans={block.spans} />
        </blockquote>
      );
    case 'code':
      return (
        <pre data-language={block.language || undefined}>
          <code>{block.text}</code>
        </pre>
      );
    case 'rule':
      return <hr />;
    default:
      return (
        <p>
          <Spans spans={block.spans} />
        </p>
      );
  }
}

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="md">
      {parse(source).map((block, index) => (
        <Node key={index} block={block} />
      ))}
    </div>
  );
}
