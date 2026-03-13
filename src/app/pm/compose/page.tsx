"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ComposeMessagePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <ComposeForm />
    </Suspense>
  );
}

function ComposeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [recipient, setRecipient] = useState(searchParams.get("to") || "");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername: recipient.trim(),
          subject: subject.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      router.push("/pm/sent");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Private Messages", href: "/pm" },
          { label: "Compose" },
        ]}
      />

      <div className="title-bar">Compose Message</div>

      <div className="content-box">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Recipient:</td>
                <td>
                  <input
                    className="forum-input"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Username"
                    required
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Subject:</td>
                <td>
                  <input
                    className="forum-input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Message subject"
                    required
                    maxLength={200}
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Message:</td>
                <td>
                  <textarea
                    className="forum-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your message..."
                    required
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <button className="forum-btn" type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
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
