export function encodePaypal(opts: {
  mode: "paypalme" | "email";
  username?: string;
  email?: string;
  amount?: number;
  currency?: string;
}): string {
  const currency = opts.currency || "USD";
  if (opts.mode === "paypalme") {
    let url = `https://www.paypal.me/${opts.username}`;
    if (opts.amount) url += `/${opts.amount}${currency}`;
    return url;
  }
  let url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(opts.email || "")}&currency_code=${currency}`;
  if (opts.amount) url += `&amount=${opts.amount}`;
  return url;
}
