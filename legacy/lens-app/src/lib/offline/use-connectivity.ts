"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that tracks connectivity and poll freshness.
 * Components using polling can call markSuccess() after each successful poll
 * and markFailure() on poll errors. The hook exposes online status and
 * lastUpdated timestamp for stale indicators.
 */
export function useConnectivity() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const markSuccess = useCallback(() => {
    failCountRef.current = 0;
    setLastUpdated(new Date());
  }, []);

  const markFailure = useCallback(() => {
    failCountRef.current++;
  }, []);

  // Consider stale if offline, or 2+ consecutive poll failures
  const isStale = !online || failCountRef.current >= 2;

  return { online, lastUpdated, isStale, markSuccess, markFailure };
}
