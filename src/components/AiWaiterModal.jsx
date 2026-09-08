"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";
import { IconArrowRight } from "@/components/Icons";

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
 * Generate appetizing descriptions for menu items
 */
function getItemDescription(item) {
  if (!item) return "";
  if (item.description && item.description.trim().length > 15) {
    return item.description;
  }

  const name = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  if (name.includes("biryani")) {
    return "Aromatic, slow-cooked long-grain basmati rice infused with whole spices and pure saffron ghee. Layered with tender, juicy and flavorful pieces with balanced warmth and a fragrant aroma.";
  }
  if (name.includes("butter") || name.includes("makhani")) {
    return "Rich, velvety tomato and cashew cream gravy cooked with aromatic kasuri methi and fresh butter. Gently spiced with a subtle sweet undertone and silky smooth texture.";
  }
  if (name.includes("tikka") || name.includes("tandoori")) {
    return "Marinated in hung curd and traditional roasted spices, charred in the tandoor to smoky perfection. Crispy spiced crust on the outside, succulent and tender on the inside.";
  }
  if (name.includes("65") || name.includes("pepper fry") || name.includes("fry")) {
    return "Hot, crispy, and packed with bold South Indian spices, fresh curry leaves, and green chilies. Juicy inside with a delightfully crunchy bite.";
  }
  if (name.includes("manchurian") || name.includes("chilli")) {
    return "Wok-tossed in a savory, zesty garlic and soy glaze with crisp bell peppers, onions, and spring greens. Mildly spicy with a tangy kick.";
  }
  if (name.includes("kebab") || name.includes("kabab")) {
    return "Melt-in-mouth ground preparation blended with royal spices and fresh herbs, pan-grilled until golden brown, juicy, and aromatic.";
  }
  if (name.includes("roti") || name.includes("naan") || name.includes("kulcha")) {
    return "Freshly baked in the clay oven, soft, layered, and lightly brushed with melted butter. The perfect companion for curries and gravies.";
  }
  if (name.includes("curry") || name.includes("masala") || name.includes("gravy")) {
    return "Simmered in an onion-tomato gravy with freshly ground spices. Hearty, aromatic, and deeply flavorful with a medium spicy profile.";
  }
  if (cat.includes("dessert") || name.includes("jamun") || name.includes("halwa")) {
    return "Delightfully sweet, warm, and rich in ghee and cardamom, offering a comforting royal finish to your meal.";
  }
  if (cat.includes("drink") || cat.includes("beverage")) {
    return "Refreshing, chilled, and revitalizing, crafted to cleanse your palate and complement flavorful dishes.";
  }

  return "Prepared fresh to order by our chefs using premium ingredients and traditional recipes. Balanced in spices, flavorful, and satisfying.";
}

/**
 * Intelligent recommendation engine:
 * When withStarters is true, ALWAYS includes BOTH Starters AND Main Course dishes (+ breads).
 * When withStarters is false, includes Main Course dishes (+ breads) without starters.
 */
function buildRecommendations({ menu, isVeg, members, withStarters }) {
  const groups = isVeg ? menu?.veg || {} : menu?.nonVeg || {};
  const allItems = Object.values(groups).flat().filter((i) => i.isAvailable !== false);

  if (allItems.length === 0) return [];

  const starterCategories = ["starter", "starters", "appetizer", "appetizers", "snacks", "tandoori", "soup", "soups"];
  const breadCategories = ["bread", "breads", "roti", "rotis", "naan", "kulcha"];
  const beverageCategories = ["beverage", "beverages", "drink", "drinks", "dessert", "desserts", "sweet", "sweets"];

  const starterItems = [];
  const mainItems = [];
  const breadItems = [];
  const drinkDessertItems = [];

  // Categorize directly by category and item attributes
  allItems.forEach((item) => {
    const catName = (item.category || "").toLowerCase();
    const itemName = (item.name || "").toLowerCase();

    if (starterCategories.some((sc) => catName.includes(sc))) {
      starterItems.push(item);
    } else if (breadCategories.some((bc) => catName.includes(bc))) {
      breadItems.push(item);
    } else if (beverageCategories.some((dc) => catName.includes(dc))) {
      drinkDessertItems.push(item);
    } else if (
      itemName.includes("tikka") &&
      !itemName.includes("masala") &&
      !itemName.includes("curry") &&
      !itemName.includes("biryani")
    ) {
      starterItems.push(item);
    } else if (
      itemName.includes("65") ||
      itemName.includes("kebab") ||
      itemName.includes("kabab") ||
      itemName.includes("crispy") ||
      itemName.includes("soup")
    ) {
      starterItems.push(item);
    } else {
      mainItems.push(item);
    }
  });

  // Safe pools
  const startersPool = starterItems.length > 0 ? starterItems : allItems.slice(0, 3);
  const mainsPool = mainItems.length > 0 ? mainItems : allItems.slice(0, 5);
  const breadsPool = breadItems.length > 0 ? breadItems : [];

  const memberScale = Math.max(1, members);
  const breadQty = memberScale > 1 ? Math.min(6, memberScale * 2) : 2;

  const combos = [];

  // Combo 1: Chef's Signature Feast (Starters + Mains + Breads)
  {
    const items = [];
    if (withStarters && startersPool[0]) {
      items.push({ ...startersPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    }
    if (mainsPool[0]) {
      items.push({ ...mainsPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    }
    if (mainsPool[1] && memberScale >= 2) {
      items.push({ ...mainsPool[1], quantity: 1 });
    }
    if (breadsPool[0]) {
      items.push({ ...breadsPool[0], quantity: breadQty });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-1",
      title: "Chef's Signature Feast",
      badge: "Chef's Choice",
      tagline: withStarters
        ? `Complete course with signature starter, rich main gravy, and accompaniments`
        : `Wholesome main course with curries and freshly baked breads`,
      items,
      totalPrice: total,
    });
  }

  // Combo 2: Popular Bestsellers Platter
  {
    const items = [];
    if (withStarters) {
      const st = startersPool.length > 1 ? startersPool[1] : startersPool[0];
      if (st) items.push({ ...st, quantity: memberScale >= 3 ? 2 : 1 });
    }
    // Pick biryani or hearty main
    const biryaniMain = mainsPool.find((m) => (m.name || "").toLowerCase().includes("biryani")) || mainsPool[0];
    if (biryaniMain) {
      items.push({ ...biryaniMain, quantity: memberScale >= 3 ? 2 : 1 });
    }
    const curryMain = mainsPool.find((m) => m.id !== biryaniMain?.id) || mainsPool[1];
    if (curryMain && memberScale >= 2) {
      items.push({ ...curryMain, quantity: 1 });
    }
    if (breadsPool.length > 1) {
      items.push({ ...breadsPool[1], quantity: breadQty });
    } else if (breadsPool[0]) {
      items.push({ ...breadsPool[0], quantity: breadQty });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-2",
      title: "Popular Bestsellers Platter",
      badge: "Most Popular",
      tagline: withStarters
        ? `Customer favorite starter combined with authentic mains and breads`
        : `Top rated main dishes and breads balanced for your table`,
      items,
      totalPrice: total,
    });
  }

  // Combo 3: Express Value Meal
  {
    const items = [];
    if (withStarters) {
      const st = startersPool.length > 2 ? startersPool[2] : startersPool[0];
      if (st) items.push({ ...st, quantity: 1 });
    }
    const quickMain = mainsPool.length > 2 ? mainsPool[2] : mainsPool[0];
    if (quickMain) {
      items.push({ ...quickMain, quantity: memberScale >= 3 ? 2 : 1 });
    }
    if (breadsPool[0]) {
      items.push({ ...breadsPool[0], quantity: Math.max(2, memberScale) });
    } else if (drinkDessertItems[0]) {
      items.push({ ...drinkDessertItems[0], quantity: 1 });
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-3",
      title: "Express Value Combo",
      badge: "Quick Prep",
      tagline: withStarters
        ? `Fast-served starter paired with a flavorful main dish`
        : `Speedy preparation, hearty flavors and great value`,
      items,
      totalPrice: total,
    });
  }

  // Combo 4: Grand Royal Banquet (Rich multi-course selection)
  if (allItems.length >= 4) {
    const items = [];
    if (withStarters) {
      if (startersPool[0]) items.push({ ...startersPool[0], quantity: 1 });
      if (startersPool[1]) items.push({ ...startersPool[1], quantity: 1 });
    }
    if (mainsPool[0]) items.push({ ...mainsPool[0], quantity: memberScale >= 3 ? 2 : 1 });
    if (mainsPool[1]) items.push({ ...mainsPool[1], quantity: 1 });
    if (breadsPool[0]) items.push({ ...breadsPool[0], quantity: breadQty });
    if (drinkDessertItems[0]) items.push({ ...drinkDessertItems[0], quantity: 1 });

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    combos.push({
      id: "combo-4",
      title: "Grand Royal Feast",
      badge: "Grand Feast",
      tagline: withStarters
        ? `Lavish feast with dual appetizers, signature main course, and sides`
        : `Elaborate main spread with curries, breads, and accompaniments`,
      items,
      totalPrice: total,
    });
  }

  return combos;
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
  const { clearCart, addItem } = useCart();
  const chatEndRef = useRef(null);

  const [step, setStep] = useState(1);
  const [selectedDiet, setSelectedDiet] = useState(null); // "veg" | "non-veg"
  const [membersCount, setMembersCount] = useState(2);
  const [withStarters, setWithStarters] = useState(null); // boolean

  // Custom item inquiry input
  const [inquiryText, setInquiryText] = useState("");
  const [inquiryItemResult, setInquiryItemResult] = useState(null);

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [orderingComboId, setOrderingComboId] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  const displayName = menu?.restaurantName || menu?.restaurant?.name || restaurantName || "ALPHAY";
  const activeTableNumber = isParcel ? "PARCEL" : (menu?.tableNumber || "1");

  // All menu items flattened for inquiry search
  const allFlattenedItems = useMemo(() => {
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
    return Array.from(map.values());
  }, [menu]);

  // Reset conversation to initial state
  const resetChat = () => {
    setStep(1);
    setSelectedDiet(null);
    setMembersCount(2);
    setWithStarters(null);
    setInquiryText("");
    setInquiryItemResult(null);
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

  useEffect(() => {
    if (isOpen) {
      resetChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, displayName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, step, inquiryItemResult]);

  // STEP 1: Handle Veg / Non-Veg Selection
  const handleSelectDiet = (diet) => {
    setSelectedDiet(diet);
    const label = diet === "veg" ? "Veg" : "Non-Veg";

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
    }, 400);
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
    }, 400);
  };

  // STEP 3: Handle Starters Selection
  const handleSelectStarters = (hasStarters) => {
    setWithStarters(hasStarters);
    const label = hasStarters ? "With Starters" : "Without Starters";

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
          } (${selectedDiet === "veg" ? "Pure Veg" : "Non-Veg"}, ${
            hasStarters ? "with starters and main course" : "main course & breads"
          }):`,
        },
      ]);
      setStep(4);
    }, 550);
  };

  // STEP 4: Recommended combos
  const recommendedCombos = useMemo(() => {
    if (!menu) return [];
    return buildRecommendations({
      menu,
      isVeg: selectedDiet === "veg",
      members: membersCount,
      withStarters: Boolean(withStarters),
    });
  }, [menu, selectedDiet, membersCount, withStarters]);

  // Handle custom dish inquiry via typing input
  const handleSendInquiry = (e) => {
    if (e) e.preventDefault();
    const query = inquiryText.trim();
    if (!query) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-inquiry-${Date.now()}`, sender: "user", text: query },
    ]);
    setInquiryText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const cleanQ = query.toLowerCase();

      // Search all menu items
      const exactMatch = allFlattenedItems.find(
        (i) => i.name.toLowerCase() === cleanQ
      );
      const partialMatch =
        exactMatch ||
        allFlattenedItems.find((i) => i.name.toLowerCase().includes(cleanQ)) ||
        allFlattenedItems.find((i) =>
          cleanQ.split(" ").some((w) => w.length > 2 && i.name.toLowerCase().includes(w))
        );

      if (partialMatch) {
        const desc = getItemDescription(partialMatch);
        const replyText = `${partialMatch.name} (${partialMatch.isVeg ? "Veg" : "Non-Veg"} - ₹${partialMatch.price.toFixed(0)}):\n${desc}`;

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-item-answer-${Date.now()}`,
            sender: "ai",
            text: replyText,
            itemAction: partialMatch,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-not-found-${Date.now()}`,
            sender: "ai",
            text: `I couldn't find "${query}" on our current menu, but we have popular dishes like ${allFlattenedItems
              .slice(0, 3)
              .map((i) => i.name)
              .join(", ")}. Feel free to ask about any of them!`,
          },
        ]);
      }
    }, 500);
  };

  // Order a single item from the inquiry chat response
  const handleOrderSingleItem = (item) => {
    addItem(item, 1);
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-item-added-${Date.now()}`,
        sender: "ai",
        text: `Added ${item.name} (₹${item.price.toFixed(0)}) to your cart! You can continue asking or view cart to order.`,
      },
    ]);
  };

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
        tableNumber: activeTableNumber,
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
        tableNumber: res.tableNumber || activeTableNumber,
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
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    PARCEL COUNTER
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-slate-700">
                    TABLE {activeTableNumber}
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
                className="flex items-center gap-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer font-['Cinzel']"
                title="Restart chat"
              >
                Start Over
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto pb-24">
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

                {/* Quick Add to Cart Button for Item Inquiries */}
                {msg.itemAction && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-amber-400 font-bold text-xs">
                      ₹{msg.itemAction.price.toFixed(0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOrderSingleItem(msg.itemAction)}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-slate-950 hover:bg-amber-400 transition-colors font-['Cinzel']"
                    >
                      Add to Cart
                    </button>
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
                  className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/40 p-4 hover:border-emerald-400 hover:bg-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="block font-['Cinzel'] text-base font-black text-emerald-400">
                    VEG
                  </span>
                  <span className="text-[11px] text-slate-400">Pure Vegetarian</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDiet("non-veg")}
                  className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-900/95 border-2 border-rose-500/40 p-4 hover:border-rose-400 hover:bg-rose-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="block font-['Cinzel'] text-base font-black text-rose-400">
                    NON-VEG
                  </span>
                  <span className="text-[11px] text-slate-400">Chicken, Meat & Seafood</span>
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
                Select table size:
              </p>

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
                Starters preference:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectStarters(true)}
                  className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/40 p-4 hover:border-amber-400 hover:bg-amber-950/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="block font-['Cinzel'] text-xs sm:text-sm font-black text-amber-300">
                    WITH STARTERS
                  </span>
                  <span className="text-[10px] text-slate-400">Includes appetizers & main course</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStarters(false)}
                  className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-900/95 border-2 border-slate-700 p-4 hover:border-amber-500/40 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span className="block font-['Cinzel'] text-xs sm:text-sm font-black text-slate-200">
                    WITHOUT STARTERS
                  </span>
                  <span className="text-[10px] text-slate-400">Direct main course & breads</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: RECOMMENDATIONS DISPLAY (Combos always contain mains + starters when requested) */}
          {step === 4 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 pl-0 sm:pl-10.5 flex flex-col gap-4"
            >
              {orderError && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-3 text-xs font-bold text-rose-200">
                  {orderError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendedCombos.map((combo, index) => (
                  <div
                    key={combo.id}
                    className="relative flex flex-col justify-between rounded-3xl bg-slate-900/95 border border-amber-500/30 p-4 shadow-xl hover:border-amber-400/60 transition-all group"
                  >
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
              <div className="pt-2 flex flex-col items-center justify-center gap-2 text-center pb-2">
                <p className="text-xs text-slate-400">
                  Prefer selecting individual items directly from the complete menu?
                </p>
                <button
                  type="button"
                  onClick={handleOrderByYourself}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700/80 px-5 py-2.5 text-xs font-bold text-slate-200 hover:border-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-md"
                >
                  <span>Order by yourself</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Browse Full Menu)</span>
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
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl mb-3 text-emerald-400 shadow-xl shadow-emerald-500/20 font-bold">
                ✓
              </div>

              <h2 className="font-['Cinzel'] text-xl font-black text-amber-300 mb-1">
                {placedOrderDetails.isParcel ? "Parcel Order Confirmed" : "Order Sent to Kitchen"}
              </h2>

              <p className="text-xs text-slate-300 mb-4">
                {placedOrderDetails.isParcel
                  ? "Your takeaway order is confirmed and sent to packaging."
                  : `Order placed for Table ${placedOrderDetails.tableNumber}. The chef has started preparation!`}
              </p>

              {placedOrderDetails.isParcel && (
                <div className="w-full rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 p-4 mb-4 text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-['Cinzel'] mb-1">
                    PARCEL PICKUP TOKEN
                  </p>
                  <p className="font-mono text-3xl font-black text-amber-400 tracking-wider">
                    #{placedOrderDetails.token || placedOrderDetails.orderSeq || "1024"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Show this 4-digit number at the Parcel Counter to collect your packaged food.
                  </p>
                </div>
              )}

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
                    ? "Track Parcel Status"
                    : "Track Order & Table Bill"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 py-2.5 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Back to Menu
                </button>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* BOTTOM INTERACTIVE TYPING CHAT INPUT */}
        {step < 5 && (
          <footer className="border-t border-amber-500/20 bg-slate-900/95 p-3 sm:p-4 backdrop-blur-xl z-20">
            <form
              onSubmit={handleSendInquiry}
              className="max-w-3xl mx-auto flex items-center gap-2"
            >
              <input
                type="text"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder='Ask about any dish (e.g. "Chicken Biryani", "Paneer Butter Masala")...'
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inquiryText.trim()}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-['Cinzel'] cursor-pointer shrink-0"
              >
                Ask
              </button>
            </form>
          </footer>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
