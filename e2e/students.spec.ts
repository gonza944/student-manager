import { expect, test } from "@playwright/test";

test("teachers can search, sort, and change student status", async ({
  page,
}) => {
  const suffix = Date.now();
  const email = `students-e2e-${suffix}@example.test`;
  const students = [
    {
      name: `Ana Alpha ${suffix}`,
      email: `ana-${suffix}@example.test`,
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
      email: `mia-${suffix}@example.test`,
      country: "Canada",
      level: "B1",
      rate: "25",
      active: false,
      contactChannel: "email",
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
    await dialog.getByLabel("Email address").fill(student.email);
    if (student.contactChannel === "preply") {
      await dialog
        .getByRole("button", { name: "Preferred contact channel: Email" })
        .click();
      await page.getByRole("menuitemradio", { name: "Preply" }).click();
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

  const cardNames = page.getByRole("article").getByRole("heading");
  await expect(cardNames).toHaveText([
    students[0].name,
    students[1].name,
    students[2].name,
  ]);

  const search = page.getByPlaceholder(
    "Search by name, email, or country…",
  );
  await search.fill(students[1].name);
  await expect(cardNames).toHaveText([students[1].name]);
  await search.fill(students[1].email);
  await expect(cardNames).toHaveText([students[1].name]);
  await search.fill(students[1].country);
  await expect(cardNames).toHaveText([students[1].name]);
  await search.fill("");

  const sort = page.locator("#student-sort");
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
});
