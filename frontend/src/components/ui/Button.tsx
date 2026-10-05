import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "quiet" | "danger" | "dangerConfirm";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  to?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", to, className, children, ...rest }: Props) {
  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(" ");
  if (to) return <Link className={cls} to={to}>{children}</Link>;
  return <button className={cls} type={rest.type || "button"} {...rest}>{children}</button>;
}
