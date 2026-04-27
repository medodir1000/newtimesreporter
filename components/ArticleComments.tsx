"use client";

import { useCallback, useEffect, useState } from "react";

type CommentRow = {
  id: string;
  article_slug: string;
  author_name: string;
  body: string;
  created_at: string;
};

type ArticleCommentsProps = {
  slug: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return iso;
  }
}

export function ArticleComments({ slug }: ArticleCommentsProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load comments");
        setComments([]);
        return;
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch {
      setError("Network error loading comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, authorName: name, body })
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMessage(data.error ?? "Could not post comment");
        return;
      }
      if (data.comment) {
        setComments((prev) => [...prev, data.comment as CommentRow]);
      }
      setName("");
      setBody("");
      setFormMessage("Thanks — your comment is published.");
    } catch {
      setFormMessage("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="border-b border-zinc-100 pb-2 font-serif text-lg font-bold text-news-black sm:text-xl">
        Comments
        {!loading && <span className="ml-2 text-sm font-normal text-zinc-500">({comments.length})</span>}
      </h2>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="comment-name" className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Your name
          </label>
          <input
            id="comment-name"
            name="authorName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-news-red/30 focus:border-news-red focus:ring-2"
            placeholder="e.g. Samira"
          />
        </div>
        <div>
          <label htmlFor="comment-body" className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Your comment
          </label>
          <textarea
            id="comment-body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            rows={4}
            className="mt-1 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-news-red/30 focus:border-news-red focus:ring-2"
            placeholder="Share your view…"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">{body.length}/2000</p>
        </div>
        {formMessage && (
          <p className={`text-sm ${formMessage.startsWith("Thanks") ? "text-green-700" : "text-news-red"}`}>{formMessage}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-news-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-100 pt-6">
        {loading && <p className="text-sm text-zinc-500">Loading comments…</p>}
        {error && !loading && <p className="text-sm text-news-red">{error}</p>}
        {!loading && !error && comments.length === 0 && (
          <p className="text-sm text-zinc-500">No comments yet. Be the first to join the discussion.</p>
        )}
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-news-black">{c.author_name}</span>
                <time className="text-xs text-zinc-500" dateTime={c.created_at}>
                  {formatDate(c.created_at)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
