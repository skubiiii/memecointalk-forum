import prisma from "@/lib/prisma";

export default async function StatsBar() {
  const stats = await prisma.forumStats.findUnique({
    where: { id: "singleton" },
  });

  const totalPosts = stats?.totalPosts ?? 0;
  const totalThreads = stats?.totalThreads ?? 0;
  const totalMembers = stats?.totalMembers ?? 0;
  const newestMember = stats?.newestMember ?? "N/A";

  return (
    <div className="forum-stats-box">
      <b>Forum Stats</b>
      <br />
      {totalPosts.toLocaleString()} Posts in {totalThreads.toLocaleString()} Topics by {totalMembers.toLocaleString()} Members. Latest Member: <b>{newestMember}</b>
      <br />
      <span className="muted">Latest Post: &quot;—&quot;</span>
      <br />
      <span className="muted">View the most recent posts on the forum.</span>
    </div>
  );
}
