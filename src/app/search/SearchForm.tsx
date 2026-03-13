"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Board { id: string; name: string; slug: string; }

export default function SearchForm({ boards, initialQuery, initialBoard, initialAuthor }: {
  boards: Board[];
  initialQuery?: string;
  initialBoard?: string;
  initialAuthor?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || "");
  const [board, setBoard] = useState(initialBoard || "");
  const [author, setAuthor] = useState(initialAuthor || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (board) params.set("board", board);
    if (author.trim()) params.set("author", author.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="content-box" style={{ marginBottom: 6 }}>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <td className="label">Search for:</td>
              <td><input className="forum-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." style={{ width: 300 }} /></td>
            </tr>
            <tr>
              <td className="label">Search in board:</td>
              <td>
                <select className="forum-input" value={board} onChange={(e) => setBoard(e.target.value)} style={{ width: 200 }}>
                  <option value="">(All boards)</option>
                  {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td className="label">By user:</td>
              <td><input className="forum-input" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Username..." style={{ width: 200 }} /></td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingTop: 6 }}><button className="forum-btn" type="submit">Search</button></td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}
