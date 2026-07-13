import { expect, test } from "@playwright/test";

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
