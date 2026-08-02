// A target="_blank" anchor must NOT be hijacked into router.push(): the
// browser opens the new tab natively and the lander page — including any
// in-progress multi-step form — stays alive underneath.
export function isNewTabAnchor(
  target: string | null | undefined,
): boolean {
  return (target ?? "").trim().toLowerCase() === "_blank";
}
