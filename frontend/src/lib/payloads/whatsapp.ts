export function encodeWhatsapp(tel: string, message?: string): string {
  const digits = tel.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
