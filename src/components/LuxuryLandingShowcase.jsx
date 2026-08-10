"use client";

import { motion } from "framer-motion";
import { IconArrowRight } from "./Icons";

export default function LuxuryLandingShowcase({ onProceed, restaurantName }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 text-white overflow-hidden select-none px-4 py-8"
    >
      {/* Dark Ambient Lantern Bokeh & Glow Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

      {/* TOP BRANDING: LOGO & TAGLINE */}
      <div className="relative z-20 flex flex-col items-center text-center mt-2">
        {/* Golden Crest Logo Icon */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-2"
        >
          <svg className="h-16 w-16 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
            <path d="M50 15 C 30 15, 20 40, 45 65 C 60 80, 75 50, 50 30 C 35 15, 65 15, 50 85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Brand Name ALPHAY */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-['Cinzel'] uppercase drop-shadow-md"
        >
          {restaurantName || "ALPHAY"}
          <span className="text-xs align-top font-sans text-amber-400 ml-1">®</span>
        </motion.h1>

        {/* Sub-tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-1 text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-amber-400/90 uppercase font-['Cinzel']"
        >
          FLAVOR THAT CONNECTS
        </motion.p>
      </div>

      {/* CENTER HERO VISUAL FEAST IMAGE WITH FLOATING STEAM ANIMATION */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="relative z-10 my-auto w-full max-w-lg flex flex-col items-center justify-center"
      >
        {/* Main Gourmet Biryani & Drink Feast Illustration / Graphic Container */}
        <div className="relative w-full aspect-[4/4.8] max-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=85"
            alt="Royal Gourmet Feast"
            className="h-full w-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
          />

          {/* Dark Lighting Overlay Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />

          {/* Wisps of Rising Steam Particles */}
          <motion.div
            animate={{
              y: [-10, -35, -55],
              opacity: [0, 0.4, 0],
              scale: [0.8, 1.2, 1.5],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none"
          />

          {/* Additional Steam Particles */}
          <motion.div
            animate={{
              y: [0, -25, -45],
              opacity: [0, 0.3, 0],
              scale: [0.9, 1.3, 1.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 1.5,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/3 w-28 h-28 rounded-full bg-amber-100/15 blur-2xl pointer-events-none"
          />

          {/* Overlay Luxury Text inside graphic */}
          <div className="absolute bottom-6 inset-x-4 text-center z-20 pointer-events-none">
            <p className="text-[10px] font-bold tracking-[0.3em] text-amber-300 uppercase font-['Cinzel']">
              DISCOVER. ORDER. ENJOY.
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-['Cinzel']">
              EXPERIENCE <span className="text-amber-400">FLAVOR</span>
            </h2>
            <p className="mt-0.5 text-2xl sm:text-3xl font-normal text-amber-300 font-['Great_Vibes'] capitalize tracking-wide drop-shadow-md">
              like never before
            </p>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM ACTION BUTTON: EXPLORE MENU */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-30 w-full max-w-sm flex flex-col items-center mb-4"
      >
        <button
          type="button"
          onClick={onProceed}
          className="group relative w-full flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 px-8 py-4 text-sm sm:text-base font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-200/60 transition-all duration-300 cursor-pointer"
        >
          {/* Dish Cloche Dome Icon */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/15 text-slate-950 group-hover:scale-110 transition-transform">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 4V2M4 18h16M4 18c0-4.418 3.582-8 8-8s8 3.582 8 8M12 10a2 2 0 100-4 2 2 0 000 4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <span className="font-['Cinzel'] tracking-[0.2em] font-extrabold">EXPLORE MENU</span>

          <IconArrowRight className="h-5 w-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-3 text-[10px] font-medium tracking-widest text-slate-400 uppercase">
          Touch to enter table number & unlock digital ordering
        </p>
      </motion.div>
    </motion.div>
  );
}
