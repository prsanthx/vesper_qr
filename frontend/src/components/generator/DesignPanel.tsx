import { useState, type ReactNode } from "react";
import type { Design } from "../../lib/schemas/design";
import { DEFAULT_DESIGN, contrastWarnings } from "../../lib/schemas/design";
import { ColorInput } from "../ui/ColorInput";
import { Toggle } from "../ui/Toggle";
import { Slider } from "../ui/Slider";
import { Segmented } from "../ui/Segmented";
import { Field } from "../ui/Field";
import { FileDrop } from "../ui/FileDrop";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { LIMITS } from "../../config";
import styles from "./DesignPanel.module.css";

type Props = { design: Design; onChange: (d: Design) => void };

const DOTS = ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"] as const;
const CORNER_SQ = ["square", "dot", "extra-rounded"] as const;
const CORNER_DOT = ["square", "dot"] as const;
const FRAMES = ["none", "banner-bottom", "banner-top", "ribbon", "ticket"] as const;
const ICONS = ["link", "mail", "phone", "wifi", "location", "calendar", "menu", "play"] as const;

const PALETTES = [
  { name: "Ink", fg: "#141210", bg: "#fffdf8" },
  { name: "Bronze", fg: "#6f4524", bg: "#f6f1e8" },
  { name: "Forest", fg: "#2f6f4e", bg: "#fffdf8" },
  { name: "Oxblood", fg: "#8f3d32", bg: "#fffdf8" },
  { name: "Night", fg: "#f6f1e8", bg: "#141210" },
];

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.section}>
      <button type="button" className={styles.head} aria-expanded={open} onClick={onToggle}>
        {title}
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      <div className={[styles.body, open ? styles.open : ""].join(" ")}>
        <div className={styles.inner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function DesignPanel({ design, onChange }: Props) {
  const [open, setOpen] = useState({ pattern: true, colors: false, frame: false, logo: false });
  const [matchFg, setMatchFg] = useState(true);
  const warnings = contrastWarnings(design);

  const patch = (partial: Partial<Design>) => onChange({ ...design, ...partial });

  return (
    <div className={styles.panel}>
      <Accordion title="Pattern" open={open.pattern} onToggle={() => setOpen((o) => ({ ...o, pattern: !o.pattern }))}>
        <div className={styles.swatches} role="group" aria-label="Dots style">
          {DOTS.map((t) => (
            <button key={t} type="button" title={t}
              className={[styles.swatch, design.dots.type === t ? styles.swatchSelected : ""].join(" ")}
              onClick={() => patch({ dots: { ...design.dots, type: t } })} />
          ))}
        </div>
        <div className={styles.swatches} role="group" aria-label="Corner squares">
          {CORNER_SQ.map((t) => (
            <button key={t} type="button" title={t}
              className={[styles.swatch, design.cornersSquare.type === t ? styles.swatchSelected : ""].join(" ")}
              onClick={() => patch({ cornersSquare: { ...design.cornersSquare, type: t } })} />
          ))}
        </div>
        <div className={styles.swatches} role="group" aria-label="Corner dots">
          {CORNER_DOT.map((t) => (
            <button key={t} type="button" title={t}
              className={[styles.swatch, design.cornersDot.type === t ? styles.swatchSelected : ""].join(" ")}
              onClick={() => patch({ cornersDot: { ...design.cornersDot, type: t } })} />
          ))}
        </div>
        <Slider label="Margin" min={0} max={8} value={design.margin}
          onChange={(margin) => patch({ margin })} />
      </Accordion>

      <Accordion title="Colors" open={open.colors} onToggle={() => setOpen((o) => ({ ...o, colors: !o.colors }))}>
        <div className={styles.palettes}>
          {PALETTES.map((p) => (
            <button key={p.name} type="button" title={p.name} className={styles.palette}
              style={{ ["--a" as string]: p.fg, ["--b" as string]: p.bg }}
              onClick={() => onChange({
                ...design,
                dots: { ...design.dots, color: p.fg, gradient: null },
                cornersSquare: { ...design.cornersSquare, color: p.fg },
                cornersDot: { ...design.cornersDot, color: p.fg },
                background: { ...design.background, color: p.bg, transparent: false },
              })} />
          ))}
        </div>
        <ColorInput label="Foreground" value={design.dots.color}
          onChange={(color) => {
            const next = { ...design, dots: { ...design.dots, color } };
            if (matchFg) {
              next.cornersSquare = { ...next.cornersSquare, color };
              next.cornersDot = { ...next.cornersDot, color };
            }
            onChange(next);
          }} />
        <Toggle label="Gradient" checked={!!design.dots.gradient}
          onChange={(on) => patch({
            dots: {
              ...design.dots,
              gradient: on
                ? { from: design.dots.color, to: design.cornersDot.color, rotation: 45 }
                : null,
            },
          })} />
        {design.dots.gradient ? (
          <>
            <ColorInput label="From" value={design.dots.gradient.from}
              onChange={(from) => patch({ dots: { ...design.dots, gradient: { ...design.dots.gradient!, from } } })} />
            <ColorInput label="To" value={design.dots.gradient.to}
              onChange={(to) => patch({ dots: { ...design.dots, gradient: { ...design.dots.gradient!, to } } })} />
            <Slider label="Rotation" min={0} max={360} step={15} value={design.dots.gradient.rotation}
              onChange={(rotation) => patch({ dots: { ...design.dots, gradient: { ...design.dots.gradient!, rotation } } })} />
          </>
        ) : null}
        <Toggle label="Match foreground" checked={matchFg} onChange={setMatchFg} />
        <ColorInput label="Corner squares" value={design.cornersSquare.color}
          onChange={(color) => patch({ cornersSquare: { ...design.cornersSquare, color } })} />
        <ColorInput label="Corner dots" value={design.cornersDot.color}
          onChange={(color) => patch({ cornersDot: { ...design.cornersDot, color } })} />
        <ColorInput label="Background" value={design.background.color} disabled={design.background.transparent}
          onChange={(color) => patch({ background: { ...design.background, color } })} />
        <Toggle label="Transparent background" checked={design.background.transparent}
          onChange={(transparent) => patch({ background: { ...design.background, transparent } })} />
        {warnings.map((w) => <Notice key={w} tone="danger">{w}</Notice>)}
      </Accordion>

      <Accordion title="Frame" open={open.frame} onToggle={() => setOpen((o) => ({ ...o, frame: !o.frame }))}>
        <div className={styles.swatches}>
          {FRAMES.map((f) => (
            <button key={f} type="button" title={f}
              className={[styles.swatch, design.frame.style === f ? styles.swatchSelected : ""].join(" ")}
              onClick={() => patch({ frame: { ...design.frame, style: f } })} />
          ))}
        </div>
        {design.frame.style !== "none" ? (
          <>
            <Field label="Frame text" value={design.frame.text} maxLength={24}
              onChange={(e) => patch({ frame: { ...design.frame, text: e.target.value.slice(0, 24) } })} />
            <ColorInput label="Frame color" value={design.frame.color}
              onChange={(color) => patch({ frame: { ...design.frame, color } })} />
            <ColorInput label="Text color" value={design.frame.textColor}
              onChange={(textColor) => patch({ frame: { ...design.frame, textColor } })} />
            <Segmented ariaLabel="Frame font" value={design.frame.font}
              onChange={(font) => patch({ frame: { ...design.frame, font } })}
              options={[{ value: "Outfit", label: "Outfit" }, { value: "Fraunces", label: "Fraunces" }]} />
          </>
        ) : null}
      </Accordion>

      <Accordion title="Logo" open={open.logo} onToggle={() => setOpen((o) => ({ ...o, logo: !o.logo }))}>
        <div className={styles.swatches}>
          <button type="button" className={[styles.swatch, design.logo.kind === "none" ? styles.swatchSelected : ""].join(" ")}
            onClick={() => patch({ logo: { kind: "none" } })}>None</button>
          {ICONS.map((icon) => (
            <button key={icon} type="button" title={icon}
              className={[styles.swatch, design.logo.kind === "icon" && design.logo.icon === icon ? styles.swatchSelected : ""].join(" ")}
              onClick={() => patch({ logo: { kind: "icon", icon } })} />
          ))}
        </div>
        <FileDrop label="Upload logo (PNG, JPEG, WebP)" accept="image/png,image/jpeg,image/webp"
          maxBytes={LIMITS.logoBytes} kindLabel="logo"
          onFile={(file) => {
            const reader = new FileReader();
            reader.onload = () => {
              patch({ logo: { kind: "upload", dataUrl: String(reader.result) } });
            };
            reader.readAsDataURL(file);
          }} />
      </Accordion>

      <div className={styles.reset}>
        <Button variant="quiet" onClick={() => onChange(structuredClone(DEFAULT_DESIGN))}>Reset design</Button>
      </div>
    </div>
  );
}
