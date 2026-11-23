import { verifyTimelineNavigation } from "./helpers/class-timeline";
import { expect, test } from "@playwright/test";
import { selectClassTime } from "./helpers/class-scheduler";

test.use({ locale: "es-AR", hasTouch: true });

test("el directorio y el formulario móvil se muestran en español", async ({
  page,
}) => {
  test.setTimeout(120_000);
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
  await page.getByRole("link", { name: "Ver agenda" }).click();
  await expect(page.getByRole("list", { name: "Cronología de clases" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Programar clase", exact: true })).toBeDisabled();
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
  const studentSince = await drawer
    .getByLabel("Estudiante desde")
    .inputValue();
  expect(studentSince).not.toBe("");
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
  await drawer
    .getByRole("button", { name: "Abrir calendario", exact: true })
    .click();
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
  await expect(editDialog.getByLabel("Estudiante desde")).toHaveValue(
    studentSince,
  );
  const birthDate = editDialog.getByLabel("Fecha de nacimiento");
  await birthDate.pressSequentially("29/02/2000");
  await expect(birthDate).toHaveValue("29/02/2000");
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
  const customPeriod = rateDialog.getByLabel(
    "Definir cuándo se aplicó esta tarifa",
  );
  await expect(customPeriod).not.toBeChecked();
  await expect(
    rateDialog.getByLabel("Fecha inicial", { exact: true }),
  ).toHaveCount(0);
  await customPeriod.check();
  await expect(
    rateDialog.getByLabel("Fecha inicial", { exact: true }),
  ).toBeVisible();
  await expect(
    rateDialog.getByRole("button", {
      name: "Abrir calendario de fecha inicial",
    }),
  ).toBeVisible();
  await expect(
    rateDialog.getByLabel("Fecha final", { exact: true }),
  ).toBeVisible();
  await expect(
    rateDialog.getByRole("button", {
      name: "Abrir calendario de fecha final",
    }),
  ).toBeVisible();
  await rateDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(rateDialog).toBeHidden();

  await page.getByRole("link", { name: "Programar clase" }).click();
  const classDrawer = page.getByRole("dialog", { name: "Programar clase" });
  await expect(classDrawer).toBeVisible();
  const scheduleSection = classDrawer.getByRole("button", {name:"Agenda", exact:true});
  const occupiedSection = classDrawer.getByRole("button", {name:"Horarios ocupados", exact:true});
  await expect(scheduleSection).toHaveAttribute("aria-expanded", "true");
  await expect(occupiedSection).toHaveAttribute("aria-expanded", "false");
  await expect(classDrawer.getByText(/Arrastra o toca/)).toHaveCount(0);
  await classDrawer.getByLabel("Importe (USD)").fill("42.50");
  await scheduleSection.click();
  await expect(scheduleSection).toHaveAttribute("aria-expanded", "false");
  await occupiedSection.click();
  await expect(occupiedSection).toHaveAttribute("aria-expanded", "true");
  await expect(classDrawer.getByText("No hay horarios ocupados en esta fecha.")).toBeVisible();
  await occupiedSection.click();
  await scheduleSection.click();
  await expect(classDrawer.getByLabel("Importe (USD)")).toHaveValue("42.50");

  const touch = await page.context().newCDPSession(page);
  await selectClassTime(page, classDrawer, "11:00");
  const endHandle = classDrawer.getByRole("slider", { name: "Ajustar hora de fin de la clase" });
  await endHandle.scrollIntoViewIfNeeded();
  await endHandle.click({trial: true});
  const bounds = await endHandle.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + 10 }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(classDrawer.getByText(/11:00 — 12:05 · 65 minutos/)).toBeVisible();
  await endHandle.focus();
  await page.keyboard.press("ArrowUp");
  const startHandle = classDrawer.getByRole("slider", { name: "Ajustar hora de inicio de la clase" });
  await startHandle.scrollIntoViewIfNeeded();
  const startBounds = await startHandle.boundingBox();
  const trackBounds = await classDrawer.locator('[data-slot="class-day-grid-track"]').boundingBox();
  expect(startBounds).not.toBeNull();
  expect(trackBounds).not.toBeNull();
  await page.touchscreen.tap(trackBounds!.x + trackBounds!.width / 2, startBounds!.y + startBounds!.height / 2 + 10);
  await expect(classDrawer.getByText(/11:05 — 12:05 · 60 minutos/)).toBeVisible();
  await expect.poll(async () => {
    const readout = await classDrawer.getByText(/11:05 — 12:05 · 60 minutos/).boundingBox();
    const viewport = await classDrawer.locator('[data-slot="scroll-area-viewport"]').boundingBox();
    return readout && viewport ? readout.y - viewport.y : -1;
  }).toBeGreaterThanOrEqual(8);

  await selectClassTime(page, classDrawer, "11:00");
  await classDrawer.getByLabel("Importe (USD)").fill("42.50");
  const mobileScreenshot = test.info().outputPath("class-mobile-grid.png");
  await classDrawer.getByRole("region", { name: "Agenda del día" }).screenshot({ path: mobileScreenshot });
  await test.info().attach("Spanish mobile interval grid", { path: mobileScreenshot, contentType: "image/png" });
  await touch.detach();
  await classDrawer.getByRole("button", { name: "Guardar clase" }).click();
  await expect(classDrawer).toBeHidden();
  await verifyTimelineNavigation(page, "vertical", "Cronología de clases", "Ir a ahora");
  await page.getByRole("button", { name: /Programada.*60 minutos.*USD/ }).click();
  await page.getByRole("menuitem", { name: "Eliminar permanentemente" }).click();
  await page.getByRole("dialog", { name: "¿Eliminar la clase?" }).getByRole("button", { name: "Eliminar permanentemente" }).click();
  await expect(page.getByText("Todavía no hay clases.", { exact: true })).toBeVisible();

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
