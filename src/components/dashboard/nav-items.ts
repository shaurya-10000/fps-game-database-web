export const NAV_ITEMS = [
  { href: "/dashboard", label: "Profile" },
  { href: "/dashboard/dms", label: "DMs" },
  { href: "/dashboard/friends", label: "Friends" },
  { href: "/dashboard/chat", label: "Global" },
] as const;

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
