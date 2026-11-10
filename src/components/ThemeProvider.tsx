"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  // We use a wrapper to ensure React doesn't complain about next-themes 
  // injecting its script tag during hydration.
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
