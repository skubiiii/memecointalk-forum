"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [avatar, setAvatar] = useState("");
  const [signature, setSignature] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/profile?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.avatar) setAvatar(data.avatar);
          if (data.signature) setSignature(data.signature);
          if (data.email) setEmail(data.email);
        });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, signature, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      } else {
        setMessage("Profile updated successfully.");
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Profile", href: `/profile/${session.user.id}` },
          { label: "Edit Profile" },
        ]}
      />

      <div className="title-bar">Edit Profile</div>

      <div className="content-box">
        {message && <div className="notice-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label">Avatar URL:</td>
                <td>
                  <input
                    type="url"
                    className="forum-input"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    style={{ width: "100%" }}
                  />
                  <div className="helper">Direct link to an image file</div>
                </td>
              </tr>
              <tr>
                <td className="label">Signature:</td>
                <td>
                  <textarea
                    className="forum-textarea"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    style={{ minHeight: 80 }}
                    maxLength={500}
                    placeholder="Your signature (BBCode supported)"
                  />
                  <div className="helper">{signature.length}/500 characters</div>
                </td>
              </tr>
              <tr>
                <td className="label">Email:</td>
                <td>
                  <input
                    type="email"
                    className="forum-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <button type="submit" className="forum-btn" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </>
  );
}
