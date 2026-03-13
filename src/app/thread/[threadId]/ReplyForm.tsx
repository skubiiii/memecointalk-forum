"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BBCodeEditor from "@/components/BBCodeEditor";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, threadId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post reply");
      }
      setContent("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="reply-form" style={{ marginTop: 4 }}>
      <div className="section-header">Reply</div>
      <div className="content-box" style={{ borderTop: "none" }}>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <BBCodeEditor value={content} onChange={setContent} />
          <div style={{ marginTop: 6 }}>
            <button className="forum-btn" type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
