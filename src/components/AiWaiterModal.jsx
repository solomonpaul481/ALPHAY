"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import VegDot from "@/components/VegDot";

/**
 * Generate rich, appetizing descriptions for menu items
 */
function getItemDescription(item) {
  if (!item) return "";
  const desc = (item.description || "").trim();
  const name = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  let tasteProfile = "";

  if (name.includes("biryani")) {
    tasteProfile =
      "Spicy, aromatic, and deeply flavorful. Prepared with long-grain basmati rice slow-cooked on dum with saffron ghee, caramelized onions, and tender, juicy pieces infused with warm whole spices.";
  } else if (name.includes("butter") || name.includes("makhani")) {
    tasteProfile =
      "Rich, creamy, and velvety with a gentle sweetness. Simmered in a slow-reduced tomato and cashew gravy with butter, fresh cream, and fragrant kasuri methi.";
  } else if (name.includes("tikka") || name.includes("tandoori")) {
    tasteProfile =
      "Smoky, spicy, and succulent. Marinated in spiced hung curd with roasted cumin and Kashmiri chili, then charred to perfection in the clay tandoor oven.";
  } else if (name.includes("65") || name.includes("pepper fry") || name.includes("fry")) {
    tasteProfile =
      "Crispy on the outside, hot, and delightfully juicy inside. Tossed with fresh curry leaves, cracked black pepper, crushed garlic, and tangy South Indian spices.";
  } else if (name.includes("manchurian") || name.includes("chilli")) {
    tasteProfile =
      "Savory, zesty, and mildly spicy with a glossy Indo-Chinese sauce. Tossed with crunchy bell peppers, spring onions, and garlic.";
  } else if (name.includes("kebab") || name.includes("kabab")) {
    tasteProfile =
      "Tender, melt-in-mouth, and lightly charred. Ground with delicate aromatic herbs, mint, and spices, pan-grilled until juicy and golden.";
  } else if (name.includes("roti") || name.includes("naan") || name.includes("kulcha")) {
    tasteProfile =
      "Freshly baked in the tandoor, soft, pillowy, and layered with a light brush of pure melted butter. The ideal accompaniment for gravies and curries.";
  } else if (name.includes("curry") || name.includes("masala") || name.includes("gravy") || name.includes("korma")) {
    tasteProfile =
      "Hearty, medium-spicy, and richly seasoned. Cooked in an onion-tomato reduction with ground coriander, turmeric, and slow-simmered herbs.";
  } else if (cat.includes("dessert") || name.includes("jamun") || name.includes("halwa") || name.includes("kheer")) {
    tasteProfile =
      "Sweet, warm, and comforting. Enriched with pure desi ghee, cardamom, and roasted nuts for a satisfying finish.";
  } else if (cat.includes("drink") || cat.includes("beverage") || name.includes("shake") || name.includes("mojito") || name.includes("lassi")) {
    tasteProfile =
      "Chilled, refreshing, and revitalizing. Perfectly balanced to soothe the palate alongside rich and spicy dishes.";
  } else {
    tasteProfile =
      "Freshly prepared to order with authentic seasonings, offering a balanced taste profile and satisfying texture.";
  }

  if (desc && desc.length > 15 && !desc.toLowerCase().includes("fresh chef")) {
    return `${desc} ${tasteProfile}`;
  }
  return tasteProfile;
}

export default function AiWaiterModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName = "our Restaurant",
  menu,
  isParcel = false,
}) {
  const { addItem, quantityOf, setQuantity } = useCart();
  const chatEndRef = useRef(null);

  const [inquiryText, setInquiryText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const displayName = menu?.restaurantName || menu?.restaurant?.name || restaurantName || "ALPHAY";
  const activeTableNumber = isParcel ? "PARCEL" : (menu?.tableNumber || "1");

  // Flatten all menu items
  const allMenuItems = useMemo(() => {
    if (!menu) return [];
    const vegList = Object.values(menu.veg || {}).flat();
    const nonVegList = Object.values(menu.nonVeg || {}).flat();
    const map = new Map();
    [...vegList, ...nonVegList, ...(menu.todaysSpecial || []), ...(menu.recommended || [])].forEach(
      (item) => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    );
    return Array.from(map.values()).filter((i) => i.isAvailable !== false);
  }, [menu]);

  // Featured sample dishes to show as quick query chips
  const popularDishes = useMemo(() => {
    return allMenuItems.slice(0, 6);
  }, [allMenuItems]);

  // Live matched dishes on top of the typing box as customer types
  const matchingSuggestions = useMemo(() => {
    const q = inquiryText.trim().toLowerCase();
    if (!q) return [];
    return allMenuItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [inquiryText, allMenuItems]);

  const router = useRouter();

  // Return to the menu page and close modal
  const handleBackToMenu = () => {
    onClose();
    if (restaurantId) {
      const query = isParcel
        ? "?type=parcel&table=PARCEL"
        : (activeTableNumber ? `?table=${encodeURIComponent(activeTableNumber)}` : "");
      router.push(`/r/${restaurantId}/menu${query}`);
    }
  };

  // Intercept browser back button so pressing back on phone or browser closes AI Waiter and returns to menu page
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ aiWaiterOpen: true }, "");
    const handlePopState = () => {
      handleBackToMenu();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, restaurantId, isParcel, activeTableNumber]);

  // Reset conversation on open
  useEffect(() => {
    if (isOpen) {
      setInquiryText("");
      setMessages([
        {
          id: "welcome-msg",
          sender: "ai",
          text: `Welcome to ${displayName}! I am your AI Food Assistant.\n\nAsk me about any dish on our menu. I will describe how it tastes, its spiciness, texture, and show you a picture of it.`,
        },
      ]);
    }
  }, [isOpen, displayName]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle dish inquiry
  const handleAskDish = (dishQuery) => {
    const query = (dishQuery || inquiryText).trim();
    if (!query) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-msg-${Date.now()}`, sender: "user", text: query },
    ]);
    setInquiryText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const cleanQ = query.toLowerCase();

      // Find best matching item
      const exactMatch = allMenuItems.find(
        (i) => i.name.toLowerCase() === cleanQ
      );
      const partialMatch =
        exactMatch ||
        allMenuItems.find((i) => i.name.toLowerCase().includes(cleanQ)) ||
        allMenuItems.find((i) =>
          cleanQ.split(" ").some((w) => w.length > 2 && i.name.toLowerCase().includes(w))
        );

      if (partialMatch) {
        const description = getItemDescription(partialMatch);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-dish-${Date.now()}`,
            sender: "ai",
            text: `Here are the details for ${partialMatch.name}:`,
            dish: {
              ...partialMatch,
              curatedDescription: description,
            },
          },
        ]);
      } else {
        const suggestions = allMenuItems.slice(0, 3).map((i) => i.name).join(", ");
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-unknown-${Date.now()}`,
            sender: "ai",
            text: `I could not find "${query}" on our menu. You can try asking about popular dishes like ${suggestions}, or select one from the quick options above.`,
          },
        ]);
      }
    }, 450);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleAskDish();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden"
      >
        {/* TOP HEADER */}
        <header className="relative flex items-center justify-between border-b border-amber-500/20 bg-slate-900/95 px-4 py-3 sm:px-6 backdrop-blur-xl z-10 shadow-lg">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300/80">
              <span className="font-['Cinzel'] text-xl font-black">A</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-sm sm:text-base font-black tracking-wide text-amber-300">
                  AI Waiter
                </h2>
                {isParcel ? (
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 font-['Cinzel']">
                    PARCEL COUNTER
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-slate-700 font-mono">
                    TABLE {activeTableNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {displayName} · Dish Description Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Explicit Back to Menu Button */}
            <button
              type="button"
              onClick={handleBackToMenu}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer font-['Cinzel']"
              aria-label="Back to Menu"
            >
              <span>← Back to Menu</span>
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES SCROLL AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto pb-32">
          {/* Quick Dish Inquiry Chips */}
          {popularDishes.length > 0 && (
            <div className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 font-['Cinzel'] mb-2.5">
                Quick Dish Inquiries:
              </p>
              <div className="flex flex-wrap gap-2">
                {popularDishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleAskDish(dish.name)}
                    className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
                  >
                    <VegDot isVeg={dish.isVeg} />
                    <span>{dish.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-2.5 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-['Cinzel'] font-black text-sm shadow-md mt-0.5">
                  A
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] sm:max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 rounded-tr-sm"
                    : "bg-slate-900 border border-amber-500/20 text-slate-100 shadow-lg rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* DETAILED DISH CARD WITH MANAGER'S PICTURE */}
                {msg.dish && (
                  <div className="mt-3.5 overflow-hidden rounded-2xl bg-slate-950 border border-amber-500/30 shadow-xl">
                    {/* Picture of the dish set by the manager */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                      {msg.dish.imageUrl ? (
                        <img
                          src={msg.dish.imageUrl}
                          alt={msg.dish.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-amber-400/60 font-['Cinzel'] tracking-widest">
                          PICTURE NOT UPLOADED BY MANAGER
                        </div>
                      )}

                      {/* Veg / Non-Veg Indicator */}
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-slate-950/80 p-1.5 backdrop-blur-md border border-slate-800">
                        <VegDot isVeg={msg.dish.isVeg} />
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-black uppercase text-amber-300 backdrop-blur-md border border-amber-500/30 font-['Cinzel']">
                        {msg.dish.category || (msg.dish.isVeg ? "VEG" : "NON-VEG")}
                      </div>
                    </div>

                    {/* Dish Information */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-['Cinzel'] text-base sm:text-lg font-black text-amber-200 leading-snug">
                          {msg.dish.name}
                        </h3>
                        <span className="font-mono text-base font-black text-amber-400 tabular-nums shrink-0">
                          ₹{msg.dish.price}
                        </span>
                      </div>

                      {/* Taste & Texture Description */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                        {msg.dish.curatedDescription}
                      </p>

                      {/* Add to Cart Button */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {msg.dish.prepTimeMinutes ? `Prep time: ~${msg.dish.prepTimeMinutes} mins` : "Available Now"}
                        </span>

                        <div>
                          {quantityOf(msg.dish.id) > 0 ? (
                            <div className="flex items-center rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-black shadow-md overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setQuantity(msg.dish.id, quantityOf(msg.dish.id) - 1)}
                                className="px-3 py-1.5 hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2">{quantityOf(msg.dish.id)}</span>
                              <button
                                type="button"
                                onClick={() => setQuantity(msg.dish.id, quantityOf(msg.dish.id) + 1)}
                                className="px-3 py-1.5 hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addItem(msg.dish, 1)}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-950 font-['Cinzel'] tracking-wide transition-all cursor-pointer active:scale-95 shadow-md"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-['Cinzel'] font-black text-sm shadow-md">
                A
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900 border border-amber-500/20 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* BOTTOM INTERACTIVE TYPING BAR WITH MATCHED ITEMS ON TOP */}
        <footer className="border-t border-amber-500/20 bg-slate-900/95 p-3 sm:p-4 backdrop-blur-xl z-20">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* MATCHED DISH NAMES DISPLAYED ON TOP AS CUSTOMER TYPES */}
            {inquiryText.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-h-36 overflow-y-auto rounded-2xl bg-slate-950/98 border border-amber-500/40 p-2.5 shadow-2xl backdrop-blur-2xl"
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 font-['Cinzel'] px-1 pb-1.5 flex items-center justify-between">
                  <span>Matched Dishes:</span>
                  <span className="text-[9px] text-slate-400 font-sans">Tap to describe with picture</span>
                </div>

                {matchingSuggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchingSuggestions.slice(0, 10).map((dish) => (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => handleAskDish(dish.name)}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
                      >
                        <VegDot isVeg={dish.isVeg} />
                        <span>{dish.name}</span>
                        <span className="font-mono text-amber-400 text-[11px]">₹{dish.price}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 px-1 py-1">
                    No dishes found matching &quot;{inquiryText}&quot;
                  </div>
                )}
              </motion.div>
            )}

            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder='Type any dish name (e.g. "Chicken Biryani", "Paneer Butter Masala")...'
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inquiryText.trim()}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-['Cinzel'] cursor-pointer shrink-0"
              >
                Ask
              </button>
            </form>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
