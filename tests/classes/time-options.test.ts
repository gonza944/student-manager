import assert from "node:assert/strict";
import test from "node:test";

import {
  getClassEndTimeOptions,
  getSelectableClassInterval,
  getClassPreferredTime,
  getClassTimeOptions,
  isClassTimeAvailable,
} from "../../lib/classes/time-options";
import { getClassDayRange } from "../../lib/classes/scheduling";
import type { ClassAvailability } from "../../lib/classes/contracts";

function availability(localDate: string, timeZone: string): ClassAvailability {
  const { dayStart, dayEnd } = getClassDayRange(localDate, timeZone);
  return {
    localDate,
    dayStart: dayStart.toISOString(),
    dayEnd: dayEnd.toISOString(),
    intervals: [],
  };
}

test("time options exclude cross-midnight starts and block full overlapping intervals, allowing adjacent slots", () => {
  const day = availability("2026-10-06", "UTC");
  day.intervals.push({
    id: "class-1",
    studentId: "student-1",
    studentName: "Student",
    status: "scheduled",
    scheduledAt: "2026-10-06T10:00:00.000Z",
    durationMinutes: 60,
  });
  const options = getClassTimeOptions(day, 60, "UTC", "en");
  const at = (time: string) =>
    options.find((option) => option.value === `2026-10-06T${time}:00.000Z`);
  assert.equal(at("09:00")?.disabled, false);
  assert.equal(at("09:05")?.disabled, true);
  assert.equal(at("10:55")?.disabled, true);
  assert.equal(at("11:00")?.disabled, false);
  assert.equal(at("23:00")?.disabled, false);
  assert.equal(at("23:05"), undefined);
  assert.deepEqual(getClassTimeOptions(day, 0, "UTC", "en"), []);
});

test("DST days contain real instants and distinguish repeated local times", () => {
  const spring = getClassTimeOptions(
    availability("2026-03-08", "America/New_York"),
    5,
    "America/New_York",
    "en",
  );
  const fall = getClassTimeOptions(
    availability("2026-11-01", "America/New_York"),
    5,
    "America/New_York",
    "en",
  );
  assert.equal(spring.length, 23 * 12);
  assert.equal(fall.length, 25 * 12);
  assert.equal(new Set(fall.map((option) => option.value)).size, fall.length);
  const repeated = fall.filter((option) => option.label.startsWith("1:00 AM"));
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0].label, repeated[1].label);
  assert.equal(
    fall.some((option) => /GMT|UTC/.test(option.label)),
    false,
  );
});

test("end-time choices reject crossing busy intervals and local midnight", () => {
  const day = availability("2026-10-07", "UTC");
  day.intervals.push({
    id: "busy",
    studentId: "student",
    studentName: "Student",
    status: "scheduled",
    scheduledAt: "2026-10-07T12:00:00.000Z",
    durationMinutes: 30,
  });
  const options = getClassEndTimeOptions(
    day,
    "2026-10-07T11:00:00.000Z",
    "UTC",
    "en",
  );
  assert.equal(
    options.find((option) => option.value === "2026-10-07T12:00:00.000Z")
      ?.disabled,
    false,
  );
  assert.equal(
    options.find((option) => option.value === "2026-10-07T12:05:00.000Z")
      ?.disabled,
    true,
  );
  assert.equal(
    isClassTimeAvailable(
      day,
      Date.parse("2026-10-07T11:30:00.000Z"),
      Date.parse("2026-10-07T12:00:00.000Z"),
    ),
    true,
  );
  assert.equal(
    isClassTimeAvailable(
      day,
      Date.parse("2026-10-07T23:30:00.000Z"),
      Date.parse("2026-10-08T00:05:00.000Z"),
    ),
    false,
  );
});

test("initial position prefers now today, earliest occupied time otherwise, and 08:00 on an empty date", () => {
  const day = availability("2026-10-07", "UTC");
  const now = new Date("2026-10-07T15:23:00.000Z");
  assert.equal(getClassPreferredTime(day, "UTC", now), now.getTime());
  const earlier = new Date("2026-10-06T00:00:00.000Z");
  assert.equal(
    getClassPreferredTime(day, "UTC", earlier),
    Date.parse("2026-10-07T08:00:00.000Z"),
  );
  day.intervals.push({
    id: "busy",
    studentId: "student",
    studentName: "Student",
    status: "completed",
    scheduledAt: "2026-10-07T11:00:00.000Z",
    durationMinutes: 30,
  });
  assert.equal(
    getClassPreferredTime(day, "UTC", earlier),
    Date.parse("2026-10-07T11:00:00.000Z"),
  );
});

test("cancelled editing permits reused slots but still enforces day boundaries", () => {
  const day = availability("2026-10-06", "UTC");
  const start = Date.parse(day.dayStart);
  day.intervals = [
    {
      id: "busy",
      studentId: "s",
      studentName: "Student",
      status: "scheduled",
      scheduledAt: day.dayStart,
      durationMinutes: 60,
    },
  ];
  assert.equal(isClassTimeAvailable(day, start, start + 300000), false);
  assert.equal(isClassTimeAvailable(day, start, start + 300000, true), true);
  assert.equal(isClassTimeAvailable(day, start - 300000, start, true), false);
});

test("initial selection shrinks to the free gap for keyboard and touch", () => {
  const day = availability("2026-10-06", "UTC");
  const start = Date.parse(day.dayStart);
  day.intervals = [
    {
      id: "busy",
      studentId: "s",
      studentName: "Student",
      status: "scheduled",
      scheduledAt: new Date(start + 15 * 60000).toISOString(),
      durationMinutes: 1425,
    },
  ];
  assert.deepEqual(getSelectableClassInterval(day, start, 60), {
    start,
    end: start + 15 * 60000,
  });
  assert.equal(getSelectableClassInterval(day, start + 15 * 60000, 60), null);
  assert.deepEqual(
    getSelectableClassInterval(day, Date.parse(day.dayEnd) - 300000, 60, true),
    { start: Date.parse(day.dayEnd) - 300000, end: Date.parse(day.dayEnd) },
  );
});
