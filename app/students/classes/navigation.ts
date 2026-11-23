export const dashboardClassTimelineId = "class-timeline";
export const dashboardClassFormSearch = "?from=dashboard";

export function getClassFormReturnHref(studentId: string, fromDashboard: boolean) {
  return fromDashboard
    ? `/#${dashboardClassTimelineId}`
    : `/students/${studentId}`;
}
