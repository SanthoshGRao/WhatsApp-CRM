import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.registration.aggregate({
      _sum: { pax: true }
    });
    const count = result._sum.pax || 0;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Count api error:", error);
    return NextResponse.json({ count: 0 });
  }
}
