# Servora — Smart Restaurant Management & QR Dining System

Servora is a modern full-stack B2B SaaS platform engineered for restaurants and cafés across Pakistan. Diners scan a single tabletop QR code to select their table, explore the culinary menu, order food with real-time status tracking, connect to guest Wi-Fi, play multiplayer table games, and build dining streaks for loyalty rewards. Restaurant staff operate dedicated real-time portals (Kitchen KDS and Waiter Floor Command), while owners manage the establishment through a comprehensive analytics dashboard.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017/servora` (or configure `MONGODB_URI` in `.env.local`)

### 2. Installation & Database Seeding

```bash
# 1. Navigate to the project directory
cd /Users/abdullah/Desktop/b.project/servora

# 2. Seed database with Café Lahore demo data (categories, dishes, staff, loyalty rules, demo customer)
npm run seed

# 3. Start local development server (binds to 0.0.0.0 for LAN phone testing)
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)** (auto-redirects to `/login`).

---

## 🔑 Demo Credentials & Fast-Fills

The login screen features **1-Click Demo Fast-Fill** buttons for immediate presentation testing without typing credentials:

| Portal | Role | Email | Password | Direct URL |
| :--- | :--- | :--- | :--- | :--- |
| **Owner Dashboard** | Manager / Owner | `owner@cafelahore.pk` | `admin123` | `http://localhost:3000/dashboard` |
| **Waiter Command** | Floor Captain | `waiter@cafelahore.pk` | `waiter123` | `http://localhost:3000/waiter` |
| **Kitchen KDS** | Head Chef | `kitchen@cafelahore.pk` | `kitchen123` | `http://localhost:3000/kitchen` |
| **Diner Portal** | Customer / Guest | `demo@servora.pk` | *(One-click sign-in)* | `http://localhost:3000/r/cafe-lahore` |

---

## 📱 Mobile Phone & LAN Wi-Fi Testing

To test the mobile diner experience directly on a physical smartphone:
1. Ensure your smartphone and Mac are connected to the same Wi-Fi network.
2. Find your Mac's LAN IP address by running:
   ```bash
   ipconfig getifaddr en0
   # Example: 192.168.10.15
   ```
3. Set `NEXT_PUBLIC_APP_URL` in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://192.168.10.15:3000
   ```
4. Restart `npm run dev`. Open `http://192.168.10.15:3000/dashboard/qr` on your computer screen, and scan the QR code with your smartphone camera!

---

## 🎬 University Presentation Demo Walkthrough (5-Minute Script)

### Step 1: Customer Scans QR & Picks Table
1. Open `http://localhost:3000/r/cafe-lahore` in a mobile viewport or phone.
2. Tap **Table 4**. Notice the top header now permanently badges **T-4**.
3. Tap **Browse Menu**. Filter categories (Karahi, BBQ, Rice, Desserts) or search `"Shinwari"`.
4. Add **Chicken Shinwari Karahi** and **Garlic Naan** to cart.
5. Tap the floating bottom cart bar (**View Cart**).

### Step 2: Dining Streak & Loyalty Demo
1. On the cart screen, notice the Guest/Loyalty section.
2. Enter `demo@servora.pk` ("Demo Customer") or click the Profile icon -> fast-fill demo customer.
3. *Context for presentation*: Demo Customer has **1 prior visit** seeded from 3 days ago. The restaurant rule requires **2 visits within 30 days** to earn a free **Peshawari Kulfa**.
4. Tap **Confirm Order**. You are redirected to `/r/cafe-lahore/order/[id]` with real-time status: **Order Received**.

### Step 3: Kitchen Prepares Food (KDS Screen)
1. Open a second tab at `http://localhost:3000/kitchen` (logged in as Kitchen).
2. The Table 4 ticket appears under **New Orders** with a live elapsed time counter.
3. Click **Start Cooking** -> moves to **Cooking in Wok** (blue column).
4. Click **Ready for Pickup** -> moves to **Ready at Counter** (green column).
5. Notice that back on the customer's phone tab, the progress stepper automatically advances to **Dishes are Ready**!

### Step 4: Floor Captain Delivers & Rewards Streak
1. Open a third tab at `http://localhost:3000/waiter` (logged in as Waiter).
2. Under the **Kitchen Pickups** tab, Table 4's order is waiting.
3. Click **Delivered & Mark Served**.
4. Because this is the 2nd visit for `demo@servora.pk`, the system automatically triggers the loyalty engine and generates an 8-character voucher code (e.g., `GIFT8842`)!
5. On the customer's phone, open `/r/cafe-lahore/account` -> the customer sees **2 / 2 Visits** completed, and their active voucher is displayed!

### Step 5: Tabletop Amenities & Value-Add
1. **Free Wi-Fi**: Tap **Free Wi-Fi** on customer header -> instant one-click copy of guest password (`lahore123`).
2. **Entertainment Hub**: Tap **Play Games** -> Play 2-player **Tic-Tac-Toe**, **Food Memory Match**, or the 10-question **Desi Trivia Quiz**.
3. **Service Calls**: Tap floating **Need help? Call Waiter** -> tap **Need Water** or **Request Bill**. Watch it chime on the Waiter tab immediately!
4. **Voucher Redemption**: Waiter opens **Redeem Voucher** tab -> types `GIFT8842` -> sees customer name and marks it redeemed!

---

## 🏛 Architecture & Tech Stack

- **Framework**: Next.js 14 App Router (React 18 + TypeScript)
- **Styling**: Tailwind CSS with custom tokens from `DESIGN.md` (warm terracotta `#F97316`, dark roast `#3B2A20`, emerald success, Plus Jakarta Sans, Material Symbols Outlined)
- **Database**: MongoDB with Mongoose (strictly multi-tenant scoped by `restaurantId`)
- **Authentication**: Dual Iron-Session (`servora_staff` and `servora_customer` cookies)
- **Real-time Operations**: Server-Sent Events (SSE) with `ReadableStream` registry and auto-reconnect fallback
- **File Uploads**: Native `FormData` processing with mime-type validation and safe disk storage
