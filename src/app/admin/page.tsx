import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format } from "date-fns";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length <= 2 ? "*".repeat(local.length) : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "GLOBAL_MODERATOR") {
    redirect("/");
  }

  const [totalUsers, totalThreads, totalPosts, totalMembers] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count(),
    prisma.post.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isBanned: true,
      createdAt: true,
    },
  });

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />
      <div className="title-bar">Admin Dashboard</div>

      <div className="content-box" style={{ marginBottom: 6 }}>
        <table className="form-table">
          <tbody>
            <tr>
              <td className="label">Total Users:</td>
              <td><b>{totalUsers}</b></td>
              <td className="label">Total Threads:</td>
              <td><b>{totalThreads}</b></td>
            </tr>
            <tr>
              <td className="label">Total Posts:</td>
              <td><b>{totalPosts}</b></td>
              <td className="label">Members:</td>
              <td><b>{totalMembers}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="content-box" style={{ marginBottom: 6 }}>
        <b>Quick Links:</b>{" "}
        <Link href="/admin/users">User Management</Link>
        {" | "}
        <Link href="/">Board Management</Link>
      </div>

      <div className="section-header">Recent Registrations</div>
      <table className="ftable">
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Username</th>
            <th style={{ width: "30%" }}>Email</th>
            <th style={{ width: "15%" }}>Role</th>
            <th style={{ width: "10%" }} className="tc">Banned</th>
            <th style={{ width: "20%" }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {recentUsers.map((user, i) => (
            <tr key={user.id} className={i % 2 === 0 ? "row1" : "row2"}>
              <td>
                <Link href={`/profile/${user.id}`} style={{ fontWeight: "bold" }}>
                  {user.username}
                </Link>
              </td>
              <td className="small">{maskEmail(user.email)}</td>
              <td className="small">{user.role}</td>
              <td className="tc small">
                {user.isBanned ? (
                  <span style={{ color: "#c00" }}>Yes</span>
                ) : (
                  <span className="muted">No</span>
                )}
              </td>
              <td className="small muted">
                {format(new Date(user.createdAt), "MMMM dd, yyyy")}
              </td>
            </tr>
          ))}
          {recentUsers.length === 0 && (
            <tr className="row1">
              <td colSpan={5} style={{ textAlign: "center", padding: 12 }} className="muted">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
