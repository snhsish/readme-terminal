import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://terminal-readme.vercel.app"),
  title: "readme-terminal - animated svg terminal for github readmes",
  description: "build a terminal animation, download the svg, commit it to your repo.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "readme-terminal",
    description: "build a terminal animation, download the svg, commit it to your repo.",
    url: "/",
    siteName: "readme-terminal",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "readme-terminal - animated svg terminal for github readmes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "readme-terminal",
    description: "build a terminal animation, download the svg, commit it to your repo.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
