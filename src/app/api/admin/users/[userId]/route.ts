import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const VALID_ROLES = ["MEMBER", "MODERATOR", "GLOBAL_MODERATOR", "ADMIN"] as const;

const updateUserSchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  isBanned: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  // Cannot modify self
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change own role or ban status" },
      { status: 400 }
    );
  }

  let body;
  try {
    body = updateUserSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: any = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.isBanned !== undefined) data.isBanned = body.isBanned;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({ success: true });
}
