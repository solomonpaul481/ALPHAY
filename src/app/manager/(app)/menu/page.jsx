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
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryIsVeg, setNewCategoryIsVeg] = useState(true);
  const [newCategoryIsNonVeg, setNewCategoryIsNonVeg] = useState(false);
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
      setItems(data.items);
      setCategories(data.categories);
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

  const addItem = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.categoryId) {
      setError("Item name, price, and category are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/manager/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(EMPTY_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err.message || "Couldn't add item.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)));
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

  return (
    <>
      <Topbar title="Menu Management" />
      <div className="grid gap-6 p-6 lg:grid-cols-[380px_1fr]">
        {/* ADD ITEM & CATEGORY PANELS */}
        <div className="space-y-6">
          {/* ADD ITEM FORM */}
          <div className="rounded-card bg-white p-5 shadow-soft">
            <h2 className="font-display text-base font-medium text-ink">Add New Menu Item</h2>
            <form onSubmit={addItem} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Item Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                  placeholder="e.g. Chicken Dum Biryani"
                />
              </div>

              {/* IMAGE UPLOAD FIELD WITH NATIVE FILE PICKER */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Item Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                
                {form.imageUrl ? (
                  <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-purple-50 bg-cream p-2">
                    <img src={form.imageUrl} alt="Preview" className="h-12 w-12 rounded-md object-cover border" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-veg">✓ Image Selected</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, imageUrl: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-[11px] text-nonveg underline hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-purple/30 bg-purple-50/50 py-3 text-xs font-semibold text-purple hover:bg-purple-50 transition-colors"
                  >
                    <span>📷</span>
                    <span>Upload Image from Device</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Price (₹)</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  type="number"
                  min="0"
                  className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                  placeholder="299"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
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
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                  placeholder="Short, appetizing description…"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Prep (mins)</label>
                  <input
                    value={form.prepTimeMinutes}
                    onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                    type="number"
                    min="1"
                    className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                  />
                </div>
                <label className="flex flex-1 items-center gap-2 pt-5 text-sm text-ink2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
                    className="h-4 w-4 rounded accent-purple"
                  />
                  <span>Vegetarian Item</span>
                </label>
              </div>

              {error && <p className="rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-purple py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50 active:scale-[0.99]"
              >
                {saving ? "Adding Item…" : "Add to Menu"}
              </button>
            </form>
          </div>

          {/* NEW CATEGORY FORM WITH VEG & NON-VEG SECTION TOGGLES */}
          <div className="rounded-card bg-white p-5 shadow-soft">
            <h2 className="font-display text-base font-medium text-ink">New Category</h2>
            <form onSubmit={addCategory} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Category Name</label>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Soups, Starters, Desserts…"
                  className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                />
              </div>

              {/* VEG AND NON-VEG DUAL SECTION BUTTONS */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Target Section(s)</label>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryIsVeg(!newCategoryIsVeg)}
                    className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                      newCategoryIsVeg
                        ? "bg-veg-tint border-veg text-veg shadow-sm"
                        : "bg-cream border-purple-50 text-ink2 opacity-60"
                    }`}
                  >
                    🥦 Veg Section {newCategoryIsVeg ? "✓" : ""}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategoryIsNonVeg(!newCategoryIsNonVeg)}
                    className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                      newCategoryIsNonVeg
                        ? "bg-nonveg-tint border-nonveg text-nonveg shadow-sm"
                        : "bg-cream border-purple-50 text-ink2 opacity-60"
                    }`}
                  >
                    🍗 Non-Veg Section {newCategoryIsNonVeg ? "✓" : ""}
                  </button>
                </div>

                {isBothSections && (
                  <p className="mt-2 rounded-lg bg-purple-50 p-2.5 text-[11px] text-purple leading-relaxed">
                    ✨ <strong>Both Sections Active:</strong> Items in this category will appear under <strong>BOTH Veg and Non-Veg</strong> sections on the customer menu.
                  </p>
                )}
              </div>

              {categoryError && (
                <p className="rounded-lg bg-nonveg-tint px-3 py-2 text-xs text-nonveg">{categoryError}</p>
              )}
              {categorySuccess && (
                <p className="rounded-lg bg-veg-tint px-3 py-2 text-xs text-veg">{categorySuccess}</p>
              )}

              <button
                type="submit"
                disabled={addingCategory || !newCategory.trim()}
                className="rounded-xl bg-purple py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50 active:scale-[0.99]"
              >
                {addingCategory ? "Adding Category…" : "+ Add Category"}
              </button>
            </form>
          </div>
        </div>

        {/* YOUR MENU ITEMS LIST */}
        <div className="rounded-card bg-white p-5 shadow-soft">
          <h2 className="font-display text-base font-medium text-ink">Your Menu ({items.length})</h2>
          <div className="mt-4 divide-y divide-purple-50">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3.5 py-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover border border-purple-50" />
                ) : (
                  <span className={`h-3 w-3 flex-shrink-0 rounded-full ${item.isVeg ? "bg-veg" : "bg-nonveg"}`} />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink2">
                    {item.categoryName} · ₹{item.price} · {item.prepTimeMinutes} mins
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAvailability(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    item.isAvailable ? "bg-veg-tint text-veg" : "bg-nonveg-tint text-nonveg"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Sold Out"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteItem(item)}
                  className="rounded-full bg-cream px-2.5 py-1.5 text-xs font-semibold text-ink2 hover:bg-nonveg-tint hover:text-nonveg"
                  aria-label={`Delete ${item.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-ink2">No items yet — add your first one.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
