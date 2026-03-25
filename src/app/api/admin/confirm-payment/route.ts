import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const registration = await prisma.registration.update({
      where: { id },
      data: { paymentStatus: "paid" },
    });

    if (registration.whatsappNumber) {
      const result = await sendWhatsAppTemplate(
        registration.whatsappNumber,
        registration.name,
        registration.club,
        registration.id,
        "rotary_payment_confirmation"
      );
      if (!result.success) {
        console.error("Failed to send WA:", result.error);
        return NextResponse.json({ success: true, paymentStatus: "paid", whatsappWarning: result.error });
      }
    }
    
    return NextResponse.json({ success: true, paymentStatus: "paid" });
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
