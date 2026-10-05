import type { Design } from "./schemas/design";
import type { DynamicType } from "../config";

export type MineEntry = {
  slug: string;
  editToken: string;
  type: DynamicType;
  title: string;
  publicUrl: string;
  editUrl: string;
  createdAt: string;
  design?: Design;
};

const KEY = "vesper.mine.v1";
let memory: MineEntry[] | null = null;
let storageBlocked = false;

function read(): MineEntry[] {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MineEntry[]) : [];
  } catch {
    storageBlocked = true;
    memory = [];
    return memory;
  }
}

function write(list: MineEntry[]) {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    storageBlocked = false;
    window.dispatchEvent(new Event("vesper-mine"));
  } catch {
    storageBlocked = true;
    window.dispatchEvent(new Event("vesper-mine"));
  }
}

export function isStorageBlocked() {
  return storageBlocked;
}

export function list(): MineEntry[] {
  return read();
}

export function add(entry: MineEntry) {
  const next = [entry, ...read().filter((e) => e.slug !== entry.slug)];
  write(next);
}

export function remove(slug: string) {
  write(read().filter((e) => e.slug !== slug));
}

export function update(slug: string, partial: Partial<MineEntry>) {
  write(read().map((e) => (e.slug === slug ? { ...e, ...partial } : e)));
}

export function exportJson(): string {
  return JSON.stringify(read(), null, 2);
}

export function importJson(text: string) {
  const incoming = JSON.parse(text) as MineEntry[];
  if (!Array.isArray(incoming)) throw new Error("Invalid list");
  const map = new Map(read().map((e) => [e.slug, e]));
  for (const e of incoming) {
    if (e.slug && e.editToken) map.set(e.slug, e);
  }
  write([...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
