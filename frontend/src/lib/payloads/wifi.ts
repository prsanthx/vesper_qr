function esc(v: string): string {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

export function encodeWifi(opts: {
  ssid: string;
  encryption: "WPA" | "WEP" | "nopass";
  password?: string;
  hidden?: boolean;
}): string {
  const parts = [`T:${opts.encryption}`, `S:${esc(opts.ssid)}`];
  if (opts.encryption !== "nopass") parts.push(`P:${esc(opts.password || "")}`);
  if (opts.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}
