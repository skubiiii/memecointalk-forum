import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { formatDistanceToNow } from "date-fns";

const THREADS_PER_PAGE = 20;

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { boardSlug } = await params;
  const { page: pageParam } = await searchParams;
  const session = await auth();
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const board = await prisma.board.findUnique({
    where: { slug: boardSlug },
    include: { category: true },
  });

  if (!board) {
    return (
      <div className="content-box" style={{ textAlign: "center", padding: 20 }}>
        <b>Board not found</b><br /><br />
        <Link href="/">Return to Home</Link>
      </div>
    );
  }

  const totalThreads = await prisma.thread.count({ where: { boardId: board.id } });
  const totalPages = Math.max(1, Math.ceil(totalThreads / THREADS_PER_PAGE));

  const threads = await prisma.thread.findMany({
    where: { boardId: board.id },
    orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
    skip: (page - 1) * THREADS_PER_PAGE,
    take: THREADS_PER_PAGE,
    include: {
      author: { select: { username: true } },
      _count: { select: { posts: true } },
    },
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "MemecoinTalk", href: "/" },
          { label: board.category.name },
          { label: board.name },
        ]}
      />

      <div className="title-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{board.name}</span>
        {session?.user && (
          <Link href={`/thread/new?board=${boardSlug}`} className="sm-btn">New Topic</Link>
        )}
      </div>

      {board.description && (
        <div className="content-box" style={{ borderTop: "none", padding: "4px 8px", fontSize: 11, color: "#666" }}>
          {board.description}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/board/${boardSlug}`} />

      <table className="ftable">
        <thead>
          <tr>
            <th style={{ width: 28 }}>&nbsp;</th>
            <th>Subject / Started by</th>
            <th className="tc" style={{ width: 55 }}>Replies</th>
            <th className="tc" style={{ width: 55 }}>Views</th>
            <th style={{ width: 180 }}>Last post</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((thread: any, idx: number) => (
            <tr key={thread.id} className={idx % 2 === 0 ? "row1" : "row2"}>
              <td className="icon-cell">
                <span className={`topic-icon ${thread.isPinned ? "pinned" : thread.isLocked ? "locked" : "normal"}`}>
                  {thread.isPinned ? "\u25B2" : thread.isLocked ? "\u2716" : "\u25CF"}
                </span>
              </td>
              <td>
                <Link href={`/thread/${thread.id}`} style={{ fontWeight: "bold", fontSize: 13 }}>
                  {thread.isPinned && <span style={{ color: "#090" }}>[Sticky] </span>}
                  {thread.isLocked && <span style={{ color: "#C00" }}>[Locked] </span>}
                  {thread.title}
                </Link>
                <br />
                <span className="small muted">
                  Started by{" "}
                  <Link href={`/profile/${thread.authorId}`}>{thread.author.username}</Link>
                </span>
              </td>
              <td className="tc">{thread.replyCount}</td>
              <td className="tc">{thread.viewCount}</td>
              <td className="small">
                {thread.lastPostAt ? (
                  <>
                    {formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true })}
                    {thread.lastPostBy && (
                      <><br /><span className="muted">by {thread.lastPostBy}</span></>
                    )}
                  </>
                ) : (
                  <span className="muted">N/A</span>
                )}
              </td>
            </tr>
          ))}
          {threads.length === 0 && (
            <tr className="row1">
              <td colSpan={5} style={{ textAlign: "center", padding: 16 }} className="muted">
                No topics yet. Be the first to post!
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/board/${boardSlug}`} />
        {session?.user && (
          <Link href={`/thread/new?board=${boardSlug}`} className="sm-btn">New Topic</Link>
        )}
      </div>
    </>
  );
}
