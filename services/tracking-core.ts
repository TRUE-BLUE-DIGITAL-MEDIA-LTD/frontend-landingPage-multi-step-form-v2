export type ResolvedExit = "clicked_through" | "back" | "closed";

export function createExitState(): {
  markClick(): void;
  markBack(): void;
  resolve(): ResolvedExit;
} {
  let clicked = false;
  let back = false;
  return {
    markClick() {
      clicked = true;
    },
    markBack() {
      back = true;
    },
    resolve() {
      if (clicked) return "clicked_through";
      if (back) return "back";
      return "closed";
    },
  };
}

export function computeScrollPct(
  scrollY: number,
  innerHeight: number,
  scrollHeight: number,
): number {
  if (scrollHeight <= 0) return 0;
  const pct = Math.round(((scrollY + innerHeight) / scrollHeight) * 100);
  return Math.max(0, Math.min(100, pct));
}
