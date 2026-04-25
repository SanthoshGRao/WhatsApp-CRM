"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
interface Registration {
  id: string;
  registrationId: string;
  name: string;
  club: string;
  zone: string | null;
  mobile: string;
  pax: number;
  vegCount: number;
  nvegCount: number;
  amount: number;
  guestDetails: string | null;
  paymentId: string | null;
  paymentOrderId: string | null;
  paymentStatus: string;
  category: string;
  createdAt: string;
  whatsappStatus: { status: string; error: string | null };
  emailStatus: { status: string; error: string | null };
}
interface Stats {
  totalRegistrations: number;
  totalPax: number;
  totalVeg: number;
  totalNveg: number;
  totalRevenue: number;
}
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export default function AdminDashboard() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [resending, setResending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [notification, setNotification] = useState<{message: string, type: "success" | "error" | "info"} | null>(null);
  const showMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };
  const resendWhatsApp = async (id: string) => {
    setResending(true);
    try {
      const res = await fetch("/api/admin/retry-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("WhatsApp message resent successfully!", "success");
        setSelectedReg(prev => prev ? { ...prev, whatsappStatus: { status: "sent", error: null } } : null);
        fetchData(pagination.page, search, filterStatus, filterZone, filterClub, filterCategory);
      } else {
        showMessage("Failed to resend: " + data.error, "error");
      }
    } catch {
      showMessage("An error occurred", "error");
    }
    setResending(false);
  };
  const fetchData = useCallback(async (page = 1, searchQuery = "", status = filterStatus, zone = filterZone, club = filterClub, category = filterCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(status)}&zone=${encodeURIComponent(zone)}&club=${encodeURIComponent(club)}&category=${encodeURIComponent(category)}&sortOrder=desc`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch { console.error("Failed to fetch"); }
    setLoading(false);
  }, [router, filterStatus, filterZone, filterClub, filterCategory]);
  useEffect(() => { fetchData(1, "", filterStatus, filterZone, filterClub, filterCategory); }, [fetchData, filterStatus, filterZone, filterClub, filterCategory]);
  const handleSearch = () => fetchData(1, search, filterStatus, filterZone, filterClub, filterCategory);
  const handlePage = (p: number) => fetchData(p, search, filterStatus, filterZone, filterClub, filterCategory);
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(`Are you sure you want to reconcile payments using ${file.name}?`)) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/reconcile-statement", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Successfully processed. Matched ${data.matched} out of ${data.totalPending} pending payments.`, "success");
        fetchData(pagination.page, search, filterStatus, filterZone, filterClub);
      } else {
        showMessage("Failed to reconcile: " + data.error, "error");
      }
    } catch {
      showMessage("An error occurred during upload.", "error");
    }
    setUploading(false);
    e.target.value = ""; // clear input
  };
  const downloadCSV = () => {
    window.open("/api/admin/export?format=csv", "_blank");
  };
  const downloadPDF = async () => {
    try {
      const res = await fetch("/api/admin/export?format=pdf");
      const data = await res.json();
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Rotary Anubandha Awards 2026 — Registrations", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 22);
      const headers = [["#", "Reg ID", "Name", "Club", "Zone", "Mobile", "Pax", "Amount", "Payment"]];
      const rows = data.registrations.map((r: Registration, i: number) => [
        i + 1, r.registrationId, r.name, r.club, r.zone || "—", r.mobile,
        r.pax, `₹${r.amount}`, r.paymentStatus
      ]);
      (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
        head: headers, body: rows, startY: 28, styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 51, 102] },
      });
      doc.save(`Rotary_Registrations_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) { console.error("PDF error:", err); showMessage("Failed to generate PDF", "error"); }
  };
  const StatusBadge = ({ status, error }: { status: string; error?: string | null }) => {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
      sent: { bg: "#edfbf2", color: "#1a7c4a", border: "#a3d9b5" },
      failed: { bg: "#fdf2f2", color: "#c0392b", border: "#f5b7b1" },
      not_sent: { bg: "#f5f2ec", color: "#6b7280", border: "#ddd5c0" },
      paid: { bg: "#edfbf2", color: "#1a7c4a", border: "#a3d9b5" },
      pending: { bg: "#fff8ec", color: "#9e7320", border: "#e8b84b" },
    };
    const c = colors[status] || colors.not_sent;
    return (
      <span
        title={error || ""}
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
          background: c.bg, color: c.color, border: `1px solid ${c.border}`,
          cursor: error ? "help" : "default",
        }}
      >
        {status === "sent" || status === "paid" ? "✓" : status === "failed" ? "✗" : "○"} {status}
      </span>
    );
  };
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#f5f2ec", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(0,31,69,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,149,42,0.25)", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.location.href = "/form.html"}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: "#fff" }}>
            Rotary <span style={{ color: "#e8b84b" }}>Anubandha Awards 2026</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={handleLogout} style={{ ...navBtn, color: "#f5b7b1", background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)" }}>
            ↪ Logout
          </button>
        </div>
      </nav>
      {}
      <div style={{ background: "linear-gradient(135deg, #001f45, #003366)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid rgba(201,149,42,0.2)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#e8b84b" }}></span> Admin Dashboard
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ ...exportBtn, background: "#27ae60", color: "#fff", cursor: uploading ? "not-allowed" : "pointer" }}>
            {uploading ? "Processing..." : "Statement Upload (PDF/Excel)"}
            <input type="file" accept=".pdf,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button onClick={downloadCSV} style={exportBtn}> Download CSV</button>
          <button onClick={downloadPDF} style={exportBtn}> Download PDF</button>
        </div>
      </div>
      {}
      <div style={{ flex: 1, padding: "24px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        {}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            <StatCard label="Registrations" value={String(stats.totalRegistrations)} sub="" color="#c9952a" />
            <StatCard label="Total Pax" value={String(stats.totalPax)} sub="" color="#003366" />
            <StatCard label="Veg Meals" value={String(stats.totalVeg)} sub="" color="#2d8c4e" />
            <StatCard label="Non-Veg Meals" value={String(stats.totalNveg)} sub="" color="#c0392b" />
            <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} sub="" color="#27ae60" />
          </div>
        )}
        {}
        <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,31,69,0.07)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ddd5c0", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", display: "flex", alignItems: "center", gap: "8px" }}>
              Customer List
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginLeft: "auto", marginRight: "10px" }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={selectStyle}>
                <option value="">All Zones</option>
                <option value="Zone 1">Zone 1</option>
                <option value="Zone 2">Zone 2</option>
                <option value="Zone 3">Zone 3</option>
                <option value="Zone 4">Zone 4</option>
                <option value="Zone 5">Zone 5</option>
                <option value="Zone 6">Zone 6</option>
                <option value="Zone 7">Zone 7</option>
                <option value="Zone 8">Zone 8</option>
                <option value="Zone 9">Zone 9</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
                <option value="">All Categories</option>
                <option value="regular">Regular</option>
                <option value="silver">Silver</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fdfcf9", border: "1.5px solid #ddd5c0", borderRadius: "8px", padding: "7px 13px" }}>
              <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Search name, phone, club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{ border: "none", background: "transparent", fontFamily: "'Outfit', sans-serif", fontSize: "13px", color: "#1a1a2e", outline: "none", width: "200px" }}
              />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #001f45, #003366)" }}>
                  {["#", "Name", "Phone", "Club", "Category", "Pax", "Amount", "Payment", "Date"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
                ) : registrations.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: "56px", textAlign: "center", color: "#6b7280" }}>No registrations found</td></tr>
                ) : registrations.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelectedReg(r)} style={{ borderBottom: "1px solid #f5f1e8", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fdfaf4")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>{(pagination.page - 1) * 10 + i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name}</td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#6b7280" }}>{r.mobile}</td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#6b7280", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.club}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                        background: r.category === "silver" ? "#eceff1" : "#fff8e1",
                        color: r.category === "silver" ? "#546e7a" : "#9e7320",
                        border: `1px solid ${r.category === "silver" ? "#b0bec5" : "#e8b84b"}`,
                      }}>{(r.category || "regular").charAt(0).toUpperCase() + (r.category || "regular").slice(1)}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#003366" }}>{r.pax}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#9e7320" }}>₹{r.amount.toLocaleString("en-IN")}</td>
                    <td style={tdStyle}><StatusBadge status={r.paymentStatus} /></td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "11px", color: "#6b7280" }}>{new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #ddd5c0", fontSize: "12px", color: "#6b7280", flexWrap: "wrap", gap: "8px" }}>
            <span>{pagination.total ? `Showing ${(pagination.page - 1) * 10 + 1}–${Math.min(pagination.page * 10, pagination.total)} of ${pagination.total}` : "No results"}</span>
            <div style={{ display: "flex", gap: "5px" }}>
              <button disabled={pagination.page <= 1} onClick={() => handlePage(pagination.page - 1)} style={pgBtn}>‹</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button key={i} onClick={() => handlePage(i + 1)} style={{ ...pgBtn, ...(pagination.page === i + 1 ? { background: "#003366", color: "#fff", borderColor: "#003366" } : {}) }}>{i + 1}</button>
              ))}
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => handlePage(pagination.page + 1)} style={pgBtn}>›</button>
            </div>
          </div>
        </div>
      </div>
      {}
      {selectedReg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
          onClick={() => setSelectedReg(null)}
        >
          <div style={{ background: "#fff", borderRadius: "16px", maxWidth: "540px", width: "100%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: "linear-gradient(135deg, #001f45, #003366)", padding: "20px 24px", borderRadius: "16px 16px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#fff" }}>{selectedReg.name}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{selectedReg.registrationId}</div>
              </div>
              <button onClick={() => setSelectedReg(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {[
                ["Club", selectedReg.club],
                ["Category", (selectedReg.category || "regular").charAt(0).toUpperCase() + (selectedReg.category || "regular").slice(1)],
                ["Zone", selectedReg.zone || "—"],
                ["Mobile", selectedReg.mobile],
                ["Pax", `${selectedReg.pax}`],
                ["Meals", `🥦 ${selectedReg.vegCount} Veg · 🍗 ${selectedReg.nvegCount} Non-Veg`],
                ["Amount", `₹${selectedReg.amount.toLocaleString("en-IN")}`],
                ["Payment ID", selectedReg.paymentId || "—"],
                ["Registered", new Date(selectedReg.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ebe0", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              {selectedReg.guestDetails && (
                <div style={{ marginTop: "12px", padding: "12px", background: "#f5f2ec", borderRadius: "8px", fontSize: "12px", color: "#6b7280" }}>
                  <strong>Guest Details:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {selectedReg.guestDetails.split(/ \| |\n/).map((guest, idx) => {
                      let fmt = guest.trim();
                      if (fmt.startsWith("Guest ")) fmt = fmt.replace(/^Guest \d+:\s*/, "");
                      fmt = fmt.replace(" / ", ": ");
                      return <div key={idx} style={{ paddingBottom: "3px" }}>{fmt}</div>;
                    })}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", marginBottom: "8px", letterSpacing: "0.5px" }}>MESSAGE STATUS</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, padding: "12px", background: "#f9f7f2", borderRadius: "8px", border: "1px solid #ddd5c0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>WhatsApp</div>
                      {selectedReg.whatsappStatus?.status === "failed" && (
                        <button
                          onClick={() => resendWhatsApp(selectedReg.id)}
                          disabled={resending}
                          style={{ background: "#c0392b", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: resending ? "not-allowed" : "pointer" }}
                        >
                          {resending ? "Resending..." : "Resend"}
                        </button>
                      )}
                    </div>
                    <StatusBadge status={selectedReg.whatsappStatus?.status || "not_sent"} error={selectedReg.whatsappStatus?.error} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "6px", ...( selectedReg.paymentStatus === "paid" ? { background: "#edfbf2", color: "#1a7c4a" } : { background: "#fff8ec", color: "#9e7320" }) }}>
                  Payment: {selectedReg.paymentStatus}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {}
      <footer style={{ textAlign: "center", padding: "14px", borderTop: "1px solid #ddd5c0", background: "rgba(255,255,255,0.6)", fontSize: "12px", color: "#6b7280" }}>
        © 2026 Rotary Anubandha Awards — Admin Portal
      </footer>
      {}
      {notification && (
        <div style={{
          position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
          background: notification.type === "success" ? "#1a7c4a" : notification.type === "error" ? "#c0392b" : "#003366",
          color: "#fff", padding: "14px 24px", borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontFamily: "'Outfit', sans-serif",
          fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px",
          animation: "slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
        }}>
          <span style={{ fontSize: "16px" }}>
            {notification.type === "success" ? "✓" : notification.type === "error" ? "✕" : "ℹ"}
          </span>
          {notification.message}
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,31,69,0.07)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "30px", fontWeight: 700, color: "#003366", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color, marginTop: "2px", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
const navBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
  borderRadius: "7px", fontSize: "13px", fontWeight: 500, background: "none",
  border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
};
const exportBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px",
  borderRadius: "8px", fontFamily: "'Outfit', sans-serif", fontSize: "13px",
  fontWeight: 600, cursor: "pointer", border: "none",
  background: "#c9952a", color: "#001f45",
};
const thStyle: React.CSSProperties = {
  padding: "11px 14px", fontSize: "11px", fontWeight: 600,
  color: "rgba(255,255,255,0.8)", letterSpacing: "0.5px",
  textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 14px", fontSize: "13px", color: "#1a1a2e", verticalAlign: "middle",
};
const pgBtn: React.CSSProperties = {
  padding: "5px 11px", border: "1.5px solid #ddd5c0", borderRadius: "6px",
  background: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: "12px",
  fontWeight: 600, cursor: "pointer", color: "#1a1a2e",
};
const selectStyle: React.CSSProperties = {
  padding: "8px 12px", border: "1.5px solid #ddd5c0", borderRadius: "8px",
  background: "#fdfcf9", fontFamily: "'Outfit', sans-serif", fontSize: "13px",
  color: "#1a1a2e", outline: "none",
};
