import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeetHack - Learn to Hack. Compete. Evolve.",
  description: "Modern hacking platform for cybersecurity enthusiasts. Learn, compete, and master hacking skills through hands-on challenges.",
  keywords: ["hacking", "cybersecurity", "challenges", "learning", "competition"],
  authors: [{ name: "LeetHack Team" }],
  creator: "LeetHack",
  publisher: "LeetHack",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#00d4ff",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leethack.dev",
    siteName: "LeetHack",
    title: "LeetHack - Learn to Hack. Compete. Evolve.",
    description: "Modern hacking platform for cybersecurity enthusiasts. Learn, compete, and master hacking skills through hands-on challenges.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LeetHack - Hacking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetHack - Learn to Hack. Compete. Evolve.",
    description: "Modern hacking platform for cybersecurity enthusiasts.",
    images: ["/og-image.jpg"],
    creator: "@leethack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-inter antialiased min-h-screen bg-background text-foreground`}
      >
        <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-gray-900/50">
          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Main content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
