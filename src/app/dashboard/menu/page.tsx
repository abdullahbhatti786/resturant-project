"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { formatPKR } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  sortOrder: number;
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

export default function OwnerMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: 0,
    image: "/images/placeholder-food.svg",
    available: true,
    tags: [] as string[],
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/owner/menu");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setItems(data.items);
      }
    } catch {
      setMessage({ text: "Failed to load menu", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/owner/items/${itemId}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) =>
          prev.map((it) => (it._id === itemId ? { ...it, available: data.available } : it))
        );
      } else {
        alert(data.message || "Failed to toggle status");
      }
    } catch {
      alert("Error toggling item availability");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/owner/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((it) => it._id !== itemId));
        setMessage({ text: "Item deleted successfully", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to delete item", type: "error" });
      }
    } catch {
      setMessage({ text: "Error deleting item", type: "error" });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCat) {
        const res = await fetch(`/api/owner/categories/${editingCat._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCategories((prev) =>
            prev.map((c) => (c._id === editingCat._id ? data.category : c))
          );
          setShowCatModal(false);
          setEditingCat(null);
          setCatName("");
        } else {
          alert(data.message);
        }
      } else {
        const res = await fetch("/api/owner/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName, sortOrder: categories.length }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCategories((prev) => [...prev, data.category]);
          setShowCatModal(false);
          setCatName("");
        } else {
          alert(data.message);
        }
      }
    } catch {
      alert("Error saving category");
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/owner/categories/${catId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== catId));
        if (selectedCat === catId) setSelectedCat("all");
      } else {
        alert(data.message || "Failed to delete category");
      }
    } catch {
      alert("Error deleting category");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/owner/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItemForm((prev) => ({ ...prev, image: data.url }));
      } else {
        alert(data.message || "Image upload failed");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.categoryId || itemForm.price < 0) return;

    try {
      if (editingItem) {
        const res = await fetch(`/api/owner/items/${editingItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setItems((prev) =>
            prev.map((it) => (it._id === editingItem._id ? data.item : it))
          );
          setShowItemModal(false);
          setEditingItem(null);
        } else {
          alert(data.message);
        }
      } else {
        const res = await fetch("/api/owner/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setItems((prev) => [data.item, ...prev]);
          setShowItemModal(false);
        } else {
          alert(data.message);
        }
      }
    } catch {
      alert("Error saving menu item");
    }
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      categoryId: categories[0]?._id || "",
      description: "",
      price: 0,
      image: "/images/placeholder-food.svg",
      available: true,
      tags: [],
    });
    setShowItemModal(true);
  };

  const openEditItem = (it: MenuItem) => {
    setEditingItem(it);
    setItemForm({
      name: it.name,
      categoryId: it.categoryId,
      description: it.description || "",
      price: it.price,
      image: it.image || "/images/placeholder-food.svg",
      available: it.available,
      tags: it.tags || [],
    });
    setShowItemModal(true);
  };

  const filteredItems =
    selectedCat === "all" ? items : items.filter((it) => it.categoryId === selectedCat);

  return (
    <OwnerLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Menu & Item Catalog</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage categories, dishes, real-time availability, and pricing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCat(null);
                setCatName("");
                setShowCatModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">create_new_folder</span>
              <span>New Category</span>
            </button>
            <button
              onClick={openNewItem}
              className="px-4 py-2.5 rounded-xl bg-primary hover:opacity-95 text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((it) => it.categoryId === cat._id).length;
            const isSelected = selectedCat === cat._id;
            return (
              <div key={cat._id} className="relative group flex items-center">
                <button
                  onClick={() => setSelectedCat(cat._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
                <div className="hidden group-hover:flex items-center gap-1 absolute right-1 bg-surface-container-highest rounded-lg p-1 shadow-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCat(cat);
                      setCatName(cat.name);
                      setShowCatModal(true);
                    }}
                    className="w-5 h-5 flex items-center justify-center text-on-surface hover:text-primary"
                    title="Edit Name"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat._id);
                    }}
                    className="w-5 h-5 flex items-center justify-center text-rose-600 hover:text-rose-800"
                    title="Delete Category"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              restaurant_menu
            </span>
            <p className="text-sm font-semibold text-on-surface">No dishes found in this category.</p>
            <button
              onClick={openNewItem}
              className="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs"
            >
              Add First Dish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`bg-surface-container-lowest border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  item.available
                    ? "border-outline-variant/30 shadow-xs"
                    : "border-outline-variant/20 opacity-60 bg-surface-container-low"
                }`}
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={item.image || "/images/placeholder-food.svg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-surface border border-outline-variant/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-on-surface truncate">{item.name}</h3>
                        <span className="font-bold text-sm text-primary shrink-0">
                          {formatPKR(item.price)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                        {item.description || "No description provided."}
                      </p>
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  {/* Real-time In-Stock / 86'd Toggle */}
                  <button
                    onClick={() => handleToggleItem(item._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      item.available
                        ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.available ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    />
                    <span>{item.available ? "In Stock" : "86'd (Out of stock)"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditItem(item)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                      title="Edit Dish"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-700 transition-colors"
                      title="Delete Dish"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Modal */}
        {showCatModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-base text-on-surface mb-4">
                {editingCat ? "Edit Category Name" : "Create New Category"}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Traditional Karahi, Desserts"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-on-primary"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl my-8">
              <h3 className="font-bold text-base text-on-surface mb-4">
                {editingItem ? "Edit Dish Details" : "Add New Menu Dish"}
              </h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g. Chicken Shinwari Karahi"
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Category *
                    </label>
                    <select
                      required
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Dietary Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={itemForm.tags.join(", ")}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          tags: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="e.g. Desi Ghee, Chef Special"
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Brief description of flavors, cuts, and serving portion..."
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Dish Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={itemForm.image || "/images/placeholder-food.svg"}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover bg-surface border border-outline-variant/30"
                    />
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                      {uploadingImage ? "Uploading..." : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-xs font-bold text-on-primary"
                  >
                    Save Dish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
