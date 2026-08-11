import { expect, test } from "@playwright/test";

test("records rate changes once and keeps histories teacher-scoped", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.42" });
  const suffix = Date.now();
  const studentName = `Rate History ${suffix}`;

  await page.goto("/signup");
  await page.addStyleTag({
    content: ".invisible { visibility: visible !important; }",
  });
  await page.getByLabel("Name").fill("Rate History Teacher");
  await page
    .getByLabel("Email")
    .fill(`rate-history-${suffix}@example.test`);
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
  const historyCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Rate history" }),
  });
  const historyTable = historyCard.getByRole("table", {
    name: "Rate history with the current rate first.",
  });
  const rows = historyTable.getByRole("row");

  await expect(historyCard).toBeVisible();
  await expect(historyCard.getByText("Time at current rate")).toHaveCount(0);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toHaveClass(/bg-orbit-ink/);
  await expect(rows.nth(1)).toContainText("Direct");
  await expect(rows.nth(1)).toContainText("$20.00");
  await expect(rows.nth(1)).toContainText("$0.97");
  await expect(rows.nth(1)).toContainText("4.85%");
  const studentProfileUrl = (
    await page.getByRole("link", { name: "Edit" }).getAttribute("href")
  )!.replace("/students/edit/", "/students/");

  await page.getByRole("link", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit student" });
  await editDialog
    .getByLabel("Learning goals")
    .fill("An unrelated profile update");
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).toBeHidden();
  await expect(rows).toHaveCount(2);

  await historyCard.getByRole("button", { name: "Edit rate" }).click();
  let rateDialog = page.getByRole("dialog", { name: "Edit rate" });
  await expect(rateDialog.locator("input")).toHaveCount(1);
  await expect(rateDialog.getByLabel("Hourly rate (USD)")).toHaveValue("20");
  await rateDialog.getByRole("radio", { name: "Preply" }).click();
  await rateDialog.getByRole("button", { name: "Save rate" }).click();
  await expect(rateDialog).toBeHidden();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("Preply");
  await expect(rows.nth(1)).toContainText("$3.60");
  await expect(rows.nth(1)).toContainText("18%");
  await expect(rows.nth(1)).toContainText("-$2.63");
  await expect(rows.nth(2)).toHaveClass(/bg-paper-strong/);
  await expect(rows.nth(2)).toContainText("Direct");
  await expect(rows.nth(2)).toContainText("$0.97");

  await historyCard.getByRole("button", { name: "Edit rate" }).click();
  rateDialog = page.getByRole("dialog", { name: "Edit rate" });
  await rateDialog.getByLabel("Hourly rate (USD)").fill("30");
  await rateDialog.getByRole("button", { name: "Save rate" }).click();
  await expect(rateDialog).toBeHidden();
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(1)).toContainText("+$8.20");

  await page.goto("/");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/signup");
  await page.addStyleTag({
    content: ".invisible { visibility: visible !important; }",
  });
  await page.getByLabel("Name").fill("Other Teacher");
  await page
    .getByLabel("Email")
    .fill(`rate-history-other-${suffix}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("playwright-test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");

  await page.goto(studentProfileUrl);
  await expect(
    page.getByRole("heading", { name: "Student not found." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rate history" })).toHaveCount(
    0,
  );
});
