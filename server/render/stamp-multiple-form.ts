/**
 * The multi-step form runtime is a static script with no access to page
 * props, so the server stamps what it needs onto the form root at render
 * time: the landing page id (for /api/v1/customers) and the page's main
 * link (redirect fallback when the form has no link of its own).
 */
export function stampMultipleFormMeta(
  document: Document,
  meta: { landingPageId: string; fallbackLink: string },
): void {
  const roots = document.querySelectorAll(".oxy-multiple-form");
  roots.forEach((root) => {
    root.setAttribute("data-oxy-lp-id", meta.landingPageId);
    root.setAttribute("data-oxy-fallback-link", meta.fallbackLink);
  });
}
