import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env";

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export function getLocalStorageDir() {
  return path.resolve(process.cwd(), env.FILE_STORAGE_LOCAL_DIR ?? "uploads");
}

export function ensureLocalStorageDir() {
  fs.mkdirSync(getLocalStorageDir(), { recursive: true });
}

export function normalizeStoragePath(filePath: string) {
  return `/uploads/${path.basename(filePath)}`;
}

export function resolveStorageAbsolutePath(storagePath: string) {
  return path.resolve(getLocalStorageDir(), path.basename(storagePath));
}

export function ensureStoredFileExists(storagePath: string) {
  const absolutePath = resolveStorageAbsolutePath(storagePath);

  if (!fs.existsSync(absolutePath)) {
    throw createHttpError("Stored file not found.", 404);
  }

  return absolutePath;
}

export function buildFileDownloadUrl(fileId: string) {
  return `/api/files/${fileId}/download`;
}
