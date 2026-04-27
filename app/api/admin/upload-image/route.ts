import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getMissingSupabaseVars, getSupabaseServerCreds, isAuthorizedAdmin } from "@/lib/admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

/** Max edge length after resize; keeps hero images sharp but payloads small as WebP. */
const MAX_EDGE_PX = 2400;
const WEBP_QUALITY = 82;
/** Prevents decompression bombs (~16k × 16k). */
const MAX_INPUT_PIXELS = 4096 * 4096;

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

/**
 * Normalize any supported raster upload to WebP (EXIF rotation applied, downscaled if huge).
 * GIFs use the first frame only so output stays light.
 */
async function convertUploadToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, {
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
    pages: 1
  })
    .rotate()
    .resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: WEBP_QUALITY, effort: 4, smartSubsample: true })
    .toBuffer();
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

  const rawName = file.name.replace(/\.[^/.]+$/, "").trim() || "image";
  const safeStem = rawName.toLowerCase().replace(/[^a-z0-9.-]/g, "-").slice(0, 80) || "image";
  const objectPath = `admin/${Date.now()}-${randomUUID()}-${safeStem}.webp`;
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  let webpBuffer: Buffer;
  try {
    webpBuffer = await convertUploadToWebp(inputBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image processing failed";
    return NextResponse.json(
      { error: `Could not convert image to WebP: ${message}. Try another file or format.` },
      { status: 422 }
    );
  }

  if (webpBuffer.length > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image is still larger than 5MB after WebP conversion. Use a smaller source image." },
      { status: 400 }
    );
  }

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "image/webp",
      "x-upsert": "true"
    },
    body: new Uint8Array(webpBuffer)
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
