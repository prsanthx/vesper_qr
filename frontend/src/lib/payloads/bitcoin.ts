export function encodeBitcoin(address: string, amount?: number, label?: string): string {
  const parts: string[] = [];
  if (amount != null && amount > 0) parts.push(`amount=${amount}`);
  if (label) parts.push(`label=${encodeURIComponent(label)}`);
  return parts.length ? `bitcoin:${address}?${parts.join("&")}` : `bitcoin:${address}`;
}
