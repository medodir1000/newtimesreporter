"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { categories } from "@/lib/mockData";
import { articleImageUrl } from "@/lib/images";

type AdminArticle = {
  id: string | number;
  slug: string;
  category: string | null;
  title: string;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
  content: string | null;
  hashtags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  canonical_url: string | null;
};

type FormState = {
  slug: string;
  category: string;
  title: string;
  author: string;
  published_at: string;
  image_url: string;
  content: string;
  hashtags: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  canonical_url: string;
};

type AnalyticsState = {
  totalViews: number;
  topCountries: { country: string; views: number }[];
  byArticle: { slug: string; title: string; views: number; topCountry: string }[];
};

const emptyForm: FormState = {
  slug: "",
  category: "News",
  title: "",
  author: "Arthur Sterling",
  published_at: "",
  image_url: "",
  content: "",
  hashtags: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  canonical_url: ""
};

const fallbackArticleImage =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";

const authorOptions = ["Arthur Sterling", "Julian Vane", "Eleanor Thorne", "Grant Mitchell", "Clara Whitmore", "Godfrey Benjamin"];

function AdminListCover({ src, title }: { src: string; title: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const resolved = useFallback ? fallbackArticleImage : src;
  return (
    <div className="relative mt-2 aspect-[2/1] w-full overflow-hidden rounded-md bg-zinc-100">
      <Image
        src={articleImageUrl(resolved, 280)}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImageBySlug, setPreviewImageBySlug] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalViews: 0,
    topCountries: [],
    byArticle: []
  });

  useEffect(() => {
    void checkExistingSession();
  }, []);

  async function loadArticles() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/articles");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Failed to load articles");
        if (response.status === 401) {
          setIsLoggedIn(false);
        }
        return false;
      }

      setArticles(result.data ?? []);
      await loadAnalytics();
      return true;
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        return;
      }
      setAnalytics(
        result.data ?? {
          totalViews: 0,
          topCountries: [],
          byArticle: []
        }
      );
    } catch {
      // Keep dashboard usable even if analytics fails.
    }
  }

  async function checkExistingSession() {
    const success = await loadArticles();
    setIsLoggedIn(success);
  }

  const canSubmit = useMemo(() => Boolean(form.title.trim() && form.slug.trim()), [form.slug, form.title]);
  const resolvedImageUrl = form.image_url.trim() || previewImageBySlug[form.slug.trim()] || (editingSlug ? previewImageBySlug[editingSlug] ?? "" : "");
  const analyticsBySlug = useMemo(() => {
    const map = new Map<string, { views: number; topCountry: string }>();
    analytics.byArticle.forEach((item) => {
      map.set(item.slug, { views: item.views, topCountry: item.topCountry });
    });
    return map;
  }, [analytics.byArticle]);

  function resetForm() {
    setEditingId(null);
    setEditingSlug(null);
    setForm(emptyForm);
  }

  async function onLogin() {
    const cleanEmail = email.trim();
    const cleanPassword = password;
    if (!cleanEmail || !cleanPassword) {
      setMessage("Enter email and password");
      return;
    }

    const loginResponse = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword
      })
    });
    const loginResult = await loginResponse.json();
    if (!loginResponse.ok) {
      setMessage(loginResult.error ?? "Login failed");
      setIsLoggedIn(false);
      return;
    }

    const success = await loadArticles();
    if (!success) {
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);
    setPassword("");
    setMessage("");
  }

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin();
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsLoggedIn(false);
    setArticles([]);
    setMessage("Logged out");
    setPassword("");
  }

  function fillFormForEdit(item: AdminArticle) {
    setEditingId(item.id);
    setEditingSlug(item.slug);
    setForm({
      slug: item.slug,
      category: item.category ?? "News",
      title: item.title,
      author: item.author ?? "",
      published_at: item.published_at ? item.published_at.slice(0, 16) : "",
      image_url: item.image_url ?? "",
      content: item.content ?? "",
      hashtags: (item.hashtags ?? []).join(", "),
      seo_title: item.seo_title ?? "",
      seo_description: item.seo_description ?? "",
      seo_keywords: (item.seo_keywords ?? []).join(", "),
      canonical_url: item.canonical_url ?? ""
    });
    setMessage("Editing article");
  }

  async function onEdit(item: AdminArticle) {
    fillFormForEdit(item);
  }

  async function onDelete(item: AdminArticle) {
    if (!isLoggedIn) return;

    const confirmed = window.confirm("Delete this article?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/articles/${item.id}`, {
      method: "DELETE"
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Delete failed");
      return;
    }

    setMessage("Article deleted");
    await loadArticles();
    if (editingId === item.id) resetForm();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoggedIn) {
      setMessage("Login first");
      return;
    }

    const activeSlug = form.slug.trim();
    const uploadedImageFallback = (activeSlug && previewImageBySlug[activeSlug]) || (editingSlug && previewImageBySlug[editingSlug]) || "";
    const finalImageUrl = form.image_url.trim() || uploadedImageFallback;

    const payload = {
      slug: activeSlug,
      category: form.category.trim(),
      title: form.title.trim(),
      author: form.author.trim(),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      image_url: finalImageUrl,
      content: form.content.trim(),
      hashtags: splitComma(form.hashtags),
      seo_title: form.seo_title.trim() || form.title.trim(),
      seo_description: form.seo_description.trim(),
      seo_keywords: splitComma(form.seo_keywords),
      canonical_url: form.canonical_url.trim()
    };

    const isEditing = editingId !== null;
    const response = await fetch(isEditing ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Failed to save");
      return;
    }

    setMessage(isEditing ? "Article updated" : "Article saved to Supabase");
    resetForm();
    await loadArticles();
  }

  async function onUploadImage(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    setMessage("");

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: payload
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Image upload failed");
        return;
      }

      setForm((prev) => ({ ...prev, image_url: result.url }));
      const targetSlug = editingSlug ?? form.slug.trim();
      if (targetSlug) {
        setPreviewImageBySlug((prev) => ({ ...prev, [targetSlug]: result.url }));
      }
      setArticles((prev) =>
        prev.map((item) => {
          if (editingId !== null && item.id === editingId) {
            return { ...item, image_url: result.url };
          }
          if (targetSlug && item.slug === targetSlug) {
            return { ...item, image_url: result.url };
          }
          return item;
        })
      );

      // When editing an existing Supabase article, persist image immediately.
      if (editingId !== null) {
        const saveResponse = await fetch(`/api/admin/articles/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ image_url: result.url })
        });

        if (!saveResponse.ok) {
          const saveResult = await saveResponse.json().catch(() => ({}));
          setMessage(saveResult.error ?? "Image uploaded but failed to attach to article");
          return;
        }

        await loadArticles();
      }

      setMessage("Image uploaded successfully");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onUploadMultipleImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadingImage(true);
    setMessage("");

    const uploadedUrls: string[] = [];
    for (const file of fileArray) {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: payload
      });
      const result = await response.json();

      if (!response.ok || !result?.url) {
        setMessage(result?.error ?? "One of images failed to upload");
        setUploadingImage(false);
        return;
      }

      uploadedUrls.push(result.url);
    }

    // Insert uploaded images into article content using markdown image syntax.
    setForm((prev) => {
      const currentContent = prev.content.trim();
      const imageBlocks = uploadedUrls.map((url) => `![Article image](${url})`).join("\n\n");
      return {
        ...prev,
        image_url: prev.image_url.trim() || uploadedUrls[0],
        content: currentContent ? `${currentContent}\n\n${imageBlocks}` : imageBlocks
      };
    });

    const targetSlug = editingSlug ?? form.slug.trim();
    if (targetSlug) {
      setPreviewImageBySlug((prev) => ({ ...prev, [targetSlug]: uploadedUrls[0] }));
    }

    setMessage(`Uploaded ${uploadedUrls.length} images and inserted into content`);
    setUploadingImage(false);
  }

  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold text-news-black">Admin Login</h1>
        <p className="mt-2 text-sm text-zinc-600">Enter admin credentials to access dashboard.</p>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <form onSubmit={(event) => void onLoginSubmit(event)}>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
              placeholder="admin@newtimesreporter.com"
              autoComplete="email"
            />
            <label className="mb-2 mt-4 block text-sm font-semibold text-zinc-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
              placeholder="Password"
              autoComplete="current-password"
            />
            <button type="submit" className="mt-4 rounded-md bg-news-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Login
            </button>
            {message && <p className="mt-3 text-sm text-news-red">{message}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-news-black">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">Manage your articles, image, hashtags, author, date, and SEO fields.</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Logout
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="font-serif text-xl font-bold text-news-black">{editingId ? "Edit Article" : "Create Article"}</h2>
        <p className="mt-1 text-xs text-zinc-500">Tip: Use Upload Image to automatically fill image URL.</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                title: event.target.value,
                slug: prev.slug || slugify(event.target.value)
              }))
            }
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="Title"
            required
          />
          <input
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="Slug"
            required
          />
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.label}>
                {category.label}
              </option>
            ))}
            <option value="News">News</option>
          </select>
          <select
            value={form.author}
            onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
          >
            {form.author && !authorOptions.includes(form.author) && <option value={form.author}>{form.author}</option>}
            {authorOptions.map((authorName) => (
              <option key={authorName} value={authorName}>
                {authorName}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.published_at}
            onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
          />
          <input
            value={resolvedImageUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="Image URL"
          />
          <div className="rounded-md border border-dashed border-zinc-300 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Upload image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingImage}
              onChange={(event) => void onUploadImage(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
            />
            <p className="mt-2 text-xs text-zinc-500">
              {uploadingImage
                ? "Uploading..."
                : "JPG, PNG, WEBP, GIF (max 5MB). Stored as compressed WebP on the server."}
            </p>
            <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Upload multiple images into content</label>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              disabled={uploadingImage}
              onChange={(event) => void onUploadMultipleImages(event.target.files)}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
            />
            <p className="mt-2 text-xs text-zinc-500">Images will be inserted in content automatically.</p>
          </div>
          <input
            value={form.hashtags}
            onChange={(event) => setForm((prev) => ({ ...prev, hashtags: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="Hashtags (comma separated)"
          />
          <input
            value={form.seo_title}
            onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="SEO Title"
          />
          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            className="min-h-36 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red md:col-span-2"
            placeholder="Article content"
          />
          <textarea
            value={form.seo_description}
            onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))}
            className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red md:col-span-2"
            placeholder="SEO Description"
          />
          <input
            value={form.seo_keywords}
            onChange={(event) => setForm((prev) => ({ ...prev, seo_keywords: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="SEO Keywords (comma separated)"
          />
          <input
            value={form.canonical_url}
            onChange={(event) => setForm((prev) => ({ ...prev, canonical_url: event.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            placeholder="Canonical URL"
          />
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-news-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              Clear
            </button>
          </div>
          {resolvedImageUrl && (
            <div className="md:col-span-2">
              <p className="mb-2 text-xs text-zinc-500">Image preview</p>
              <div className="relative aspect-[2/1] w-full max-w-md overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                <Image
                  src={articleImageUrl(resolvedImageUrl, 400)}
                  alt="Article preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-news-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-news-red">
            Total Views: {analytics.totalViews}
          </span>
          {analytics.topCountries.slice(0, 3).map((item) => (
            <span key={item.country} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
              {item.country}: {item.views}
            </span>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-news-black">Articles</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadArticles()}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="mb-3 text-sm text-news-red">{message}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading...</p>}
        {!loading && articles.length === 0 && <p className="text-sm text-zinc-500">No articles yet or not connected.</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {articles.map((item) => (
            <article key={`${item.id}-${item.slug}`} className="rounded-lg border border-zinc-200 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700">
                  Views: {analyticsBySlug.get(item.slug)?.views ?? 0}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700">
                  Top Country: {analyticsBySlug.get(item.slug)?.topCountry ?? "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{item.category ?? "News"}</p>
                <span
                  className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700"
                >
                  supabase
                </span>
              </div>
              <h3 className="mt-1 font-semibold text-zinc-900">{item.title}</h3>
              <p className="text-xs text-zinc-500">/{item.slug}</p>
              <AdminListCover
                src={previewImageBySlug[item.slug] || item.image_url?.trim() || fallbackArticleImage}
                title={item.title}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={false}
                  onClick={() => void onEdit(item)}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={false}
                  onClick={() => void onDelete(item)}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
