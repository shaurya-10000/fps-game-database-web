"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </div>
  );
}
