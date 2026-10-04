import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { TypePicker } from "../components/generator/TypePicker";
import { TypeForm, defaultValues, type FormValues } from "../components/generator/TypeForm";
import { DesignPanel } from "../components/generator/DesignPanel";
import { Preview } from "../components/generator/Preview";
import { DownloadBar } from "../components/generator/DownloadBar";
import { EditableResult } from "../components/generator/EditableResult";
import { Notice } from "../components/ui/Notice";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME, isDynamicType, isStaticType, type QrType } from "../config";
import { DEFAULT_DESIGN, type Design } from "../lib/schemas/design";
import { encodeStatic } from "../lib/payloads";
import { downloadPng, downloadSvg, exportFilename } from "../lib/qr/export";
import { renderQrSvg } from "../lib/qr/render";
import { api } from "../lib/api";
import { add as addMine } from "../lib/mine";
import { typeLabel } from "../content/typeMeta";
import styles from "./Generator.module.css";

const DRAFT_KEY = "vesper.draft.v1";

function validate(type: QrType, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const req = (k: string, msg = "Required.") => {
    if (!String(values[k] || "").trim()) errors[k] = msg;
  };
  const urlOk = (k: string) => {
    const v = String(values[k] || "").trim();
    if (!v) return;
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      if (u.protocol !== "http:" && u.protocol !== "https:") errors[k] = "Enter a full web address, like https://example.com.";
    } catch {
      errors[k] = "Enter a full web address, like https://example.com.";
    }
  };
  const phoneOk = (k: string) => {
    const v = String(values[k] || "").replace(/[\s\-()]/g, "");
    if (!v) return;
    if (!/^\+[1-9]\d{6,14}$/.test(v)) errors[k] = "Use international format, starting with +.";
  };

  if (type === "link" || type === "website") { req("url"); urlOk("url"); }
  if (type === "text") req("message");
  if (type === "email") {
    req("to");
    if (values.to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.to))) errors.to = "Enter a valid email.";
  }
  if (type === "call" || type === "sms" || type === "whatsapp") { req("tel"); phoneOk("tel"); }
  if (type === "wifi") {
    req("ssid");
    if (values.encryption !== "nopass") req("password");
  }
  if (type === "vcard") req("firstName");
  if (type === "bitcoin") {
    req("address");
    if (values.address && !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(String(values.address))) {
      errors.address = "Enter a valid Bitcoin address.";
    }
  }
  if (type === "paypal") {
    if (values.mode === "email") req("email");
    else req("username");
  }
  if (type === "app") { req("fallbackUrl"); urlOk("fallbackUrl"); }
  if (type === "profile" || type === "business") req("name");
  if (type === "coupon") { req("title"); req("code"); }
  if (type === "feedback") req("prompt");
  if (type === "video") { req("url"); }
  if (type === "pdf" || type === "links" || type === "event" || type === "menu" || type === "mp3") req("title");
  if (type === "event") req("start");
  return errors;
}

function payloadForApi(type: QrType, values: FormValues): Record<string, unknown> {
  const copy = { ...values };
  delete copy._photoFile;
  delete copy._imageFiles;
  delete copy._pdfFile;
  delete copy._audioFile;
  delete copy._coverFile;
  delete copy.startLocal;
  delete copy.endLocal;
  if (type === "wifi" && copy.password) {/* keep */}
  return copy;
}

export default function Generator() {
  usePageMeta(`${APP_NAME} — QR codes, no account`, "Make QR codes in your browser. No account, no watermark.");
  const [params] = useSearchParams();
  const [type, setType] = useState<QrType>("link");
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [design, setDesign] = useState<Design>(structuredClone(DEFAULT_DESIGN));
  const [size, setSize] = useState<512 | 1024 | 2048>(1024);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ publicUrl: string; editUrl: string; editToken: string; slug: string } | null>(null);
  const [uploadFail, setUploadFail] = useState(0);
  const [showSponsor, setShowSponsor] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [stickyThumb, setStickyThumb] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.type) setType(d.type);
        if (d.values) setValues(d.values);
        if (d.design) setDesign(d.design);
      }
    } catch { /* ignore */ }
    const t = params.get("type");
    if (t && (isStaticType(t) || isDynamicType(t))) {
      setType(t);
      setValues(defaultValues(t, params.get("preset")));
    } else if (params.get("preset") === "wedding") {
      setType("links");
      setValues(defaultValues("links", "wedding"));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const serializable = { ...values };
    for (const k of Object.keys(serializable)) {
      if (serializable[k] instanceof File || Array.isArray(serializable[k]) && (serializable[k] as unknown[])[0] instanceof File) {
        delete serializable[k];
      }
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ type, values: serializable, design }));
  }, [type, values, design, hydrated]);

  useEffect(() => {
    const bar = document.getElementById("download-bar");
    if (!bar) return;
    const obs = new IntersectionObserver(([e]) => setStickyVisible(!e?.isIntersecting), { threshold: 0 });
    obs.observe(bar);
    return () => obs.disconnect();
  }, [result, type]);

  const encoded = useMemo(() => {
    if (isDynamicType(type)) {
      return result?.publicUrl || `${location.origin}/r/preview`;
    }
    try {
      const errs = validate(type, values);
      if (Object.keys(errs).length) return "https://example.com";
      return encodeStatic(type, values);
    } catch {
      return "https://example.com";
    }
  }, [type, values, result]);

  const caption = isDynamicType(type)
    ? result
      ? result.publicUrl
      : "Preview — your code gets its own link when you create it. Encodes your short link after you create it"
    : encoded;

  const changeType = (t: QrType) => {
    setType(t);
    setValues(defaultValues(t, params.get("preset")));
    setErrors({});
    setResult(null);
    setUploadFail(0);
  };

  const doDownload = async (kind: "png" | "svg") => {
    const errs = validate(type, values);
    if (isStaticType(type) && Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const data = isDynamicType(type) ? result!.publicUrl : encodeStatic(type, values);
    const svg = await renderQrSvg(data, design, 1000);
    setStickyThumb(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })));
    if (kind === "svg") downloadSvg(svg, exportFilename(type, "svg"));
    else await downloadPng(svg, size, exportFilename(type, "png"));
    setShowSponsor(true);
  };

  const createEditable = async () => {
    const errs = validate(type, values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setCreating(true);
    setUploadFail(0);
    try {
      const designForApi = structuredClone(design);
      if (designForApi.logo.kind === "upload") {
        const { dataUrl: _, ...rest } = designForApi.logo;
        designForApi.logo = rest;
      }
      const created = await api.createCode({
        type,
        payload: payloadForApi(type, values),
        design: designForApi,
      });
      let fails = 0;
      const patchPayload = { ...payloadForApi(type, values) };
      let patchDesign = structuredClone(designForApi);

      const upload = async (kind: string, file: File | undefined, assign: (id: string) => void) => {
        if (!file) return;
        try {
          const asset = await api.uploadAsset(created.editToken, kind, file);
          assign(asset.id);
        } catch {
          fails += 1;
        }
      };

      await upload("image", values._photoFile as File | undefined, (id) => { patchPayload.photoAssetId = id; });
      await upload("pdf", values._pdfFile as File | undefined, (id) => { patchPayload.pdfAssetId = id; });
      await upload("audio", values._audioFile as File | undefined, (id) => { patchPayload.audioAssetId = id; });
      await upload("image", values._coverFile as File | undefined, (id) => { patchPayload.coverAssetId = id; });
      if (values._imageFiles) {
        const ids: string[] = [];
        for (const f of values._imageFiles as File[]) {
          try {
            const asset = await api.uploadAsset(created.editToken, "image", f);
            ids.push(asset.id);
          } catch {
            fails += 1;
          }
        }
        patchPayload.imageAssetIds = ids;
      }
      if (design.logo.kind === "upload" && design.logo.dataUrl) {
        try {
          const res = await fetch(design.logo.dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "logo.png", { type: blob.type || "image/png" });
          const asset = await api.uploadAsset(created.editToken, "logo", file);
          patchDesign = { ...patchDesign, logo: { kind: "upload", assetId: asset.id } };
        } catch {
          fails += 1;
        }
      }

      try {
        await api.patchCode(created.editToken, { payload: patchPayload, design: patchDesign });
      } catch {
        /* code exists */
      }

      addMine({
        slug: created.slug,
        editToken: created.editToken,
        type: type as never,
        title: String(values.title || values.name || values.prompt || type),
        publicUrl: created.publicUrl,
        editUrl: created.editUrl,
        createdAt: new Date().toISOString(),
        design,
      });
      setResult(created);
      setUploadFail(fails);
    } catch (e) {
      setErrors({ _form: e instanceof Error ? e.message : "Couldn't reach the server. Static codes still work offline." });
    } finally {
      setCreating(false);
    }
  };

  const mode = isDynamicType(type)
    ? result
      ? "dynamic-ready"
      : "dynamic-create"
    : "static";

  return (
    <PageShell>
      <div className={styles.page}>
        <div className={styles.strip}>
          <h1>Make a QR code. Keep it.</h1>
          <p>No account, no email, no watermark. Pick a type, style it, download.</p>
        </div>
        <div className={styles.grid}>
          <div>
            <TypePicker value={type} onChange={changeType} />
            <TypeForm
              type={type}
              values={values}
              errors={errors}
              onChange={(v) => { setValues(v); setErrors({}); }}
              onBlurField={(name) => {
                const e = validate(type, values);
                if (e[name]) setErrors((prev) => ({ ...prev, [name]: e[name]! }));
              }}
            />
            {isDynamicType(type) ? (
              <Notice>
                Editable codes point to a short {APP_NAME} link, so you can change what they open later and see scan counts. Your edit link is the only key — save it.
              </Notice>
            ) : null}
            {errors._form ? <Notice tone="danger">{errors._form}</Notice> : null}
          </div>
          <div className={styles.sticky}>
            <Preview
              data={encoded}
              design={design}
              typeLabel={typeLabel(type)}
              caption={caption}
              showEncodedToggle={isStaticType(type)}
            />
            <DownloadBar
              mode={mode}
              size={size}
              onSize={setSize}
              onPng={() => void doDownload("png")}
              onSvg={() => void doDownload("svg")}
              onCreate={() => void createEditable()}
              onMakeEditable={type === "link" ? () => {
                const url = values.url;
                setType("website");
                setValues({ url });
                setResult(null);
                setTimeout(() => {
                  // create with carried url
                  void (async () => {
                    setCreating(true);
                    try {
                      const designForApi = structuredClone(design);
                      if (designForApi.logo.kind === "upload") {
                        const { dataUrl: _, ...rest } = designForApi.logo;
                        designForApi.logo = rest;
                      }
                      const created = await api.createCode({
                        type: "website",
                        payload: { url },
                        design: designForApi,
                      });
                      addMine({
                        slug: created.slug,
                        editToken: created.editToken,
                        type: "website",
                        title: String(url || "Website"),
                        publicUrl: created.publicUrl,
                        editUrl: created.editUrl,
                        createdAt: new Date().toISOString(),
                        design,
                      });
                      setResult(created);
                    } catch (e) {
                      setErrors({ _form: e instanceof Error ? e.message : "Couldn't reach the server. Static codes still work offline." });
                    } finally {
                      setCreating(false);
                    }
                  })();
                }, 0);
              } : undefined}
              creating={creating}
              showSponsor={showSponsor}
              onDismissSponsor={() => setShowSponsor(false)}
              stickyThumb={stickyThumb}
              stickyVisible={stickyVisible}
            />
            {result ? (
              <>
                {uploadFail > 0 ? (
                  <Notice tone="danger">
                    The code was created but {uploadFail} file(s) failed to upload. Open the edit page to retry.
                  </Notice>
                ) : null}
                <EditableResult
                  publicUrl={result.publicUrl}
                  editUrl={result.editUrl}
                  onAnother={() => { setResult(null); setValues(defaultValues(type)); }}
                />
              </>
            ) : null}
            <DesignPanel design={design} onChange={setDesign} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
