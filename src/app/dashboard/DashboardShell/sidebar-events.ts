export const OPEN_SIDEBAR_EVENT = "fps-open-sidebar";

/** Lets any page open the dashboard navigation (used by the menu button on phones). */
export function requestOpenSidebar(): void {
  window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT));
}