import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";

const MESSAGES_PER_PAGE = 20;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const userId = session.user.id;

  const totalMessages = await prisma.privateMessage.count({
    where: { receiverId: userId },
  });
  const totalPages = Math.max(1, Math.ceil(totalMessages / MESSAGES_PER_PAGE));

  const messages = await prisma.privateMessage.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * MESSAGES_PER_PAGE,
    take: MESSAGES_PER_PAGE,
    include: {
      sender: { select: { username: true } },
    },
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Private Messages" },
        ]}
      />

      <div className="title-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Inbox</span>
        <div style={{ display: "flex", gap: 4 }}>
          <Link href="/pm/sent" className="sm-btn">Sent Messages</Link>
          <Link href="/pm/compose" className="sm-btn">Compose</Link>
        </div>
      </div>

      <table className="ftable">
        <thead>
          <tr>
            <th style={{ width: "4%" }}>&nbsp;</th>
            <th style={{ width: "50%" }}>Subject</th>
            <th style={{ width: "20%" }}>From</th>
            <th style={{ width: "26%" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, i) => (
            <tr key={msg.id} className={i % 2 === 0 ? "row1" : "row2"}>
              <td className="tc">
                {!msg.isRead ? (
                  <span className="unread-indicator" title="Unread" />
                ) : (
                  <span style={{ opacity: 0.3 }}>&#x2709;</span>
                )}
              </td>
              <td>
                <Link
                  href={`/pm/${msg.id}`}
                  style={{ fontWeight: msg.isRead ? "normal" : "bold" }}
                >
                  {msg.subject}
                </Link>
              </td>
              <td>
                <Link href={`/profile/${msg.senderId}`}>
                  {msg.sender.username}
                </Link>
              </td>
              <td className="small muted">
                {format(new Date(msg.createdAt), "MMMM dd, yyyy, hh:mm:ss a")}
              </td>
            </tr>
          ))}
          {messages.length === 0 && (
            <tr className="row1">
              <td colSpan={4} style={{ textAlign: "center", padding: 20 }} className="muted">
                Your inbox is empty.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/pm"
      />
    </>
  );
}
