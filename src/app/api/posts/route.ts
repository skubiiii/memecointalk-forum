import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createPostSchema = z.object({
  content: z.string().min(1).max(50000, "Post content is too long"),
  threadId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = createPostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input: content is required" }, { status: 400 });
  }

  const thread = await prisma.thread.findUnique({
    where: { id: body.threadId },
    include: { board: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.isLocked) {
    return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
  }

  const userId = session.user.id;
  const username = (session.user as any).username || session.user.name || "Unknown";

  const post = await prisma.post.create({
    data: {
      content: body.content,
      threadId: thread.id,
      authorId: userId,
    },
  });

  // Update thread stats
  await prisma.thread.update({
    where: { id: thread.id },
    data: {
      replyCount: { increment: 1 },
      lastPostAt: new Date(),
      lastPostBy: username,
    },
  });

  // Update board stats
  await prisma.board.update({
    where: { id: thread.boardId },
    data: {
      postCount: { increment: 1 },
      lastPostAt: new Date(),
      lastPostBy: username,
      lastThreadTitle: thread.title,
      lastThreadId: thread.id,
    },
  });

  // Update user post count
  await prisma.user.update({
    where: { id: userId },
    data: { postCount: { increment: 1 } },
  });

  // Update forum stats
  await prisma.forumStats.upsert({
    where: { id: "singleton" },
    update: {
      totalPosts: { increment: 1 },
    },
    create: {
      id: "singleton",
      totalPosts: 1,
    },
  });

  return NextResponse.json({ id: post.id });
}
