import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";
import UserActions from "./UserActions";

const USERS_PER_PAGE = 20;

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const where: any = {};
  if (search && search.trim()) {
    where.OR = [
      { username: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const totalUsers = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * USERS_PER_PAGE,
    take: USERS_PER_PAGE,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      postCount: true,
      meritScore: true,
      isBanned: true,
      createdAt: true,
    },
  });

  let baseUrl = "/admin/users?";
  if (search) baseUrl += `search=${encodeURIComponent(search)}&`;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Users" },
        ]}
      />
      <div className="title-bar">User Management</div>

      <div className="content-box" style={{ marginBottom: 6 }}>
        <form method="GET" action="/admin/users">
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Search users:</td>
                <td>
                  <input
                    type="text"
                    name="search"
                    defaultValue={search || ""}
                    placeholder="Username or email..."
                    className="forum-input"
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ width: 80 }}>
                  <button type="submit" className="forum-btn">Filter</button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="small muted" style={{ padding: "4px 0" }}>
        {totalUsers} user{totalUsers !== 1 ? "s" : ""} found
      </div>

      <table className="ftable">
        <thead>
          <tr>
            <th style={{ width: "16%" }}>Username</th>
            <th style={{ width: "20%" }}>Email</th>
            <th style={{ width: "10%" }}>Role</th>
            <th style={{ width: "7%" }} className="tc">Posts</th>
            <th style={{ width: "7%" }} className="tc">Merit</th>
            <th style={{ width: "8%" }} className="tc">Banned</th>
            <th style={{ width: "12%" }}>Joined</th>
            <th style={{ width: "20%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={user.id} className={i % 2 === 0 ? "row1" : "row2"}>
              <td>
                <Link href={`/profile/${user.id}`} style={{ fontWeight: "bold" }}>
                  {user.username}
                </Link>
              </td>
              <td className="small">{user.email}</td>
              <td className="small">{user.role}</td>
              <td className="tc">{user.postCount}</td>
              <td className="tc">{user.meritScore}</td>
              <td className="tc small">
                {user.isBanned ? (
                  <span style={{ color: "#c00" }}>Yes</span>
                ) : (
                  <span className="muted">No</span>
                )}
              </td>
              <td className="small muted">
                {format(new Date(user.createdAt), "MMM dd, yyyy")}
              </td>
              <td>
                <UserActions
                  userId={user.id}
                  currentRole={user.role}
                  isBanned={user.isBanned}
                  isCurrentUser={user.id === session.user.id}
                />
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr className="row1">
              <td colSpan={8} style={{ textAlign: "center", padding: 12 }} className="muted">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl={baseUrl}
      />
    </>
  );
}
