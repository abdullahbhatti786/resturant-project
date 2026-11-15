import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Relative imports for models
import Restaurant from "../src/models/Restaurant";
import User from "../src/models/User";
import Customer from "../src/models/Customer";
import MenuCategory from "../src/models/MenuCategory";
import MenuItem from "../src/models/MenuItem";
import Order from "../src/models/Order";
import ServiceRequest from "../src/models/ServiceRequest";
import Feedback from "../src/models/Feedback";
import Visit from "../src/models/Visit";
import Reward from "../src/models/Reward";
import QuizQuestion from "../src/models/QuizQuestion";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/servora";

async function seed() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  // Clean existing data for a fresh seed
  console.log("Cleaning old data...");
  await Promise.all([
    Restaurant.deleteMany({}),
    User.deleteMany({}),
    Customer.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    ServiceRequest.deleteMany({}),
    Feedback.deleteMany({}),
    Visit.deleteMany({}),
    Reward.deleteMany({}),
    QuizQuestion.deleteMany({}),
  ]);

  // 1. Create Restaurant
  console.log("Creating Restaurant: Cafe Lahore...");
  const restaurant = await Restaurant.create({
    name: "Café Lahore",
    slug: "cafe-lahore",
    logo: "/images/placeholder-logo.svg",
    address: "Gulberg III, Lahore • Branch #01",
    wifiName: "CafeLahore_Guest",
    wifiPassword: "karakchai123",
    tableCount: 20,
    enabledGames: {
      tictactoe: true,
      memory: true,
      quiz: true,
    },
    loyaltyRules: {
      requiredVisits: 2,
      withinDays: 30,
      giftDescription: "Free Peshawari Kulfa",
      rewardExpiryDays: 14,
    },
  });

  // 2. Create Staff Users
  console.log("Creating Staff accounts...");
  const ownerPass = await bcrypt.hash("admin123", 10);
  const waiterPass = await bcrypt.hash("waiter123", 10);
  const kitchenPass = await bcrypt.hash("kitchen123", 10);

  await User.create([
    {
      restaurantId: restaurant._id,
      name: "Tariq Malik (Owner)",
      email: "owner@cafelahore.pk",
      passwordHash: ownerPass,
      role: "owner",
      active: true,
    },
    {
      restaurantId: restaurant._id,
      name: "Salman Khan (Waiter)",
      email: "waiter@cafelahore.pk",
      passwordHash: waiterPass,
      role: "waiter",
      active: true,
    },
    {
      restaurantId: restaurant._id,
      name: "Chef Aslam (Kitchen)",
      email: "kitchen@cafelahore.pk",
      passwordHash: kitchenPass,
      role: "kitchen",
      active: true,
    },
  ]);

  // 3. Create Categories
  console.log("Creating Menu Categories...");
  const categories = await MenuCategory.create([
    { restaurantId: restaurant._id, name: "Starters & Appetizers", sortOrder: 1 },
    { restaurantId: restaurant._id, name: "Mains & Karahi", sortOrder: 2 },
    { restaurantId: restaurant._id, name: "Burgers & Wraps", sortOrder: 3 },
    { restaurantId: restaurant._id, name: "Chai & Beverages", sortOrder: 4 },
    { restaurantId: restaurant._id, name: "Traditional Desserts", sortOrder: 5 },
  ]);

  const [startersCat, mainsCat, burgersCat, drinksCat, dessertsCat] = categories;

  // 4. Create Menu Items
  console.log("Creating Menu Items...");
  const items = await MenuItem.create([
    {
      restaurantId: restaurant._id,
      categoryId: mainsCat._id,
      name: "Desi Ghee Chicken Karahi (Half)",
      description: "Rich simmered tomato gravy, fresh ginger juliennes, freshly ground spices in iron wok.",
      price: 1450,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["House Star", "Chef Special"],
      sortOrder: 1,
    },
    {
      restaurantId: restaurant._id,
      categoryId: mainsCat._id,
      name: "Mutton Shinwari Karahi (Full Wok)",
      description: "Tender mountain mutton cooked purely in animal fat, green chillies, and sea salt.",
      price: 2800,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Chef Special"],
      sortOrder: 2,
    },
    {
      restaurantId: restaurant._id,
      categoryId: mainsCat._id,
      name: "Special Dum Biryani (Chicken)",
      description: "Fragrant basmati rice, marinated succulent chicken leg, golden onions, with side mint raita.",
      price: 650,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Popular"],
      sortOrder: 3,
    },
    {
      restaurantId: restaurant._id,
      categoryId: mainsCat._id,
      name: "Beef Chapli Kabab (Peshawari)",
      description: "2 large pan-fried Peshawari kababs infused with pomegranate seeds, coriander, and tomato slice.",
      price: 950,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Signature"],
      sortOrder: 4,
    },
    {
      restaurantId: restaurant._id,
      categoryId: burgersCat._id,
      name: "Lahori Zinger Burger Combo",
      description: "Crispy double-fried spiced thigh, secret chipotle garlic mayo, served with crinkle fries.",
      price: 720,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Crispy Star"],
      sortOrder: 5,
    },
    {
      restaurantId: restaurant._id,
      categoryId: startersCat._id,
      name: "Chicken Tikka Boti Platter",
      description: "Skewered charbroiled boneless chicken chunks marinated in spicy yogurt with mint chutney.",
      price: 850,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["BBQ Special"],
      sortOrder: 6,
    },
    {
      restaurantId: restaurant._id,
      categoryId: startersCat._id,
      name: "Garlic Roghani Naan",
      description: "Freshly baked tandoori flatbread brushed with desi ghee, toasted sesame, and roasted garlic.",
      price: 120,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Tandoor Line"],
      sortOrder: 7,
    },
    {
      restaurantId: restaurant._id,
      categoryId: startersCat._id,
      name: "Loaded Masala Fries",
      description: "Crispy crinkle-cut fries drizzled with spicy garlic mayo, green jalapeños, and chaat masala.",
      price: 420,
      image: "/images/placeholder-food.svg",
      available: false, // OUT OF STOCK for demo
      tags: ["Snack"],
      sortOrder: 8,
    },
    {
      restaurantId: restaurant._id,
      categoryId: drinksCat._id,
      name: "Cardamom Karak Chai",
      description: "Slow-brewed creamy doodh patti simmered with whole green cardamom pods.",
      price: 180,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["House Favorite"],
      sortOrder: 9,
    },
    {
      restaurantId: restaurant._id,
      categoryId: drinksCat._id,
      name: "Traditional Shahi Lassi (Sweet)",
      description: "Thick Punjabi churned sweet yogurt topped with rich clotted malai and crushed pistachios.",
      price: 280,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Classic"],
      sortOrder: 10,
    },
    {
      restaurantId: restaurant._id,
      categoryId: drinksCat._id,
      name: "Mint Margarita",
      description: "Refreshing crushed ice cooler with fresh garden mint, Persian lime, and Himalayan black salt.",
      price: 250,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Chilled"],
      sortOrder: 11,
    },
    {
      restaurantId: restaurant._id,
      categoryId: dessertsCat._id,
      name: "Peshawari Kulfa with Falooda",
      description: "Artisanal slow-reduced saffron milk ice cream with rabri, rose syrup, and cornstarch noodles.",
      price: 350,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: ["Dessert Delight"],
      sortOrder: 12,
    },
  ]);

  // 5. Create Seeded Customers
  console.log("Creating Seeded Customers for Loyalty & Dashboard...");
  const demoCustomer = await Customer.create({
    restaurantId: restaurant._id,
    email: "demo@servora.pk",
    name: "Demo Customer",
    marketingConsent: true,
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  });

  const aliCustomer = await Customer.create({
    restaurantId: restaurant._id,
    email: "ali@gmail.com",
    name: "Ali Raza",
    marketingConsent: true,
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  });

  const sanaCustomer = await Customer.create({
    restaurantId: restaurant._id,
    email: "sana@yahoo.com",
    name: "Sana Ahmed",
    marketingConsent: false,
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  });

  // 6. Create Past Orders & Visits for Demo Flow
  console.log("Creating Past Orders, Visits, and Rewards...");
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const threeDaysAgoMidnight = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate());

  const demoOrder1 = await Order.create({
    restaurantId: restaurant._id,
    tableNumber: 5,
    customerId: demoCustomer._id,
    publicToken: crypto.randomUUID(),
    items: [
      {
        menuItemId: items[0]._id,
        name: items[0].name,
        price: items[0].price,
        quantity: 1,
        specialInstructions: "Less spicy please",
      },
      {
        menuItemId: items[6]._id,
        name: items[6].name,
        price: items[6].price,
        quantity: 2,
        specialInstructions: "",
      },
    ],
    total: 1690,
    status: "served",
    servedAt: threeDaysAgo,
    createdAt: threeDaysAgo,
  });

  // Demo Customer has 1 existing visit 3 days ago
  await Visit.create({
    restaurantId: restaurant._id,
    customerId: demoCustomer._id,
    orderId: demoOrder1._id,
    date: threeDaysAgoMidnight,
    createdAt: threeDaysAgo,
  });

  // Ali has 2 visits and an active reward
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  const aliOrder = await Order.create({
    restaurantId: restaurant._id,
    tableNumber: 8,
    customerId: aliCustomer._id,
    publicToken: crypto.randomUUID(),
    items: [
      { menuItemId: items[2]._id, name: items[2].name, price: items[2].price, quantity: 2 },
      { menuItemId: items[8]._id, name: items[8].name, price: items[8].price, quantity: 2 },
    ],
    total: 1660,
    status: "served",
    servedAt: oneDayAgo,
    createdAt: oneDayAgo,
  });

  await Visit.create([
    {
      restaurantId: restaurant._id,
      customerId: aliCustomer._id,
      orderId: aliOrder._id,
      date: new Date(fourDaysAgo.getFullYear(), fourDaysAgo.getMonth(), fourDaysAgo.getDate()),
      createdAt: fourDaysAgo,
    },
    {
      restaurantId: restaurant._id,
      customerId: aliCustomer._id,
      orderId: aliOrder._id,
      date: new Date(oneDayAgo.getFullYear(), oneDayAgo.getMonth(), oneDayAgo.getDate()),
      createdAt: oneDayAgo,
    },
  ]);

  // Seeded active reward for Ali
  await Reward.create({
    restaurantId: restaurant._id,
    customerId: aliCustomer._id,
    code: "GIFT8842",
    description: "Free Peshawari Kulfa",
    status: "active",
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdAt: oneDayAgo,
  });

  // 7. Seed Past Feedback
  console.log("Creating Seeded Feedback...");
  await Feedback.create([
    {
      restaurantId: restaurant._id,
      tableNumber: 5,
      customerId: demoCustomer._id,
      ratings: { food: 5, service: 5, cleanliness: 4, waitingTime: 4 },
      comment: "Desi Ghee Karahi was outstanding! Great ambience in Gulberg courtyard.",
      createdAt: threeDaysAgo,
    },
    {
      restaurantId: restaurant._id,
      tableNumber: 8,
      customerId: aliCustomer._id,
      ratings: { food: 4, service: 4, cleanliness: 5, waitingTime: 4 },
      comment: "Dum Biryani and Karak Chai are a staple. Keep it up!",
      createdAt: oneDayAgo,
    },
  ]);

  // 8. Seed Service Requests
  console.log("Creating Initial Service Requests...");
  await ServiceRequest.create([
    {
      restaurantId: restaurant._id,
      tableNumber: 4,
      type: "water",
      note: "Extra cold mineral water with glasses",
      status: "acknowledged",
    },
    {
      restaurantId: restaurant._id,
      tableNumber: 9,
      type: "bill",
      note: "Cash payment requested",
      status: "submitted",
    },
  ]);

  // 9. Seed 20 Quiz Questions
  console.log("Creating 20 Quiz Questions...");
  await QuizQuestion.create([
    // Pakistan
    {
      question: "What is the national flower of Pakistan?",
      options: ["Jasmine (Chambeli)", "Rose", "Sunflower", "Tulip"],
      correctIndex: 0,
      category: "pakistan",
    },
    {
      question: "Which city is known as the 'Heart of Pakistan'?",
      options: ["Karachi", "Lahore", "Islamabad", "Peshawar"],
      correctIndex: 1,
      category: "pakistan",
    },
    {
      question: "Which mountain is the second-highest peak in the world, located in Pakistan?",
      options: ["Nanga Parbat", "K2 (Godwin-Austen)", "Broad Peak", "Rakaposhi"],
      correctIndex: 1,
      category: "pakistan",
    },
    {
      question: "In which year did Pakistan win its first Cricket World Cup under Imran Khan?",
      options: ["1987", "1992", "1996", "1999"],
      correctIndex: 1,
      category: "pakistan",
    },
    {
      question: "What is the official currency of Pakistan?",
      options: ["Pakistani Rupee (PKR)", "Riyal", "Dinar", "Taka"],
      correctIndex: 0,
      category: "pakistan",
    },
    {
      question: "Which heritage fort was built by Mughal Emperor Akbar in Lahore?",
      options: ["Rohtas Fort", "Lahore Fort (Shahi Qila)", "Derawar Fort", "Ranikot Fort"],
      correctIndex: 1,
      category: "pakistan",
    },
    {
      question: "Which river is the longest and most important river in Pakistan?",
      options: ["Jhelum", "Chenab", "Indus", "Ravi"],
      correctIndex: 2,
      category: "pakistan",
    },
    // Cricket
    {
      question: "Who is known as the 'Rawalpindi Express'?",
      options: ["Wasim Akram", "Shoaib Akhtar", "Waqar Younis", "Mohammad Amir"],
      correctIndex: 1,
      category: "cricket",
    },
    {
      question: "Which Pakistani batsman scored the highest individual score in an ODI innings (210*) against Zimbabwe?",
      options: ["Saeed Anwar", "Babar Azam", "Fakhar Zaman", "Inzamam-ul-Haq"],
      correctIndex: 2,
      category: "cricket",
    },
    {
      question: "In cricket, how many balls make up a standard over?",
      options: ["5", "6", "8", "10"],
      correctIndex: 1,
      category: "cricket",
    },
    {
      question: "What does LBW stand for in cricket?",
      options: ["Leg Before Wicket", "Long Ball Wide", "Line Boundary Wicket", "Late Bat Wave"],
      correctIndex: 0,
      category: "cricket",
    },
    {
      question: "Which cricket stadium in Lahore has hosted the 1996 World Cup Final?",
      options: ["National Stadium", "Gaddafi Stadium", "Rawalpindi Cricket Stadium", "Arbab Niaz Stadium"],
      correctIndex: 1,
      category: "cricket",
    },
    {
      question: "Who holds the record for most international wickets as a left-arm pacer?",
      options: ["Mitchell Starc", "Wasim Akram", "Zaheer Khan", "Chaminda Vaas"],
      correctIndex: 1,
      category: "cricket",
    },
    {
      question: "What is the maximum number of reviews (DRS) per innings in T20 Internationals?",
      options: ["1", "2", "3", "Unlimited"],
      correctIndex: 1,
      category: "cricket",
    },
    // General Knowledge
    {
      question: "Which spice is famously known as the 'Queen of Spices' and essential in Karak Chai?",
      options: ["Cinnamon", "Cardamom (Elaichi)", "Clove", "Saffron"],
      correctIndex: 1,
      category: "general",
    },
    {
      question: "What is the primary ingredient of traditional naan dough?",
      options: ["Wheat Flour (Maida)", "Cornmeal", "Barley", "Rice Flour"],
      correctIndex: 0,
      category: "general",
    },
    {
      question: "How many players are on the field for one team in a standard soccer (football) match?",
      options: ["9", "10", "11", "12"],
      correctIndex: 2,
      category: "general",
    },
    {
      question: "Which celestial body is at the center of our solar system?",
      options: ["Earth", "Jupiter", "Sun", "Mars"],
      correctIndex: 2,
      category: "general",
    },
    {
      question: "What is the boiling point of water at standard sea level?",
      options: ["90°C", "100°C", "120°C", "80°C"],
      correctIndex: 1,
      category: "general",
    },
    {
      question: "Which traditional cooking utensil is universally used to prepare a Pakistani Karahi?",
      options: ["Pressure Cooker", "Deep Iron Wok (Karahi)", "Clay Tandoor", "Steamer"],
      correctIndex: 1,
      category: "general",
    },
  ]);

  console.log("\n========================================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("========================================================");
  console.log("📍 Restaurant Slug: cafe-lahore");
  console.log("📱 Customer QR URL: http://localhost:3000/r/cafe-lahore");
  console.log("\n🔑 DEMO STAFF CREDENTIALS:");
  console.log("--------------------------------------------------------");
  console.log("👔 Owner:   owner@cafelahore.pk   | Password: admin123   (-> /dashboard)");
  console.log("🚶 Waiter:  waiter@cafelahore.pk  | Password: waiter123  (-> /waiter)");
  console.log("👨‍🍳 Kitchen: kitchen@cafelahore.pk | Password: kitchen123 (-> /kitchen)");
  console.log("\n⭐ DEMO LOYALTY CUSTOMER:");
  console.log("--------------------------------------------------------");
  console.log("👤 Email: demo@servora.pk | Name: Demo Customer");
  console.log("   (Has 1 visit recorded 3 days ago. 1 more visit triggers reward!)");
  console.log("🎫 Ali's Active Voucher Code: GIFT8842");
  console.log("========================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
