import path from "node:path";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUploadedFile(file: File, opts: { prefix: string }) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = path.extname(file.name).toLowerCase() || "";
  const safeExt = ext.replace(/[^a-z0-9.]/g, "");
  const filename = `${opts.prefix}-${crypto.randomUUID()}${safeExt}`;
  const absolutePath = path.join(UPLOADS_DIR, filename);
  await writeFile(absolutePath, buffer);

  return {
    filename,
    publicPath: `/uploads/${filename}`,
  };
}

