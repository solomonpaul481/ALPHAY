# ALPHAX — Restaurant Self-Ordering Platform

A real, working Next.js app covering all three portals from the brief, sharing
one database, structured as a hierarchy — an order flows up from the
customer to the restaurant that fulfills it, and every restaurant rolls up
into the platform that oversees it:

```
   Customer Portal        places an order
          │
          ▼
   Manager Portal         fulfills it, for one restaurant
          │
          ▼
   Admin Portal (ALPHAX)  oversees every restaurant on the platform
```

- **Customer Portal** (`/r/<restaurantId>`) — QR → menu → cart → Razorpay
  payment → live tracking
- **Manager Portal** (`/manager`) — live orders, analytics, menu, QR/tables,
  staff, for one restaurant
- **Admin Portal / ALPHAX** (`/admin`) — every restaurant on the platform:
  onboarding, analytics, status, billing

They're one Next.js project rather than three, because orders the customer
app creates need to show up live in the Manager Portal, and Manager data
needs to roll up into Admin analytics — that only works cleanly against a
single shared schema.

## Stack

- **Next.js 14** (App Router) — pages + API routes in one project
- **Prisma + SQLite** for dev (swap to Postgres/MySQL for production — one line change)
- **Razorpay** Node SDK — order creation + webhook signature verification
- **Google OAuth 2.0** (hand-rolled, no extra library) — Admin sign-in
- **bcryptjs** — Manager password hashing
- **Tailwind CSS**, **Framer Motion**, **Recharts** (analytics), **qrcode** (QR generation)
- Plain JavaScript (no TypeScript), to keep the codebase approachable

## 1. Install

```bash
npm install          # also runs `prisma generate` automatically
cp .env.example .env # then fill in the values below
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Leave as `file:./dev.db` for local dev |
| `SESSION_SECRET` | Any long random string, e.g. `openssl rand -hex 32` |
| `APP_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials (see step 3) |
| `ADMIN_ALLOWED_EMAILS` | Optional comma-separated allowlist. Leave unset in dev to let any Google account sign in as admin |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys (use **Test Mode** while developing) |
| `RAZORPAY_WEBHOOK_SECRET` | A secret string you choose yourself — enter the same one in the Razorpay Dashboard later |

## 2. Set up the database

```bash
npx prisma migrate dev --name init   # creates dev.db and every table
npm run seed                         # sample restaurant, menu, manager login, 90 days of orders
```

The seed script prints:
- The restaurant's ID — that's the `[restaurantId]` in customer URLs
- A **manager login**: `manager@paradise.alphax.demo` / `paradise123`
- A second, suspended restaurant ("Pista House") so the Admin Portal has more
  than one row to look at
- ~90 days of realistic order history, so Analytics isn't empty on first run

## 3. Set up Google sign-in (Admin Portal only)

The brief requires Google sign-in for the Admin Portal specifically (not the
Manager Portal, which uses the email/password login above).

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID** → Application type: **Web application**
3. Authorized redirect URI: `http://localhost:3000/api/admin/auth/google/callback`
4. Copy the Client ID / Secret into `.env`

Any Google account can sign in as an admin by default in development. Set
`ADMIN_ALLOWED_EMAILS` in `.env` to restrict this once you're past local dev.

## 4. Run it

```bash
npm run dev
```

- **Landing page**: `http://localhost:3000` — links to all three portals
- **Customer**: `http://localhost:3000/r/<restaurantId>` (the seed script prints this)
- **Manager**: `http://localhost:3000/manager/login`
- **Admin**: `http://localhost:3000/admin/login`

**Geolocation note:** the seeded restaurant's coordinates are a placeholder in
`prisma/seed.js`. Update them to your real location (or your browser's
location) before testing table check-in, or you'll always be "outside" the
150 m geofence. Browsers only allow geolocation over `https://` or
`localhost`, so local testing is fine.

## 5. Test real payments end-to-end

Razorpay Checkout works immediately in test mode — but the **webhook** (the
only thing allowed to actually confirm an order) needs a public URL, since
Razorpay's servers call it directly. Locally, use a tunnel:

```bash
npx ngrok http 3000
```

Then in the Razorpay Dashboard → **Settings → Webhooks**:
- URL: `https://<your-ngrok-subdomain>.ngrok.app/api/webhooks/razorpay`
- Secret: the same string you put in `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured` and `payment.failed`

Use [Razorpay's test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
to pay. Within a couple of seconds the webhook fires, the order flips to
`CONFIRMED`, and:
- the customer's payment-processing screen (which is polling) moves to success
- the order appears live on the **Manager dashboard**, ready to be advanced
  through Preparing → Ready → Served — which the customer's tracking screen
  picks up in real time too

## How the payment security model works

1. Cart → **Payment** page creates a draft `Order` (status `PENDING_PAYMENT`)
   and a matching Razorpay order, pricing everything from the database —
   never from numbers the browser sends.
2. Razorpay Checkout opens. There is no "I Paid" / "Payment Done" button
   anywhere in this codebase — the browser can only *attempt* a payment, never
   assert that one succeeded.
3. When Checkout's own success callback fires, the app does **not** mark
   anything paid — it just navigates to a "Checking Payment…" screen that
   polls the order's status.
4. Razorpay's servers call `POST /api/webhooks/razorpay` directly with a
   signed payload. Only after that signature is verified server-side
   (`src/lib/razorpay.js` → `verifyWebhookSignature`) does the order become
   `CONFIRMED`. This is the one and only place an order is marked paid.
5. The polling screen picks up the status change and moves to Success or Failure.
6. From `CONFIRMED` onward, only an authenticated **manager** can advance the
   order (`Preparing → Ready → Served`) — there's no customer-facing or
   unauthenticated way to change kitchen status.

## Auth model, portal by portal

| Portal | Method | Session cookie | Notes |
|---|---|---|---|
| Customer | Table check-in (geofence-gated) | `alphax_session` | No password — presence at the restaurant is the credential |
| Manager | Email + password (bcrypt) | `alphax_manager_session` | One manager account per restaurant in this seed; scale to many by adding rows to `Manager` |
| Admin | Google OAuth 2.0 | `alphax_admin_session` | First-ever sign-in auto-creates the `AdminUser` row (or is rejected if `ADMIN_ALLOWED_EMAILS` is set and doesn't include them) |

Admins can also open any restaurant's Manager Portal directly from
**Admin → Restaurants → "Manager Portal"** — this signs an ordinary manager
session token for that restaurant server-side, without ever seeing or needing
that manager's password (`/api/admin/restaurants/[id]/impersonate`).

## Project structure

```
prisma/schema.prisma          Restaurant, Manager, StaffMember, AdminUser,
                               Order, MenuItem, etc.
prisma/seed.js                 Sample data for all three portals

src/lib/
  db.js                        Prisma client singleton
  session.js, get-session.js   Customer table-session cookie (JWT)
  manager-auth.js               Manager session cookie (JWT) + password check
  admin-auth.js                 Admin session cookie (JWT)
  google-oauth.js               Minimal Google OAuth 2.0 client
  geolocation.js                 Haversine distance + geofence check
  razorpay.js                    Order creation + checkout/webhook signature verification
  analytics.js                   Shared day/month/year revenue aggregation
  cart-context.jsx               Client-side cart (React state + sessionStorage)
  api-client.js                  Thin fetch wrapper for customer API routes

src/app/api/
  r/[restaurantId]/...           Customer-facing endpoints (session, menu,
                                  orders, staff-call, rating)
  webhooks/razorpay/              The authoritative payment webhook
  manager/...                     Manager-only endpoints (all scoped to the
                                  logged-in manager's restaurant)
  admin/...                       Admin-only endpoints (platform-wide)

src/app/r/[restaurantId]/         Customer flow — Steps 1–14 from the brief
src/app/manager/
  login/                          Manager login
  (app)/dashboard, analytics,
        menu, qr, staff/          Protected Manager Portal pages
src/app/admin/
  login/                          Admin Google sign-in
  (app)/dashboard, analytics,
        restaurants, transactions/ Protected Admin Portal pages

src/components/                  Customer UI (FoodCard, Timeline, TicketCard…)
src/components/dashboard/        Shared Manager/Admin UI (Sidebar, StatCard,
                                  RevenueBarChart, FullscreenButton…)
```

## Design notes

- Palette: purple (`#6D28D9`, as specified) plus a deep-basil veg green and
  brick-red non-veg accent — deliberately not the stock traffic-light
  green/red so the veg/non-veg system reads as part of the same premium
  palette rather than a bolted-on convention. The dashboard portals reuse the
  same palette and type system as the customer app, so the brand is
  consistent across all three surfaces.
- Type: **Fraunces** (display) + **Manrope** (UI/body) + **IBM Plex Mono**
  for anything numeric that should read like a printed ticket: order
  numbers, queue tokens, transaction IDs, prices, employee IDs.
- Signature element: order confirmation, tracking, and the queue token use a
  scalloped "kitchen ticket" edge (`.ticket-edge-bottom` in `globals.css`),
  echoing a torn paper order slip — used nowhere else so it stays a
  signature rather than a decoration. The same ticket divider reappears on
  the Manager dashboard's live order cards, tying kitchen operations back to
  the same motif.
- **Veg/Non-Veg is a toggle, not two stacked sections.** Top-right of the
  menu header, default **off** (non-veg/red theme). Flipping it swaps the
  category chips, the Today's Special/Recommended/Popular rows, and the menu
  itself over to veg/green — the whole page follows the toggle, not just the
  item list (`src/components/VegToggle.jsx`,
  `src/app/r/[restaurantId]/menu/page.jsx`).

## What's simplified (and how to harden it for production)

- **One Razorpay account for every restaurant.** A real multi-restaurant
  rollout would use [Razorpay Route](https://razorpay.com/docs/route/) to
  split each payment to the right restaurant's own account automatically.
- **Billing is a snapshot, not a ledger.** `Restaurant.billingDueDate` /
  `billingStatus` hold the *current* cycle only, matching the brief's sample
  table. A production system would want a proper `Invoice` history model.
- **"Send Reminder" just timestamps.** Wire `POST /api/admin/transactions/[id]/remind`
  up to a real email/SMS provider (Postmark, Twilio, etc.) when you're ready.
- **Geolocation is a friction control, not a security boundary.** Browser
  coordinates aren't cryptographically verifiable — a customer could spoof
  them. It stops the common case (ordering from home), not a determined bad
  actor.
- **Live updates are polling, not push.** The Manager dashboard polls every
  6s and the customer tracking screen every 4s — simple and reliable, but a
  websocket/SSE layer would feel snappier at real scale.
- **One manager per restaurant out of the box.** The schema already supports
  many (`Manager.restaurantId` isn't unique) — insert more rows, or extend
  the Manager Portal with its own "invite a co-manager" flow.
- **New managers get a temporary password an admin sets by hand.** There's
  no email-delivery or forced-reset-on-first-login flow yet — Admin →
  Restaurants → Add Restaurant just shows the credentials once, to be shared
  securely. Wire up an email provider and a "change password" page in the
  Manager Portal to close this loop properly.
