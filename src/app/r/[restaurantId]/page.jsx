"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import { IconUtensils, IconArrowRight, IconSparkles, IconClock, IconQrCode } from "@/components/Icons";

function LandingForm() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState(searchParams.get("table") || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 3D Tilt Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAX Restaurant" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async (e) => {
    if (e) e.preventDefault();
    const cleanTable = tableNumber.trim();
    if (!cleanTable) return;
    setError("");
    setSubmitting(true);

    try {
      await api.startSession({ tableNumber: cleanTable });
      router.push(`/r/${restaurantId}/menu`);
    } catch (err) {
      setError(err.message || "Invalid table number. Please check your table number and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/60 dark:border-slate-800 backdrop-blur-xl transition-shadow duration-500 hover:shadow-purple-500/20"
      >
        {/* Floating 3D Glowing Accent Orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* 3D Content Layers */}
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10 text-center">
          {/* Logo Badge */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/30 text-white transform transition-transform duration-500 group-hover:scale-105">
            {restaurant?.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-12 w-12 object-contain" />
            ) : (
              <IconUtensils className="h-10 w-10 text-white" />
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-slate-800 px-3.5 py-1 text-xs font-bold text-purple dark:text-purple-300 border border-purple-100 dark:border-slate-700">
            <IconSparkles className="h-3.5 w-3.5" /> ALPHAX DIGITAL DINING EXPERIENCE
          </span>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">
            {restaurant?.name || "Welcome"}
          </h1>

          <p className="mt-2 text-xs font-semibold text-ink2 max-w-sm mx-auto">
            Scan QR Code verified. Please enter your dining table number to browse our menu and order.
          </p>

          {/* Quick Feature Chips */}
          <div style={{ transform: "translateZ(20px)" }} className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1 rounded-full bg-purple-50/80 dark:bg-slate-800 px-3 py-1 text-purple">
              <IconQrCode className="h-3.5 w-3.5" /> QR Direct Order
            </span>
            <span className="flex items-center gap-1 rounded-full bg-veg-tint px-3 py-1 text-veg">
              <IconClock className="h-3.5 w-3.5" /> Instant Kitchen KDS
            </span>
            <span className="flex items-center gap-1 rounded-full bg-purple-50/80 dark:bg-slate-800 px-3 py-1 text-purple">
              <IconSparkles className="h-3.5 w-3.5" /> Live Order Tracking
            </span>
          </div>

          {/* Manual Table Number Input Form */}
          <form
            onSubmit={handleContinue}
            style={{ transform: "translateZ(40px)" }}
            className="mt-8 rounded-2xl bg-purple-50/40 dark:bg-slate-800/60 p-5 border border-purple-100/60 dark:border-slate-700 text-left shadow-inner"
          >
            <label htmlFor="table" className="block text-[11px] font-extrabold uppercase tracking-wider text-ink2">
              Enter Your Table Number
            </label>

            <div className="relative mt-2">
              <input
                id="table"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                type="text"
                inputMode="text"
                placeholder="e.g. Table 12"
                autoFocus
                className="w-full rounded-xl border border-purple-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 text-center text-2xl font-black text-ink placeholder:text-ink2/40 focus:border-purple focus:outline-none focus:ring-4 focus:ring-purple/20 transition-all"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-nonveg-tint p-3 text-xs font-bold text-nonveg text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!tableNumber.trim() || submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-4 text-base font-bold text-white shadow-xl shadow-purple-600/30 transition-all hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying Table...
                </span>
              ) : (
                <>
                  <span>Explore Menu & Order</span>
                  <IconArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-[10px] font-semibold text-ink2">
            No GPS app required. Simply enter your table number to proceed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-purple-900/10 via-slate-900/5 to-purple-900/10 px-6 py-12">
      {/* Dynamic 3D Particle Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />
      
      <Suspense fallback={<div className="text-sm font-bold text-ink2">Loading 3D Dining Experience...</div>}>
        <LandingForm />
      </Suspense>
    </main>
  );
}
