import { useEffect } from "react";

export function usePageMeta(title: string, description: string, opts?: { noindex?: boolean }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (opts?.noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex");
    } else if (robots) {
      robots.remove();
    }
  }, [title, description, opts?.noindex]);
}
