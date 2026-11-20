import { expect, type Page } from "@playwright/test";

export async function verifyTimelineNavigation(page: Page, orientation: "horizontal" | "vertical", label: string, goToNow: string) {
  const timeline = page.locator(`[data-orientation="${orientation}"]`).filter({ has: page.getByRole("list", { name: label, exact: true }) });
  await expect(timeline).toBeVisible();
  const viewport = timeline.locator('[data-slot="scroll-area-viewport"]');
  await expect.poll(() => viewport.evaluate((element) => getComputedStyle(element).maskImage)).not.toBe("none");
  await viewport.evaluate((element, horizontal) => {
    if (horizontal) element.scrollLeft = 0;
    else element.scrollTop = 0;
  }, orientation === "horizontal");
  await page.getByRole("button", { name: goToNow, exact: true }).click();
  await expect.poll(async () => viewport.evaluate((element, horizontal) => {
    const line = element.querySelector('[data-slot="timeline-now-line"]');
    if (!line) return Infinity;
    const view = element.getBoundingClientRect();
    const marker = line.getBoundingClientRect();
    return horizontal ? Math.abs(marker.x - (view.x + view.width / 2)) : Math.abs(marker.y - (view.y + view.height / 2));
  }, orientation === "horizontal")).toBeLessThan(2);
  const marker = await timeline.locator('[data-slot="timeline-now-line"]').boundingBox();
  expect(marker).not.toBeNull();
  expect(orientation === "horizontal" ? marker!.height > marker!.width : marker!.width > marker!.height).toBe(true);
}
