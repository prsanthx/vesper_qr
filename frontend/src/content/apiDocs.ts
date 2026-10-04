export type ApiDocSection = {
  id: string;
  title: string;
  prose: string;
  curl?: string;
  response?: string;
};

export const API_DOCS: ApiDocSection[] = [
  { id: "key", title: "Getting a key", prose: "Click Get an API key below. You receive an API key and a manage token once. We store only hashes. The manage token can revoke the key; codes created with it keep working." },
  { id: "auth", title: "Authentication", prose: "Send Authorization: Bearer vqk_… on /api/v1/* routes. Missing, invalid, or revoked keys return 401." },
  { id: "limits", title: "Limits", prose: "30 creates per hour per IP and 10 creates per hour per API key. A bulk request counts as 1 create toward both limits (max 50 rows). Exceeding returns 429 with Retry-After." },
  { id: "create", title: "Create", prose: "Create an editable code.", curl: `curl -X POST "$ORIGIN/api/v1/codes" -H "Authorization: Bearer vqk_…" -H "Content-Type: application/json" -d '{"type":"website","payload":{"url":"https://example.com"}}'`, response: '{ "slug": "Ab12CdE", "editToken": "vqe_…", "publicUrl": "…/r/Ab12CdE", "editUrl": "…/e/vqe_…" }' },
  { id: "list", title: "List", prose: "List codes created with this key.", curl: `curl "$ORIGIN/api/v1/codes?limit=50" -H "Authorization: Bearer vqk_…"`, response: '{ "items": [{ "slug": "…", "type": "website", "title": "…", "publicUrl": "…", "createdAt": "…", "updatedAt": "…", "scanCount": 0 }], "nextCursor": null }' },
  { id: "get", title: "Get", prose: "Fetch a full code by edit token if it belongs to the key.", curl: `curl "$ORIGIN/api/v1/codes?token=vqe_…" -H "Authorization: Bearer vqk_…"` },
  { id: "delete", title: "Delete", prose: "Soft-delete a code by slug.", curl: `curl -X DELETE "$ORIGIN/api/v1/codes/Ab12CdE" -H "Authorization: Bearer vqk_…"` },
  { id: "bulk", title: "Bulk CSV", prose: "Create up to 50 website codes from CSV with header type,title,url.", curl: `curl -X POST "$ORIGIN/api/v1/codes/bulk" -H "Authorization: Bearer vqk_…" -H "Content-Type: text/csv" --data-binary @codes.csv`, response: '{ "created": [{ "row": 2, "slug": "…", "editToken": "…", "publicUrl": "…", "editUrl": "…" }], "errors": [{ "row": 3, "message": "…" }] }' },
  { id: "errors", title: "Errors", prose: "Errors look like { \"error\": { \"code\": \"validation\", \"message\": \"…\", \"fields\": { … } } }. Common codes: validation, unauthorized, rate_limited, not_found, retired." },
  { id: "anon", title: "Anonymous endpoints", prose: "The browser app also uses /api/codes, /api/scans/:slug, /api/public/:slug, /api/assets/:id, /api/feedback/:slug, /api/contact, /api/abuse, /api/keys, and /api/health without an API key." },
];
