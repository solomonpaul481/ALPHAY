/**
 * Audio chime and notification helper when chef marks an order READY.
 * Uses Web Audio API to synthesize a clean, pleasant, multi-tone restaurant pickup bell
 * with zero external assets, fast execution, and full mobile support.
 */

export function playOrderReadyChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Four-tone service bell chord (C5 -> E5 -> G5 -> C6)
    const tones = [
      { freq: 523.25, timeOffset: 0.0, gain: 0.35 },
      { freq: 659.25, timeOffset: 0.12, gain: 0.35 },
      { freq: 783.99, timeOffset: 0.24, gain: 0.4 },
      { freq: 1046.5, timeOffset: 0.38, gain: 0.45 },
    ];

    tones.forEach(({ freq, timeOffset, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);

      const startTime = ctx.currentTime + timeOffset;
      const duration = 0.9;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Mobile vibration pattern: short buzz - short buzz - long buzz
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 450]);
    }
  } catch (err) {
    console.warn("Audio chime could not play automatically:", err);
  }
}

export function notifyOrderReady({ token, isCafeteria = true }) {
  // 1. Play Audio Chime & Vibrate
  playOrderReadyChime();

  // 2. Trigger Browser / Phone Notification if permitted
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      const title = "🔔 Order Ready for Pickup!";
      const body = token
        ? `Token #${token}: Your food is ready! Please collect your order at the counter.`
        : "Your order is ready! Please collect your order at the counter.";

      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `order-ready-${token || "token"}`,
        requireInteraction: true,
      });
    } catch (e) {
      // Notification failed or blocked
    }
  }
}

export async function requestAlertNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  } catch (e) {
    return false;
  }
}
