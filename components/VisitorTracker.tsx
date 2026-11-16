"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    try {
      const STORAGE_KEY = "uppiliees_vid";

      // 1. Retrieve or generate anonymous visitor ID
      let vid = localStorage.getItem(STORAGE_KEY);
      if (!vid) {
        // Try reading cookie as fallback
        const match = document.cookie.match(new RegExp(`(^|;\\s*)${STORAGE_KEY}=([^;]*)`));
        if (match && match[2]) {
          vid = decodeURIComponent(match[2]);
        }
      }

      if (!vid) {
        // Generate a random visitor ID without personal information
        const randomPart = Math.random().toString(36).substring(2, 12);
        const timePart = Date.now().toString(36);
        vid = `vis_${randomPart}${timePart}`;
      }

      // 2. Persist in localStorage and 1-year cookie
      localStorage.setItem(STORAGE_KEY, vid);
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(vid)}; path=/; max-age=31536000; SameSite=Lax`;

      // 3. Send anonymous ping to /api/track on page load
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Pass cookies so logged-in users get linked safely
        body: JSON.stringify({ visitor_id: vid }),
      }).catch(() => {
        // Silent failure so user browsing is never interrupted
      });
    } catch {
      // In private browsing mode or storage disabled, silently ignore
    }
  }, []);

  return null;
}
