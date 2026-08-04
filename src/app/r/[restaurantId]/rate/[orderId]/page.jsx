"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";

const STARS = [1, 2, 3, 4, 5];

export default function RatingPage() {
  const { restaurantId, orderId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await api.submitRating(orderId, { stars, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Couldn't submit your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl"
        >
          🙏
        </motion.div>
        <h1 className="mt-4 font-display text-xl font-medium text-ink">Thanks for the feedback!</h1>
        <p className="mt-1 text-sm text-ink2">We hope to see you again soon.</p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="mt-8 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Back to Menu
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-medium text-ink">How was your meal?</h1>
      <p className="mt-1 text-sm text-ink2">Your feedback helps the kitchen and the staff.</p>

      <div className="mt-6 flex gap-2">
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="text-4xl transition-transform active:scale-90"
          >
            {(hovered || stars) >= n ? "⭐" : "☆"}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more (optional)…"
        rows={3}
        className="mt-6 w-full max-w-sm rounded-xl border border-purple/15 bg-white p-3 text-sm text-ink placeholder:text-ink2/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
      />

      {error && (
        <p className="mt-3 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={stars === 0 || submitting}
        className="mt-6 w-full max-w-sm rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </main>
  );
}
