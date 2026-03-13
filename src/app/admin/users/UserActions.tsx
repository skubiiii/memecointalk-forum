"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["MEMBER", "MODERATOR", "GLOBAL_MODERATOR", "ADMIN"] as const;

export default function UserActions({
  userId,
  currentRole,
  isBanned,
  isCurrentUser,
}: {
  userId: string;
  currentRole: string;
  isBanned: boolean;
  isCurrentUser: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateUser(data: { role?: string; isBanned?: boolean }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update user");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isCurrentUser) {
    return <span className="small muted">--</span>;
  }

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
      <select
        defaultValue={currentRole}
        disabled={loading}
        onChange={(e) => updateUser({ role: e.target.value })}
        className="forum-input"
        style={{ fontSize: 11, padding: "1px 2px" }}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <button
        disabled={loading}
        onClick={() => updateUser({ isBanned: !isBanned })}
        className="sm-btn"
        style={isBanned ? {} : { background: "#c00", color: "#fff", borderColor: "#900" }}
      >
        {loading ? "..." : isBanned ? "Unban" : "Ban"}
      </button>
    </div>
  );
}
