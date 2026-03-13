"use client";

import Link from "next/link";
import { format } from "date-fns";
import { renderBBCode, sanitizeHtml } from "@/lib/bbcode";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PostAuthor {
  id: string;
  username: string;
  avatar: string | null;
  signature: string | null;
  role: string;
  postCount: number;
  meritScore: number;
}

interface PostProps {
  post: {
    id: string;
    content: string;
    createdAt: Date | string;
    editedAt: Date | string | null;
    isFirstPost: boolean;
    author: PostAuthor;
    _count: { merits: number };
  };
  threadId: string;
}

function getRank(postCount: number): { label: string; className: string } {
  if (postCount >= 480) return { label: "Legendary", className: "rank-legendary" };
  if (postCount >= 240) return { label: "Hero Member", className: "rank-hero" };
  if (postCount >= 120) return { label: "Sr. Member", className: "rank-sr" };
  if (postCount >= 60) return { label: "Full Member", className: "rank-full" };
  if (postCount >= 30) return { label: "Member", className: "rank-member" };
  if (postCount >= 10) return { label: "Jr. Member", className: "rank-jr" };
  return { label: "Newbie", className: "rank-newbie" };
}

function getRoleRank(role: string): { label: string; className: string } | null {
  if (role === "ADMIN") return { label: "Administrator", className: "rank-admin" };
  if (role === "GLOBAL_MODERATOR") return { label: "Global Moderator", className: "rank-mod" };
  if (role === "MODERATOR") return { label: "Moderator", className: "rank-mod" };
  return null;
}

function formatDate(d: Date | string) {
  try {
    return format(new Date(d), "MMMM dd, yyyy, hh:mm:ss a");
  } catch {
    return String(d);
  }
}

export default function PostCard({ post, threadId }: PostProps) {
  const { author } = post;
  const roleRank = getRoleRank(author.role);
  const activityRank = getRank(author.postCount);
  const session = useSession();
  const router = useRouter();
  const currentUserId = session?.data?.user?.id;
  const renderedContent = sanitizeHtml(renderBBCode(post.content));

  const handleQuote = () => {
    const quoteText = `[quote=${author.username}]\n${post.content}\n[/quote]\n\n`;
    window.dispatchEvent(new CustomEvent("bbcode-insert-quote", { detail: { text: quoteText } }));
    document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMerit = async () => {
    if (!currentUserId) return;
    const res = await fetch("/api/merit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to give merit");
    }
  };

  return (
    <table className="post-table">
      <tbody>
        <tr>
          <td className="post-user-cell">
            <div className="pu-name">
              <Link href={`/profile/${author.id}`}>{author.username}</Link>
            </div>
            <div className="pu-rank">
              {roleRank ? (
                <span className={roleRank.className}>{roleRank.label}</span>
              ) : (
                <span className={activityRank.className}>{activityRank.label}</span>
              )}
            </div>
            {author.avatar ? (
              <div className="pu-avatar">
                <img src={author.avatar} alt={author.username} />
              </div>
            ) : (
              <div className="pu-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 24 }}>
                ?
              </div>
            )}
            <div className="pu-info">
              Activity: {Math.min(author.postCount, 999)}<br />
              Merit: {author.meritScore}<br />
              Posts: {author.postCount}
            </div>
          </td>
          <td className="post-content-cell">
            <div className="post-head">
              <span>{formatDate(post.createdAt)}</span>
              <span>
                {post._count.merits > 0 && (
                  <span className="merit-badge"> Merit: {post._count.merits} </span>
                )}
              </span>
            </div>
            <div className="post-body" dangerouslySetInnerHTML={{ __html: renderedContent }} />
            {post.editedAt && (
              <div style={{ padding: "4px 10px", fontSize: 10, color: "#888", fontStyle: "italic" }}>
                Last edit: {formatDate(post.editedAt)}
              </div>
            )}
            {author.signature && (
              <div className="post-sig" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderBBCode(author.signature)) }} />
            )}
            <div className="post-foot">
              <button onClick={handleQuote} className="sm-btn">Quote</button>
              {currentUserId && currentUserId !== author.id && (
                <button onClick={handleMerit} className="sm-btn">+Merit</button>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
