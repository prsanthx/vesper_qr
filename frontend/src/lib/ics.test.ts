import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("ics", () => {
  it("timed event", () => {
    const out = buildIcs({
      slug: "abc",
      title: "Meetup",
      start: "2024-06-01T15:00:00.000Z",
      end: "2024-06-01T16:00:00.000Z",
    });
    expect(out).toContain("BEGIN:VEVENT");
    expect(out).toContain("DTSTART:20240601T150000Z");
    expect(out).toContain("DTEND:20240601T160000Z");
    expect(out.includes("\r\n")).toBe(true);
  });

  it("all-day event", () => {
    const out = buildIcs({
      slug: "day",
      title: "Holiday",
      start: "2024-07-04T00:00:00.000Z",
      allDay: true,
    });
    expect(out).toContain("DTSTART;VALUE=DATE:20240704");
  });
});
