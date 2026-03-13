import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createMessageSchema = z.object({
  recipientUsername: z.string().min(1).max(20),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(10000, "Message is too long"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = createMessageSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid input: recipient, subject (1-200 chars), and content are required" },
      { status: 400 }
    );
  }

  const recipient = await prisma.user.findUnique({
    where: { username: body.recipientUsername },
    select: { id: true },
  });

  if (!recipient) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const message = await prisma.privateMessage.create({
    data: {
      subject: body.subject,
      content: body.content,
      senderId: session.user.id,
      receiverId: recipient.id,
    },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
