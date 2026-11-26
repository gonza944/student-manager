import { expect, test, type Page } from "@playwright/test";

import { selectClassTime } from "./helpers/class-scheduler";
import { verifyTimelineNavigation } from "./helpers/class-timeline";

async function signUpTeacher(page: Page, email: string) {
  await page.goto("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByLabel("Name", { exact: true }).fill("Dashboard timeline teacher");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("playwright-test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
}

test("teachers can manage classes for different students on the dashboard", async ({ page }) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const ana = `Ana Timeline ${suffix}`;
  const zoe = `Zoe Timeline ${suffix}`;
  await signUpTeacher(page, `timeline-${suffix}@example.test`);

  const empty = page.getByText("No classes yet.", { exact: true });
  const schedule = page.getByRole("button", { name: "Schedule class", exact: true });
  await page.getByRole("link", { name: "View schedule" }).click();
  await expect(empty).toBeVisible();
  await expect(schedule).toBeDisabled();

  for (const [name, rate] of [[ana, "50"], [zoe, "60"]]) {
    await page.goto("/students/add");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Student since", { exact: true }).fill("09/01/2026");
    await page.getByLabel("Hourly rate (USD)").fill(rate);
    await page.getByRole("button", { name: "Add student", exact: true }).click();
    await expect(page).toHaveURL("/students");
  }

  await page.goto("/");
  const viewport = page.viewportSize()!;
  for (const [name, day, width] of [[zoe, "02", 1033], [ana, "01", 390]] as const) {
    await page.setViewportSize({ width, height: 486 });
    await schedule.click();
    await page.getByRole("menuitem", { name, exact: true }).click();
    const form = page.getByRole("dialog", { name: "Schedule class", exact: true });
    await expect(form.getByRole("heading", { name: "Schedule class", level: 1 })).toBeVisible();
    await expect(form.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Class timeline", includeHidden: true })).toBeAttached();
    const date = form.getByLabel("Date", { exact: true });
    await expect(date).toBeInViewport();
    await expect(form.getByLabel("Charge (USD)")).toBeInViewport();
    const save = form.getByRole("button", { name: "Save class" });
    await expect(save).toBeInViewport({ ratio: 1 });
    const availabilityLoaded = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      response.request().postData()?.includes(`2026-09-${day}`) === true,
    );
    await date.fill(`09/${day}/2026`);
    await availabilityLoaded;
    const interval = form.getByRole("button", { name: "Select an available class interval" });
    await expect(interval).toBeEnabled();
    await interval.press("Enter");
    await expect(form.getByRole("slider", { name: "Adjust class start time" })).toBeVisible();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(form).toBeHidden();
    await expect(page).toHaveURL("/#class-timeline");
  }
  await page.setViewportSize(viewport);

  const timeline = page.getByRole("list", { name: "Class timeline", exact: true });
  const classFor = (name: string) => timeline.getByRole("button").filter({ hasText: name });
  await expect(timeline.getByRole("button")).toHaveText([/Ana Timeline/, /Zoe Timeline/]);
  await verifyTimelineNavigation(page, "horizontal", "Class timeline", "Go to now");

  const themeToggle = page.getByRole("button", { name: "Toggle color theme" });
  await themeToggle.click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const darkForeground = await page.locator("body").evaluate((body) => getComputedStyle(body).color);
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toHaveCSS("color", darkForeground);
  await expect(schedule).toHaveCSS("color", darkForeground);
  await expect(timeline.getByText("Scheduled", { exact: true }).first()).toHaveCSS("color", darkForeground);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await themeToggle.click();

  const viewStudent = page.getByRole("menuitem", { name: "View student profile" });
  await classFor(ana).click();
  await expect(viewStudent).toBeVisible();
  await viewStudent.press("Enter");
  await expect(page).toHaveURL(/\/students\/[^/]+$/);
  await expect(page.getByRole("heading", { name: ana, exact: true })).toBeVisible();
  await timeline.getByRole("button", { name: /Scheduled.*60 minutes/ }).click();
  await expect(page.getByRole("menuitem", { name: "Edit class" })).toBeVisible();
  await expect(viewStudent).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goBack();
  await expect(page).toHaveURL("/#class-timeline");

  await classFor(ana).click();
  await page.getByRole("menuitem", { name: "Edit class" }).click();
  const edit = page.getByRole("dialog", { name: "Edit class" });
  await expect(edit).toBeVisible();
  await expect(page.getByRole("list", { name: "Class timeline", includeHidden: true })).toBeAttached();
  await expect(edit.getByText(ana, { exact: true })).toBeVisible();
  await expect(edit.getByLabel("Date", { exact: true })).toBeInViewport();
  await expect(edit.getByLabel("Charge (USD)")).toBeInViewport();
  await expect(edit.getByRole("region", { name: "Day schedule" })).toBeInViewport();
  await edit.getByRole("button", { name: "Occupied times" }).click();
  await expect(edit.getByText("No occupied times on this date.")).toBeInViewport();
  await edit.getByLabel("Charge (USD)").fill("55");
  await edit.getByRole("button", { name: "Save class" }).click();
  await expect(edit).toBeHidden();
  await expect(page).toHaveURL("/#class-timeline");
  await expect(classFor(ana)).toContainText("USD 55.00");

  await classFor(zoe).click();
  await page.getByRole("menuitem", { name: "Mark completed" }).click();
  await expect(classFor(zoe)).toContainText("Completed");

  await classFor(ana).click();
  await page.getByRole("menuitem", { name: "Cancel class" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel class" }).click();
  await expect(classFor(ana)).toContainText("Cancelled");

  await page.setViewportSize({ width: 390, height: 680 });
  await verifyTimelineNavigation(page, "vertical", "Class timeline", "Go to now");
  await classFor(zoe).click();
  await page.getByRole("menuitem", { name: "Edit class" }).click();
  await expect(edit).toBeVisible();
  await expect(edit.getByText(zoe, { exact: true })).toBeVisible();
  await expect(edit.getByLabel("Date", { exact: true })).toBeInViewport();
  await expect(edit.getByLabel("Charge (USD)")).toBeInViewport();
  await expect(edit.getByRole("region", { name: "Day schedule" })).toBeInViewport();
  await edit.getByRole("button", { name: "Occupied times" }).click();
  await expect(edit.getByText("No occupied times on this date.")).toBeInViewport();
  await edit.getByRole("button", { name: "Close class dialog" }).click();
  await expect(edit).toBeHidden();
  await expect(page).toHaveURL("/#class-timeline");

  await classFor(zoe).click();
  await expect(viewStudent).toBeVisible();
  await viewStudent.click();
  await expect(page).toHaveURL(/\/students\/[^/]+$/);
  await expect(page.getByRole("heading", { name: zoe, exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/#class-timeline");

  await classFor(ana).click();
  await page.getByRole("menuitem", { name: "Delete permanently" }).click();
  await page.getByRole("dialog", { name: "Delete class?" }).getByRole("button", { name: "Delete permanently" }).click();
  await expect(classFor(ana)).toHaveCount(0);
  await expect(classFor(zoe)).toContainText("Completed");

  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await signUpTeacher(page, `other-timeline-${suffix}@example.test`);
  await expect(empty).toBeVisible();
  await expect(classFor(zoe)).toHaveCount(0);
});

test("desktop revenue tooltips show gross and net amounts by source", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await signUpTeacher(page, `revenue-${Date.now()}@example.test`);

  const students = [
    { name: "Preply revenue student", source: "Preply", rate: "100", time: "9:00 AM" },
    { name: "Direct revenue student", source: "Direct", rate: "60", time: "11:00 AM" },
  ];
  for (const { name, source, rate } of students) {
    await page.goto("/students/add");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Hourly rate (USD)").fill(rate);
    await page.getByRole("radio", { name: source, exact: true }).click();
    await page.getByRole("button", { name: "Add student", exact: true }).click();
    await expect(page).toHaveURL("/students");
  }

  await page.goto("/");
  const schedule = page.getByRole("button", { name: "Schedule class", exact: true });
  const timeline = page.getByRole("list", { name: "Class timeline", exact: true });
  for (const { name, time } of students) {
    await schedule.click();
    await page.getByRole("menuitem", { name, exact: true }).click();
    const form = page.getByRole("dialog", { name: "Schedule class", exact: true });
    await selectClassTime(page, form, time);
    await form.getByRole("button", { name: "Save class", exact: true }).click();
    await expect(form).toBeHidden();
    await expect(page).toHaveURL("/#class-timeline");

    const scheduledClass = timeline.getByRole("button").filter({ hasText: name });
    await scheduledClass.click();
    await page.getByRole("menuitem", { name: "Mark completed" }).click();
    await expect(scheduledClass).toContainText("Completed");
  }

  await page.goto("/");
  const overview = page.getByRole("region", { name: "Teaching overview" });
  const tooltip = page.getByRole("tooltip");
  const totals = [
    {
      amount: overview.getByText("$139.09", { exact: true }),
      breakdown: /^Net after fees\s*Preply\s*\$82\.00\s*Direct\s*\$57\.09$/,
    },
    {
      amount: overview.getByText("$160.00", { exact: true }),
      breakdown: /^Gross before fees\s*Preply\s*\$100\.00\s*Direct\s*\$60\.00$/,
    },
  ];

  for (const { amount, breakdown } of totals) {
    await amount.hover();
    await expect(tooltip).toHaveText(breakdown);
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  }

  await overview.getByText("Monthly revenue", { exact: true }).hover();
  await page.getByRole("button", { name: "Log out", exact: true }).focus();
  for (const { amount, breakdown } of totals) {
    await page.keyboard.press("Tab");
    await expect(amount).toBeFocused();
    await expect(tooltip).toHaveText(breakdown);
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(amount).toBeFocused();
  }
});
