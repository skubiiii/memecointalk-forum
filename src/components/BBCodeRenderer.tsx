import { renderBBCode, sanitizeHtml } from "@/lib/bbcode";

interface BBCodeRendererProps {
  content: string;
}

export default function BBCodeRenderer({ content }: BBCodeRendererProps) {
  const html = sanitizeHtml(renderBBCode(content));

  return (
    <div
      className="post-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
