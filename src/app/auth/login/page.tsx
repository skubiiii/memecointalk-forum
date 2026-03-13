"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { username, password, redirect: false });
      if (result?.error) {
        setError("Login failed. Check your username and password.");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <title>Login - MemecoinTalk</title>
      <Breadcrumbs items={[{ label: "MemecoinTalk", href: "/" }, { label: "Login" }]} />
      <div className="title-bar">Login</div>
      <div className="content-box" style={{ borderTop: "none" }}>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Username:</td>
                <td>
                  <input className="forum-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" style={{ width: 250 }} />
                </td>
              </tr>
              <tr>
                <td className="label">Password:</td>
                <td>
                  <input className="forum-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" style={{ width: 250 }} />
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingTop: 8 }}>
                  <button className="forum-btn" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  <span className="small" style={{ marginLeft: 12 }}>
                    Don&apos;t have an account? <Link href="/auth/register">Register</Link>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </>
  );
}
