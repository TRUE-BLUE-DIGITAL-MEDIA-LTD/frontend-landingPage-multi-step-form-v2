import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { stampMultipleFormMeta } from "./stamp-multiple-form";

describe("stampMultipleFormMeta", () => {
  it("stamps id and fallback link on every form root", () => {
    const dom = new JSDOM(
      `<div class="oxy-multiple-form"></div><div class="oxy-multiple-form"></div>`,
    );
    stampMultipleFormMeta(dom.window.document, {
      landingPageId: "lp123",
      fallbackLink: "https://partner.example/go",
    });
    const roots = dom.window.document.querySelectorAll(".oxy-multiple-form");
    roots.forEach((root) => {
      expect(root.getAttribute("data-oxy-lp-id")).toBe("lp123");
      expect(root.getAttribute("data-oxy-fallback-link")).toBe(
        "https://partner.example/go",
      );
    });
  });

  it("is a no-op on pages without the form", () => {
    const dom = new JSDOM(`<div class="other"></div>`);
    expect(() =>
      stampMultipleFormMeta(dom.window.document, {
        landingPageId: "lp123",
        fallbackLink: "",
      }),
    ).not.toThrow();
  });
});
