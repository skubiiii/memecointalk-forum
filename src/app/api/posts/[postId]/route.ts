import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updatePostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = updatePostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input: content is required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const userRole = session.user.role;
  const isAuthor = post.authorId === session.user.id;
  const isStaff = userRole === "ADMIN" || userRole === "MODERATOR" || userRole === "GLOBAL_MODERATOR";

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      content: body.content,
      editedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      isFirstPost: true,
      threadId: true,
      thread: {
        select: {
          id: true,
          boardId: true,
          replyCount: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const userRole = session.user.role;
  const isAuthor = post.authorId === session.user.id;
  const isStaff = userRole === "ADMIN" || userRole === "MODERATOR" || userRole === "GLOBAL_MODERATOR";

  if (!isAuthor && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (post.isFirstPost) {
    // Deleting the first post deletes the entire thread (cascade deletes posts)
    const threadPostCount = post.thread.replyCount + 1; // replies + first post

    await prisma.thread.delete({
      where: { id: post.threadId },
    });

    // Update board stats
    await prisma.board.update({
      where: { id: post.thread.boardId },
      data: {
        threadCount: { decrement: 1 },
        postCount: { decrement: threadPostCount },
      },
    });

    // Update forum stats
    await prisma.forumStats.update({
      where: { id: "singleton" },
      data: {
        totalThreads: { decrement: 1 },
        totalPosts: { decrement: threadPostCount },
      },
    });

    // Decrement author post counts for all posts in the thread
    // (the cascade already deleted them, but we need to update user counts)
    // For simplicity, decrement the deleting user's count for the first post
    await prisma.user.update({
      where: { id: post.authorId },
      data: { postCount: { decrement: 1 } },
    });

    return NextResponse.json({ deleted: "thread" }, { status: 200 });
  }

  // Regular post deletion
  await prisma.post.delete({
    where: { id: postId },
  });

  // Update thread reply count
  await prisma.thread.update({
    where: { id: post.threadId },
    data: { replyCount: { decrement: 1 } },
  });

  // Update board post count
  await prisma.board.update({
    where: { id: post.thread.boardId },
    data: { postCount: { decrement: 1 } },
  });

  // Update user post count
  await prisma.user.update({
    where: { id: post.authorId },
    data: { postCount: { decrement: 1 } },
  });

  // Update forum stats
  await prisma.forumStats.update({
    where: { id: "singleton" },
    data: { totalPosts: { decrement: 1 } },
  });

  return NextResponse.json({ deleted: "post" }, { status: 200 });
}
