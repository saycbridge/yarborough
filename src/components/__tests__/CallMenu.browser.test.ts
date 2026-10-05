import { afterEach, describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { CallMenu } from "../CallMenu";
import {
  type Call,
  type CallInterpretation,
  type HandAnalysis,
  handFromCdhsString,
} from "../../bridge";
import "../../index.css";

/** The narrowest phone the menu is laid out for, less the page's padding. */
const NARROW = 375 - 32;

/** The calls with the widest labels: a bubble has to hold each of them. */
const CALLS: Call[] = [
  { type: "pass" },
  { type: "double" },
  { type: "redouble" },
  { type: "bid", level: 7, strain: "N" },
  { type: "bid", level: 7, strain: "S" },
];

const INTERPRETATIONS: CallInterpretation[] = CALLS.map((call) => ({
  call,
  ruleName: "Some Rule",
  constraints: "10+ hcp",
}));

/** Every call weighed, and none of them meaning anything: the small bubbles. */
const NO_RULE: HandAnalysis = {
  call: { type: "pass" },
  calls: CALLS.map((call) => ({ call, fit: "no_rule", misses: [] })),
};

let root: Root | undefined;
let container: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  container?.remove();
  root = undefined;
  container = undefined;
});

function renderMenu(props: Parameters<typeof CallMenu>[0]) {
  container = document.createElement("div");
  container.style.width = `${NARROW}px`;
  document.body.append(container);
  root = createRoot(container);
  flushSync(() => root!.render(h(CallMenu, props)));
}

/**
 * Each row's bubble, with how far the call written in it reaches from its
 * middle: out to the corner of its capitals, which a round bubble cuts off
 * first. The capitals stand about 0.72em tall.
 */
function bubbles() {
  return CALLS.map((call) => {
    const key =
      call.type === "bid"
        ? `${call.level}${call.strain}`
        : { pass: "P", double: "X", redouble: "XX" }[call.type];
    const bubble = container!.querySelector(`[data-testid="call-row-${key}"]`)!
      .firstElementChild as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(bubble);
    const box = bubble.getBoundingClientRect();
    const label = range.getBoundingClientRect();
    const capHeight =
      0.72 * Number.parseFloat(getComputedStyle(bubble).fontSize);
    return {
      radius: box.width / 2,
      reach: Math.hypot(label.width / 2, capHeight / 2),
    };
  });
}

describe("CallMenu bubbles", () => {
  it("holds every call's label inside its round bubble", () => {
    renderMenu({ interpretations: INTERPRETATIONS });
    for (const { radius, reach } of bubbles()) {
      // A zero radius would mean Tailwind never loaded.
      expect(radius).toBeGreaterThan(0);
      expect(reach).toBeLessThanOrEqual(radius);
    }
  });

  it("holds them inside the small bubble of a call with no meaning", () => {
    renderMenu({
      interpretations: INTERPRETATIONS,
      analysis: NO_RULE,
      hand: handFromCdhsString("42.A973.K5.AQ982"),
    });
    for (const { radius, reach } of bubbles()) {
      // A zero radius would mean Tailwind never loaded.
      expect(radius).toBeGreaterThan(0);
      expect(reach).toBeLessThanOrEqual(radius);
    }
  });
});
