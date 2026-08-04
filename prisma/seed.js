const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Sample coordinates — Hyderabad. Replace with the real restaurant location.
const RESTAURANT_LAT = 17.4239;
const RESTAURANT_LNG = 78.4738;

const MANAGER_EMAIL = "manager@paradise.alphay.demo";
const MANAGER_PASSWORD = "paradise123";

async function main() {
  console.log("Seeding ALPHAY sample data...");

  await prisma.rating.deleteMany();
  await prisma.staffCallRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Paradise Biryani",
      logoUrl: "/logo.svg",
      latitude: 17.583506,
      longitude: 79.758944,
      geofenceRadiusMeters: 150,
      gstPercent: 5,
      status: "ACTIVE",
      commissionPercent: 5,
      billingDueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      billingStatus: "ACTIVE",
    },
  });

  const tableNumbers = ["1", "2", "3", "4", "5", "6", "7", "8"];
  for (const n of tableNumbers) {
    await prisma.diningTable.create({
      data: { restaurantId: restaurant.id, number: n },
    });
  }
  await prisma.diningTable.create({
    data: { restaurantId: restaurant.id, number: "PARCEL", isParcelCounter: true },
  });

  // ---- Categories ----
  const cat = async (name, isVeg, sortOrder) =>
    prisma.category.create({
      data: { restaurantId: restaurant.id, name, isVeg, sortOrder },
    });

  const vegStarters = await cat("Starters", true, 1);
  const vegCurries = await cat("Curries", true, 2);
  const vegNaan = await cat("Naan", true, 3);
  const vegDesserts = await cat("Desserts", true, 4);
  const vegDrinks = await cat("Drinks", true, 5);

  const nonVegStarters = await cat("Starters", false, 1);
  const nonVegBiryani = await cat("Biryani", false, 2);
  const nonVegCurries = await cat("Curries", false, 3);
  const nonVegBBQ = await cat("BBQ", false, 4);
  const nonVegDrinks = await cat("Drinks", false, 5);

  // ---- Menu items ----
  const item = (data) => prisma.menuItem.create({ data: { restaurantId: restaurant.id, ...data } });

  await item({
    categoryId: nonVegBiryani.id,
    name: "Chicken Dum Biryani",
    description: "Authentic Hyderabadi dum biryani, slow-cooked with saffron and fried onions.",
    price: 299,
    prepTimeMinutes: 30,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600",
    badges: "BEST_SELLER",
    isTodaysSpecial: true,
    isPopular: true,
    sortOrder: 1,
  });
  await item({
    categoryId: nonVegBiryani.id,
    name: "Mutton Dum Biryani",
    description: "Tender mutton layered with long-grain basmati and warm spices.",
    price: 349,
    prepTimeMinutes: 40,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1633945274309-2846d9de6698?w=600",
    badges: "CHEF_SPECIAL",
    isTodaysSpecial: true,
    sortOrder: 2,
  });
  await item({
    categoryId: nonVegStarters.id,
    name: "Chicken 65",
    description: "Deep-fried Chicken chunks tossed in curry leaves and red chilli.",
    price: 219,
    prepTimeMinutes: 20,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600",
    badges: "SPICY",
    isPopular: true,
    sortOrder: 1,
  });
  await item({
    categoryId: nonVegBBQ.id,
    name: "Tandoori Chicken (Half)",
    description: "Char-grilled chicken marinated overnight in yoghurt and spices.",
    price: 259,
    prepTimeMinutes: 25,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1610057099431-d73a1c9d8723?w=600",
    badges: "CHEF_SPECIAL",
    sortOrder: 1,
  });
  await item({
    categoryId: nonVegBBQ.id,
    name: "Chicken Seekh Kebab",
    description: "Minced chicken skewers, char-grilled with ginger, garlic, and garam masala.",
    price: 239,
    prepTimeMinutes: 20,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600",
    badges: "SPICY",
    sortOrder: 2,
  });
  await item({
    categoryId: nonVegCurries.id,
    name: "Butter Chicken",
    description: "Roasted chicken simmered in a velvety tomato-butter gravy.",
    price: 289,
    prepTimeMinutes: 25,
    isVeg: false,
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600",
    isRecommended: true,
    sortOrder: 1,
  });
  await item({
    categoryId: nonVegDrinks.id,
    name: "Masala Buttermilk",
    description: "Chilled spiced buttermilk with curry leaf and ginger.",
    price: 59,
    prepTimeMinutes: 5,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600",
    sortOrder: 1,
  });

  await item({
    categoryId: vegStarters.id,
    name: "Paneer Tikka",
    description: "Smoky char-grilled cottage cheese with bell peppers and onions.",
    price: 229,
    prepTimeMinutes: 20,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600",
    badges: "CHEF_SPECIAL",
    isPopular: true,
    sortOrder: 1,
  });
  await item({
    categoryId: vegCurries.id,
    name: "Dal Makhani",
    description: "Black lentils slow-simmered overnight with cream and butter.",
    price: 189,
    prepTimeMinutes: 15,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1626777553635-be352fc8f5ec?w=600",
    badges: "HEALTHY",
    isRecommended: true,
    sortOrder: 1,
  });
  await item({
    categoryId: vegCurries.id,
    name: "Paneer Butter Masala",
    description: "Cottage cheese cubes in a rich, mildly sweet tomato gravy.",
    price: 219,
    prepTimeMinutes: 20,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600",
    isTodaysSpecial: true,
    sortOrder: 2,
  });
  await item({
    categoryId: vegNaan.id,
    name: "Butter Naan",
    description: "Tandoor-baked leavened bread, brushed with butter.",
    price: 49,
    prepTimeMinutes: 10,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
    isPopular: true,
    sortOrder: 1,
  });
  await item({
    categoryId: vegDesserts.id,
    name: "Gulab Jamun (2 pc)",
    description: "Soft milk dumplings soaked in cardamom-rose syrup.",
    price: 79,
    prepTimeMinutes: 5,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1601303516534-bf0aac72f7f3?w=600",
    sortOrder: 1,
  });
  await item({
    categoryId: vegDrinks.id,
    name: "Sweet Lassi",
    description: "Thick chilled yoghurt drink, lightly sweetened.",
    price: 69,
    prepTimeMinutes: 5,
    isVeg: true,
    imageUrl: "https://images.unsplash.com/photo-1626200926749-1877088cf40f?w=600",
    isPopular: true,
    sortOrder: 1,
  });

  // ---- Manager account ----
  const passwordHash = await bcrypt.hash(MANAGER_PASSWORD, 10);
  await prisma.manager.create({
    data: {
      restaurantId: restaurant.id,
      name: "Ravi Shankar",
      email: MANAGER_EMAIL,
      passwordHash,
    },
  });

  // ---- Staff ----
  const staffRoster = [
    { empCode: "111", name: "John", department: "KITCHEN", salary: 18000 },
    { empCode: "112", name: "Mary", department: "CLEANING", salary: 12000 },
    { empCode: "113", name: "Arjun", department: "SERVICE", salary: 15000 },
    { empCode: "114", name: "Priya", department: "MANAGEMENT", salary: 26000 },
  ];
  for (const s of staffRoster) {
    await prisma.staffMember.create({ data: { restaurantId: restaurant.id, ...s } });
  }

  // ---- A second restaurant, suspended, so the Admin Portal has more than
  // one row to show (matches the sample data in the brief). ----
  const pistaHouse = await prisma.restaurant.create({
    data: {
      name: "Pista House",
      logoUrl: "/logo.svg",
      latitude: RESTAURANT_LAT + 0.01,
      longitude: RESTAURANT_LNG + 0.01,
      gstPercent: 5,
      status: "SUSPENDED",
      commissionPercent: 5,
      billingDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      billingStatus: "OVERDUE",
    },
  });
  await prisma.diningTable.create({ data: { restaurantId: pistaHouse.id, number: "1" } });

  // ---- Historical + live orders, so Analytics/Dashboards aren't empty ----
  const allItems = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
  const dummySession = await prisma.customerSession.create({
    data: {
      restaurantId: restaurant.id,
      tableId: (await prisma.diningTable.findFirst({ where: { restaurantId: restaurant.id, isParcelCounter: false } })).id,
      token: `seed-session-${Date.now()}`,
      latitude: RESTAURANT_LAT,
      longitude: RESTAURANT_LNG,
      distanceMeters: 10,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  const tables = await prisma.diningTable.findMany({ where: { restaurantId: restaurant.id, isParcelCounter: false } });

  function randomItems() {
    const count = 1 + Math.floor(Math.random() * 3);
    const picked = [];
    for (let i = 0; i < count; i++) {
      const item = allItems[Math.floor(Math.random() * allItems.length)];
      picked.push({ ...item, quantity: 1 + Math.floor(Math.random() * 2) });
    }
    return picked;
  }

  async function createSeedOrder(createdAt, status) {
    const picked = randomItems();
    const subtotal = picked.reduce((s, i) => s + i.price * i.quantity, 0);
    const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + gstAmount) * 100) / 100;
    const table = tables[Math.floor(Math.random() * tables.length)];
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        sessionId: dummySession.id,
        status,
        subtotal,
        gstAmount,
        total,
        razorpayOrderId: `seed_${Math.random().toString(36).slice(2)}`,
        razorpayPaymentId: `pay_seed_${Math.random().toString(36).slice(2)}`,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: picked.map((i) => ({
            menuItemId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
    });
  }

  // 90 days of history, a handful of served orders per day.
  const DAYS_OF_HISTORY = 90;
  for (let d = DAYS_OF_HISTORY; d >= 1; d--) {
    const ordersThatDay = 1 + Math.floor(Math.random() * 4);
    for (let o = 0; o < ordersThatDay; o++) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - d);
      createdAt.setHours(11 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      await createSeedOrder(createdAt, "SERVED");
    }
  }
  // A few completed orders earlier today, plus some still in the kitchen
  // right now so the Manager dashboard's live queue has something to show.
  for (let o = 0; o < 4; o++) {
    const createdAt = new Date();
    createdAt.setHours(9 + o, Math.floor(Math.random() * 60));
    await createSeedOrder(createdAt, "SERVED");
  }
  await createSeedOrder(new Date(Date.now() - 6 * 60 * 1000), "CONFIRMED");
  await createSeedOrder(new Date(Date.now() - 4 * 60 * 1000), "PREPARING");
  await createSeedOrder(new Date(Date.now() - 2 * 60 * 1000), "PREPARING");
  await createSeedOrder(new Date(Date.now() - 12 * 60 * 1000), "READY");

  console.log(`Seeded restaurant ${restaurant.name} (${restaurant.id})`);
  console.log(`Tables: ${tableNumbers.join(", ")}, PARCEL`);
  console.log(`Manager login: ${MANAGER_EMAIL} / ${MANAGER_PASSWORD}`);
  console.log(`Second restaurant (suspended): ${pistaHouse.name} (${pistaHouse.id})`);
  console.log(`Seeded ~${DAYS_OF_HISTORY} days of order history for analytics.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
