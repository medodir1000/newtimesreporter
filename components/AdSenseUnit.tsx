"use client";

import { CSSProperties, useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseUnitProps = {
  adSlot: string;
  adFormat: "auto" | "fluid" | "autorelaxed";
  adClient?: string;
  fullWidthResponsive?: boolean;
  adLayout?: "in-article";
  adLayoutKey?: string;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_AD_CLIENT = "ca-pub-8538567628743584";

export function AdSenseUnit({
  adSlot,
  adFormat,
  adClient = DEFAULT_AD_CLIENT,
  fullWidthResponsive,
  adLayout,
  adLayoutKey,
  className,
  style
}: AdSenseUnitProps) {
  const minHeight =
    style?.minHeight ??
    (adFormat === "fluid" ? 140 : adFormat === "autorelaxed" ? 180 : 120);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate-init errors from hot-reload.
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", minHeight, ...style }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
      data-ad-layout={adLayout}
      data-ad-layout-key={adLayoutKey}
    />
  );
}
