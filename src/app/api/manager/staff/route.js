const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function GET() {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const staff = await db.staffMember.findMany({
    where: { restaurantId: manager.restaurantId },
    orderBy: { empCode: "asc" },
  });
  return NextResponse.json({ staff });
}

async function POST(request) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { empCode, name, department, salary } = body;
  if (!empCode || !name || !department || !salary) {
    return NextResponse.json({ error: "Employee ID, name, department, and salary are all required." }, { status: 400 });
  }

  try {
    const member = await db.staffMember.create({
      data: {
        restaurantId: manager.restaurantId,
        empCode: String(empCode).trim(),
        name,
        department,
        salary: parseFloat(salary),
      },
    });
    return NextResponse.json({ ok: true, member });
  } catch (err) {
    return NextResponse.json({ error: "That employee ID is already in use." }, { status: 409 });
  }
}

module.exports = { GET, POST };
