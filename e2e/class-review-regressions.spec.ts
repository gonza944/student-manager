import { expect, test } from "@playwright/test";

test("class review regressions: full-page discard, external refresh and historical charge edits", async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.clock.install();
  const name = `Class review ${Date.now()}`;
  await page.goto("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(`class-review-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("playwright-test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/students/add");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Student since", { exact: true }).fill("09/01/2026");
  await page.getByLabel("Hourly rate (USD)").fill("50");
  await page.getByRole("button", { name: "Add student", exact: true }).click();
  await expect(page).toHaveURL("/students");
  await page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) }).getByRole("link").click();
  await expect(page).toHaveURL(/\/students\/[^/]+$/);
  const profile = new URL(page.url()).pathname;

  await page.goto(`${profile}/classes/add`);
  await page.getByLabel("Charge (USD)").fill("51");
  await page.getByRole("link", { name: "Back to student" }).click();
  const discard = page.getByRole("dialog", { name: "Discard unsaved changes?" });
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Charge (USD)")).toHaveValue("51");
  await page.getByRole("link", { name: "Back to student" }).click();
  await discard.getByRole("button", { name: "Discard changes" }).click();
  await expect(page).toHaveURL(profile);

  await page.goto(`${profile}/classes/add`);
  const availabilityLoaded = page.waitForResponse((response) =>
    response.request().method() === "POST" &&
    response.request().postData()?.includes("2026-09-01") === true,
  );
  await page.getByLabel("Date", { exact: true }).fill("09/01/2026");
  await availabilityLoaded;
  const interval = page.getByRole("button", { name: "Select an available class interval" });
  await expect(interval).toBeEnabled();
  await interval.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("slider", { name: "Adjust class start time" })).toBeVisible();
  await page.getByRole("button", { name: "Save class" }).click();
  await expect(page).toHaveURL(profile);
  const scheduled = page.getByRole("button", { name: /Scheduled.*60 minutes.*USD/ });
  await expect(scheduled).toBeVisible();

  await scheduled.click();
  const editLink = page.getByRole("menuitem", { name: "Edit class" });
  const editPath = await editLink.getAttribute("href");
  expect(editPath).toBeTruthy();
  // An unchanged background refresh must keep the active menu and scroll position.
  const viewport = page.locator('[data-orientation="horizontal"] [data-slot="scroll-area-viewport"]');
  const offset = await viewport.evaluate((element) => element.scrollLeft);
  const refreshed = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === profile);
  await page.clock.runFor(60_001);
  await refreshed;
  await expect(editLink).toBeVisible();
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(offset);
  await page.keyboard.press("Escape");

  const other = await context.newPage();
  await other.goto(profile);
  await other.getByRole("button", { name: /Scheduled.*60 minutes.*USD/ }).click();
  await other.getByRole("menuitem", { name: "Mark completed" }).click();
  await expect(other.getByRole("button", { name: /Completed.*60 minutes.*USD/ })).toBeVisible();
  await page.bringToFront();
  await page.clock.runFor(60_001);
  await expect(page.getByRole("button", { name: /Completed.*60 minutes.*USD/ })).toBeVisible();

  await other.goto(`/students/edit/${profile.split("/").at(-1)}`);
  await other.getByLabel("Student since", { exact: true }).fill("09/02/2026");
  await other.getByRole("button", { name: "Save changes" }).click();
  await expect(other).toHaveURL(profile);
  await other.close();
  await page.goto(editPath!);
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue("09/01/2026");
  await expect(page.getByRole("button", { name: "Save class" })).toBeEnabled();
  await page.getByLabel("Charge (USD)").fill("65");
  await page.getByRole("link", { name: "Back to student" }).click();
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "Keep editing" }).click();
  await page.getByLabel("Date", { exact: true }).fill("08/31/2026");
  await expect(page.getByRole("button", { name: "Save class" })).toBeDisabled();
  await page.getByLabel("Date", { exact: true }).fill("09/01/2026");
  await page.getByRole("button", { name: "Save class" }).click();
  await expect(page).toHaveURL(profile);
  await page.reload();
  await expect(page.getByRole("button", { name: /Completed.*60 minutes.*USD 65\.00/ })).toBeVisible();

  await page.getByRole("button", { name: /Completed.*60 minutes.*USD/ }).click();
  await page.getByRole("menuitem", { name: "Delete permanently" }).click();
  await page.getByRole("dialog", { name: "Delete class?" }).getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("No classes yet.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL("/students");
});
