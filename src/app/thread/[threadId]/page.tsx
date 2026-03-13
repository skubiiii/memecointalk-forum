import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import ReplyForm from "./ReplyForm";

const POSTS_PER_PAGE = 20;

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { threadId } = await params;
  const { page: pageParam } = await searchParams;
  const session = await auth();
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      board: { include: { category: true } },
      author: { select: { username: true } },
    },
  });

  if (!thread) {
    return (
      <div className="content-box" style={{ textAlign: "center", padding: 20 }}>
        <b>Thread not found</b><br /><br />
        <Link href="/">Return to Home</Link>
      </div>
    );
  }

  await prisma.thread.update({
    where: { id: threadId },
    data: { viewCount: { increment: 1 } },
  });

  const totalPosts = await prisma.post.count({ where: { threadId } });
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));

  const posts = await prisma.post.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    skip: (page - 1) * POSTS_PER_PAGE,
    take: POSTS_PER_PAGE,
    include: {
      author: {
        select: { id: true, username: true, avatar: true, signature: true, role: true, postCount: true, meritScore: true },
      },
      _count: { select: { merits: true } },
    },
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "MemecoinTalk", href: "/" },
          { label: thread.board.category.name },
          { label: thread.board.name, href: `/board/${thread.board.slug}` },
          { label: thread.title },
        ]}
      />

      <div className="title-bar">{thread.title}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
        <span className="small muted">
          Author: <Link href={`/profile/${thread.authorId}`}>{thread.author.username}</Link>
          {" | "}Replies: {thread.replyCount}
          {" | "}Views: {thread.viewCount}
        </span>
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/thread/${threadId}`} />
      </div>

      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} threadId={threadId} />
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
        <span></span>
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/thread/${threadId}`} />
      </div>

      {session?.user && !thread.isLocked && (
        <ReplyForm threadId={threadId} />
      )}

      {thread.isLocked && (
        <div className="content-box" style={{ textAlign: "center", color: "#888", marginTop: 4 }}>
          This topic is locked. You cannot post new replies.
        </div>
      )}
    </>
  );
}
