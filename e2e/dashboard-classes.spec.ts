import { expect, test, type Page } from "@playwright/test";

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
  for (const [name, day] of [[zoe, "02"], [ana, "01"]]) {
    await schedule.click();
    await page.getByRole("menuitem", { name, exact: true }).click();
    const form = page.getByRole("main");
    await expect(form.getByRole("heading", { name: "Schedule class" })).toBeVisible();
    await expect(form.getByText(name, { exact: true })).toBeVisible();
    const availabilityLoaded = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      response.request().postData()?.includes(`2026-09-${day}`) === true,
    );
    await form.getByLabel("Date", { exact: true }).fill(`09/${day}/2026`);
    await availabilityLoaded;
    const interval = form.getByRole("button", { name: "Select an available class interval" });
    await expect(interval).toBeEnabled();
    await interval.press("Enter");
    await expect(form.getByRole("slider", { name: "Adjust class start time" })).toBeVisible();
    const save = form.getByRole("button", { name: "Save class" });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page).toHaveURL("/#class-timeline");
  }

  const timeline = page.getByRole("list", { name: "Class timeline", exact: true });
  const classFor = (name: string) => timeline.getByRole("button").filter({ hasText: name });
  await expect(timeline.getByRole("button")).toHaveText([/Ana Timeline/, /Zoe Timeline/]);
  await verifyTimelineNavigation(page, "horizontal", "Class timeline", "Go to now");

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
