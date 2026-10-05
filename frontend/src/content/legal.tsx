// OWNER: have these reviewed for your jurisdiction.
import { APP_NAME } from "../config";

export const LEGAL_UPDATED = "2026-03-22";

export const privacy = {
  title: "Privacy",
  body: [
    `${APP_NAME} is built to keep static QR codes on your device. When you make a static code, the content and design stay in your browser. Downloads do not require a network request for static codes.`,
    "Editable codes store a payload, design, uploaded files, and a hashed edit token on our server. The public short link is what the QR encodes. The edit link is the only key; we store a hash of it, not the raw token.",
    "When someone scans an editable code we may record the time, country if a hosting proxy provides it, device class, OS family, and a salted hash of the IP address. We do not store the raw IP. Bot-like user agents are skipped.",
    "Contact messages and abuse reports are stored on the server so we can read them. My codes and draft state use localStorage and sessionStorage in your browser. We do not set cookies for analytics.",
    "There are no ads and no third-party analytics scripts. Buy Me a Coffee and YouTube are third parties only when you choose to open or load them. To delete an editable code and its files, use the delete control on the edit page.",
  ],
};

export const terms = {
  title: "Terms",
  body: [
    `${APP_NAME} is a free service provided as-is, without warranty. There is no uptime guarantee.`,
    "You may not use the service for phishing, malware distribution, illegal content, harassment, or impersonation. We may disable codes reported for abuse.",
    "You are responsible for the content you link to or upload. We may change or end the service. Continued use after changes means you accept the updated terms.",
  ],
};

export const disclaimer = {
  title: "Disclaimer",
  body: [
    "Generated codes should be tested on more than one phone before a print run. Print size, contrast, material, and camera quality all affect scanning.",
    "We are not responsible for misprints, scanning failures, or third-party destinations that change or become unavailable.",
    "Editable codes depend on this service remaining online. Keep your own copies of important destinations and edit links.",
  ],
};
