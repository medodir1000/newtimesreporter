import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getMissingSupabaseVars, getSupabaseServerCreds, isAuthorizedAdmin } from "@/lib/admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

function getMimeTypeFromFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "";
}

async function ensureBucketExists(supabaseUrl: string, supabaseKey: string, bucket: string) {
  const checkResponse = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  if (checkResponse.ok) return true;

  const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true
    })
  });

  return createResponse.ok;
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    const missing = getMissingSupabaseVars();
    return NextResponse.json({ error: `Supabase config missing: ${missing.join(", ")}` }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }

  const detectedType = file.type || getMimeTypeFromFilename(file.name);
  if (!ALLOWED_TYPES.has(detectedType)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPG, JPEG, PNG, WEBP, or GIF." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image too large. Max size is 5MB." }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "article-images";
  const bucketReady = await ensureBucketExists(supabaseUrl, supabaseKey, bucket);
  if (!bucketReady) {
    return NextResponse.json({ error: `Storage bucket "${bucket}" is unavailable.` }, { status: 500 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
  const objectPath = `admin/${Date.now()}-${randomUUID()}-${safeName || `image.${extension}`}`;
  const arrayBuffer = await file.arrayBuffer();

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": detectedType,
      "x-upsert": "true"
    },
    body: Buffer.from(arrayBuffer)
  });

  const uploadJson = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    return NextResponse.json(
      { error: uploadJson?.message ?? `Upload failed. Verify bucket "${bucket}" exists and is public.` },
      { status: uploadResponse.status }
    );
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  return NextResponse.json({ url: publicUrl, path: objectPath, bucket });
}
