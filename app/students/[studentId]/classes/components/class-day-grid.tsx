"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClassAvailability } from "@/lib/classes/contracts";
import {
  getClassTimeOptions,
  getSelectableClassInterval,
  isClassTimeAvailable,
} from "@/lib/classes/time-options";

const STEP = 300_000;
const PIXELS_PER_MINUTE = 2;

export function ClassDayGrid({
  day,
  scheduledAt,
  durationMinutes,
  timeZone,
  preferredTime,
  disabled,
  allowOverlap = false,
  onSelect,
}: {
  day: ClassAvailability;
  scheduledAt: string;
  durationMinutes: number;
  timeZone: string;
  preferredTime: number;
  disabled: boolean;
  allowOverlap?: boolean;
  onSelect: (start: string, duration: number) => void;
}) {
  const t = useTranslations("Classes");
  const locale = useLocale();
  const viewport = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    mode: "new" | "start" | "end";
    anchor: number;
    start: number;
    end: number;
    pointerY: number;
    touch: boolean;
  } | null>(null);
  const dayStart = Date.parse(day.dayStart);
  const dayEnd = Date.parse(day.dayEnd);
  const start = Date.parse(scheduledAt);
  const end = start + durationMinutes * 60_000;
  const selected = start >= dayStart && end <= dayEnd && end > start;
  const valid = isClassTimeAvailable(day, start, end, allowOverlap);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const labels = new Map(
    getClassTimeOptions(day, 5, timeZone, locale).map((option) => [
      Date.parse(option.value),
      option.label,
    ]),
  );
  const formatTime = (instant: number) =>
    labels.get(instant) ?? time.format(instant);
  const top = (instant: number) =>
    ((instant - dayStart) / 60_000) * PIXELS_PER_MINUTE;
  const height = top(dayEnd);
  const initialPosition = useRef(selected ? start : preferredTime);
  useEffect(() => {
    if (viewport.current)
      viewport.current.scrollTop = Math.max(
        0,
        ((initialPosition.current - dayStart) / 60_000) * PIXELS_PER_MINUTE -
          60,
      );
  }, [dayStart]);
  useEffect(() => {
    if (dragging || !selected || !viewport.current) return;
    const position = 64 + ((start - dayStart) / 60_000) * PIXELS_PER_MINUTE;
    const endPosition = 64 + ((end - dayStart) / 60_000) * PIXELS_PER_MINUTE;
    const fits = endPosition - position <= viewport.current.clientHeight - 108;
    if (
      position < viewport.current.scrollTop + 80 ||
      position >
        viewport.current.scrollTop + viewport.current.clientHeight - 28 ||
      (fits &&
        endPosition >
          viewport.current.scrollTop + viewport.current.clientHeight - 28)
    ) {
      viewport.current.scrollTop = Math.max(0, position - 80);
    }
  }, [start, end, selected, dayStart, dragging]);

  function commit(nextStart: number, nextEnd: number) {
    if (!isClassTimeAvailable(day, nextStart, nextEnd, allowOverlap)) return;
    onSelect(new Date(nextStart).toISOString(), (nextEnd - nextStart) / 60_000);
  }
  function selectAt(start: number) {
    const interval = getSelectableClassInterval(
      day,
      start,
      durationMinutes,
      allowOverlap,
    );
    if (interval) commit(interval.start, interval.end);
  }
  function instantAt(clientY: number) {
    const y = clientY - (grid.current?.getBoundingClientRect().top ?? clientY);
    return Math.max(
      dayStart,
      Math.min(dayEnd, dayStart + Math.round(y / PIXELS_PER_MINUTE / 5) * STEP),
    );
  }
  function begin(
    event: PointerEvent<HTMLElement>,
    mode: "new" | "start" | "end",
  ) {
    if (disabled || event.button !== 0) return;
    event.stopPropagation();
    if (mode !== "new" || event.pointerType !== "touch") setDragging(true);
    const anchor = Math.min(dayEnd - STEP, instantAt(event.clientY));
    gesture.current = {
      mode,
      anchor,
      start,
      end,
      pointerY: event.clientY,
      touch: event.pointerType === "touch",
    };
    if (mode !== "new" || event.pointerType !== "touch") {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (mode === "new" && event.pointerType !== "touch") selectAt(anchor);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || (current.touch && current.mode === "new")) return;
    const point = instantAt(event.clientY);
    if (current.mode === "start")
      commit(Math.min(point, current.end - STEP), current.end);
    else if (current.mode === "end")
      commit(current.start, Math.max(point, current.start + STEP));
    else if (point !== current.anchor) {
      const low = Math.min(point, current.anchor);
      commit(
        low,
        Math.min(dayEnd, Math.max(low + STEP, Math.max(point, current.anchor))),
      );
    }
  }
  function finish(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (
      current?.touch &&
      current.mode === "new" &&
      Math.abs(event.clientY - current.pointerY) < 6
    ) {
      selectAt(current.anchor);
    }
    gesture.current = null;
    setDragging(false);
  }

  return (
    <section
      aria-labelledby="class-day-grid-title"
      className="flex min-h-0 flex-[6] flex-col gap-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="class-day-grid-title" className="text-sm font-bold">
          {t("grid.title")}
        </h2>
      </div>
      <ScrollArea
        viewportRef={viewport}
        className="min-h-40 flex-1 rounded-xl border border-orbit-ink/20"
        data-vaul-no-drag
      >
        <div className="px-6 pb-6 pt-16">
          <div
            ref={grid}
            data-slot="class-day-grid"
            className="relative select-none"
            style={{ height }}
          >
            <div
              data-slot="class-day-grid-track"
              className="absolute inset-y-0 start-20 end-3 touch-pan-y"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={t("grid.selectInterval")}
              aria-disabled={disabled}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  const available = getClassTimeOptions(
                    allowOverlap ? { ...day, intervals: [] } : day,
                    5,
                    timeZone,
                    locale,
                  ).filter((option) => !option.disabled);
                  const option =
                    available.find(
                      (item) => Date.parse(item.value) >= preferredTime,
                    ) ?? available[0];
                  if (option) selectAt(Date.parse(option.value));
                } else if (
                  selected &&
                  (event.key === "ArrowUp" || event.key === "ArrowDown")
                ) {
                  event.preventDefault();
                  const offset = event.key === "ArrowUp" ? -STEP : STEP;
                  commit(start + offset, end + offset);
                }
              }}
              onPointerDown={(event) => begin(event, "new")}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={() => {
                gesture.current = null;
                setDragging(false);
              }}
            />
            {Array.from(
              { length: Math.ceil((dayEnd - dayStart) / (30 * 60_000)) },
              (_, index) => {
                const instant = dayStart + index * 30 * 60_000;
                return (
                  <div
                    key={instant}
                    className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center"
                    style={{ top: top(instant) }}
                  >
                    <span className="w-20 pe-3 text-end text-xs leading-none text-muted-foreground [text-box:trim-both_cap_alphabetic]">
                      {formatTime(instant)}
                    </span>
                    <span className="flex-1 border-t border-orbit-ink/10" />
                  </div>
                );
              },
            )}
            {day.intervals.map((interval) => {
              const busyStart = Math.max(
                dayStart,
                Date.parse(interval.scheduledAt),
              );
              const busyEnd = Math.min(
                dayEnd,
                Date.parse(interval.scheduledAt) +
                  interval.durationMinutes * 60_000,
              );
              const label = `${formatTime(busyStart)} — ${formatTime(busyEnd)} · ${interval.studentName} · ${t(`statuses.${interval.status}`)}`;
              return (
                <div
                  key={interval.id}
                  title={label}
                  className="pointer-events-none absolute start-20 end-3 overflow-hidden rounded-xl border border-orbit-ink/20 bg-muted p-3 text-xs"
                  style={{
                    top: top(busyStart),
                    height: top(busyEnd) - top(busyStart),
                  }}
                >
                  <p className="font-bold">{interval.studentName}</p>
                  <p>
                    {formatTime(busyStart)} — {formatTime(busyEnd)} ·{" "}
                    {t(`statuses.${interval.status}`)}
                  </p>
                </div>
              );
            })}
            {selected ? (
              <div
                className={`pointer-events-none absolute start-20 end-3 rounded-lg border-2 ${valid ? "border-orbit-ink bg-orbit-ink/10" : "border-destructive bg-destructive/10"}`}
                style={{ top: top(start), height: top(end) - top(start) }}
              >
                <p className="absolute -top-14 end-0 rounded-md bg-paper-strong px-2 py-1 text-end text-xs font-bold">
                  {formatTime(start)} — {formatTime(end)} ·{" "}
                  {t("duration", { minutes: durationMinutes })}
                </p>
                {(["start", "end"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="outline"
                    size="sm"
                    role="slider"
                    aria-label={t(
                      mode === "start" ? "grid.startHandle" : "grid.endHandle",
                    )}
                    aria-valuemin={
                      mode === "start" ? 0 : (start - dayStart) / 60_000 + 5
                    }
                    aria-valuemax={
                      mode === "start"
                        ? (end - dayStart) / 60_000 - 5
                        : (dayEnd - dayStart) / 60_000
                    }
                    aria-valuenow={
                      ((mode === "start" ? start : end) - dayStart) / 60_000
                    }
                    aria-valuetext={formatTime(mode === "start" ? start : end)}
                    disabled={disabled}
                    className={`pointer-events-auto absolute h-11 touch-none rounded-full bg-paper-strong text-xs ${mode === "start" ? "start-1 -top-[22px]" : "end-1 -bottom-[22px]"}`}
                    onPointerDown={(event) => begin(event, mode)}
                    onPointerMove={move}
                    onPointerUp={finish}
                    onPointerCancel={() => {
                      gesture.current = null;
                      setDragging(false);
                    }}
                    onKeyDown={(event) => {
                      const direction =
                        event.key === "ArrowUp" || event.key === "ArrowLeft"
                          ? -1
                          : event.key === "ArrowDown" ||
                              event.key === "ArrowRight"
                            ? 1
                            : 0;
                      if (!direction) return;
                      event.preventDefault();
                      if (mode === "start")
                        commit(start + direction * STEP, end);
                      else commit(start, end + direction * STEP);
                    }}
                  >
                    {t(mode === "start" ? "grid.startLabel" : "grid.endLabel")}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}
