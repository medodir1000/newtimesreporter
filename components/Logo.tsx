import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

function LogoMark() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 3h12a1 1 0 011 1v16H5V4a1 1 0 011-1zm1 2v12h10V5H7zm2 2h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z" />
    </svg>
  );
}

type LogoProps = {
  compact?: boolean;
  light?: boolean;
};

export function Logo({ compact = false, light = false }: LogoProps) {
  const primaryText = light ? "text-white" : "text-news-black";
  const secondaryText = light ? "text-red-300" : "text-news-red";

  return (
    <Link href="/" className="inline-flex min-w-0 items-center gap-2 sm:gap-3" aria-label={SITE_NAME}>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-news-red text-white sm:h-10 sm:w-10">
        <LogoMark />
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={`block truncate font-serif font-bold tracking-[0.08em] sm:tracking-[0.14em] ${primaryText} ${compact ? "text-base" : "text-[0.98rem] sm:text-2xl lg:text-4xl"}`}
        >
          NEW TIMES
        </span>
        <span
          className={`block truncate font-sans font-semibold uppercase tracking-[0.14em] sm:tracking-[0.28em] ${secondaryText} ${compact ? "text-[9px]" : "text-[9px] sm:text-xs"}`}
        >
          REPORTER
        </span>
      </span>
    </Link>
  );
}
