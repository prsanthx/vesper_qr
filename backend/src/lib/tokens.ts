import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

export function hashIp(salt: string, ip: string): string {
  return sha256Hex(salt + ip).slice(0, 32);
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function randomBase62(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62[randomInt(BASE62.length)];
  }
  return out;
}

export function generateSlug(exists: (slug: string) => boolean): string {
  for (let i = 0; i < 5; i++) {
    const slug = randomBase62(7);
    if (!exists(slug)) return slug;
  }
  for (let i = 0; i < 5; i++) {
    const slug = randomBase62(8);
    if (!exists(slug)) return slug;
  }
  return randomBase62(10);
}

function randomPrefixed(prefix: string): string {
  return prefix + randomBytes(32).toString("base64url");
}

export function generateEditToken(): string {
  return randomPrefixed("vqe_");
}

export function generateApiKey(): string {
  return randomPrefixed("vqk_");
}

export function generateManageToken(): string {
  return randomPrefixed("vqm_");
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
