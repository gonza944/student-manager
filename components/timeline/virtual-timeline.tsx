"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  getTimelineLayout,
  getTimelineNowOffset,
  type TimelineOrientation,
} from "./layout";

type VirtualTimelineProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  getTimestamp: (item: T) => number;
  orientation: TimelineOrientation;
  now: number;
  label: string;
  nowLabel: string;
  renderHeader: (goToNow: () => void) => ReactNode;
  renderItem: (
    item: T,
    context: { orientation: TimelineOrientation; above: boolean },
  ) => ReactNode;
  onReachStart?: () => void;
  onReachEnd?: () => void;
};

export function VirtualTimeline<T>({
  items: entries,
  getKey,
  getTimestamp,
  orientation,
  now,
  label,
  nowLabel,
  renderHeader,
  renderItem,
  onReachStart,
  onReachEnd,
}: VirtualTimelineProps<T>) {
  const layout = getTimelineLayout(orientation);
  const viewport = useRef<HTMLDivElement>(null);
  const navigatingToNow = useRef(false);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const finish = () => {
      navigatingToNow.current = false;
    };
    element.addEventListener("scrollend", finish);
    return () => element.removeEventListener("scrollend", finish);
  }, []);
  const [extent, setExtent] = useState(0);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setExtent(element[layout.extentProperty]),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [layout.extentProperty]);
  const nowIndex = entries.filter((item) => getTimestamp(item) < now).length;
  const items = [
    ...entries.slice(0, nowIndex),
    null,
    ...entries.slice(nowIndex),
  ];
  // TanStack Virtual deliberately exposes mutable measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    horizontal: layout.horizontal,
    initialOffset: () => getTimelineNowOffset(nowIndex, orientation),
    paddingStart: extent / 2,
    paddingEnd: extent / 2,
    count: items.length,
    getScrollElement: () => viewport.current,
    estimateSize: (index) =>
      index === nowIndex ? layout.nowSize : layout.itemSize,
    getItemKey: (index) =>
      items[index] == null ? "timeline-now" : getKey(items[index]),
    overscan: 3,
  });
  const firstId = entries[0] == null ? undefined : getKey(entries[0]);
  const anchor = useRef<{ first: string | undefined } | null>(null);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || !extent) return;
    if (!anchor.current)
      element[layout.scrollProperty] = getTimelineNowOffset(
        nowIndex,
        orientation,
      );
    else if (firstId !== anchor.current.first) {
      const added = entries.findIndex(
        (item) => getKey(item) === anchor.current?.first,
      );
      if (added > 0) {
        if (navigatingToNow.current) {
          virtualizer.scrollToIndex(nowIndex, {
            align: "center",
            behavior: "smooth",
          });
        } else element[layout.scrollProperty] += added * layout.itemSize;
      }
    }
    anchor.current = { first: firstId };
  }, [
    extent,
    firstId,
    getKey,
    entries,
    nowIndex,
    layout.itemSize,
    layout.scrollProperty,
    orientation,
    virtualizer,
  ]);
  const rows = virtualizer.getVirtualItems();
  const first = rows[0]?.index;
  const last = rows.at(-1)?.index;
  useEffect(() => {
    if (!extent || navigatingToNow.current) return;
    if (first !== undefined && first < 3 && onReachStart) onReachStart();
    else if (last !== undefined && last >= items.length - 3 && onReachEnd)
      onReachEnd();
  }, [extent, first, last, items.length, onReachStart, onReachEnd]);

  const goToNow = () => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const offset = viewport.current?.[layout.scrollProperty] ?? 0;
    navigatingToNow.current =
      smooth &&
      Math.abs(offset - getTimelineNowOffset(nowIndex, orientation)) > 1;
    virtualizer.scrollToIndex(nowIndex, {
      align: "center",
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return (
    <>
      {renderHeader(goToNow)}
      <div className="px-6">
        <ScrollArea
          viewportRef={viewport}
          viewportClassName={layout.horizontal ? "timeline-fade-horizontal" : "timeline-fade-vertical"}
          data-orientation={orientation}
          className={layout.viewportClass}
          aria-label={label}
        >
          <ul
            aria-label={label}
            className="relative"
            style={
              layout.horizontal
                ? {
                    width: virtualizer.getTotalSize(),
                    height: 440,
                    minWidth: "100%",
                  }
                : { height: virtualizer.getTotalSize(), width: "100%" }
            }
          >
            <li
              aria-hidden="true"
              className={`pointer-events-none absolute border-border ${layout.railClass}`}
            />
            {rows.map((row) => {
              const item = items[row.index];
              const above =
                (row.index < nowIndex
                  ? row.index - nowIndex
                  : row.index - nowIndex - 1) %
                  2 ===
                0;
              return (
                <li
                  key={row.key}
                  aria-setsize={items.length}
                  aria-posinset={row.index + 1}
                  className="absolute"
                  style={
                    layout.horizontal
                      ? {
                          top: 0,
                          height: "100%",
                          width: row.size,
                          left: row.start,
                        }
                      : {
                          left: 0,
                          width: "100%",
                          height: row.size,
                          top: row.start,
                        }
                  }
                >
                  {item ? (
                    <div
                      className={`${getTimestamp(item) < now ? "text-muted-foreground" : ""} ${layout.horizontal ? `absolute inset-x-4 ${above ? "bottom-[220px] pb-8" : "top-[220px] pt-8"}` : "absolute inset-y-0 start-8 end-2 py-3"}`}
                    >
                      {renderItem(item, { orientation, above })}
                    </div>
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        data-slot="timeline-now-line"
                        className={`pointer-events-none absolute ${layout.nowLineClass}`}
                      />
                      <div className="relative flex h-full items-center justify-center">
                        <span className="rounded-full border border-orbit-ink/20 bg-yellow-200 px-4 py-2 text-sm font-bold text-orbit-ink">
                          {nowLabel}
                        </span>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {layout.horizontal ? <ScrollBar orientation="horizontal" /> : null}
        </ScrollArea>
      </div>
    </>
  );
}
