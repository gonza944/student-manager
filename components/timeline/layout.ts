export type TimelineOrientation = "horizontal" | "vertical";

export function getTimelineLayout(orientation: TimelineOrientation) {
  const horizontal = orientation === "horizontal";
  return {
    horizontal,
    itemSize: horizontal ? 256 : 224,
    nowSize: horizontal ? 128 : 88,
    scrollProperty: horizontal
      ? ("scrollLeft" as const)
      : ("scrollTop" as const),
    extentProperty: horizontal
      ? ("clientWidth" as const)
      : ("clientHeight" as const),
    viewportClass: horizontal
      ? "h-[440px] w-full"
      : "h-[min(70dvh,35rem)] min-h-80 w-full",
    railClass: horizontal
      ? "inset-x-0 top-[220px] border-t"
      : "inset-y-0 start-5 border-s",
    nowLineClass: horizontal
      ? "inset-y-6 left-1/2 w-px bg-linear-to-b from-transparent via-yellow-700 to-transparent dark:via-accent"
      : "inset-x-0 top-1/2 h-px bg-linear-to-r from-transparent via-yellow-700 to-transparent dark:via-accent",
  };
}

export function getTimelineNowOffset(
  nowIndex: number,
  orientation: TimelineOrientation,
) {
  const layout = getTimelineLayout(orientation);
  return nowIndex * layout.itemSize + layout.nowSize / 2;
}
