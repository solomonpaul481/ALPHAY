const QRCode = require("qrcode");
const { getManagerSession } = require("@/lib/manager-auth");

function appUrl(path) {
  let base = process.env.APP_URL;
  if (!base && process.env.VERCEL_URL) {
    base = `https://${process.env.VERCEL_URL}`;
  }
  if (!base) {
    base = "http://localhost:3000";
  }
  base = base.trim().replace(/\/+$/, "");
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${formattedPath}`;
}

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const type = searchParams.get("type");

  const isParcelReq =
    type === "parcel" ||
    String(table).trim().toUpperCase() === "PARCEL" ||
    String(table).trim().toUpperCase() === "P";

  let targetUrl = appUrl(`/r/${manager.restaurantId}`);
  if (isParcelReq) {
    targetUrl = appUrl(`/r/${manager.restaurantId}?type=parcel&table=PARCEL`);
  } else if (table) {
    targetUrl = appUrl(`/r/${manager.restaurantId}?table=${encodeURIComponent(table.trim())}`);
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
