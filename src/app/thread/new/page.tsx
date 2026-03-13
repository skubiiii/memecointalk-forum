"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BBCodeEditor from "@/components/BBCodeEditor";

export default function NewThreadPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <NewThreadForm />
    </Suspense>
  );
}

function NewThreadForm() {
  const searchParams = useSearchParams();
  const boardSlug = searchParams.get("board") || "";
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, boardSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create thread");
      }

      router.push(`/thread/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Board", href: `/board/${boardSlug}` },
          { label: "New Thread" },
        ]}
      />

      <div className="title-bar">Create New Thread</div>

      <div className="content-box">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Subject:</td>
                <td>
                  <input
                    className="forum-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Thread title"
                    required
                    maxLength={200}
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Message:</td>
                <td>
                  <BBCodeEditor value={content} onChange={setContent} />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <button className="forum-btn" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Post New Thread"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </>
  );
}
