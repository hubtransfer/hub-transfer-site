"use client";

import { useEffect, useState } from "react";

const GOOGLE_MAPS_KEY = "AIzaSyBe4UwnVYRP5KAUOtHg3diD6kPTif3VN30";
let scriptStatus: "idle" | "loading" | "loaded" = "idle";
const listeners: Array<() => void> = [];

function notifyListeners() {
  for (const fn of listeners) fn();
  listeners.length = 0;
}

export function useGoogleMaps(): boolean {
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!window.google?.maps?.places;
  });

  useEffect(() => {
    if (loaded) return;

    // Already loaded by another instance or external script
    if (window.google?.maps?.places) {
      scriptStatus = "loaded";
      setLoaded(true);
      return;
    }

    if (scriptStatus === "loaded") {
      setLoaded(true);
      return;
    }

    if (scriptStatus === "loading") {
      // Wait for the first loader to finish
      listeners.push(() => setLoaded(true));
      return;
    }

    // Check if script tag already exists (e.g. portal layout loads it)
    const existing = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
    if (existing) {
      scriptStatus = "loading";
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          scriptStatus = "loaded";
          setLoaded(true);
          notifyListeners();
        }
      }, 100);
      return () => clearInterval(check);
    }

    // Load script
    scriptStatus = "loading";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      scriptStatus = "loaded";
      setLoaded(true);
      notifyListeners();
    };
    script.onerror = () => {
      scriptStatus = "idle";
    };
    document.head.appendChild(script);
  }, [loaded]);

  return loaded;
}
