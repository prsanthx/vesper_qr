export type ApiError = {
  error: { code: string; message: string; fields?: Record<string, string>; retryAfterSec?: number };
};

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiError;
    throw Object.assign(new Error(err.error?.message || "Request failed"), {
      status: res.status,
      code: err.error?.code,
      fields: err.error?.fields,
      retryAfterSec: err.error?.retryAfterSec,
    });
  }
  return data as T;
}

export type CreateResult = {
  slug: string;
  editToken: string;
  publicUrl: string;
  editUrl: string;
};

export type Asset = {
  id: string;
  kind: string;
  mime: string;
  bytes: number;
  originalName: string;
  url: string;
};

export type CodeDoc = {
  slug: string;
  type: string;
  title: string;
  payload: Record<string, unknown>;
  design: import("./schemas/design").Design;
  assets: Asset[];
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
  scanCount: number;
};

export type PublicDoc = {
  slug: string;
  type: string;
  title: string;
  payload: Record<string, unknown>;
  design: import("./schemas/design").Design;
  assets: Asset[];
};

export const api = {
  createCode: (body: unknown) =>
    request<CreateResult>("/api/codes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  getCode: (token: string) => request<CodeDoc>(`/api/codes/${token}`),
  patchCode: (token: string, body: unknown) =>
    request<CodeDoc>(`/api/codes/${token}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteCode: (token: string) =>
    request<void>(`/api/codes/${token}`, { method: "DELETE" }),
  uploadAsset: (
    token: string,
    kind: string,
    file: File,
    onProgress?: (pct: number) => void,
  ) =>
    new Promise<Asset>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/codes/${token}/assets`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(Object.assign(new Error(data.error?.message || "Upload failed"), data));
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () => reject(new Error("Couldn't reach the server. Static codes still work offline."));
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", file);
      xhr.send(fd);
    }),
  deleteAsset: (token: string, assetId: string) =>
    request<void>(`/api/codes/${token}/assets/${assetId}`, { method: "DELETE" }),
  stats: (token: string) => request<Record<string, unknown>>(`/api/codes/${token}/stats`),
  feedbackList: (token: string) =>
    request<Record<string, unknown>>(`/api/codes/${token}/feedback`),
  scan: (slug: string) =>
    request<PublicDoc>(`/api/scans/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
  public: (slug: string) => request<PublicDoc>(`/api/public/${slug}`),
  submitFeedback: (slug: string, body: { rating: number; comment?: string }) =>
    request<{ ok: true }>(`/api/feedback/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  contact: (body: unknown) =>
    request<{ ok: true }>("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  abuse: (body: unknown) =>
    request<{ ok: true }>("/api/abuse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  health: () =>
    request<{
      status: string;
      version: string;
      uptimeSec: number;
      db: string;
      time: string;
    }>("/api/health"),
  createKey: () =>
    request<{ apiKey: string; manageToken: string; note: string }>("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
};
