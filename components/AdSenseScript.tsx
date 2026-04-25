"use client";

import { useEffect } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8538567628743584";

/**
 * Loads the AdSense library without Next.js Script attributes that trigger
 * "AdSense head tag doesn't support data-nscript attribute" in dev tools.
 */
export function AdSenseScript() {
  useEffect(() => {
    if (document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  return null;
}
