"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="breadcrumbs">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="sep">&raquo;</span>}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <b>{item.label}</b>
          )}
        </span>
      ))}
    </div>
  );
}
