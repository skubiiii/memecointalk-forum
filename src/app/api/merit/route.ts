import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const meritSchema = z.object({
  postId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = meritSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input: postId is required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: body.postId },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Cannot merit own posts
  if (post.authorId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot merit your own posts" },
      { status: 403 }
    );
  }

  try {
    await prisma.merit.create({
      data: {
        postId: body.postId,
        senderId: session.user.id,
        receiverId: post.authorId,
      },
    });

    // Increment receiver's merit score
    await prisma.user.update({
      where: { id: post.authorId },
      data: { meritScore: { increment: 1 } },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation — already merited this post
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "You have already merited this post" },
        { status: 409 }
      );
    }
    throw err;
  }
}
