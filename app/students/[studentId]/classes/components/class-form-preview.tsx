"use client";

import { useState } from "react";

import { StudentDatePicker } from "@/app/students/add/components/student-date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ClassTimePicker } from "./class-time-picker";

export function ClassFormPreview({
  mode,
  locale,
  timeZone,
  minDate,
  initialDate,
  initialTime,
  labels,
}: {
  mode: "add" | "edit";
  locale: string;
  timeZone: string;
  minDate: string;
  initialDate: string;
  initialTime: string;
  labels: {
    date: string;
    datePlaceholder: string;
    openDate: string;
    startTime: string;
    openTime: string;
    save: string;
  };
}) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);

  return (
    <form className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-class-date`}>{labels.date}</Label>
          <StudentDatePicker
            id={`${mode}-class-date`}
            name="date"
            value={date}
            locale={locale}
            timeZone={timeZone}
            placeholder={labels.datePlaceholder}
            openLabel={labels.openDate}
            minDate={minDate}
            limitToToday={false}
            required
            invalid={false}
            onValueChange={setDate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-class-time`}>{labels.startTime}</Label>
          <ClassTimePicker
            id={`${mode}-class-time`}
            name="time"
            value={time}
            locale={locale}
            openLabel={labels.openTime}
            onValueChange={setTime}
          />
        </div>
      </div>
      <Button type="submit" disabled>
        {labels.save}
      </Button>
    </form>
  );
}
