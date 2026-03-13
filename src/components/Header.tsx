import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  let unreadCount = 0;
  if (user?.id) {
    unreadCount = await prisma.privateMessage.count({
      where: { receiverId: user.id, isRead: false },
    });
  }

  return (
    <>
      {/* Top utility bar */}
      <div className="forum-top-bar">
        <div>
          {user ? (
            <>
              Welcome, <b>{(user as any).username ?? user.name}</b>.
              {unreadCount > 0 && (
                <> You have <Link href="/pm"><b>{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</b></Link>.</>
              )}
            </>
          ) : (
            <>Welcome, <b>Guest</b>. Please <Link href="/auth/login">login</Link> or <Link href="/auth/register">register</Link>.</>
          )}
        </div>
        <div>
          {user && <LogoutButton />}
        </div>
      </div>

      {/* Logo area */}
      <div className="forum-logo-area">
        <Link href="/" className="forum-logo">
          MemecoinTalk
          <span className="logo-sub">Pair Trading Discussion Forum</span>
        </Link>
      </div>

      {/* Navigation bar */}
      <div className="forum-nav">
        <Link href="/">Home</Link>
        <span className="sep">|</span>
        <Link href="/search">Search</Link>
        <span className="sep">|</span>
        {user ? (
          <>
            <Link href={`/profile/${user.id}`}>Profile</Link>
            <span className="sep">|</span>
            <Link href="/pm">My Messages{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
            <span className="sep">|</span>
            <Link href="/admin">Admin</Link>
          </>
        ) : (
          <>
            <Link href="/auth/login">Login</Link>
            <span className="sep">|</span>
            <Link href="/auth/register">Register</Link>
          </>
        )}
      </div>
    </>
  );
}
