import type { Context } from "hono";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function errorJson(
  c: Context,
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return c.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    status as 400,
  );
}

export function handleRouteError(c: Context, err: unknown) {
  if (err instanceof AppError) {
    return errorJson(c, err.status, err.code, err.message, err.fields);
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_";
      if (!fields[path]) fields[path] = issue.message;
    }
    return errorJson(c, 400, "validation", "Validation failed", fields);
  }
  console.error("[error]", err);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";
  return errorJson(c, 500, "internal", message);
}

export function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const xff = c.req.header("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
  }
  return (
    c.env?.remoteAddress ||
    c.req.header("x-real-ip") ||
    "127.0.0.1"
  );
}
