import { expect, test } from "@playwright/test";

test("auth pages link to each other", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/login");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByRole("link", { name: "Create a teacher account" }).click();

  await expect(page).toHaveURL("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByRole("link", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/login");
  expect(consoleErrors).toEqual([]);
});

test("currency options are grouped and filter as the teacher types", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });

  const currency = page.getByRole("combobox", { name: "Teaching currency" });
  await expect(currency).toHaveValue("USD — US Dollar");

  await page.getByRole("button", { name: "Open currency options" }).click();
  await expect(page.getByText("Popular", { exact: true })).toBeVisible();
  await expect(page.getByText("Africa", { exact: true })).toBeVisible();

  await currency.fill("yen");
  const yen = page.getByRole("option", { name: "Japanese Yen (JPY)" });
  await yen.click();
  await expect(currency).toHaveValue("JPY — Japanese Yen");
  await expect(yen).toBeHidden();

  await currency.fill("argentine");
  await expect(
    page.getByRole("option", { name: "Argentine Peso (ARS)" }),
  ).toBeVisible();
});

test("a teacher can sign up, log out, and sign back in", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;
  const password = "playwright-test";

  await page.goto("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });

  const createAccount = page.getByRole("button", { name: "Create account" });
  await expect(createAccount).toBeDisabled();

  await page.getByLabel("Name").fill("Playwright Teacher");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await expect(createAccount).toBeEnabled();
  await createAccount.click();

  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL("/login");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeDisabled();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Students" }).click();
  await expect(page).toHaveURL("/students");
  await expect(page.getByRole("link", { name: "Add student" })).toBeVisible();
  await expect(page.getByText("No students yet.", { exact: true })).toBeVisible();

  const studentName = `Playwright Student ${Date.now()}`;
  await page.getByRole("link", { name: "Add student" }).click();

  const dialog = page.getByRole("dialog", { name: "Add a student" });
  await expect(page).toHaveURL("/students/add");
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/students");
  await expect(dialog).toBeHidden();

  await page.getByRole("link", { name: "Add student" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Full name").fill(studentName);
  await dialog.getByLabel("Email address").fill(`${Date.now()}@example.test`);

  const nationality = dialog.getByRole("combobox", { name: "Nationality" });
  await nationality.fill("Japan");
  await page.getByRole("option", { name: "Japan" }).click();
  await expect(nationality).toHaveValue("Japan");
  await expect(
    dialog.getByRole("combobox", { name: "Time zone" }),
  ).toHaveValue("Asia/Tokyo");

  await dialog.getByRole("button", { name: "Level: A1" }).click();
  await page.getByRole("menuitemradio", { name: "B2" }).click();
  await expect(dialog.getByRole("button", { name: "Level: B2" })).toBeVisible();

  await dialog.getByLabel("Preferences").fill("Visual summaries");
  await dialog.getByLabel("Preferences").press("Enter");
  await expect(dialog.getByText("Visual summaries", { exact: true })).toBeVisible();
  await dialog.getByLabel("Interests").fill("Travel");
  await dialog.getByLabel("Interests").press("Enter");
  await expect(dialog.getByText("Travel", { exact: true })).toBeVisible();

  await dialog
    .getByRole("button", { name: "Preferred contact channel: Email" })
    .click();
  await page.getByRole("menuitemradio", { name: "WhatsApp" }).click();
  await expect(
    dialog.getByRole("button", {
      name: "Preferred contact channel: WhatsApp",
    }),
  ).toBeVisible();

  const firstAvatar = dialog.getByAltText("Avatar 1", { exact: true });
  await firstAvatar.scrollIntoViewIfNeeded();
  await expect(firstAvatar).toBeVisible();
  await dialog.getByRole("radio", { name: "Preply" }).click();
  await expect(dialog.getByRole("radio", { name: "Preply" })).toBeChecked();
  await dialog.getByRole("radio", { name: "Direct" }).click();
  await dialog.getByRole("radio", { name: "Yellow" }).click();
  await expect(dialog.getByRole("radio", { name: "Yellow" })).toBeChecked();
  await dialog.getByRole("switch", { name: "Active student" }).click();
  await expect(dialog.getByRole("switch", { name: "Active student" })).not.toBeChecked();
  await dialog.getByRole("switch", { name: "Active student" }).click();
  await expect(dialog.getByRole("heading", { name: studentName })).toBeVisible();
  await dialog.getByRole("button", { name: "Add student", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL("/students");
  await expect(page.getByRole("heading", { name: studentName })).toBeVisible();

  const studentCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: studentName }),
  });
  await studentCard
    .getByRole("button", { name: `Actions for ${studentName}` })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("dialog", {
    name: `Delete ${studentName}?`,
  });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(deleteDialog).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await studentCard
    .getByRole("button", { name: `Actions for ${studentName}` })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const deleteDrawer = page.locator('[data-slot="drawer-content"]').filter({
    hasText: `Delete ${studentName}?`,
  });
  await expect(deleteDrawer).toBeVisible();
  await deleteDrawer
    .getByRole("button", { name: "Delete forever" })
    .click();
  await expect(studentCard).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: studentName }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/students/add");
  await expect(page).toHaveURL("/students/add");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Add a student" }),
  ).toBeVisible();
  const addNavigation = page.getByRole("navigation", {
    name: "Add student navigation",
  });
  await expect(
    addNavigation.getByRole("link", { name: "Dashboard" }),
  ).toBeVisible();
  await expect(
    addNavigation.getByRole("link", { name: "Students" }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/students");
  await page.getByRole("link", { name: "Add student" }).click();
  await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible();
});
