import { expect, type Locator, type Page } from "@playwright/test";

export async function selectClassTime(page: Page, form: Locator, time: string) {
  const label = form.getByText(time, { exact: true });
  await label.scrollIntoViewIfNeeded();
  const labelBounds = await label.boundingBox();
  const track = await form
    .locator('[data-slot="class-day-grid-track"]')
    .boundingBox();
  expect(labelBounds).not.toBeNull();
  expect(track).not.toBeNull();
  await page.mouse.click(
    track!.x + track!.width / 2,
    labelBounds!.y + labelBounds!.height / 2,
  );
}
