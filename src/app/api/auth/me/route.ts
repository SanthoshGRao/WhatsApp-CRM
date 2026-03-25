import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  void request;
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, admin });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
