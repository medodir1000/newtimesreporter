import Script from "next/script";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8538567628743584";

/**
 * AdSense loader — deferred until after load (lazyOnload) to reduce main-thread work during LCP.
 */
export function AdSenseScript() {
  return (
    <Script id="adsense-pagead" src={ADSENSE_SRC} strategy="lazyOnload" crossOrigin="anonymous" />
  );
}
