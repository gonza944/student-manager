import { expect, test } from "@playwright/test";

test("persists fee changes and records affected rate histories", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const studentName = `Direct Fee ${suffix}`;
  const preplyStudentName = `Preply Fee ${suffix}`;

  await page.goto("/signup");
  await page.addStyleTag({
    content: ".invisible { visibility: visible !important; }",
  });
  await page.getByLabel("Name").fill("Direct Fee Teacher");
  await page
    .getByLabel("Email")
    .fill(`direct-fee-${suffix}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("playwright-test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Students" }).click();
  await page.getByRole("link", { name: "Add student" }).click();
  const addDialog = page.getByRole("dialog", { name: "Add a student" });
  await addDialog.getByLabel("Full name").fill(studentName);
  await addDialog.getByLabel("Hourly rate (USD)").fill("20");
  await addDialog
    .getByRole("button", { name: "Add student", exact: true })
    .click();
  await expect(addDialog).toBeHidden();

  await page
    .getByRole("link", { name: `Open profile for ${studentName}` })
    .click();
  await expect(page).toHaveURL(/\/students\/[A-Za-z0-9_-]+$/);
  const profileUrl = page.url();
  let rows = page
    .getByRole("table", {
      name: "Rate history with the current rate first.",
    })
    .getByRole("row");
  await expect(rows.nth(1)).toContainText("4.85%");
  await expect(rows.nth(1)).toContainText("$0.97");

  await page.goto("/students");
  await page.getByRole("link", { name: "Add student" }).click();
  const preplyDialog = page.getByRole("dialog", { name: "Add a student" });
  await preplyDialog.getByLabel("Full name").fill(preplyStudentName);
  await preplyDialog.getByLabel("Hourly rate (USD)").fill("20");
  await preplyDialog.getByRole("radio", { name: "Preply" }).click();
  await preplyDialog
    .getByRole("button", { name: "Add student", exact: true })
    .click();
  await expect(preplyDialog).toBeHidden();
  await page
    .getByRole("link", { name: `Open profile for ${preplyStudentName}` })
    .click();
  await expect(page).toHaveURL(/\/students\/[A-Za-z0-9_-]+$/);
  const preplyProfileUrl = page.url();
  rows = page
    .getByRole("table", {
      name: "Rate history with the current rate first.",
    })
    .getByRole("row");
  await expect(rows.nth(1)).toContainText("18%");
  await expect(rows.nth(1)).toContainText("$3.60");

  await page.goto("/");
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL("/settings");
  const preplyFee = page.getByLabel("Preply commission");
  const directFee = page.getByLabel("Direct student fee");
  await expect(preplyFee).toHaveValue("18.00");
  await expect(directFee).toHaveValue("4.85");
  await preplyFee.fill("20.00");
  await directFee.fill("6.50");
  await page.getByRole("button", { name: "Save fees" }).click();
  await expect(page.getByText("Fee settings updated.")).toBeVisible();
  await expect(preplyFee).toHaveValue("20.00");
  await expect(directFee).toHaveValue("6.50");

  await page.reload();
  await expect(page.getByLabel("Preply commission")).toHaveValue("20.00");
  await expect(page.getByLabel("Direct student fee")).toHaveValue("6.50");
  await page.goto(profileUrl);
  rows = page
    .getByRole("table", {
      name: "Rate history with the current rate first.",
    })
    .getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("6.5%");
  await expect(rows.nth(1)).toContainText("$1.30");
  await expect(rows.nth(1)).toContainText("$18.70");
  await expect(rows.nth(1)).toContainText("-$0.33");
  await expect(rows.nth(2)).toContainText("4.85%");

  await page.goto(preplyProfileUrl);
  rows = page
    .getByRole("table", {
      name: "Rate history with the current rate first.",
    })
    .getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("20%");
  await expect(rows.nth(1)).toContainText("$4.00");
  await expect(rows.nth(1)).toContainText("$16.00");
  await expect(rows.nth(1)).toContainText("-$0.40");
  await expect(rows.nth(2)).toContainText("18%");
});
