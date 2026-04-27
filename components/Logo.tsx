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

  return (
    <Link href="/" className="inline-flex items-center gap-2 sm:gap-3" aria-label={SITE_NAME}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-news-red text-white sm:h-10 sm:w-10">
        <LogoMark />
      </span>
      <span className={`font-serif font-bold tracking-tight ${primaryText} ${compact ? "text-lg" : "text-lg sm:text-2xl lg:text-4xl"}`}>
        {SITE_NAME}
      </span>
    </Link>
  );
}
