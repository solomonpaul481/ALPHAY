"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PaymentPageRedirect() {
  const { restaurantId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (restaurantId) {
      router.replace(`/r/${restaurantId}/track`);
    }
  }, [restaurantId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 font-['Cinzel'] font-bold text-xs">
      Redirecting to Session Track & Bill...
    </div>
  );
}
