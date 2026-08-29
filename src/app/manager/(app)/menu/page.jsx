"use client";

import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

const EMPTY_FORM = {
  name: "",
  price: "",
  categoryId: "",
  description: "",
  prepTimeMinutes: "15",
  isVeg: true,
  imageUrl: "",
};

export default function ManagerMenuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  
  // New Category states
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryIsVeg, setNewCategoryIsVeg] = useState(true);
  const [newCategoryIsNonVeg, setNewCategoryIsNonVeg] = useState(false);
  
  // Category Editing states
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryIsVeg, setEditCategoryIsVeg] = useState(true);
  const [editCategoryIsNonVeg, setEditCategoryIsNonVeg] = useState(false);
  const [categoryUpdating, setCategoryUpdating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const fileInputRef = useRef(null);

  const load = async () => {
    const res = await fetch("/api/manager/menu");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
      setCategories(data.categories || []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((f) => ({ ...f, imageUrl: event.target?.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");
    if (!newCategory.trim()) {
      setCategoryError("Please enter a category name.");
      return;
    }
    setAddingCategory(true);
    try {
      const res = await fetch("/api/manager/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.trim(),
          isVeg: newCategoryIsVeg,
          isNonVeg: newCategoryIsNonVeg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category.");
      setNewCategory("");
      setCategorySuccess(`Category "${data.category.name}" added successfully!`);
      await load();
      setForm((f) => ({ ...f, categoryId: data.category.id }));
    } catch (err) {
      setCategoryError(err.message || "Couldn't add category.");
    } finally {
      setAddingCategory(false);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryIsVeg(cat.isVeg !== false);
    setEditCategoryIsNonVeg(cat.isNonVeg === true);
    setCategoryError("");
    setCategorySuccess("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
  };

  const saveEditCategory = async (catId) => {
    if (!editCategoryName.trim()) {
      setCategoryError("Category name cannot be empty.");
      return;
    }
    setCategoryUpdating(true);
    setCategoryError("");
    setCategorySuccess("");
    try {
      const res = await fetch(`/api/manager/categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          isVeg: editCategoryIsVeg,
          isNonVeg: editCategoryIsNonVeg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category.");
      setCategorySuccess(`Category updated successfully!`);
      setEditingCategoryId(null);
      await load();
    } catch (err) {
      setCategoryError(err.message || "Couldn't update category.");
    } finally {
      setCategoryUpdating(false);
    }
  };

  const deleteCategory = async (cat) => {
    const itemCount = items.filter((i) => i.categoryId === cat.id).length;
    const confirmMsg = itemCount > 0
      ? `Are you sure you want to delete category "${cat.name}"? This will also delete ${itemCount} item(s) under this category.`
      : `Delete category "${cat.name}"?`;
      
    if (!confirm(confirmMsg)) return;

    setCategoryError("");
    setCategorySuccess("");
    try {
      const res = await fetch(`/api/manager/categories/${cat.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete category.");
      }
      setCategorySuccess(`Category deleted.`);
      await load();
    } catch (err) {
      setCategoryError(err.message || "Couldn't delete category.");
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) {
      setError("Please enter a valid price in Rupees.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/manager/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: parseFloat(form.price),
          categoryId: form.categoryId,
          description: form.description.trim() || undefined,
          prepTimeMinutes: parseInt(form.prepTimeMinutes, 10) || 15,
          isVeg: form.isVeg,
          imageUrl: form.imageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add menu item.");
      }

      setForm(EMPTY_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err.message || "Could not add item.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
    );
    await fetch(`/api/manager/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
  };

  const deleteItem = async (item) => {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/manager/menu/${item.id}`, { method: "DELETE" });
  };

  const isBothSections = (!newCategoryIsVeg && !newCategoryIsNonVeg) || (newCategoryIsVeg && newCategoryIsNonVeg);

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Topbar title="Menu Management" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[400px_1fr] max-w-7xl mx-auto text-slate-900 dark:text-white">
        {/* ADD ITEM & CATEGORY PANELS */}
        <div className="space-y-6">
          {/* ADD ITEM FORM (GLASSMORPHIC BLACK & GOLD) */}
          <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-xl text-white space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <h2 className="font-['Cinzel'] text-lg font-extrabold text-white">Add New Menu Item</h2>
                <p className="text-[11px] text-slate-400 font-medium">Create dishes to appear on the digital QR menu.</p>
              </div>
            </div>

            <form onSubmit={addItem} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Item Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
                  placeholder="e.g. Chicken Dum Biryani, Paneer Tikka..."
                />
              </div>

              {/* IMAGE UPLOAD FIELD */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Item Image (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                
                {form.imageUrl ? (
                  <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-2.5 shadow-inner">
                    <img src={form.imageUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover border border-amber-500/40" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-black text-emerald-400">✓ Image Attached</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, imageUrl: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-[11px] text-rose-400 underline hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer font-['Cinzel']"
                  >
                    <span>📷</span>
                    <span>Upload Image from Device</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                    Price (₹)
                  </label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    type="number"
                    min="0"
                    className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-bold text-amber-300 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
                    placeholder="299"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                    Prep Time (mins)
                  </label>
                  <input
                    value={form.prepTimeMinutes}
                    onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                    type="number"
                    min="1"
                    className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none shadow-inner"
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => {
                    const sectionLabel =
                      (c.isVeg && !c.isNonVeg) ? "Veg Section" :
                      (!c.isVeg && c.isNonVeg) ? "Non-Veg Section" : "Veg & Non-Veg Section";
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({sectionLabel})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
                  placeholder="Short, delicious description for diners…"
                />
              </div>

              {/* VEG TOGGLE */}
              <div className="rounded-2xl bg-slate-950/60 border border-amber-500/20 p-3 flex items-center justify-between">
                <span className="text-xs font-bold font-['Cinzel'] text-slate-300">Vegetarian Dish</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isVeg: !form.isVeg })}
                  className={`rounded-xl px-3 py-1 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                    form.isVeg
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "bg-rose-500 text-white shadow-md"
                  }`}
                >
                  {form.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                </button>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs font-bold text-rose-300 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                {saving ? "Adding Item…" : "+ Add Dish to Menu"}
              </button>
            </form>
          </div>

          {/* NEW CATEGORY FORM (GLASSMORPHIC BLACK & GOLD) */}
          <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-xl text-white space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
              <span className="text-2xl">📑</span>
              <div>
                <h2 className="font-['Cinzel'] text-lg font-extrabold text-white">Create New Category</h2>
                <p className="text-[11px] text-slate-400 font-medium">Group menu items into sections.</p>
              </div>
            </div>

            <form onSubmit={addCategory} className="space-y-3.5">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Category Name
                </label>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Soups, Starters, Biryani, Desserts…"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
                />
              </div>

              {/* VEG AND NON-VEG SECTION TOGGLES */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  Target Menu Section(s)
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryIsVeg(!newCategoryIsVeg)}
                    className={`rounded-xl py-2 px-3 text-xs font-black border transition-all cursor-pointer font-['Cinzel'] ${
                      newCategoryIsVeg
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-500 opacity-60"
                    }`}
                  >
                    🥦 Veg {newCategoryIsVeg ? "✓" : ""}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategoryIsNonVeg(!newCategoryIsNonVeg)}
                    className={`rounded-xl py-2 px-3 text-xs font-black border transition-all cursor-pointer font-['Cinzel'] ${
                      newCategoryIsNonVeg
                        ? "bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-500 opacity-60"
                    }`}
                  >
                    🍗 Non-Veg {newCategoryIsNonVeg ? "✓" : ""}
                  </button>
                </div>

                {isBothSections && (
                  <p className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300 leading-relaxed font-medium">
                    ✨ <strong>Both Sections Active:</strong> This category will appear under <strong>BOTH Veg and Non-Veg</strong> tabs on the customer menu.
                  </p>
                )}
              </div>

              {categoryError && (
                <p className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-2.5 text-xs font-bold text-rose-300">{categoryError}</p>
              )}
              {categorySuccess && (
                <p className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-xs font-bold text-emerald-300">{categorySuccess}</p>
              )}

              <button
                type="submit"
                disabled={addingCategory || !newCategory.trim()}
                className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-extrabold text-slate-950 shadow-md font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer transition-all"
              >
                {addingCategory ? "Adding Category…" : "+ Add Category"}
              </button>
            </form>
          </div>

          {/* MANAGE CATEGORIES LIST */}
          <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-xl text-white space-y-4">
            <h3 className="font-['Cinzel'] text-sm font-extrabold text-amber-400 uppercase tracking-wider">
              Manage Categories ({categories.length})
            </h3>

            <div className="space-y-2.5">
              {categories.map((c) => {
                const itemCount = items.filter((i) => i.categoryId === c.id).length;
                const isEditing = editingCategoryId === c.id;

                if (isEditing) {
                  return (
                    <div key={c.id} className="rounded-2xl border border-amber-500/40 bg-slate-950 p-3.5 space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-amber-400 font-['Cinzel']">Category Name</label>
                        <input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-amber-500/30 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditCategoryIsVeg(!editCategoryIsVeg)}
                          className={`rounded-xl py-1.5 px-2 text-[10px] font-black border font-['Cinzel'] ${
                            editCategoryIsVeg ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" : "bg-slate-900 text-slate-500 opacity-60"
                          }`}
                        >
                          🥦 Veg {editCategoryIsVeg ? "✓" : ""}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCategoryIsNonVeg(!editCategoryIsNonVeg)}
                          className={`rounded-xl py-1.5 px-2 text-[10px] font-black border font-['Cinzel'] ${
                            editCategoryIsNonVeg ? "bg-rose-500/20 border-rose-400 text-rose-300" : "bg-slate-900 text-slate-500 opacity-60"
                          }`}
                        >
                          🍗 Non-Veg {editCategoryIsNonVeg ? "✓" : ""}
                        </button>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={categoryUpdating}
                          onClick={() => saveEditCategory(c.id)}
                          className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:opacity-50 font-['Cinzel']"
                        >
                          {categoryUpdating ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                }

                const sectionTag =
                  c.isVeg && !c.isNonVeg
                    ? "🥦 Veg"
                    : !c.isVeg && c.isNonVeg
                    ? "🍗 Non-Veg"
                    : "🥦 Veg & 🍗 Non-Veg";

                return (
                  <div key={c.id} className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-slate-950/70 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-white font-['Cinzel'] truncate">{c.name}</p>
                      <p className="text-[11px] text-amber-400/80 font-mono mt-0.5">
                        {sectionTag} · {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => startEditCategory(c)}
                        className="rounded-xl border border-amber-500/30 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(c)}
                        className="rounded-xl border border-rose-500/30 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">No categories created yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* YOUR MENU ITEMS LIST (GLASSMORPHIC BLACK & GOLD TABLE / CARDS) */}
        <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-xl text-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div>
              <h2 className="font-['Cinzel'] text-xl font-extrabold text-white flex items-center gap-2">
                <span>🍽️</span>
                <span>Active Menu Items</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Total {filteredItems.length} dish{filteredItems.length === 1 ? "" : "es"} in menu catalogue.
              </p>
            </div>

            {/* SEARCH INPUT BAR */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish or category..."
                className="w-full rounded-2xl border border-amber-500/30 bg-slate-950/80 pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none shadow-inner"
              />
              <span className="absolute left-3 top-2.5 text-xs text-amber-400">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* MENU ITEMS GRID / LIST */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/20 p-4 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover border border-amber-500/30 shadow-md"
                    />
                  ) : (
                    <div className={`h-12 w-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-lg border ${
                      item.isVeg
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    }`}>
                      {item.isVeg ? "🥦" : "🍗"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-extrabold text-white font-['Cinzel'] tracking-wide">
                        {item.name}
                      </p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                        item.isVeg
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {item.isVeg ? "VEG" : "NON-VEG"}
                      </span>
                    </div>

                    <p className="text-xs text-amber-400/90 font-mono font-bold mt-0.5">
                      {item.categoryName || "General"} · ₹{item.price} · ⏱️ {item.prepTimeMinutes} mins
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className={`rounded-2xl px-3.5 py-2 text-xs font-black font-['Cinzel'] transition-all cursor-pointer ${
                      item.isAvailable
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                    }`}
                  >
                    {item.isAvailable ? "Available ✓" : "Sold Out ✕"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="rounded-2xl bg-slate-900 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    aria-label={`Delete ${item.name}`}
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="py-14 text-center space-y-2">
                <p className="text-3xl">🍽️</p>
                <p className="text-sm font-extrabold text-white font-['Cinzel']">No menu items found</p>
                {searchQuery ? (
                  <p className="text-xs text-slate-400">
                    No results matching &ldquo;{searchQuery}&rdquo;. Try clearing your search query.
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Add your first menu item using the form on the left.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
