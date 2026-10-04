import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { config, LIMITS } from "./config.js";
import { getDb } from "./db/index.js";
import { codesRoutes } from "./routes/codes.js";
import { assetsRoutes } from "./routes/assets.js";
import { scansRoutes } from "./routes/scans.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { contactRoutes } from "./routes/contact.js";
import { abuseRoutes } from "./routes/abuse.js";
import { keysRoutes } from "./routes/keys.js";
import { v1Routes } from "./routes/v1.js";
import { healthRoutes } from "./routes/health.js";
import { handleRouteError } from "./lib/errors.js";

export function createApp() {
  getDb();
  const app = new Hono();

  app.use("*", async (c, next) => {
    const id = crypto.randomUUID().slice(0, 8);
    const start = Date.now();
    await next();
    const path = c.req.path.replace(
      /\/api\/codes\/vqe_[^/]+/g,
      "/api/codes/[token]",
    );
    console.info(
      `[${id}] ${c.req.method} ${path} ${c.res.status} ${Date.now() - start}ms`,
    );
  });

  app.use("*", async (c, next) => {
    await next();
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Content-Type-Options", "nosniff");
    c.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (config.isProd) {
      c.header(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self' data: blob: https://img.buymeacoffee.com https://i.ytimg.com; media-src 'self' blob: https:; frame-src https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      );
    }
  });

  app.use("*", async (c, next) => {
    const isUpload =
      c.req.method === "POST" &&
      /\/api\/codes\/[^/]+\/assets$/.test(c.req.path);
    if (isUpload) {
      await next();
      return;
    }
    return bodyLimit({
      maxSize: LIMITS.jsonBodyBytes,
      onError: (ctx) =>
        ctx.json(
          { error: { code: "too_large", message: "Request body too large" } },
          413,
        ),
    })(c, next);
  });

  const api = new Hono();
  api.route("/", healthRoutes);
  api.route("/codes", codesRoutes);
  api.route("/", assetsRoutes);
  api.route("/", scansRoutes);
  api.route("/", feedbackRoutes);
  api.route("/", contactRoutes);
  api.route("/", abuseRoutes);
  api.route("/", keysRoutes);
  api.route("/v1", v1Routes);

  app.route("/api", api);

  app.onError((err, c) => handleRouteError(c, err));

  if (config.isProd && existsSync(config.frontendDist)) {
    const dist = config.frontendDist;
    const root = relative(process.cwd(), dist) || ".";
    app.use("/assets/*", serveStatic({ root }));
    app.use("/*", serveStatic({ root }));
    app.get("*", (c) => {
      if (c.req.path.startsWith("/api/")) {
        return c.json(
          { error: { code: "not_found", message: "Not found" } },
          404,
        );
      }
      return c.html(readFileSync(join(dist, "index.html"), "utf8"));
    });
  }

  return app;
}

export type AppType = ReturnType<typeof createApp>;

const isMain =
  process.env.VITEST !== "true" &&
  !process.argv.some((a) => a.includes("vitest"));

if (isMain) {
  const app = createApp();
  console.info(
    `[vesper] API listening on http://localhost:${config.port} (PUBLIC_BASE_URL=${config.publicBaseUrl || "(unset)"})`,
  );
  serve({ fetch: app.fetch, port: config.port });
}
