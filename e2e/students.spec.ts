import { expect, test } from "@playwright/test";

test("teachers can filter, sort, and change student status", async ({
  page,
}) => {
  test.setTimeout(45_000);
  const suffix = Date.now();
  const email = `students-e2e-${suffix}@example.test`;
  const students = [
    {
      name: `Ana Alpha ${suffix}`,
      email: `ana-${suffix}@example.test`,
      birthDate: "1990-05-20",
      country: "Argentina",
      level: "C2",
      rate: "10",
      active: true,
      contactChannel: "preply",
    },
    {
      name: `Zoe Beta ${suffix}`,
      email: `zoe-${suffix}@example.test`,
      country: "Japan",
      level: "A1",
      rate: "40",
      active: true,
      contactChannel: "email",
    },
    {
      name: `Mia Gamma ${suffix}`,
      email: null,
      country: "Canada",
      level: "B1",
      rate: "25",
      active: false,
      contactChannel: "other",
    },
  ];

  await page.goto("/signup");
  await page.addStyleTag({
    content: ".invisible { visibility: visible !important; }",
  });
  await page.getByLabel("Name").fill("Student Directory E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("playwright-test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Students" }).click();

  for (const student of students) {
    await page.getByRole("link", { name: "Add student" }).click();
    const dialog = page.getByRole("dialog", { name: "Add a student" });
    await dialog.getByLabel("Full name").fill(student.name);
    if (student.email) {
      await dialog.getByLabel("Email address").fill(student.email);
    }
    if ("birthDate" in student) {
      const calendarTrigger = dialog.getByRole("button", {
        name: "Open calendar",
      });
      await expect(calendarTrigger).toHaveCSS("width", "44px");
      await calendarTrigger.click();
      const calendar = page.getByRole("grid");
      const year = page.getByRole("combobox", { name: "Choose the Year" });
      await expect(calendar).toBeVisible();
      await expect(calendar.getByRole("button").first()).toHaveCSS(
        "width",
        "44px",
      );
      await year.click();
      await expect(calendar).toBeVisible();
      await year.selectOption(student.birthDate.slice(0, 4));
      await page.keyboard.press("Escape");
      await dialog.getByLabel("Birth date").fill(student.birthDate);
    }
    if (student.contactChannel !== "other") {
      await dialog
        .getByRole("button", { name: "Preferred contact channel: Other" })
        .click();
      await page
        .getByRole("menuitemradio", {
          name: student.contactChannel === "preply" ? "Preply" : "Email",
        })
        .click();
    }

    if (student.country !== "Argentina") {
      const nationality = dialog.getByRole("combobox", {
        name: "Nationality",
      });
      await nationality.fill(student.country);
      await page.getByRole("option", { name: student.country }).click();
    }

    await dialog
      .getByRole("button", { name: "Level: A1" })
      .click();
    await page
      .getByRole("menuitemradio", { name: student.level })
      .click();
    await dialog.getByLabel("Hourly rate (USD)").fill(student.rate);
    if (!student.active) {
      await dialog.getByRole("switch", { name: "Active student" }).click();
    }
    await dialog
      .getByRole("button", { name: "Add student", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }

  await page.getByRole("link", { name: `Open profile for ${students[1].name}` }).click();
  const rateCard = page.locator('[data-slot="card"]').filter({
    has: page.getByText("Hourly rate", { exact: true }),
  });
  await expect(rateCard.getByText("Gross rate", { exact: true })).toBeVisible();
  await expect(rateCard.getByText("Fee", { exact: true })).toBeVisible();
  await expect(rateCard.getByText("Net rate", { exact: true })).toBeVisible();
  await expect(rateCard.getByText("$1.94", { exact: true })).toBeVisible();
  await expect(rateCard.getByText("$38.06", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to students" }).click();

  const cardNames = page.getByRole("article").getByRole("heading");
  await expect(page.getByText("3 students", { exact: true })).toBeVisible();
  const sort = page.locator("#student-sort");
  await sort.click();
  await page.getByRole("menuitemradio", { name: "Name" }).click();
  await expect(cardNames).toHaveText([
    students[0].name,
    students[1].name,
    students[2].name,
  ]);

  const search = page.getByRole("searchbox", { name: "Search students" });
  await search.fill(students[1].name);
  await expect(cardNames).toHaveText([students[1].name]);
  await expect(page.getByText("3 students", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Some students may be hidden by filters."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(cardNames).toHaveText([
    students[0].name,
    students[1].name,
    students[2].name,
  ]);

  await sort.click();
  await page
    .getByRole("menuitemradio", { name: "Hourly rate" })
    .click();
  await expect(cardNames).toHaveText([
    students[1].name,
    students[0].name,
    students[2].name,
  ]);
  await sort.click();
  await page.getByRole("menuitemradio", { name: "Level" }).click();
  await expect(cardNames).toHaveText([
    students[1].name,
    students[0].name,
    students[2].name,
  ]);
  await sort.click();
  await page.getByRole("menuitemradio", { name: "Name" }).click();

  await page.getByRole("switch", { name: "Hide inactive" }).click();
  await expect(cardNames).toHaveText([
    students[0].name,
    students[1].name,
  ]);
  await expect(page.getByText("3 students", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  const miaCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: students[2].name }),
  });
  await miaCard
    .getByRole("button", { name: `Actions for ${students[2].name}` })
    .click();
  await page.getByRole("menuitem", { name: "Set as active" }).click();
  await expect(cardNames).toHaveText([
    students[0].name,
    students[2].name,
    students[1].name,
  ]);

  const anaCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: students[0].name }),
  });
  await anaCard
    .getByRole("button", { name: `Actions for ${students[0].name}` })
    .click();
  await page.getByRole("menuitem", { name: "Set as inactive" }).click();
  await expect(cardNames).toHaveText([
    students[2].name,
    students[1].name,
    students[0].name,
  ]);

  await page.reload();
  await expect(cardNames).toHaveText([
    students[2].name,
    students[1].name,
    students[0].name,
  ]);
  await anaCard
    .getByRole("button", { name: `Actions for ${students[0].name}` })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Set as active" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Dashboard" }).click();
  const activeStudentsMetric = page.locator('[data-slot="card"]').filter({
    hasText: "Active students",
  });
  await expect(
    activeStudentsMetric.getByText("2", { exact: true }),
  ).toBeVisible();
});
