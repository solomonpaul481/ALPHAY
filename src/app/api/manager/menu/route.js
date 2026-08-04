const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function GET() {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await db.menuItem.findMany({
    where: { restaurantId: manager.restaurantId },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });
  const categories = await db.category.findMany({
    where: { restaurantId: manager.restaurantId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      prepTimeMinutes: i.prepTimeMinutes,
      isVeg: i.isVeg,
      isAvailable: i.isAvailable,
      imageUrl: i.imageUrl,
      categoryId: i.categoryId,
      categoryName: i.category.name,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      isVeg: c.isVeg,
      isNonVeg: c.isNonVeg,
    })),
  });
}

async function POST(request) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, price, categoryId, description, prepTimeMinutes, isVeg, imageUrl } = body;

  if (!name || !price || !categoryId) {
    return NextResponse.json({ error: "Item name, price, and category are required." }, { status: 400 });
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category || category.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const item = await db.menuItem.create({
    data: {
      restaurantId: manager.restaurantId,
      categoryId,
      name,
      description: description || "",
      price: parseFloat(price),
      prepTimeMinutes: parseInt(prepTimeMinutes, 10) || 15,
      isVeg: isVeg !== false,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({ ok: true, item });
}

module.exports = { GET, POST };
