import { afterEach, describe, expect, it } from "vitest";
import "../index.css";

const sources = import.meta.glob(["../**/*.tsx", "../components/ui.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

let probe: HTMLElement | undefined;

afterEach(() => {
  probe?.remove();
  probe = undefined;
});

/** The size and line height Tailwind gives a class, as the browser lays it out. */
function measure(className: string) {
  probe = document.createElement("span");
  probe.className = className;
  probe.textContent = "Pass";
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const size = Number.parseFloat(style.fontSize);
  const lineHeight = Number.parseFloat(style.lineHeight);
  probe.remove();
  return { size, lineHeight };
}

describe("the type scale", () => {
  it("sets text at an iPhone's own sizes: footnote, subhead, body", () => {
    expect(measure("text-xs").size).toBe(13);
    expect(measure("text-sm").size).toBe(15);
    expect(measure("text-base").size).toBe(17);
    expect(measure("text-lg").size).toBe(19);
    expect(measure("text-xl").size).toBe(21);
  });

  it("gives each size a line at least 1.3 times its height", () => {
    for (const name of ["xs", "sm", "base", "lg", "xl"]) {
      const { size, lineHeight } = measure(`text-${name}`);
      expect(lineHeight / size, name).toBeGreaterThanOrEqual(1.3);
    }
  });

  it("writes nothing on screen smaller than 12px", () => {
    // Arbitrary sizes skip the scale, so they are checked one by one.
    const sizes = Object.entries(sources)
      .filter(([path]) => !path.includes("__tests__"))
      .flatMap(([path, source]) =>
        [...source.matchAll(/text-\[(\d+)px\]/g)].map((match) => ({
          path,
          px: Number(match[1]),
        })),
      );
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter(({ px }) => px < 12)).toEqual([]);
  });
});
