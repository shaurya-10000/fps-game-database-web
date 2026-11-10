"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { shouldHideSiteChrome } from "./routes";

interface SiteChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Wraps page content with the site header/footer, except on full-screen routes.
 * Header and footer are passed in as props so they can stay server components.
 */
export default function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const hide = shouldHideSiteChrome(usePathname());

  return (
    <>
      {!hide && header}
      <main className="flex-1">{children}</main>
      {!hide && footer}
    </>
  );
}