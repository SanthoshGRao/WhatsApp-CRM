import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile");
    if (!mobile) {
      return NextResponse.json({ error: "Mobile number required" }, { status: 400 });
    }
    const existingRegistration = await prisma.registration.findFirst({
      where: { mobile },
    });
    return NextResponse.json({ exists: !!existingRegistration });
  } catch (error) {
    console.error("Mobile check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
