const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function GET(request, { params }) {
  const { restaurantId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json(
      { error: "session_required", message: "Please verify your table to view the menu." },
      { status: 401 }
    );
  }

  const items = await db.menuItem.findMany({
    where: { restaurantId },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  const shape = (i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    price: i.price,
    prepTimeMinutes: i.prepTimeMinutes,
    isVeg: i.isVeg,
    isAvailable: i.isAvailable,
    imageUrl: i.imageUrl,
    badges: i.badges ? i.badges.split(",") : [],
    category: i.category.name,
  });

  const todaysSpecial = items.filter((i) => i.isTodaysSpecial && i.isAvailable).map(shape);
  const recommended = items.filter((i) => i.isRecommended && i.isAvailable).map(shape);
  const popular = items.filter((i) => i.isPopular && i.isAvailable).map(shape);

  const groupByCategory = (list) => {
    const grouped = {};
    for (const i of list) {
      const catName = i.category.name;
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(shape(i));
    }
    return grouped;
  };

  // Category section logic:
  // If both isVeg and isNonVeg are false (or both true), category appears in BOTH sections!
  const vegItems = items.filter((i) => {
    const cat = i.category;
    const isBoth = (cat.isVeg === false && cat.isNonVeg === false) || (cat.isVeg === true && cat.isNonVeg === true);
    if (isBoth) return true;
    if (cat.isVeg) return true;
    return i.isVeg;
  });

  const nonVegItems = items.filter((i) => {
    const cat = i.category;
    const isBoth = (cat.isVeg === false && cat.isNonVeg === false) || (cat.isVeg === true && cat.isNonVeg === true);
    if (isBoth) return true;
    if (cat.isNonVeg) return true;
    return !i.isVeg;
  });

  const veg = groupByCategory(vegItems);
  const nonVeg = groupByCategory(nonVegItems);

  return NextResponse.json({
    tableNumber: session.table.number,
    restaurantName: session.restaurant.name,
    todaysSpecial,
    recommended,
    popular,
    veg,
    nonVeg,
  });
}

module.exports = { GET };
