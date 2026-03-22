"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useShakeToCart — detects device shake via DeviceMotion API (iOS / mobile)
 * and calls the provided callback (toggle cart drawer).
 *
 * Uses acceleration including gravity for best iOS compatibility.
 * Requires user gesture to request permission on iOS 13+.
 */
export function useShakeToCart(onShake: () => void) {
  const lastShake = useRef(0);
  const shakeThreshold = 15; // m/s² — lowered for reliable iOS shake detection
  const cooldown = 1500; // ms between triggers — prevents accidental double-trigger

  const handleMotion = useCallback(
    (e: DeviceMotionEvent) => {
      // Use acceleration (without gravity) when available — gives cleaner shake signal
      const acc = e.acceleration || e.accelerationIncludingGravity;
      if (!acc) return;

      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);

      if (total > shakeThreshold) {
        const now = Date.now();
        if (now - lastShake.current > cooldown) {
          lastShake.current = now;
          onShake();
        }
      }
    },
    [onShake]
  );

  useEffect(() => {
    // Only run on devices that support DeviceMotionEvent
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;

    // iOS 13+ requires permission request — we attach it to first user touch
    const requestPermission = async () => {
      try {
        const DME = DeviceMotionEvent as any;
        if (typeof DME.requestPermission === "function") {
          const perm = await DME.requestPermission();
          if (perm !== "granted") return;
        }
        window.addEventListener("devicemotion", handleMotion, { passive: true });
      } catch {
        // Permission denied or not available
      }
    };

    // On iOS we need to attach to a user gesture first
    const onFirstTouch = () => {
      requestPermission();
      // Don't remove listener — allow re-requesting if permission was denied
    };

    // Try to add immediately (works on Android & desktop dev)
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === "function") {
      // iOS — wait for user touch, keep listening for subsequent touches
      window.addEventListener("touchstart", onFirstTouch, { passive: true });
    } else {
      // Non-iOS — add directly
      window.addEventListener("devicemotion", handleMotion, { passive: true });
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("touchstart", onFirstTouch);
    };
  }, [handleMotion]);
}
