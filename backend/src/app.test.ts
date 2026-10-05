import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "./config.js";

process.env.VITEST = "true";

let dataDir: string;
let app: ReturnType<typeof import("./index.js").createApp>;

beforeEach(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "vesper-test-"));
  config.dataDir = dataDir;
  config.uploadsDir = join(dataDir, "uploads");
  config.dbPath = join(dataDir, "vesper.db");
  config.publicBaseUrl = "http://localhost:5173";
  config.ipSalt = "test-salt";
  config.isProd = false;
  const { resetDbForTests } = await import("./db/index.js");
  resetDbForTests(config.dbPath);
  const mod = await import("./index.js");
  app = mod.createApp();
});

afterEach(() => {
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function pngBytes(size = 100): Buffer {
  // minimal valid 1x1 PNG
  const base = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  if (size <= base.length) return base;
  return Buffer.concat([base, Buffer.alloc(size - base.length, 0)]);
}

describe("API flow", () => {
  it("create → get → patch → scan → stats → delete → 410", async () => {
    const created = await app.request("/api/codes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com" },
      }),
    });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.slug).toBeTruthy();
    expect(body.editToken).toMatch(/^vqe_/);

    const got = await app.request(`/api/codes/${body.editToken}`);
    expect(got.status).toBe(200);
    const doc = await got.json();
    expect(doc.slug).toBe(body.slug);

    const patched = await app.request(`/api/codes/${body.editToken}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: { url: "https://example.org/new" },
      }),
    });
    expect(patched.status).toBe(200);
    const patchedDoc = await patched.json();
    expect(patchedDoc.slug).toBe(body.slug);
    expect(patchedDoc.payload.url).toContain("example.org");

    const scan = await app.request(`/api/scans/${body.slug}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      },
      body: "{}",
    });
    expect(scan.status).toBe(200);

    const botScan = await app.request(`/api/scans/${body.slug}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "curl/8.0",
      },
      body: "{}",
    });
    expect(botScan.status).toBe(200);

    const stats = await app.request(`/api/codes/${body.editToken}/stats`);
    expect(stats.status).toBe(200);
    const s = await stats.json();
    expect(s.total).toBe(1);
    expect(s.last30Days).toHaveLength(30);

    const preview = await app.request(`/api/public/${body.slug}`);
    expect(preview.status).toBe(200);

    const del = await app.request(`/api/codes/${body.editToken}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(204);

    const gone = await app.request(`/api/scans/${body.slug}`, {
      method: "POST",
      body: "{}",
    });
    expect(gone.status).toBe(410);
  });

  it("uploads accept PNG, reject oversized logo and fake png", async () => {
    const created = await app.request("/api/codes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com" },
      }),
    });
    const { editToken } = await created.json();

    const fd = new FormData();
    fd.set("kind", "logo");
    fd.set("file", new File([pngBytes()], "logo.png", { type: "image/png" }));
    const ok = await app.request(`/api/codes/${editToken}/assets`, {
      method: "POST",
      body: fd,
    });
    expect(ok.status).toBe(201);
    const asset = await ok.json();
    await app.request(`/api/codes/${editToken}/assets/${asset.id}`, {
      method: "DELETE",
    });

    const big = new FormData();
    big.set("kind", "logo");
    big.set(
      "file",
      new File([pngBytes(1_100_000)], "big.png", { type: "image/png" }),
    );
    const tooBig = await app.request(`/api/codes/${editToken}/assets`, {
      method: "POST",
      body: big,
    });
    expect(tooBig.status).toBe(413);

    const fake = new FormData();
    fake.set("kind", "logo");
    fake.set(
      "file",
      new File([Buffer.from("not an image")], "x.png", { type: "image/png" }),
    );
    const bad = await app.request(`/api/codes/${editToken}/assets`, {
      method: "POST",
      body: fake,
    });
    expect(bad.status).toBe(415);
  });

  it("feedback bounds and health", async () => {
    const created = await app.request("/api/codes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "feedback",
        payload: { prompt: "How was it?", allowComment: true },
      }),
    });
    const { slug, editToken } = await created.json();

    const bad = await app.request(`/api/feedback/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 9 }),
    });
    expect(bad.status).toBe(400);

    const ok = await app.request(`/api/feedback/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Great" }),
    });
    expect(ok.status).toBe(201);

    const list = await app.request(`/api/codes/${editToken}/feedback`);
    const fb = await list.json();
    expect(fb.count).toBe(1);
    expect(fb.average).toBe(5);

    const health = await app.request("/api/health");
    expect(health.status).toBe(200);
    const h = await health.json();
    expect(h.status).toBe("ok");
    expect(h.db).toBe("ok");
  });

  it("rate limits creates at 31", async () => {
    config.trustProxy = true;
    for (let i = 0; i < 30; i++) {
      const res = await app.request("/api/codes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.9",
        },
        body: JSON.stringify({
          type: "website",
          payload: { url: `https://example.com/${i}` },
        }),
      });
      expect(res.status).toBe(201);
    }
    const limited = await app.request("/api/codes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.9",
      },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com/over" },
      }),
    });
    expect(limited.status).toBe(429);
    config.trustProxy = false;
  });

  it("API key flow, bulk partial success, and key rate limit", async () => {
    const keyRes = await app.request("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(keyRes.status).toBe(201);
    const { apiKey } = await keyRes.json();

    const badAuth = await app.request("/api/v1/codes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer vqk_invalid",
      },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com" },
      }),
    });
    expect(badAuth.status).toBe(401);

    const created = await app.request("/api/v1/codes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com/v1" },
      }),
    });
    expect(created.status).toBe(201);
    const c = await created.json();

    const list = await app.request("/api/v1/codes", {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const listed = await list.json();
    expect(listed.items.some((i: { slug: string }) => i.slug === c.slug)).toBe(
      true,
    );

    const del = await app.request(`/api/v1/codes/${c.slug}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    expect(del.status).toBe(204);

    const bulk = await app.request("/api/v1/codes/bulk", {
      method: "POST",
      headers: {
        "content-type": "text/csv",
        authorization: `Bearer ${apiKey}`,
      },
      body: "type,title,url\nwebsite,Ok,https://ok.example\napp,Bad,https://x.example",
    });
    expect(bulk.status).toBe(201);
    const b = await bulk.json();
    expect(b.created.length).toBe(1);
    expect(b.errors.length).toBe(1);
  });

  it("11th v1 create in an hour returns 429", async () => {
    const keyRes = await app.request("/api/keys", { method: "POST", body: "{}" });
    const { apiKey } = await keyRes.json();
    for (let i = 0; i < 10; i++) {
      const r = await app.request("/api/v1/codes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "x-forwarded-for": `198.51.100.${i}`,
        },
        body: JSON.stringify({
          type: "website",
          payload: { url: `https://example.com/r${i}` },
        }),
      });
      expect(r.status).toBe(201);
    }
    const limited = await app.request("/api/v1/codes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "x-forwarded-for": "198.51.100.200",
      },
      body: JSON.stringify({
        type: "website",
        payload: { url: "https://example.com/over" },
      }),
    });
    expect(limited.status).toBe(429);
  });
});
