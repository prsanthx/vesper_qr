export function encodeSms(tel: string, message?: string): string {
  const t = tel.replace(/[\s\-()]/g, "");
  return `SMSTO:${t}:${message ?? ""}`;
}
