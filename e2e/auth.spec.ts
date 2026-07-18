import { expect, test } from "@playwright/test";

test("auth pages link to each other", async ({ page }) => {
  await page.goto("/login");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByRole("link", { name: "Create a teacher account" }).click();

  await expect(page).toHaveURL("/signup");
  await page.addStyleTag({ content: ".invisible { visibility: visible !important; }" });
  await page.getByRole("link", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/login");
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
});
