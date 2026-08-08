const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;
  const existingCategory = await db.category.findUnique({ where: { id } });
  if (!existingCategory || existingCategory.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, isVeg, isNonVeg } = body;

  const dataToUpdate = {};
  if (typeof name === "string") {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Category name cannot be empty." }, { status: 400 });
    }

    // Check if name is taken by another category in the same restaurant
    const duplicate = await db.category.findFirst({
      where: {
        restaurantId: manager.restaurantId,
        id: { not: id },
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: `Category "${trimmedName}" already exists.` }, { status: 409 });
    }

    dataToUpdate.name = trimmedName;
  }

  if (typeof isVeg === "boolean") dataToUpdate.isVeg = isVeg;
  if (typeof isNonVeg === "boolean") dataToUpdate.isNonVeg = isNonVeg;

  const updatedCategory = await db.category.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({ ok: true, category: updatedCategory });
}

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category || category.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  // Delete linked menu items first to maintain referential integrity
  await db.menuItem.deleteMany({
    where: { categoryId: id },
  });

  // Delete category
  await db.category.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
