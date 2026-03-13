import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import slugify from "slugify";

const createThreadSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1),
  boardSlug: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = createThreadSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input: title must be 3-200 chars, content required" }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { slug: body.boardSlug },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const threadSlug = slugify(body.title, { lower: true, strict: true });
  const userId = session.user.id;
  const username = (session.user as any).username || session.user.name || "Unknown";

  const thread = await prisma.thread.create({
    data: {
      title: body.title,
      slug: threadSlug,
      boardId: board.id,
      authorId: userId,
      lastPostBy: username,
    },
  });

  // Create the first post
  await prisma.post.create({
    data: {
      content: body.content,
      threadId: thread.id,
      authorId: userId,
      isFirstPost: true,
    },
  });

  // Update board stats
  await prisma.board.update({
    where: { id: board.id },
    data: {
      threadCount: { increment: 1 },
      postCount: { increment: 1 },
      lastPostAt: new Date(),
      lastPostBy: username,
      lastThreadTitle: body.title,
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
      totalThreads: { increment: 1 },
      totalPosts: { increment: 1 },
    },
    create: {
      id: "singleton",
      totalThreads: 1,
      totalPosts: 1,
    },
  });

  return NextResponse.json({ id: thread.id, slug: thread.slug });
}
