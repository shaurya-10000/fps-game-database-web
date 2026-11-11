import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";

// Body font - clean, highly readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Header/Display font - tall, aggressive, sporty
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fps-game-database-web.vercel.app"),
  title: {
    default: "FPS Game Database",
    template: "%s · FPS Game Database",
  },
  description:
    "A reference for competitive FPS games — full ballistics, characters, maps, modes, and live competitive rankings.",
  openGraph: {
    title: "FPS Game Database",
    description: "The competitive FPS reference. Live Elo, ballistics, and squad chat.",
    url: "https://fps-game-database-web.vercel.app",
    siteName: "FPS Game Database",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FPS Game Database",
    description: "The competitive FPS reference. Live Elo, ballistics, and squad chat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SiteChrome header={<Header />} footer={<Footer />}>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}


