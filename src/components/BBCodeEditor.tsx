"use client";

import { useRef, useCallback, useEffect } from "react";

interface BBCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
}

interface ToolbarButton {
  label: string;
  openTag: string;
  closeTag: string;
  prompt?: string;
}

const toolbarButtons: ToolbarButton[] = [
  { label: "B", openTag: "[b]", closeTag: "[/b]" },
  { label: "I", openTag: "[i]", closeTag: "[/i]" },
  { label: "U", openTag: "[u]", closeTag: "[/u]" },
  { label: "S", openTag: "[s]", closeTag: "[/s]" },
  { label: "URL", openTag: "[url=", closeTag: "[/url]", prompt: "Enter URL:" },
  { label: "IMG", openTag: "[img]", closeTag: "[/img]" },
  { label: "Code", openTag: "[code]", closeTag: "[/code]" },
  { label: "Quote", openTag: "[quote]", closeTag: "[/quote]" },
  { label: "List", openTag: "[list]\n[*]", closeTag: "\n[/list]" },
  {
    label: "Color",
    openTag: "[color=",
    closeTag: "[/color]",
    prompt: "Enter color (e.g. red, #ff0000):",
  },
  {
    label: "Size",
    openTag: "[size=",
    closeTag: "[/size]",
    prompt: "Enter font size (8-36):",
  },
  { label: "Spoiler", openTag: "[spoiler]", closeTag: "[/spoiler]" },
];

export default function BBCodeEditor({
  value,
  onChange,
  name,
}: BBCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = useCallback(
    (button: ToolbarButton) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let openTag = button.openTag;
      let closeTag = button.closeTag;

      // For tags that need a parameter via prompt
      if (button.prompt) {
        const param = window.prompt(button.prompt);
        if (param === null) return; // User cancelled

        if (button.label === "URL") {
          openTag = `[url=${param}]`;
        } else if (button.label === "Color") {
          openTag = `[color=${param}]`;
        } else if (button.label === "Size") {
          openTag = `[size=${param}]`;
        }
      }

      const before = value.substring(0, start);
      const after = value.substring(end);
      const insertion = selectedText || (button.label === "IMG" ? "" : "");
      const newValue = before + openTag + insertion + closeTag + after;

      onChange(newValue);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        if (textarea) {
          const cursorPos = selectedText
            ? start + openTag.length + selectedText.length + closeTag.length
            : start + openTag.length;
          textarea.selectionStart = cursorPos;
          textarea.selectionEnd = cursorPos;
          textarea.focus();
        }
      });
    },
    [value, onChange]
  );

  // Listen for quote insertion events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.text) {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const newValue = value
          ? value + "\n" + detail.text + "\n"
          : detail.text + "\n";
        onChange(newValue);

        requestAnimationFrame(() => {
          if (textarea) {
            textarea.selectionStart = newValue.length;
            textarea.selectionEnd = newValue.length;
            textarea.focus();
          }
        });
      }
    };

    window.addEventListener("bbcode-insert-quote", handler);
    return () => window.removeEventListener("bbcode-insert-quote", handler);
  }, [value, onChange]);

  return (
    <div>
      <div className="bbcode-toolbar">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => insertTag(button)}
            title={button.label}
          >
            {button.label}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="forum-textarea"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
      />
    </div>
  );
}
