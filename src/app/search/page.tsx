import Link from "next/link";
import prisma from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import { formatDistanceToNow } from "date-fns";
import SearchForm from "./SearchForm";

const RESULTS_PER_PAGE = 20;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; board?: string; author?: string; page?: string }>;
}) {
  const { q, board, author, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const boards = await prisma.board.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const hasQuery = q && q.trim().length > 0;
  let results: any[] = [];
  let totalResults = 0;

  if (hasQuery) {
    const query = q.trim();
    const where: any = {
      OR: [
        { content: { contains: query, mode: "insensitive" } },
        { thread: { title: { contains: query, mode: "insensitive" } } },
      ],
    };

    if (board) {
      where.OR = [
        { content: { contains: query, mode: "insensitive" }, thread: { boardId: board } },
        { thread: { title: { contains: query, mode: "insensitive" }, boardId: board } },
      ];
    }

    if (author) {
      const authorUser = await prisma.user.findFirst({
        where: { username: { contains: author, mode: "insensitive" } },
        select: { id: true },
      });
      if (authorUser) {
        where.OR = where.OR.map((cond: any) => ({ ...cond, authorId: authorUser.id }));
      } else {
        return (
          <>
            <Breadcrumbs items={[{ label: "MemecoinTalk", href: "/" }, { label: "Search" }]} />
            <div className="title-bar">Search</div>
            <SearchForm boards={boards} initialQuery={q} initialBoard={board} initialAuthor={author} />
            <div className="content-box muted" style={{ textAlign: "center", padding: 14 }}>
              No results found for &quot;{query}&quot;.
            </div>
          </>
        );
      }
    }

    totalResults = await prisma.post.count({ where });
    results = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * RESULTS_PER_PAGE,
      take: RESULTS_PER_PAGE,
      include: {
        thread: { include: { board: { select: { id: true, name: true, slug: true } } } },
        author: { select: { id: true, username: true } },
      },
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
  let baseUrl = "/search?";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (board) params.set("board", board);
  if (author) params.set("author", author);
  baseUrl += params.toString();

  return (
    <>
      <Breadcrumbs items={[{ label: "MemecoinTalk", href: "/" }, { label: "Search" }]} />
      <div className="title-bar">Search</div>
      <SearchForm boards={boards} initialQuery={q} initialBoard={board} initialAuthor={author} />

      {hasQuery && (
        <>
          <div className="small muted" style={{ padding: "4px 0" }}>
            {totalResults} result{totalResults !== 1 ? "s" : ""} found for &quot;{q}&quot;
          </div>

          {results.length > 0 ? (
            <>
              <table className="ftable">
                <thead>
                  <tr>
                    <th>Thread</th>
                    <th style={{ width: 120 }}>Board</th>
                    <th style={{ width: 90 }}>Author</th>
                    <th style={{ width: 100 }}>Date</th>
                    <th>Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((post: any, idx: number) => (
                    <tr key={post.id} className={idx % 2 === 0 ? "row1" : "row2"}>
                      <td><Link href={`/thread/${post.thread.id}`} style={{ fontWeight: "bold" }}>{post.thread.title}</Link></td>
                      <td className="small"><Link href={`/board/${post.thread.board.slug}`}>{post.thread.board.name}</Link></td>
                      <td className="small"><Link href={`/profile/${post.author.id}`}>{post.author.username}</Link></td>
                      <td className="small muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</td>
                      <td className="small">{post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
            </>
          ) : (
            <div className="content-box muted" style={{ textAlign: "center", padding: 14 }}>No results found.</div>
          )}
        </>
      )}
    </>
  );
}
