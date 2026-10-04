import { beforeEach, describe, expect, it } from "vitest";
import { add, importJson, list, remove } from "./mine";

beforeEach(() => {
  localStorage.clear();
});

describe("mine", () => {
  it("add/dedupe/remove/import", () => {
    add({
      slug: "abc",
      editToken: "vqe_1",
      type: "website",
      title: "A",
      publicUrl: "http://x/r/abc",
      editUrl: "http://x/e/vqe_1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    add({
      slug: "abc",
      editToken: "vqe_1",
      type: "website",
      title: "A2",
      publicUrl: "http://x/r/abc",
      editUrl: "http://x/e/vqe_1",
      createdAt: "2024-01-02T00:00:00.000Z",
    });
    expect(list()).toHaveLength(1);
    expect(list()[0]!.title).toBe("A2");
    remove("abc");
    expect(list()).toHaveLength(0);
    importJson(JSON.stringify([{
      slug: "z",
      editToken: "vqe_z",
      type: "links",
      title: "Z",
      publicUrl: "http://x/r/z",
      editUrl: "http://x/e/vqe_z",
      createdAt: "2024-01-03T00:00:00.000Z",
    }]));
    expect(list()[0]!.slug).toBe("z");
  });
});
