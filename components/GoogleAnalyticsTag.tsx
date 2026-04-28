import Script from "next/script";

function resolveGaMeasurementId(): string | null {
  const raw = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-YWMMPX0CNR").trim();
  if (!raw) return null;
  return /^G-[A-Z0-9]+$/.test(raw) ? raw : null;
}

/**
 * Manual Google tag (gtag.js) install.
 * Loaded after interactive to avoid blocking initial render.
 */
export function GoogleAnalyticsTag() {
  const measurementId = resolveGaMeasurementId();
  if (!measurementId) return null;

  return (
    <>
      <Script
        id="google-gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `,
        }}
      />
    </>
  );
}
