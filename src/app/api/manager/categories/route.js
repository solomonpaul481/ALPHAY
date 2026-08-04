const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function POST(request) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, isVeg, isNonVeg } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  const trimmedName = name.trim();
  const existing = await db.category.findFirst({
    where: {
      restaurantId: manager.restaurantId,
      name: { equals: trimmedName, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json({ error: `Category "${trimmedName}" already exists.` }, { status: 409 });
  }

  const category = await db.category.create({
    data: {
      restaurantId: manager.restaurantId,
      name: trimmedName,
      isVeg: isVeg === true,
      isNonVeg: isNonVeg === true,
    },
  });
  return NextResponse.json({ ok: true, category });
}

module.exports = { POST };
