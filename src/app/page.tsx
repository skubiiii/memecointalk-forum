import Link from "next/link";
import prisma from "@/lib/prisma";
import StatsBar from "@/components/StatsBar";
import { formatDistanceToNow } from "date-fns";

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      boards: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          children: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  return (
    <>
      {categories.map((category) => (
        <div key={category.id}>
          <div className="cat-header">{category.name}</div>
          <table className="ftable">
            <thead>
              <tr>
                <th style={{ width: 32 }}>&nbsp;</th>
                <th>Board</th>
                <th className="tc" style={{ width: 65 }}>Topics</th>
                <th className="tc" style={{ width: 65 }}>Posts</th>
                <th style={{ width: 200 }}>Last Post</th>
              </tr>
            </thead>
            <tbody>
              {category.boards.map((board: any, idx: number) => (
                <tr key={board.id} className={idx % 2 === 0 ? "row1" : "row2"}>
                  <td className="icon-cell">
                    <span className={`board-icon ${board.postCount > 0 ? "bi-on" : "bi-off"}`}>
                      {board.postCount > 0 ? "\u25CF" : "\u25CB"}
                    </span>
                  </td>
                  <td>
                    <span className="board-name">
                      <Link href={`/board/${board.slug}`}>{board.name}</Link>
                    </span>
                    {board.description && (
                      <div className="board-desc">{board.description}</div>
                    )}
                    {board.children.length > 0 && (
                      <div className="board-children">
                        Child boards: {board.children.map((child: any, i: number) => (
                          <span key={child.id}>
                            {i > 0 && ", "}
                            <Link href={`/board/${child.slug}`}>{child.name}</Link>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="tc">{board.threadCount}</td>
                  <td className="tc">{board.postCount}</td>
                  <td className="small">
                    {board.lastPostAt ? (
                      <div className="lastpost-info">
                        <Link href={board.lastThreadId ? `/thread/${board.lastThreadId}` : "#"}>
                          {board.lastThreadTitle ?? "—"}
                        </Link>
                        <br />
                        <span className="lp-date">
                          by {board.lastPostBy ?? "Unknown"},{" "}
                          {formatDistanceToNow(new Date(board.lastPostAt), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="muted">No posts yet</span>
                    )}
                  </td>
                </tr>
              ))}
              {category.boards.length === 0 && (
                <tr className="row1">
                  <td colSpan={5} style={{ textAlign: "center", padding: 10 }} className="muted">
                    No boards in this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
      <StatsBar />
    </>
  );
}
