import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  avatar: z.string().url().refine(
    (url) => /^https?:\/\//i.test(url),
    "Avatar URL must use http or https"
  ).optional().or(z.literal("")),
  signature: z.string().max(500).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Only allow users to fetch their own profile data (contains email)
  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatar: true,
      signature: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = updateProfileSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Check email uniqueness if email is being changed
  if (body.email && body.email !== "") {
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Email is already in use by another account" },
        { status: 409 }
      );
    }
  }

  const updateData: Record<string, string | null> = {};
  if (body.avatar !== undefined) {
    updateData.avatar = body.avatar === "" ? null : body.avatar;
  }
  if (body.signature !== undefined) {
    updateData.signature = body.signature === "" ? null : body.signature;
  }
  if (body.email !== undefined && body.email !== "") {
    updateData.email = body.email;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
