"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";
import { formatPKR } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
}

interface MenuItem {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  tags: string[];
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [restaurantName, setRestaurantName] = useState("Café Lahore");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<string | null>(null);

  useEffect(() => {
    // Read table from URL search params or storage
    if (typeof window !== "undefined") {
      const tableParam = searchParams?.get("table");
      if (tableParam && Number(tableParam) > 0) {
        setTable(tableParam);
        sessionStorage.setItem(`servora_${slug}_table`, tableParam);
        localStorage.setItem(`servora_${slug}_table`, tableParam);
      } else {
        const storedTable =
          sessionStorage.getItem(`servora_${slug}_table`) ||
          localStorage.getItem(`servora_${slug}_table`);
        if (storedTable) setTable(storedTable);
      }

      const storedCart = sessionStorage.getItem(`servora_${slug}_cart`);
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch {
          setCart([]);
        }
      }
    }

    fetchMenu();
  }, [slug]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/r/${slug}/menu`);
      const data = await res.json();
      if (data.success) {
        setRestaurantName(data.restaurant.name);
        setCategories(data.categories);
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`servora_${slug}_cart`, JSON.stringify(newCart));
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) return;
    const existingIndex = cart.findIndex((c) => c.menuItemId === item._id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updateCart(updated);
    } else {
      updateCart([
        ...cart,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    const existingIndex = cart.findIndex((c) => c.menuItemId === itemId);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
      } else {
        updated.splice(existingIndex, 1);
      }
      updateCart(updated);
    }
  };

  const getItemQuantity = (itemId: string) => {
    const found = cart.find((c) => c.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartPrice = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const filteredItems = items.filter((it) => {
    const matchesCat = selectedCat === "all" || it.categoryId === selectedCat;
    const matchesSearch =
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <CustomerLayout restaurantName={restaurantName} tableNumber={table}>
      <div className="p-4 flex flex-col gap-4">
        {/* Quick Amenity Banner (WiFi, Games, Feedback) */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/r/${slug}/wifi`}
            className="p-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-base">wifi</span>
            <span>Wi-Fi</span>
          </Link>

          <Link
            href={`/r/${slug}/games`}
            className="p-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-base">sports_esports</span>
            <span>Games</span>
          </Link>

          <Link
            href={`/r/${slug}/feedback`}
            className="p-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-amber-500 text-base">star</span>
            <span>Feedback</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search karahi, biryani, drinks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === "all"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-lowest text-on-surface border border-outline-variant/30"
            }`}
          >
            All Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(cat._id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === cat._id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-lowest text-on-surface border border-outline-variant/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dishes List */}
        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant font-medium">
            Loading delicious menu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1">
              search_off
            </span>
            <p className="text-xs font-bold text-on-surface">No dishes match your search</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Try searching for something else</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item._id);
              return (
                <div
                  key={item._id}
                  className={`p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex gap-3 shadow-xs transition-all ${
                    !item.available ? "opacity-60 bg-surface-container-low" : ""
                  }`}
                >
                  <img
                    src={item.image || "/images/placeholder-food.svg"}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-surface border border-outline-variant/20 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-xs text-on-surface leading-tight">
                          {item.name}
                        </h3>
                        <span className="font-extrabold text-xs text-primary shrink-0">
                          {formatPKR(item.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1">
                        {item.description || "Freshly cooked to order."}
                      </p>
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-surface-container text-on-surface-variant"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {!item.available ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                          Sold Out
                        </span>
                      ) : qty > 0 ? (
                        <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
                          <button
                            onClick={() => handleRemoveFromCart(item._id)}
                            className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center text-primary font-bold active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-on-surface w-4 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-bold active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Floating Bottom Cart Bar */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-200">
            <Link
              href={`/r/${slug}/cart`}
              className="w-full bg-secondary text-on-secondary p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-secondary-container/40 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  {totalCartCount}
                </div>
                <div>
                  <p className="text-[11px] text-on-secondary/70 font-semibold leading-none">
                    Total Order
                  </p>
                  <p className="text-sm font-extrabold text-on-secondary mt-0.5">
                    {formatPKR(totalCartPrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
                <span>View Cart</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
