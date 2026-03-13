/**
 * BBCode parser/renderer for MemecoinTalk forum.
 * Custom implementation using regex replacements.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Clamp a numeric size value between min and max.
 */
function clampSize(value: string, min: number, max: number): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Parse BBCode input and return HTML string.
 * Processing order matters: [code] is handled first to prevent inner parsing.
 */
export function renderBBCode(input: string): string {
  let html = escapeHtml(input);

  // --- [code] blocks: extract first, replace after all other processing ---
  const codeBlocks: string[] = [];
  html = html.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    (_match, content: string) => {
      codeBlocks.push(content);
      return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
    }
  );

  // --- Inline formatting ---
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<del>$1</del>");

  // --- [color=...] ---
  html = html.replace(
    /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
    (_match, color: string, content: string) => {
      // Only allow safe color values (named colors, hex, rgb)
      const safeColor = color.replace(/[^a-zA-Z0-9#(),.\s%]/g, "");
      return `<span style="color: ${safeColor}">${content}</span>`;
    }
  );

  // --- [size=...] ---
  html = html.replace(
    /\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi,
    (_match, size: string, content: string) => {
      const clamped = clampSize(size, 8, 36);
      return `<span style="font-size: ${clamped}px">${content}</span>`;
    }
  );

  // --- [url=...]text[/url] ---
  html = html.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_match, url: string, text: string) => {
      const safeUrl = url.replace(/^javascript:/i, "");
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  );

  // --- [url]http://...[/url] ---
  html = html.replace(
    /\[url\]([\s\S]*?)\[\/url\]/gi,
    (_match, url: string) => {
      const safeUrl = url.replace(/^javascript:/i, "");
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
    }
  );

  // --- [img]url[/img] ---
  html = html.replace(
    /\[img\]([\s\S]*?)\[\/img\]/gi,
    (_match, url: string) => {
      const safeUrl = url.replace(/^javascript:/i, "");
      return `<img src="${safeUrl}" style="max-width:100%" alt="" />`;
    }
  );

  // --- [quote=author] and [quote] ---
  html = html.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    (_match, author: string, content: string) => {
      return `<div class="bbcode-quote"><cite>${author} wrote:</cite>${content}</div>`;
    }
  );
  html = html.replace(
    /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    '<div class="bbcode-quote">$1</div>'
  );

  // --- [spoiler] ---
  html = html.replace(
    /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    '<span class="bbcode-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>'
  );

  // --- [list] with [*] items ---
  html = html.replace(
    /\[list\]([\s\S]*?)\[\/list\]/gi,
    (_match, content: string) => {
      const items = content
        .split(/\[\*\]/)
        .filter((item) => item.trim() !== "")
        .map((item) => `<li>${item.trim()}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
  );

  // --- Restore code blocks (no inner BBCode parsing) ---
  codeBlocks.forEach((block, index) => {
    html = html.replace(
      `%%CODEBLOCK_${index}%%`,
      `<div class="bbcode-code">${block}</div>`
    );
  });

  // --- Newlines to <br> ---
  html = html.replace(/\n/g, "<br>");

  return html;
}

/**
 * Basic XSS sanitization for rendered HTML.
 * Removes script tags, dangerous event handlers, and javascript: URLs.
 */
export function sanitizeHtml(html: string): string {
  let sanitized = html;

  // Remove <script> tags and their content
  sanitized = sanitized.replace(
    /<script[\s\S]*?<\/script>/gi,
    ""
  );
  // Remove self-closing / unclosed script tags
  sanitized = sanitized.replace(/<script[^>]*\/?>/gi, "");

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(
    /\s+on[a-z]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // But preserve our intentional onclick for spoilers by re-adding it
  sanitized = sanitized.replace(
    /class="bbcode-spoiler"/g,
    'class="bbcode-spoiler" onclick="this.classList.toggle(\'revealed\')"'
  );

  // Strip javascript: from href and src attributes
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*"javascript:[^"]*"/gi,
    '$1=""'
  );
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*'javascript:[^']*'/gi,
    "$1=''"
  );

  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(/<\/?(iframe|object|embed|form|meta|link|base)[^>]*>/gi, "");

  return sanitized;
}
