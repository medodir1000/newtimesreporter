"use client";

import { useEffect } from "react";

type ArticleViewTrackerProps = {
  slug: string;
};

export function ArticleViewTracker({ slug }: ArticleViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    const key = `article-view:${slug}:${new Date().toISOString().slice(0, 10)}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key)) {
      return;
    }

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ slug })
    }).finally(() => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, "1");
      }
    });
  }, [slug]);

  return null;
}
