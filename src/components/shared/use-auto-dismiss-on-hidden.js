import { useEffect, useRef } from "react";

export default function useAutoDismissOnHidden(active, onHidden) {
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      dismissedRef.current = false;
      return undefined;
    }

    function handleHidden() {
      if (dismissedRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "hidden") return;
      dismissedRef.current = true;
      onHidden?.();
    }

    document.addEventListener("visibilitychange", handleHidden);
    window.addEventListener("blur", handleHidden);
    window.addEventListener("pagehide", handleHidden);

    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("blur", handleHidden);
      window.removeEventListener("pagehide", handleHidden);
    };
  }, [active, onHidden]);
}
