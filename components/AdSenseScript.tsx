"use client";

import { useEffect } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8538567628743584";

/**
 * AdSense loader without Next Script `data-nscript` attribute.
 * Injected on idle to keep initial render/LCP light.
 */
export function AdSenseScript() {
  useEffect(() => {
    if (document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)) {
      return;
    }

    const inject = () => {
      const script = document.createElement("script");
      script.async = true;
      script.src = ADSENSE_SRC;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };

    if (typeof win.requestIdleCallback === "function") {
      win.requestIdleCallback(inject);
      return;
    }

    const timer = globalThis.setTimeout(inject, 1200);
    return () => globalThis.clearTimeout(timer);
  }, []);

  return null;
}
