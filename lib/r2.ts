import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 (S3-compatible). Env vars documented in .env.example.
const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

export function r2Configured() {
  return Boolean(accountId && bucket && publicBase && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}

let client: S3Client | null = null;
function r2() {
  if (!r2Configured()) throw new Error("R2 is not configured. Add the R2_* variables to .env.local.");
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

/** A short-lived URL the browser can PUT one file to. */
export async function presignUpload(key: string, contentType: string, contentLength: number) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    CacheControl: "public, max-age=31536000, immutable",
  });
  return getSignedUrl(r2(), command, { expiresIn: 60 });
}

export function publicUrlFor(key: string) {
  return `${publicBase}/${key}`;
}

/** The object key if the URL points into our bucket, else null. */
export function keyFromPublicUrl(url: string) {
  if (!publicBase || !url.startsWith(`${publicBase}/`)) return null;
  return url.slice(publicBase.length + 1);
}

export async function deleteObject(key: string) {
  await r2().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
