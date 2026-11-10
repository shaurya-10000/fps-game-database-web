/** Route prefixes that render full-screen, without the marketing header/footer. */
const BARE_PREFIXES = ["/dashboard"] as const;

/** Routes under a bare prefix that should still show the header/footer (e.g. logged-out pages). */
const CHROME_EXCEPTIONS = ["/dashboard/login"] as const;

const matches = (pathname: string, route: string): boolean =>
  pathname === route || pathname.startsWith(route + "/");

export function shouldHideSiteChrome(pathname: string): boolean {
  if (CHROME_EXCEPTIONS.some((route) => matches(pathname, route))) return false;
  return BARE_PREFIXES.some((prefix) => matches(pathname, prefix));
}