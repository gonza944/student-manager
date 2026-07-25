import { expect, test } from "@playwright/test";

test.use({ locale: "es-AR" });

test("el directorio y el formulario móvil se muestran en español", async ({
  page,
}) => {
  const suffix = Date.now();

  await page.goto("/signup");
  await page.addStyleTag({
    content: ".invisible { visibility: visible !important; }",
  });
  await page.getByLabel("Nombre").fill("Docente Playwright");
  await page
    .getByLabel("Correo electrónico")
    .fill(`estudiantes-es-${suffix}@example.test`);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("playwright-test");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Estudiantes" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Cada estudiante, de un vistazo.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Todavía no hay estudiantes.", { exact: true }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Agregar estudiante" }).click();
  const drawer = page.locator('[data-slot="drawer-content"]');
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", {
      level: 1,
      name: "Agregar estudiante",
    }),
  ).toBeVisible();
});
