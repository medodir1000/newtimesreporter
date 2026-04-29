type NewsTickerProps = {
  items: string[];
};

export function NewsTicker({ items }: NewsTickerProps) {
  const loop = [...items, ...items];

  return (
    <div className="ntr-ticker max-w-[54vw] sm:max-w-none">
      <div className="ntr-ticker-track text-xs text-white sm:text-sm">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex shrink-0 items-center">
            <span className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-news-red" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
