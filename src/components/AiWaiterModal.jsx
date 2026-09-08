"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";
import {
  IconCart,
  IconSparkles,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
} from "@/components/Icons";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Intelligent recommendation engine:
 * Curates 2 to 6 balanced meal packages from the restaurant's actual menu items.
 */
function buildRecommendations({ menu, isVeg, members, withStarters }) {
  const groups = isVeg ? menu?.veg || {} : menu?.nonVeg || {};
  const allItems = Object.values(groups).flat().filter((i) => i.isAvailable !== false);

  if (allItems.length === 0) return [];

  // Helper to test if an item is a starter
  const isStarter = (item) => {
    const text = `${item.categoryName || ""} ${item.name || ""} ${item.description || ""}`.toLowerCase();
    return (
      text.includes("starter") ||
      text.includes("appetizer") ||
      text.includes("tikka") ||
      text.includes("kebab") ||
      text.includes("kabab") ||
      text.includes("crispy") ||
      text.includes("fry") ||
      text.includes("65") ||
      text.includes("manchurian") ||
      text.includes("soup") ||
      text.includes("roll") ||
      text.includes("wings")
    );
  };

  // Helper to test if an item is a main dish / curry / biryani
  const isMain = (item) => {
    const text = `${item.categoryName || ""} ${item.name || ""} ${item.description || ""}`.toLowerCase();
    return (
      text.includes("curry") ||
      text.includes("masala") ||
      text.includes("gravy") ||
      text.includes("biryani") ||
      text.includes("rice") ||
      text.includes("dal") ||
      text.includes("paneer") ||
      text.includes("chicken") ||
      text.includes("mutton") ||
      text.includes("kofta") ||
      text.includes("pulao") ||
      text.includes("main") ||
      text.includes("thali")
    );
  };

  // Helper to test if item is bread
  const isBread = (item) => {
    const text = `${item.categoryName || ""} ${item.name || ""}`.toLowerCase();
    return (
      text.includes("roti") ||
      text.includes("naan") ||
      text.includes("paratha") ||
      text.includes("kulcha") ||
      text.includes("bread")
    );
  };

  // Helper to test if item is beverage or dessert
  const isBeverageOrDessert = (item) => {
    const text = `${item.categoryName || ""} ${item.name || ""}`.toLowerCase();
    return (
      text.includes("drink") ||
      text.includes("beverage") ||
      text.includes("mojito") ||
      text.includes("shake") ||
      text.includes("coke") ||
      text.includes("lassi") ||
      text.includes("dessert") ||
      text.includes("ice cream") ||
      text.includes("jamun") ||
      text.includes("halwa")
    );
  };

  const starterItems = allItems.filter(isStarter);
  const mainItems = allItems.filter((i) => isMain(i) && !isStarter(i));
  const breadItems = allItems.filter(isBread);
  const drinkDessertItems = allItems.filter(isBeverageOrDessert);
  const otherItems = allItems.filter(
    (i) => !isStarter(i) && !isMain(i) && !isBread(i) && !isBeverageOrDessert(i)
  );

  // Fallbacks if specific categories are sparse
  const startersPool = starterItems.length > 0 ? starterItems : allItems.slice(0, 4);
  const mainsPool = mainItems.length > 0 ? mainItems : allItems.slice(2, 8);
  const breadsPool = breadItems.length > 0 ? breadItems : [];

  const memberScale = Math.max(1, members);
  const breadQty = memberScale > 1 ? Math.min(6, memberScale * 2) : 2;

  const combos = [];

  // Combo 1: Chef's Signature Feast
  {
    const items = [];
    if (withStarters && startersPool.length > 0) {
      items.push({ ...startersPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    }
    if (mainsPool.length > 0) {
      items.push({ ...mainsPool[0], quantity: memberScale >= 4 ? 2 : 1 });
    }
    if (mainsPool.length > 1 && memberScale >= 2) {
      items.push({ ...mainsPool[1], quantity: 1 });
    }
    if (breadsPool.length > 0) {
      items.push({ ...breadsPool[0], quantity: breadQty });
    } else if (items.length === 1 && allItems.length > 2) {
      items.push({ ...allItems[1], quantity: 1 });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-1",
      title: "Chef's Signature Feast",
      badge: "⭐ Chef's Pick",
      tagline: `Curated best-sellers balanced for ${memberScale} ${memberScale === 1 ? "person" : "people"}`,
      items,
      totalPrice: total,
    });
  }

  // Combo 2: Popular Bestsellers Combo
  {
    const items = [];
    if (withStarters && startersPool.length > 1) {
      items.push({ ...startersPool[1], quantity: memberScale >= 3 ? 2 : 1 });
    } else if (withStarters && startersPool.length > 0) {
      items.push({ ...startersPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    }

    const mainIdx = mainsPool.length > 2 ? 2 : mainsPool.length > 1 ? 1 : 0;
    if (mainsPool[mainIdx]) {
      items.push({ ...mainsPool[mainIdx], quantity: memberScale >= 3 ? 2 : 1 });
    }

    if (breadsPool.length > 1) {
      items.push({ ...breadsPool[1], quantity: breadQty });
    } else if (breadsPool.length > 0) {
      items.push({ ...breadsPool[0], quantity: breadQty });
    }

    if (drinkDessertItems.length > 0 && memberScale >= 2) {
      items.push({ ...drinkDessertItems[0], quantity: memberScale });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-2",
      title: "Popular Bestsellers Platter",
      badge: "🔥 Most Loved",
      tagline: `Crowd favorite flavors, guaranteed satisfaction`,
      items,
      totalPrice: total,
    });
  }

  // Combo 3: Quick & Delicious Express
  {
    const items = [];
    if (withStarters && startersPool.length > 2) {
      items.push({ ...startersPool[2], quantity: 1 });
    } else if (withStarters && startersPool.length > 0) {
      items.push({ ...startersPool[0], quantity: 1 });
    }

    const quickMain = mainsPool.find((m) => m.name.toLowerCase().includes("biryani") || m.name.toLowerCase().includes("rice")) || mainsPool[0];
    if (quickMain) {
      items.push({ ...quickMain, quantity: memberScale >= 3 ? 2 : 1 });
    }

    if (drinkDessertItems.length > 0) {
      items.push({ ...drinkDessertItems[0], quantity: 1 });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-3",
      title: "Quick & Delicious Express",
      badge: "⚡ Fast Prep",
      tagline: `Quick, satisfying and rich in authentic taste`,
      items,
      totalPrice: total,
    });
  }

  // Combo 4: Royal Celebration Spread (if multiple items available)
  if (allItems.length >= 4) {
    const items = [];
    if (withStarters) {
      if (startersPool[0]) items.push({ ...startersPool[0], quantity: 1 });
      if (startersPool[1]) items.push({ ...startersPool[1], quantity: 1 });
    }
    if (mainsPool[0]) items.push({ ...mainsPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    if (mainsPool[1]) items.push({ ...mainsPool[1], quantity: 1 });
    if (breadsPool[0]) items.push({ ...breadsPool[0], quantity: breadQty });

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-4",
      title: "Royal Grand Banquet",
      badge: "👑 Royal Spread",
      tagline: `A lavish, wholesome feast with full flavors`,
      items,
      totalPrice: total,
    });
  }

  return combos.slice(0, 4); // return 2 to 4 rich responses
}

export default function AiWaiterModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName = "our Restaurant",
  menu,
  isParcel = false,
}) {
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { clearCart } = useCart();
  const chatEndRef = useRef(null);

  // Conversation step:
  // 1: CATEGORY (Veg / Non-Veg)
  // 2: MEMBERS (How many people)
  // 3: STARTERS (With or without starters)
  // 4: SUGGESTIONS (Show 2-6 combos + "Order by yourself")
  // 5: ORDER_SUCCESS (Order placed successfully)
  const [step, setStep] = useState(1);
  const [selectedDiet, setSelectedDiet] = useState(null); // "veg" | "non-veg"
  const [membersCount, setMembersCount] = useState(2);
  const [withStarters, setWithStarters] = useState(null); // boolean

  // Chat message history
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [orderingComboId, setOrderingComboId] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  const displayName = menu?.restaurant?.name || restaurantName || "ALPHAY";

  // Reset conversation to initial state
  const resetChat = () => {
    setStep(1);
    setSelectedDiet(null);
    setMembersCount(2);
    setWithStarters(null);
    setOrderingComboId(null);
    setOrderError("");
    setPlacedOrderDetails(null);

    setMessages([
      {
        id: "msg-welcome",
        sender: "ai",
        text: `Hey, welcome to our ${displayName}!\nWhat would you like to have?`,
      },
    ]);
  };

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      resetChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, displayName]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, step]);

  // STEP 1: Handle Veg / Non-Veg Selection
  const handleSelectDiet = (diet) => {
    setSelectedDiet(diet);
    const label = diet === "veg" ? "Veg 🌱" : "Non-Veg 🍗";

    setMessages((prev) => [
      ...prev,
      { id: `user-diet-${Date.now()}`, sender: "user", text: label },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-members-${Date.now()}`,
          sender: "ai",
          text: `Great choice! For how many members?`,
        },
      ]);
      setStep(2);
    }, 500);
  };

  // STEP 2: Handle Members Count Selection
  const handleConfirmMembers = (count) => {
    const countNum = Math.max(1, parseInt(count, 10) || 1);
    setMembersCount(countNum);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-members-${Date.now()}`,
        sender: "user",
        text: `${countNum} ${countNum === 1 ? "Member" : "Members"}`,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-starters-${Date.now()}`,
          sender: "ai",
          text: `With or without starters?`,
        },
      ]);
      setStep(3);
    }, 500);
  };

  // STEP 3: Handle Starters Selection
  const handleSelectStarters = (hasStarters) => {
    setWithStarters(hasStarters);
    const label = hasStarters ? "With Starters 🥟" : "Without Starters 🍲";

    setMessages((prev) => [
      ...prev,
      { id: `user-starters-${Date.now()}`, sender: "user", text: label },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-recommend-${Date.now()}`,
          sender: "ai",
          text: `Here are our chef's curated recommendations for ${membersCount} ${
            membersCount === 1 ? "member" : "members"
          } (${selectedDiet === "veg" ? "Pure Veg" : "Non-Veg"}):`,
        },
      ]);
      setStep(4);
    }, 650);
  };

  // Computed combos for Step 4
  const recommendedCombos = useMemo(() => {
    if (!menu) return [];
    return buildRecommendations({
      menu,
      isVeg: selectedDiet === "veg",
      members: membersCount,
      withStarters: Boolean(withStarters),
    });
  }, [menu, selectedDiet, membersCount, withStarters]);

  // ACTION: "Order by yourself"
  const handleOrderByYourself = () => {
    onClose();
  };

  // ACTION: "Order" on a combo response
  const handleOrderCombo = async (combo) => {
    if (orderingComboId) return;
    setOrderingComboId(combo.id);
    setOrderError("");

    const orderPayloadItems = combo.items.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      notes: "Ordered via AI Waiter",
    }));

    const specialInstructions = isParcel
      ? `[PARCEL] Ordered via AI Waiter (${combo.title})`
      : `Ordered via AI Waiter (${combo.title})`;

    try {
      const res = await api.createOrder({
        items: orderPayloadItems,
        specialInstructions,
        isParcel,
        type: isParcel ? "parcel" : "dine_in",
      });

      // If parcel order requires online Razorpay payment
      if (res.isParcel && res.requiresPayment) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
          throw new Error("Could not load payment gateway. Please check internet connection.");
        }

        const options = {
          key: res.keyId || "rzp_test_TUtBMqf8GaZllM",
          amount: res.amountInPaise || Math.round(res.amount * 100),
          currency: res.currency || "INR",
          name: res.restaurantName || displayName,
          description: `Parcel Pickup Token #${res.token || res.orderSeq}`,
          order_id: res.razorpayOrderId,
          theme: { color: "#F59E0B" },
          handler: async function (payResponse) {
            try {
              const verifyRes = await fetch(
                `/api/r/${restaurantId}/orders/${res.orderId}/verify`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_payment_id: payResponse.razorpay_payment_id,
                    razorpay_order_id: payResponse.razorpay_order_id,
                    razorpay_signature: payResponse.razorpay_signature,
                  }),
                }
              );
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }

              const finalToken = verifyData.token || res.token || String(res.orderSeq);
              setPlacedOrderDetails({
                isParcel: true,
                token: finalToken,
                orderSeq: res.orderSeq,
                total: res.amount,
                comboTitle: combo.title,
                items: combo.items,
              });
              clearCart();
              setStep(5);
            } catch (verErr) {
              setOrderError(verErr.message || "Payment verification failed.");
            } finally {
              setOrderingComboId(null);
            }
          },
          modal: {
            ondismiss: function () {
              setOrderingComboId(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (failResp) {
          setOrderingComboId(null);
          setOrderError(failResp.error?.description || "Payment failed. Please try again.");
        });
        rzp.open();
        return;
      }

      // Immediate Confirmation for Dine-in or Counter Parcel Order
      const finalToken = res.token || String(res.orderSeq || 1001);
      setPlacedOrderDetails({
        isParcel: Boolean(isParcel || res.isParcel),
        token: finalToken,
        orderSeq: res.orderSeq,
        tableNumber: res.tableNumber || (isParcel ? "PARCEL" : "Your Table"),
        total: res.amount || combo.totalPrice,
        comboTitle: combo.title,
        items: combo.items,
      });

      clearCart();
      setStep(5);
    } catch (err) {
      console.error("AI Waiter order placement error:", err);
      if (err.status === 401) {
        router.replace(`/r/${restaurantId}`);
        return;
      }
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderingComboId(null);
    }
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
        <header className="relative flex items-center justify-between border-b border-amber-500/20 bg-slate-900/90 px-4 py-3 sm:px-6 backdrop-blur-xl z-10 shadow-lg">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300/80">
              <span className="font-['Cinzel'] text-xl font-black">A</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-['Cinzel'] text-sm sm:text-base font-black tracking-wide text-amber-300">
                  AI Waiter
                </h2>
                {isParcel && (
                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    PARCEL COUNTER
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {displayName} · Instant Ordering Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Start Over Button */}
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={resetChat}
                className="flex items-center gap-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer"
                title="Restart chat"
              >
                <span>↺</span>
                <span className="hidden sm:inline">Start Over</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              aria-label="Close AI Waiter"
            >
              ✕
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES SCROLL AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto">
          {/* Messages stream */}
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
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 rounded-tr-sm"
                    : "bg-slate-900 border border-amber-500/20 text-slate-100 shadow-lg rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
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

          {/* DYNAMIC INTERACTION BLOCKS BASED ON STEP */}

          {/* STEP 1: CATEGORY SELECTION (Veg / Non-Veg) */}
          {step === 1 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 pl-10.5 flex flex-col gap-2.5 max-w-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-['Cinzel']">
                Please select your preference:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectDiet("veg")}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/40 p-4 hover:border-emerald-400 hover:bg-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🥗</span>
                  <div className="text-center">
                    <span className="block font-['Cinzel'] text-sm font-black text-emerald-400">
                      VEG
                    </span>
                    <span className="text-[11px] text-slate-400">Pure Vegetarian</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDiet("non-veg")}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/95 border-2 border-rose-500/40 p-4 hover:border-rose-400 hover:bg-rose-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🍗</span>
                  <div className="text-center">
                    <span className="block font-['Cinzel'] text-sm font-black text-rose-400">
                      NON-VEG
                    </span>
                    <span className="text-[11px] text-slate-400">Chicken, Meat & Seafood</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: NUMBER OF MEMBERS */}
          {step === 2 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 pl-10.5 flex flex-col gap-3 max-w-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-['Cinzel']">
                Select or enter table size:
              </p>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleConfirmMembers(num)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer border ${
                      membersCount === num
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30"
                        : "bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-500/60"
                    }`}
                  >
                    {num} {num === 1 ? "Member" : "Members"}
                  </button>
                ))}
              </div>

              {/* Stepper with Confirm Button */}
              <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2.5 w-full justify-between">
                <span className="text-xs font-bold text-slate-300 pl-2">Custom Count:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMembersCount((c) => Math.max(1, c - 1))}
                    className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-black text-sm active:scale-95"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-amber-300">
                    {membersCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMembersCount((c) => Math.min(25, c + 1))}
                    className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-black text-sm active:scale-95"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmMembers(membersCount)}
                    className="ml-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer font-['Cinzel']"
                  >
                    Confirm ({membersCount})
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: WITH OR WITHOUT STARTERS */}
          {step === 3 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 pl-10.5 flex flex-col gap-2.5 max-w-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-['Cinzel']">
                Choose an option:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectStarters(true)}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/95 border-2 border-amber-500/40 p-4 hover:border-amber-400 hover:bg-amber-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🥟</span>
                  <div className="text-center">
                    <span className="block font-['Cinzel'] text-xs sm:text-sm font-black text-amber-300">
                      WITH STARTERS
                    </span>
                    <span className="text-[10px] text-slate-400">Includes tasty appetizers</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStarters(false)}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/95 border-2 border-slate-700 p-4 hover:border-amber-500/40 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🍲</span>
                  <div className="text-center">
                    <span className="block font-['Cinzel'] text-xs sm:text-sm font-black text-slate-200">
                      WITHOUT STARTERS
                    </span>
                    <span className="text-[10px] text-slate-400">Direct main course & rice</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: RECOMMENDATIONS DISPLAY (2-6 CURATED COMBOS + "ORDER BY YOURSELF") */}
          {step === 4 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 pl-0 sm:pl-10.5 flex flex-col gap-4"
            >
              {orderError && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-3 text-xs font-bold text-rose-200">
                  ⚠️ {orderError}
                </div>
              )}

              {/* Curated combos list (2 to 4 rich options) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendedCombos.map((combo, index) => (
                  <div
                    key={combo.id}
                    className="relative flex flex-col justify-between rounded-3xl bg-slate-900/95 border border-amber-500/30 p-4 shadow-xl hover:border-amber-400/60 transition-all group"
                  >
                    {/* Badge & Title */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300 font-['Cinzel']">
                          {combo.badge}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Option {index + 1}
                        </span>
                      </div>

                      <h3 className="font-['Cinzel'] text-base font-black text-amber-200 group-hover:text-amber-300 transition-colors">
                        {combo.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mb-3">{combo.tagline}</p>

                      {/* Items list */}
                      <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-2.5 mb-3 flex flex-col gap-1.5">
                        {combo.items.map((item, iIdx) => (
                          <div
                            key={`${item.id}-${iIdx}`}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-300 truncate max-w-[190px]">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-mono">
                                ×{item.quantity}
                              </span>
                              <span className="font-mono text-xs font-bold text-amber-400/90">
                                ₹{(item.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer with Total and ORDER BUTTON */}
                    <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Total Price
                        </span>
                        <span className="font-mono text-base font-black text-amber-300">
                          ₹{combo.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOrderCombo(combo)}
                        disabled={Boolean(orderingComboId)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer font-['Cinzel'] tracking-wider"
                      >
                        {orderingComboId === combo.id ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                            <span>Placing...</span>
                          </>
                        ) : (
                          <>
                            <span>ORDER</span>
                            <IconArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* OPTION: ORDER BY YOURSELF */}
              <div className="pt-2 flex flex-col items-center justify-center gap-2 text-center pb-4">
                <p className="text-xs text-slate-400">
                  Prefer selecting individual items directly from the complete menu?
                </p>
                <button
                  type="button"
                  onClick={handleOrderByYourself}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700/80 px-5 py-2.5 text-xs font-bold text-slate-200 hover:border-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-md"
                >
                  <span>📖</span>
                  <span>Order by yourself</span>
                  <span className="text-[10px] text-slate-400">(Browse Full Menu)</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: ORDER SUCCESS CELEBRATION */}
          {step === 5 && placedOrderDetails && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4 flex flex-col items-center text-center max-w-md mx-auto"
            >
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-3 text-emerald-400 shadow-xl shadow-emerald-500/20">
                ✓
              </div>

              <h2 className="font-['Cinzel'] text-xl font-black text-amber-300 mb-1">
                {placedOrderDetails.isParcel ? "Parcel Order Confirmed!" : "Order Sent to Kitchen!"}
              </h2>

              <p className="text-xs text-slate-300 mb-4">
                {placedOrderDetails.isParcel
                  ? "Your takeaway order is confirmed and sent to packaging."
                  : "Our chefs have received your order and started preparation!"}
              </p>

              {/* 4-DIGIT PARCEL PICKUP TOKEN DISPLAY */}
              {placedOrderDetails.isParcel && (
                <div className="w-full rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 p-4 mb-4 text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-['Cinzel'] mb-1">
                    YOUR PARCEL PICKUP TOKEN
                  </p>
                  <p className="font-mono text-3xl font-black text-amber-400 tracking-wider">
                    #{placedOrderDetails.token || placedOrderDetails.orderSeq || "1024"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Show this 4-digit number at the Parcel Counter to collect your packaged meal.
                  </p>
                </div>
              )}

              {/* Ordered Items summary */}
              <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-3.5 mb-5 text-left text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 font-['Cinzel'] font-bold text-amber-400">
                  <span>{placedOrderDetails.comboTitle}</span>
                  <span className="font-mono">₹{placedOrderDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1 text-slate-300">
                  {placedOrderDetails.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{i.name}</span>
                      <span className="font-mono text-slate-400">×{i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/r/${restaurantId}/track${
                        placedOrderDetails.isParcel ? "?type=parcel&table=PARCEL" : ""
                      }`
                    );
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-black text-slate-950 font-['Cinzel'] shadow-lg tracking-wider cursor-pointer"
                >
                  {placedOrderDetails.isParcel
                    ? "📦 Track Parcel Status & Token"
                    : "📋 Track Order & Table Bill"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 py-2.5 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Back to Restaurant Menu
                </button>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
