// Decides whether a clicked link is "the main button" — i.e. it leads to the
// lander's offer. Query params are ignored because subids vary per placement.
const normPath = (p: string) => p.replace(/\/+$/, "") || "/";

export function isMainTarget(
  href: string | null | undefined,
  mainButton: string | null | undefined,
): boolean {
  if (!href || !mainButton) return false;
  try {
    const a = new URL(href);
    const b = new URL(mainButton);
    return a.origin === b.origin && normPath(a.pathname) === normPath(b.pathname);
  } catch {
    return false;
  }
}
