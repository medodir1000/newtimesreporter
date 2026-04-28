import Script from "next/script";

function resolveGtmId(): string | null {
  const raw = (process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-P7DJJJWJ").trim();
  if (!raw) return null;
  return /^GTM-[A-Z0-9]+$/.test(raw) ? raw : null;
}

/**
 * Google Tag Manager install snippet (head script + body noscript fallback).
 * Default strategy is beforeInteractive to match GTM install docs.
 * Override with NEXT_PUBLIC_GTM_ID; set empty to disable.
 */
export function GoogleTagManager() {
  const gtmId = resolveGtmId();
  if (!gtmId) return null;

  const strategyEnv = (process.env.NEXT_PUBLIC_GTM_STRATEGY ?? "beforeInteractive").trim();
  const strategy =
    strategyEnv === "beforeInteractive" || strategyEnv === "afterInteractive" || strategyEnv === "lazyOnload"
      ? strategyEnv
      : "beforeInteractive";

  const inlineScript = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;

  return (
    <>
      <Script id="google-tag-manager" strategy={strategy} dangerouslySetInnerHTML={{ __html: inlineScript }} />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height={0}
          width={0}
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
