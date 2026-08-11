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

  const studentName = `Estudiante Playwright ${suffix}`;
  await drawer.getByLabel("Nombre completo").fill(studentName);
  await drawer
    .getByRole("button", { name: "Canal de contacto preferido: Otro" })
    .click();
  await page
    .getByRole("menuitemradio", { name: "Correo electrónico" })
    .click();
  await drawer
    .getByRole("button", { name: "Agregar estudiante", exact: true })
    .click();
  await expect(
    drawer.getByText(
      "Agrega un correo electrónico para usarlo como contacto preferido.",
    ),
  ).toBeVisible();
  await drawer
    .getByRole("button", { name: "Canal de contacto preferido: Correo electrónico" })
    .click();
  await page.getByRole("menuitemradio", { name: "Otro" }).click();
  await drawer.getByRole("button", { name: "Abrir calendario" }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Elegir el año" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer.getByLabel("Fecha de nacimiento")).toHaveValue("");
  await drawer
    .getByRole("button", { name: "Agregar estudiante", exact: true })
    .click();
  await expect(drawer).toBeHidden();

  const studentCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: studentName }),
  });
  await studentCard
    .getByRole("button", { name: `Acciones para ${studentName}` })
    .click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/students\/edit\/[A-Za-z0-9_-]+$/);

  const editDialog = page.getByRole("dialog", { name: "Editar estudiante" });
  await expect(
    editDialog.getByRole("button", { name: "Cancelar" }),
  ).toHaveCount(0);
  await expect(editDialog.getByLabel("Nombre completo")).toHaveValue(
    studentName,
  );
  await expect(
    editDialog.getByLabel("Correo electrónico", { exact: true }),
  ).toHaveValue("");
  await editDialog.getByLabel("Fecha de nacimiento").fill("2000-02-29");
  await editDialog.getByLabel("Objetivos de aprendizaje").fill("Conversación");
  await editDialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(editDialog).toBeHidden();
  await expect(
    page.getByText("Se actualizaron los datos del estudiante.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("29 de febrero de 2000")).toBeVisible();

  const historyCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Historial de tarifas" }),
  });
  await expect(
    historyCard.getByText("Tiempo con la tarifa actual"),
  ).toHaveCount(0);
  const rows = historyCard
    .getByRole("table", {
      name: "Historial de tarifas con la tarifa actual primero.",
    })
    .getByRole("row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toHaveClass(/bg-orbit-ink/);
  await expect(rows.nth(1)).toContainText("Directo");

  await historyCard.getByRole("button", { name: "Editar tarifa" }).click();
  const rateDialog = page.getByRole("dialog", { name: "Editar tarifa" });
  await expect(rateDialog.getByLabel("Tarifa por hora (USD)")).toBeVisible();
  await expect(
    rateDialog.getByRole("radio", { name: "Directo" }),
  ).toBeChecked();
  await expect(
    rateDialog.getByText(
      "Preply usa tu comisión configurada. Directo usa tu comisión configurada para Directo.",
    ),
  ).toBeVisible();
  await rateDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(rateDialog).toBeHidden();

  await page.goto("/");
  await page.getByRole("link", { name: "Configuración" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Configuración" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Comisión de Preply"),
  ).toHaveValue("18.00");
  await expect(
    page.getByLabel("Comisión de estudiantes directos"),
  ).toHaveValue("4.85");
});
