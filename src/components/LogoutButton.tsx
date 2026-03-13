"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        signOut({ callbackUrl: "/" });
      }}
      style={{ cursor: "pointer" }}
    >
      Logout
    </a>
  );
}
