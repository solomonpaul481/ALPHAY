"use client";

import { useEffect, useState } from "react";

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-purple/30 bg-purple px-4 py-2.5 text-xs font-semibold text-white shadow-lift hover:bg-purple-deep transition-all active:scale-95 cursor-pointer"
      title="Toggle Full Screen View"
    >
      <span className="text-sm">{isFullscreen ? "📉" : "⛶"}</span>
      <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
    </button>
  );
}
