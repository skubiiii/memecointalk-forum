"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  pages.push(1);
  if (currentPage > 3) pages.push("...");
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  function pageUrl(page: number) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  }

  return (
    <div className="pages">
      <b>Pages:</b>{" "}
      {currentPage > 1 && (
        <><Link href={pageUrl(currentPage - 1)}>&laquo; previous</Link>{" "}</>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`}> ... </span>
        ) : p === currentPage ? (
          <span key={p} className="current">{p}</span>
        ) : (
          <span key={p}><Link href={pageUrl(p)}>{p}</Link> </span>
        )
      )}
      {currentPage < totalPages && (
        <Link href={pageUrl(currentPage + 1)}>next &raquo;</Link>
      )}
    </div>
  );
}
