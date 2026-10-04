import QRCodeStyling from "qr-code-styling";
import type { Design } from "../schemas/design";
import { iconToDataUrl } from "../../components/icons/logoIcons";
import { composeFramed } from "./frame";

export function buildQrOptions(data: string, design: Design, sizePx = 1000) {
  const errorCorrectionLevel = design.logo.kind === "none" ? "Q" : "H";
  let image: string | undefined;
  if (design.logo.kind === "icon") {
    const stroke = design.dots.gradient?.from || design.dots.color;
    const bg = design.background.transparent
      ? "#ffffff"
      : design.background.color;
    image = iconToDataUrl(design.logo.icon, stroke, bg);
  } else if (design.logo.kind === "upload") {
    image = design.logo.dataUrl || (design.logo.assetId ? `/api/assets/${design.logo.assetId}` : undefined);
  }

  const dotsOptions: Record<string, unknown> = {
    type: design.dots.type,
    color: design.dots.color,
  };
  if (design.dots.gradient) {
    dotsOptions.gradient = {
      type: "linear",
      rotation: (design.dots.gradient.rotation * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: design.dots.gradient.from },
        { offset: 1, color: design.dots.gradient.to },
      ],
    };
  }

  return {
    type: "svg" as const,
    width: sizePx,
    height: sizePx,
    data,
    margin: design.margin * 10,
    qrOptions: { errorCorrectionLevel: errorCorrectionLevel as "Q" | "H" },
    dotsOptions,
    cornersSquareOptions: {
      type: design.cornersSquare.type,
      color: design.cornersSquare.color,
    },
    cornersDotOptions: {
      type: design.cornersDot.type,
      color: design.cornersDot.color,
    },
    backgroundOptions: {
      color: design.background.transparent
        ? "rgba(0,0,0,0)"
        : design.background.color,
    },
    image,
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.3,
      margin: 6,
      crossOrigin: "anonymous" as const,
    },
  };
}

let previewInstance: QRCodeStyling | null = null;

export async function renderQrSvg(
  data: string,
  design: Design,
  sizePx = 1000,
  opts?: { reuse?: boolean },
): Promise<string> {
  const options = buildQrOptions(data, design, sizePx);
  let qr: QRCodeStyling;
  if (opts?.reuse) {
    if (!previewInstance) previewInstance = new QRCodeStyling(options);
    else previewInstance.update(options);
    qr = previewInstance;
  } else {
    qr = new QRCodeStyling(options);
  }
  const blob = await qr.getRawData("svg");
  if (!blob) throw new Error("Failed to render QR");
  const text =
    blob instanceof Blob
      ? await blob.text()
      : Buffer.isBuffer(blob)
        ? blob.toString("utf8")
        : String(blob);
  return composeFramed(text, design);
}

export { composeFramed };
