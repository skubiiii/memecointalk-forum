import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const MODERATOR_ROLES = ["MODERATOR", "GLOBAL_MODERATOR", "ADMIN"];

const updateThreadSchema = z.object({
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  boardId: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (!MODERATOR_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { threadId } = await params;

  let body;
  try {
    body = updateThreadSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const data: any = {};
  if (body.isPinned !== undefined) data.isPinned = body.isPinned;
  if (body.isLocked !== undefined) data.isLocked = body.isLocked;

  // Move to different board
  if (body.boardId && body.boardId !== thread.boardId) {
    const newBoard = await prisma.board.findUnique({
      where: { id: body.boardId },
    });
    if (!newBoard) {
      return NextResponse.json({ error: "Target board not found" }, { status: 404 });
    }

    data.boardId = body.boardId;

    // Update old board stats
    await prisma.board.update({
      where: { id: thread.boardId },
      data: {
        threadCount: { decrement: 1 },
        postCount: { decrement: thread.replyCount + 1 },
      },
    });

    // Update new board stats
    await prisma.board.update({
      where: { id: body.boardId },
      data: {
        threadCount: { increment: 1 },
        postCount: { increment: thread.replyCount + 1 },
      },
    });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data,
    include: {
      board: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(updatedThread);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "GLOBAL_MODERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { threadId } = await params;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      _count: { select: { posts: true } },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const postCount = thread._count.posts;

  // Delete thread (posts cascade due to onDelete: Cascade in schema)
  await prisma.thread.delete({
    where: { id: threadId },
  });

  // Update board stats
  await prisma.board.update({
    where: { id: thread.boardId },
    data: {
      threadCount: { decrement: 1 },
      postCount: { decrement: postCount },
    },
  });

  // Update forum stats
  await prisma.forumStats.update({
    where: { id: "singleton" },
    data: {
      totalThreads: { decrement: 1 },
      totalPosts: { decrement: postCount },
    },
  });

  return NextResponse.json({ success: true });
}
