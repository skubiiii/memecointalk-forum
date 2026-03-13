"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (username.length > 20) { setError("Username must be 20 characters or fewer."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username: letters, numbers, underscores only."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) { setError("Password must contain uppercase, lowercase, and a number."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); }
      else { router.push("/auth/login?registered=1"); }
    } catch { setError("An unexpected error occurred."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <title>Register - MemecoinTalk</title>
      <Breadcrumbs items={[{ label: "MemecoinTalk", href: "/" }, { label: "Registration" }]} />
      <div className="title-bar">Registration</div>
      <div className="content-box" style={{ borderTop: "none" }}>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Username:</td>
                <td>
                  <input className="forum-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" style={{ width: 250 }} />
                  <div className="helper">3-20 characters, letters, numbers, underscores only.</div>
                </td>
              </tr>
              <tr>
                <td className="label">Email:</td>
                <td><input className="forum-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={{ width: 250 }} /></td>
              </tr>
              <tr>
                <td className="label">Password:</td>
                <td>
                  <input className="forum-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" style={{ width: 250 }} />
                  <div className="helper">Minimum 8 characters. Must include uppercase, lowercase, and a number.</div>
                </td>
              </tr>
              <tr>
                <td className="label">Verify password:</td>
                <td><input className="forum-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" style={{ width: 250 }} /></td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingTop: 8 }}>
                  <button className="forum-btn" type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                  <span className="small" style={{ marginLeft: 12 }}>Already registered? <Link href="/auth/login">Login</Link></span>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </>
  );
}
