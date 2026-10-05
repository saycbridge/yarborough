import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { PracticePage } from "../PracticePage";
import "../../index.css";

/**
 * The phones the page is laid out for: an iPhone 15, 16 or 17 at 393 by 852,
 * and the narrower iPhone SE or mini at 375.
 */
const SCREEN_HEIGHT = 852;
const WIDTHS = [393, 375];

/** The actions under the bidding box, in the order they stand. */
const ACTIONS = ["Undo bid", "Restart hand", "Skip hand", "Share hand"];

let root: Root | undefined;
let phone: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  phone?.remove();
  root = undefined;
  phone = undefined;
});

function renderAt(width: number) {
  phone = document.createElement("div");
  phone.style.width = `${width}px`;
  document.body.style.margin = "0";
  document.body.append(phone);
  const router = createMemoryRouter(
    [{ path: "/bid/:boardId", element: h(PracticePage) }],
    { initialEntries: ["/bid/1-8415fab0e7e28874f7549bc26c"] },
  );
  root = createRoot(phone);
  flushSync(() => root!.render(h(RouterProvider, { router })));
}

function action(name: string): HTMLElement {
  const match = [...phone!.querySelectorAll("button")].find(
    (b) => b.textContent === name,
  );
  if (!match) throw new Error(`no button ${name}`);
  return match;
}

describe("PracticePage on a phone", () => {
  it.each(WIDTHS)(
    "keeps the actions under the bidding box to one line at %ipx",
    async (width) => {
      renderAt(width);
      await vi.waitFor(() => action("Skip hand"));

      const boxes = ACTIONS.map((name) => action(name).getBoundingClientRect());
      const lineHeight = Number.parseFloat(
        getComputedStyle(action("Skip hand")).lineHeight,
      );
      // A zero line height would mean Tailwind never loaded.
      expect(lineHeight).toBeGreaterThan(0);
      for (const [i, box] of boxes.entries()) {
        expect(box.height, ACTIONS[i]).toBe(lineHeight);
        expect(box.top, ACTIONS[i]).toBe(boxes[0].top);
      }
      const row = action("Skip hand").parentElement!;
      expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
      expect(phone!.scrollWidth).toBeLessThanOrEqual(width);

      // From the tabs to the last action, a hand being bid stands within
      // the phone's screen.
      expect(boxes[0].bottom - phone!.getBoundingClientRect().top).toBeLessThan(
        SCREEN_HEIGHT,
      );
    },
  );
});
