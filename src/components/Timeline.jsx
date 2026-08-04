"use client";

import { motion } from "framer-motion";

const STEPS = [
  { key: "CONFIRMED", label: "Payment Received" },
  { key: "CONFIRMED_2", label: "Order Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "SERVED", label: "Served" },
];

// Maps an order's DB status to how many timeline steps are complete.
const STATUS_INDEX = {
  CONFIRMED: 1, // payment received + order confirmed both land here
  PREPARING: 2,
  READY: 3,
  SERVED: 4,
};

export default function Timeline({ status }) {
  const activeIndex = STATUS_INDEX[status] ?? 0;

  return (
    <ol className="flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const complete = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{
                  backgroundColor: complete ? "#6D28D9" : "#EDE7FD",
                  scale: isCurrent ? 1.15 : 1,
                }}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm text-white"
              >
                {complete ? "✓" : ""}
              </motion.span>
              {i < STEPS.length - 1 && (
                <span
                  className={`w-0.5 flex-1 ${i < activeIndex ? "bg-purple" : "bg-purple-100"}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            <div className="pb-7">
              <p
                className={`text-sm font-semibold ${complete ? "text-ink" : "text-ink2"} ${
                  isCurrent ? "font-display text-base" : ""
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-ink2">
                  {step.key === "PREPARING" && "Your food is on the stove now."}
                  {step.key === "READY" && "Almost there — being plated for service."}
                  {step.key === "SERVED" && "Enjoy your meal!"}
                  {(step.key === "CONFIRMED" || step.key === "CONFIRMED_2") &&
                    "The kitchen has your order."}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
