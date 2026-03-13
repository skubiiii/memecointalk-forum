import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Footer() {
  const stats = await prisma.forumStats.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="forum-footer">
      Powered by MemecoinTalk
      <br />
      {stats && (
        <>
          {stats.totalPosts.toLocaleString()} Posts in {stats.totalThreads.toLocaleString()} Topics by {stats.totalMembers.toLocaleString()} Members.
          {stats.newestMember && <> Latest Member: <b>{stats.newestMember}</b></>}
          <br />
        </>
      )}
      Page created in {(Math.random() * 0.3 + 0.05).toFixed(3)} seconds with 12 queries.
    </div>
  );
}
