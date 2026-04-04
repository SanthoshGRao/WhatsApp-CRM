import nodemailer from "nodemailer";
import { prisma } from "./prisma";

function getTransporter() {
  const port = parseInt(process.env.SMTP_PORT || "587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface RegistrationData {
  id: string;
  registrationId: string;
  name: string;
  club: string;
  zone?: string | null;
  mobile: string;
  pax: number;
  guestNames?: string | null;
  vegCount: number;
  nvegCount: number;
  amount: number;
  guestDetails?: string | null;
  paymentId?: string | null;
}

export async function sendAdminNotification(data: RegistrationData): Promise<void> {
  try {
    const senderEmail = process.env.SMTP_USER || "santhoshgrao13@gmail.com";
    
    // Fetch all admin emails from the database
    const admins = await prisma.admin.findMany({ select: { email: true } });
    const recipientEmails = admins.length > 0 
      ? admins.map(a => a.email) 
      : [senderEmail];

    const htmlContent = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f6f0; padding: 20px;">
        <div style="background: linear-gradient(135deg, #001f45, #003366); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #e8b84b; margin: 0; font-size: 22px;">New Registration Alert!</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 13px;">Rotary Anubandha Awards 2026</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #ddd5c0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Registration ID</td><td style="padding: 8px; font-weight: 700; color: #003366;">${data.registrationId}</td></tr>
            <tr style="background: #faf8f3;"><td style="padding: 8px; color: #6b7280; font-size: 13px;">Name</td><td style="padding: 8px; font-weight: 600;">${data.name}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Club</td><td style="padding: 8px;">${data.club}</td></tr>
            <tr style="background: #faf8f3;"><td style="padding: 8px; color: #6b7280; font-size: 13px;">Zone</td><td style="padding: 8px;">${data.zone || "—"}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Mobile</td><td style="padding: 8px;">${data.mobile}</td></tr>
            <tr style="background: #faf8f3;"><td style="padding: 8px; color: #6b7280; font-size: 13px;">Pax</td><td style="padding: 8px; font-weight: 700;">${data.pax} ${data.guestNames ? `(Guests: ${data.guestNames})` : ''}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Meals</td><td style="padding: 8px;">🥦 ${data.vegCount} Veg &nbsp; 🍗 ${data.nvegCount} Non-Veg</td></tr>
            <tr style="background: #faf8f3;"><td style="padding: 8px; color: #6b7280; font-size: 13px;">Amount</td><td style="padding: 8px; font-weight: 700; color: #c9952a; font-size: 18px;">₹${data.amount.toLocaleString("en-IN")}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Payment ID</td><td style="padding: 8px; font-size: 12px; color: #1a7c4a;">${data.paymentId || "N/A"}</td></tr>
          </table>
          ${data.guestDetails ? `<div style="margin-top: 16px; padding: 12px; background: #f5f2ec; border-radius: 8px; font-size: 12px; color: #6b7280;"><strong>Guest Details:</strong><br/>${data.guestDetails}</div>` : ""}
        </div>
        <p style="text-align: center; font-size: 11px; color: #999; margin-top: 16px;">This is an automated notification from Rotary Registration System</p>
      </div>
    `;

    await getTransporter().sendMail({
      from: `"Rotary Registration" <${senderEmail}>`,
      to: recipientEmails,
      subject: `New Registration: ${data.name} — ${data.club} (₹${data.amount})`,
      html: htmlContent,
    });

    // Log success
    await prisma.messageLog.create({
      data: {
        registrationId: data.id,
        type: "email",
        status: "sent",
      },
    });
    console.log("✅ Admin email notification sent");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    // Log failure
    try {
      await prisma.messageLog.create({
        data: {
          registrationId: data.id,
          type: "email",
          status: "failed",
          errorMessage: errorMsg,
        },
      });
    } catch {
      console.error("Failed to log email error");
    }
    console.error("❌ Failed to send admin email:", errorMsg);
  }
}
