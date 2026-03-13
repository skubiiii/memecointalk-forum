import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import BBCodeRenderer from "@/components/BBCodeRenderer";
import { format } from "date-fns";

export default async function ViewMessagePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { messageId } = await params;
  const userId = session.user.id;

  const message = await prisma.privateMessage.findUnique({
    where: { id: messageId },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
  });

  if (!message) notFound();

  if (message.senderId !== userId && message.receiverId !== userId) {
    notFound();
  }

  if (message.receiverId === userId && !message.isRead) {
    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  const isReceived = message.receiverId === userId;
  const otherUser = isReceived ? message.sender : message.receiver;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Private Messages", href: "/pm" },
          { label: message.subject },
        ]}
      />

      <div className="title-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{message.subject}</span>
        {isReceived && (
          <Link
            href={`/pm/compose?to=${encodeURIComponent(message.sender.username)}&subject=${encodeURIComponent("Re: " + message.subject)}`}
            className="sm-btn"
          >
            Reply
          </Link>
        )}
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{
          padding: "4px 8px",
          fontSize: 11,
          color: "#666",
          borderBottom: "1px solid #D0D0D0",
          background: "#D5DAE6",
          display: "flex",
          justifyContent: "space-between",
        }}>
          <span>
            {isReceived ? "From" : "To"}:{" "}
            <Link href={`/profile/${otherUser.id}`}>
              {otherUser.username}
            </Link>
          </span>
          <span>
            {format(new Date(message.createdAt), "MMMM dd, yyyy, hh:mm:ss a")}
          </span>
        </div>

        <div style={{ padding: "10px 12px" }}>
          <BBCodeRenderer content={message.content} />
        </div>
      </div>

      <div style={{ padding: "6px 0", display: "flex", gap: 4 }}>
        <Link href="/pm" className="sm-btn">Back to Inbox</Link>
        {isReceived && (
          <Link
            href={`/pm/compose?to=${encodeURIComponent(message.sender.username)}&subject=${encodeURIComponent("Re: " + message.subject)}`}
            className="sm-btn"
          >
            Reply
          </Link>
        )}
      </div>
    </>
  );
}
