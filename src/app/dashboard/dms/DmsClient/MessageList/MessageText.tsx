const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g;
const CODE_PATTERN = /(```[\s\S]*?```|`[^`\n]+`)/g;
const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\n]+\*)/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withMentions(text: string, mention: string | undefined, keyBase: string): React.ReactNode[] {
  if (!mention) return [text];
  const pattern = new RegExp(`(@${escapeRegExp(mention)})`, "gi");
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <span key={`${keyBase}-m${i}`} className="rounded bg-accent/20 px-1 font-semibold text-accent">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** **bold**, *italic* and ~~strike~~ (no nesting), plus @mention highlighting. */
function renderInline(text: string, mention: string | undefined, keyBase: string): React.ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, i) => {
    const key = `${keyBase}-i${i}`;
    if (i % 2 === 0) return withMentions(part, mention, key);
    if (part.startsWith("**")) return <strong key={key}>{withMentions(part.slice(2, -2), mention, key)}</strong>;
    if (part.startsWith("~~")) return <s key={key}>{withMentions(part.slice(2, -2), mention, key)}</s>;
    return <em key={key}>{withMentions(part.slice(1, -1), mention, key)}</em>;
  });
}

interface MessageTextProps {
  text: string;
  /** Highlight "@name" mentions of this person. */
  mention?: string;
}

/**
 * Renders chat text: links, **bold**, *italic*, ~~strike~~, `code`, ``` code blocks ``` and @mentions.
 * Everything is rendered as React text, so no markup in a message is ever interpreted as HTML.
 */
export default function MessageText({ text, mention }: MessageTextProps) {
  return (
    <div className="whitespace-pre-wrap break-words">
      {text.split(CODE_PATTERN).map((chunk, ci) => {
        if (ci % 2 === 1) {
          if (chunk.startsWith("```")) {
            const body = chunk.slice(3, -3).replace(/^[a-z0-9+-]*\n/i, "").replace(/^\n|\n$/g, "");
            return (
              <pre
                key={`c${ci}`}
                className="my-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 font-mono text-[12.5px] leading-relaxed whitespace-pre"
              >
                <code>{body}</code>
              </pre>
            );
          }
          return (
            <code key={`c${ci}`} className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[12.5px]">
              {chunk.slice(1, -1)}
            </code>
          );
        }
        return chunk.split(URL_PATTERN).map((part, ui) =>
          ui % 2 === 1 ? (
            <a
              key={`c${ci}-u${ui}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {part}
            </a>
          ) : (
            renderInline(part, mention, `c${ci}-u${ui}`)
          ),
        );
      })}
    </div>
  );
}