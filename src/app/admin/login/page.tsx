"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.pattern} />
          <h2 style={styles.title}>Admin Portal</h2>
          <p style={styles.subtitle}>Rotary Anubandha Awards 2026</p>
        </div>
        <form onSubmit={handleLogin} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </>
            )}
          </button>
          <div
            style={styles.backLink}
            onClick={() => (window.location.href = "/form.html")}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Registration
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f2ec",
    fontFamily: "'Outfit', sans-serif",
    padding: "32px 16px",
    position: "relative",
  },
  bg1: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(circle at 15% 20%, rgba(201,149,42,0.07), transparent 50%)",
    pointerEvents: "none",
  },
  bg2: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(circle at 85% 80%, rgba(0,51,102,0.07), transparent 50%)",
    pointerEvents: "none",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 2px 0 rgba(201,149,42,0.4), 0 10px 48px rgba(0,31,69,0.13)",
    width: "100%",
    maxWidth: "420px",
    overflow: "hidden",
    animation: "rise 0.5s cubic-bezier(0.22,0.68,0,1.15) both",
    position: "relative",
    zIndex: 1,
  },
  cardTop: {
    background: "linear-gradient(135deg, #001f45, #003366)",
    padding: "36px 28px 28px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  pattern: {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    background: "repeating-linear-gradient(45deg, #e8b84b 0, #e8b84b 1px, transparent 0, transparent 50%)",
    backgroundSize: "18px 18px",
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "26px",
    color: "#fff",
    position: "relative",
    zIndex: 1,
    marginBottom: "4px",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    position: "relative",
    zIndex: 1,
    margin: 0,
  },
  form: {
    padding: "32px 28px 28px",
  },
  errorBox: {
    background: "#fdf2f2",
    border: "1px solid #f5b7b1",
    borderRadius: "9px",
    padding: "11px 14px",
    fontSize: "13px",
    color: "#c0392b",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  field: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontSize: "11.5px",
    fontWeight: 600,
    color: "#1a1a2e",
    letterSpacing: "0.4px",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    border: "1.5px solid #ddd5c0",
    borderRadius: "10px",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "15px",
    color: "#1a1a2e",
    background: "#fdfcf9",
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #9e7320, #c9952a, #e8b84b)",
    backgroundSize: "200%",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "18px",
    boxShadow: "0 4px 18px rgba(201,149,42,0.38)",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#6b7280",
    cursor: "pointer",
  },
};
