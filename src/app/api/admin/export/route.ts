import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const format = request.nextUrl.searchParams.get("format") || "csv";
    const registrations = await prisma.registration.findMany({
      include: { messageLogs: true },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const headers = [
        "Reg ID", "Name", "Club", "Zone", "Mobile", "Pax",
        "Veg", "Non-Veg", "Amount (₹)", "Payment ID", "Payment Status",
        "WhatsApp Status", "Email Status", "Guest Details", "Registered At"
      ];

      const rows = registrations.map((r) => {
        const waLog = r.messageLogs.find((l) => l.type === "whatsapp");
        const emLog = r.messageLogs.find((l) => l.type === "email");
        return [
          r.registrationId, r.name, r.club, r.zone || "", r.mobile,
          r.pax, r.vegCount, r.nvegCount,
          r.amount, r.paymentId || "", r.paymentStatus,
          waLog ? `${waLog.status}${waLog.errorMessage ? ` - ${waLog.errorMessage}` : ""}` : "not_sent",
          emLog ? emLog.status : "not_sent",
          r.guestDetails || "", r.createdAt.toISOString()
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...rows].join("\r\n");
      
      return new NextResponse("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Rotary_Registrations_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // For PDF, return JSON data (PDF generation happens on client)
    return NextResponse.json({
      registrations: registrations.map((r) => {
        const waLog = r.messageLogs.find((l) => l.type === "whatsapp");
        const emLog = r.messageLogs.find((l) => l.type === "email");
        return {
          registrationId: r.registrationId,
          name: r.name,
          club: r.club,
          zone: r.zone,
          mobile: r.mobile,
          pax: r.pax,
          vegCount: r.vegCount,
          nvegCount: r.nvegCount,
          amount: r.amount,
          paymentId: r.paymentId,
          paymentStatus: r.paymentStatus,
          whatsappStatus: waLog?.status || "not_sent",
          emailStatus: emLog?.status || "not_sent",
          createdAt: r.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
