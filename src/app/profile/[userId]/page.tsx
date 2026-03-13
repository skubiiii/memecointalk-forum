import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDistanceToNow } from "date-fns";

function getRank(postCount: number): { label: string; className: string } {
  if (postCount >= 480) return { label: "Legendary", className: "rank-legendary" };
  if (postCount >= 240) return { label: "Hero Member", className: "rank-hero" };
  if (postCount >= 120) return { label: "Sr. Member", className: "rank-sr" };
  if (postCount >= 60) return { label: "Full Member", className: "rank-full" };
  if (postCount >= 30) return { label: "Member", className: "rank-member" };
  if (postCount >= 10) return { label: "Jr. Member", className: "rank-jr" };
  return { label: "Newbie", className: "rank-newbie" };
}

function getRoleLabel(role: string): string | null {
  if (role === "ADMIN") return "Administrator";
  if (role === "GLOBAL_MODERATOR") return "Global Moderator";
  if (role === "MODERATOR") return "Moderator";
  return null;
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatar: true, signature: true, role: true, postCount: true, meritScore: true, createdAt: true },
  });

  if (!user) notFound();

  const recentPosts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { thread: { select: { id: true, title: true } } },
  });

  const rank = getRank(user.postCount);
  const roleLabel = getRoleLabel(user.role);
  const isOwnProfile = session?.user?.id === user.id;

  return (
    <>
      <Breadcrumbs items={[{ label: "MemecoinTalk", href: "/" }, { label: "Profile" }, { label: user.username }]} />

      <div className="title-bar">Summary - {user.username}</div>

      <table className="ftable">
        <tbody>
          <tr className="row1">
            <td style={{ width: 170, textAlign: "center", verticalAlign: "top", padding: 12 }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} style={{ width: 80, height: 80, display: "block", margin: "0 auto 6px" }} />
              ) : (
                <div style={{ width: 80, height: 80, background: "#ddd", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 24 }}>?</div>
              )}
              <b>{user.username}</b><br />
              <span className="small">
                {roleLabel ? (
                  <span className={user.role === "ADMIN" ? "rank-admin" : "rank-mod"}>{roleLabel}</span>
                ) : (
                  <span className={rank.className}>{rank.label}</span>
                )}
              </span>
            </td>
            <td style={{ verticalAlign: "top", padding: 10 }}>
              <table className="form-table">
                <tbody>
                  <tr><td className="label">Joined:</td><td>{new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
                  <tr><td className="label">Posts:</td><td>{user.postCount}</td></tr>
                  <tr><td className="label">Merit:</td><td>{user.meritScore}</td></tr>
                  <tr><td className="label">Rank:</td><td><span className={rank.className}>{rank.label}</span></td></tr>
                  {user.signature && <tr><td className="label">Signature:</td><td className="small muted" style={{ fontStyle: "italic" }}>{user.signature}</td></tr>}
                </tbody>
              </table>
              {isOwnProfile && (
                <div style={{ marginTop: 8, paddingLeft: 6 }}>
                  <Link href="/profile/edit" className="sm-btn">Edit Profile</Link>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="section-header" style={{ marginTop: 6 }}>Recent Posts</div>
      <table className="ftable">
        <thead>
          <tr><th>Thread</th><th style={{ width: 140 }}>Date</th></tr>
        </thead>
        <tbody>
          {recentPosts.length === 0 ? (
            <tr className="row1"><td colSpan={2} className="muted" style={{ textAlign: "center", padding: 12 }}>No posts yet.</td></tr>
          ) : (
            recentPosts.map((post: any, idx: number) => (
              <tr key={post.id} className={idx % 2 === 0 ? "row1" : "row2"}>
                <td><Link href={`/thread/${post.thread.id}`}>{post.thread.title}</Link></td>
                <td className="small muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
