import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const filterStatus = searchParams.get("status") || "";
    const filterZone = searchParams.get("zone") || "";
    const filterClub = searchParams.get("club") || "";
    const filterCategory = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { club: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search } },
            { registrationId: { contains: search, mode: "insensitive" } },
            { zone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    if (filterStatus) where.paymentStatus = filterStatus;
    if (filterZone) where.zone = filterZone;
    if (filterClub) where.club = filterClub;
    if (filterCategory) where.category = filterCategory;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          messageLogs: {
            orderBy: { sentAt: "desc" },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registration.count({ where }),
    ]);

    // Get aggregate stats
    const stats = await prisma.registration.aggregate({
      _count: { id: true },
      _sum: {
        pax: true,
        vegCount: true,
        nvegCount: true,
        amount: true,
      },
    });

    return NextResponse.json({
      registrations: registrations.map((r) => ({
        ...r,
        whatsappStatus: getMessageStatus(r.messageLogs, "whatsapp"),
        emailStatus: getMessageStatus(r.messageLogs, "email"),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRegistrations: stats._count.id,
        totalPax: stats._sum.pax || 0,
        totalVeg: stats._sum.vegCount || 0,
        totalNveg: stats._sum.nvegCount || 0,
        totalRevenue: stats._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Registrations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

function getMessageStatus(
  logs: { type: string; status: string; errorMessage: string | null }[],
  type: string
) {
  const log = logs.find((l) => l.type === type);
  if (!log) return { status: "not_sent", error: null };
  return { status: log.status, error: log.errorMessage };
}
