"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    await signOut({ redirect: false });
    window.location.href = "/";
  }

  return (
    <a href="#" onClick={handleLogout} style={{ cursor: "pointer" }}>
      Logout
    </a>
  );
}
