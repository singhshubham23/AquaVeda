import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useScrollToHash(deps = []) {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;

    const targetId = decodeURIComponent(hash.replace(/^#/, ""));
    const timer = window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hash, pathname, ...deps]);
}
