import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthAdmin } from "@/lib/auth";
import * as xlsx from "xlsx";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const admin = await getAuthAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let textLines: string[] = [];
    const mime = file.type || file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (mime === "application/pdf" || mime === ".pdf") {
      if (typeof globalThis.DOMMatrix === "undefined") {
        (globalThis as any).DOMMatrix = class DOMMatrix {
          constructor() { return Object.create(null); }
        };
      }
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      textLines = pdfData.text.split("\n");
    } else if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mime === "application/vnd.ms-excel" || mime === ".xlsx" || mime === ".xls") {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      textLines = rows.map(row => row.join(" "));
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or Excel file." }, { status: 400 });
    }
    const pendingRegistrations = await prisma.registration.findMany({
      where: { paymentStatus: "pending" },
    });
    let matchedCount = 0;
    const errors: string[] = [];
    for (const reg of pendingRegistrations) {
      if (!reg.paymentId || reg.paymentId.trim().length < 6) continue;
      const utr = reg.paymentId.trim();
      const amountStr = reg.amount.toString();
      const formattedAmount1 = amountStr + ".00";
      const formattedAmount2 = amountStr + ",00";
      const formattedAmount3 = parseFloat(amountStr).toLocaleString("en-IN") + ".00";
      const fullText = textLines.join(" ");
      const isMatch = fullText.includes(utr) && 
        (fullText.includes(amountStr) || fullText.includes(formattedAmount1) || fullText.includes(formattedAmount2) || fullText.includes(formattedAmount3));
      if (isMatch) {
        try {
          const updated = await prisma.registration.update({
            where: { id: reg.id },
            data: { paymentStatus: "paid" },
          });
          if (updated.whatsappNumber) {
            const result = await sendWhatsAppTemplate(
              updated.whatsappNumber,
              updated.name,
              updated.club,
              updated.id,
              "rotary_payment_confirmation"
            );
            if (!result.success) {
              errors.push(`WA dispatch failed for ${updated.name}: ${result.error}`);
            }
          }
          matchedCount++;
        } catch (e: any) {
          errors.push(`Failed to update ${reg.name}: ${e.message}`);
        }
      }
    }
    return NextResponse.json({ 
      success: true, 
      matched: matchedCount,
      totalPending: pendingRegistrations.length,
      errors 
    });
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    return NextResponse.json(
      { error: "Failed to process bank statement: " + error.message },
      { status: 500 }
    );
  }
}
