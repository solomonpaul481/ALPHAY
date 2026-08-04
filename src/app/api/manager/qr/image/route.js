const QRCode = require("qrcode");
const { getManagerSession } = require("@/lib/manager-auth");

function appUrl(path) {
  return `${process.env.APP_URL || "http://localhost:3000"}${path}`;
}

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const type = searchParams.get("type");

  let targetUrl = appUrl(`/r/${manager.restaurantId}`);
  if (table) {
    targetUrl = appUrl(`/r/${manager.restaurantId}?table=${encodeURIComponent(table.trim())}`);
  } else if (type === "parcel") {
    targetUrl = appUrl(`/r/${manager.restaurantId}?table=PARCEL`);
  }

  const buffer = await QRCode.toBuffer(targetUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#1C1524", light: "#FFFFFF" },
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": table ? `inline; filename="qr-table-${table}.png"` : 'inline',
    },
  });
}

module.exports = { GET };
