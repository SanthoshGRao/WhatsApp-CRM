import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { sendAdminNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      club,
      zone,
      mobile,
      pax,
      adults,
      children,
      vegCount,
      nvegCount,
      amount,
      guestDetails,
      paymentId,
    } = body;
    const paymentOrderId = body.paymentOrderId || body.orderId || null;
    const paymentSignature = body.paymentSignature || null;

    // Validation
    if (!name || !club || !mobile || !pax) {
      return NextResponse.json(
        { error: "Name, club, mobile, and pax are required" },
        { status: 400 }
      );
    }

    // Use frontend-generated registration ID or create a new one
    const registrationId = body.registrationId || "REA" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, "0");

    // Prevent duplicate UTR
    if (paymentId && paymentId !== 'Pending') {
      const existingUtr = await prisma.registration.findFirst({
        where: { paymentId: paymentId }
      });
      if (existingUtr) {
        return NextResponse.json(
          { error: "This Payment UTR has already been used for another registration." },
          { status: 400 }
        );
      }
    }

    // Create registration in database
    const registration = await prisma.registration.create({
      data: {
        registrationId,
        name,
        club,
        zone: zone || null,
        mobile,
        whatsappNumber: mobile, // Use mobile as WhatsApp number
        pax: parseInt(pax) || 1,
        adults: parseInt(adults) || 0,
        children: parseInt(children) || 0,
        vegCount: parseInt(vegCount) || 0,
        nvegCount: parseInt(nvegCount) || 0,
        amount: parseFloat(amount) || 0,
        guestDetails: guestDetails || null,
        paymentId: paymentId || null,
        paymentOrderId: paymentOrderId || null,
        paymentSignature: paymentSignature || null,
        paymentStatus: "pending",
      },
    });
    // Send WhatsApp message asynchronously using standard template
    sendWhatsAppTemplate(
      mobile,
      name,
      club,
      registration.id,
      "rotary_welcome_registration"
    ).then((result) => {
      if (result.success) {
        console.log("✅ Registration WA sent:", result.messageId);
      } else {
        console.error("❌ Registration WA failed:", result.error);
      }
    }).catch((err) => {
      console.error("Registration WA send error:", err);
    });

    // Send admin email notification asynchronously
    sendAdminNotification({
      id: registration.id,
      registrationId: registration.registrationId,
      name,
      club,
      zone,
      mobile,
      pax: registration.pax,
      adults: registration.adults,
      children: registration.children,
      vegCount: registration.vegCount,
      nvegCount: registration.nvegCount,
      amount: registration.amount,
      guestDetails,
      paymentId,
    }).catch((err) => {
      console.error("Email notification error:", err);
    });

    return NextResponse.json({
      success: true,
      registrationId: registration.registrationId,
      id: registration.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create registration" },
      { status: 500 }
    );
  }
}
