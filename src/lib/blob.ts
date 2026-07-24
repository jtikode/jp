import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Uploads to Vercel Blob when configured (production). Falls back to writing
 * into public/uploads for local development, where BLOB_READ_WRITE_TOKEN isn't set.
 */
export async function uploadPhoto(
  fileName: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(fileName, data, { access: "public", contentType });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(uploadsDir, uniqueName), data);
  return `/uploads/${uniqueName}`;
}
