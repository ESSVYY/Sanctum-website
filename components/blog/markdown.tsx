import { Fragment } from "react";
import { safeUrl } from "@/lib/blog/schema";

// Deliberately small Markdown dialect. Raw HTML is always React-escaped;
// no HTML injection, embedded images, iframes or executable URL schemes.
function inline(text: string) {
  return text
    .split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) => {
      const link = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(part);
      if (link && safeUrl(link[2]))
        return (
          <a key={i} href={link[2]}>
            {link[1]}
          </a>
        );
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i}>{part.slice(1, -1)}</code>;
      return <Fragment key={i}>{part}</Fragment>;
    });
}
export function Markdown({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return (
    <div className="article-body">
      {blocks.map((block, i) => {
        if (/^```/.test(block))
          return (
            <pre key={i}>
              <code>
                {block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")}
              </code>
            </pre>
          );
        const heading = /^(#{1,3})\s+(.+)$/.exec(block);
        if (heading)
          return heading[1].length === 3 ? (
            <h3 key={i}>{inline(heading[2])}</h3>
          ) : (
            <h2 key={i}>{inline(heading[2])}</h2>
          );
        const lines = block.split("\n");
        if (lines.every((l) => /^[-*]\s/.test(l)))
          return (
            <ul key={i}>
              {lines.map((l, n) => (
                <li key={n}>{inline(l.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\d+\.\s/.test(l)))
          return (
            <ol key={i}>
              {lines.map((l, n) => (
                <li key={n}>{inline(l.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}
