import { mkdirSync, unlinkSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { config, LIMITS } from "../config.js";
import { AppError } from "./errors.js";
import { uuid } from "./tokens.js";

export type AssetKind = "logo" | "image" | "pdf" | "audio";

const KIND_LIMITS: Record<AssetKind, number> = {
  logo: LIMITS.logoBytes,
  image: LIMITS.imageBytes,
  pdf: LIMITS.pdfBytes,
  audio: LIMITS.audioBytes,
};

const KIND_MIMES: Record<AssetKind, string[]> = {
  logo: ["image/png", "image/jpeg", "image/webp"],
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
  audio: ["audio/mpeg"],
};

const EXT_FOR_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
};

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120) || "file";
}

export async function sniffAndValidate(
  kind: AssetKind,
  buffer: Buffer,
  declaredName: string,
): Promise<{ mime: string; ext: string; originalName: string }> {
  if (buffer.byteLength > KIND_LIMITS[kind]) {
    throw new AppError(413, "too_large", `File exceeds ${kind} size limit`);
  }
  const ft = await fileTypeFromBuffer(buffer);
  const mime = ft?.mime;
  if (!mime || !KIND_MIMES[kind].includes(mime)) {
    if (
      declaredName.toLowerCase().endsWith(".svg") ||
      buffer.slice(0, 200).toString("utf8").includes("<svg")
    ) {
      throw new AppError(415, "unsupported_type", "SVG uploads are not allowed");
    }
    throw new AppError(
      415,
      "unsupported_type",
      `Unsupported file type for ${kind}`,
    );
  }
  return {
    mime,
    ext: EXT_FOR_MIME[mime] || "bin",
    originalName: sanitizeFilename(declaredName),
  };
}

export function saveAssetFile(
  codeId: string,
  assetId: string,
  ext: string,
  buffer: Buffer,
): string {
  const dir = join(config.uploadsDir, codeId);
  mkdirSync(dir, { recursive: true });
  const rel = join("uploads", codeId, `${assetId}.${ext}`);
  const abs = join(config.dataDir, rel);
  writeFileSync(abs, buffer);
  return rel.replace(/\\/g, "/");
}

export function deleteAssetFile(relPath: string): void {
  const abs = join(config.dataDir, relPath);
  if (existsSync(abs)) {
    try {
      unlinkSync(abs);
    } catch {
      /* ignore */
    }
  }
}

export function deleteCodeUploadDir(codeId: string): void {
  const dir = join(config.uploadsDir, codeId);
  if (!existsSync(dir)) return;
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export function newAssetId(): string {
  return uuid();
}

export { KIND_LIMITS, KIND_MIMES };
