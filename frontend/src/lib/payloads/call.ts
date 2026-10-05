export function encodeCall(tel: string): string {
  return `tel:${tel.replace(/[\s\-()]/g, "")}`;
}
