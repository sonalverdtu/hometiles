"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isKidLocked, KIDLOCK_EVENT } from "@/lib/client/store";

/**
 * While the child lock is on, every page leads back to the board and the site's header and footer are
 * removed (not just covered), so neither a typed URL nor the keyboard can take the child out of their board.
 */
export function LockGuard() {
  const path = usePathname();
  useEffect(() => {
    const sync = () => {
      const on = isKidLocked();
      if (on) document.documentElement.dataset.kidlock = "1";
      else delete document.documentElement.dataset.kidlock;
      if (on && path !== "/board") window.location.replace("/board");
    };
    sync();
    window.addEventListener(KIDLOCK_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(KIDLOCK_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [path]);
  return null;
}
