import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getAuthAdmin } from "@/lib/auth";
export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    const registration = await prisma.registration.findUnique({
      where: { id },
    });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const targetNumber = registration.whatsappNumber || registration.mobile;
    if (!targetNumber) {
      return NextResponse.json({ error: "No mobile number found for this registration" }, { status: 400 });
    }
    const template = registration.paymentStatus === "paid" ? "rotary_payment_confirmation" : undefined;
    const result = await sendWhatsAppTemplate(
      targetNumber,
      registration.name,
      registration.club,
      registration.id,
      template
    );
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error("Error retrying WhatsApp message:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
