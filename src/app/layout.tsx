import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { InstallAppProvider } from "@/features/install/InstallAppProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Meet native speakers, practise together with real challenges, and keep a streak going. Language partners first — dating only if you say so.",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lets the app paint into the notch and home-indicator areas in standalone mode.
  viewportFit: "cover",
  // Android Chrome shrinks the layout viewport (and so dvh) when the keyboard
  // opens, which keeps the chat composer and form buttons above it.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <InstallAppProvider>{children}</InstallAppProvider>
      </body>
    </html>
  );
}
