"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const isSample = !process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Favorites are persisted server-side (favorite_schools table) so they're
 * identical whether toggled from the Schools grid or the Coaches table,
 * and survive reloads/devices instead of resetting per page load.
 */
export function useFavoriteSchools() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(isSample);
  // If the user toggles a favorite before the initial GET resolves, the
  // GET's response would otherwise land last and clobber that click with
  // stale server state. Once a toggle happens, the fetch response is
  // ignored — the optimistic local state is already authoritative.
  const toggledRef = useRef(false);

  useEffect(() => {
    if (isSample) return;
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : { schools: [] }))
      .then((data: { schools: string[] }) => {
        if (!toggledRef.current) setFavorites(new Set(data.schools));
      })
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback((schoolName: string) => {
    toggledRef.current = true;
    setFavorites((prev) => {
      const next = new Set(prev);
      const wasFavorited = next.has(schoolName);
      if (wasFavorited) next.delete(schoolName);
      else next.add(schoolName);

      if (!isSample) {
        fetch("/api/favorites", {
          method: wasFavorited ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_name: schoolName }),
        }).catch(() => {});
      }

      return next;
    });
  }, []);

  return { favorites, toggle, loaded };
}
