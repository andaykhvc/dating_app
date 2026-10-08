import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { I18nProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { siteUrl } from "@/lib/site";
import { ThemeSync } from "@/features/appearance/ThemeSync";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import { InstallAppProvider } from "@/features/install/InstallAppProvider";
import { LegalLinks } from "@/components/legal/LegalLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
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
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading the language cookie makes every page render per request (the proxy
  // already runs on each one); see docs/i18n.md for the trade-off.
  const locale = await getLocale();
  return (
    // data-theme is set by the inline script before paint, so React must keep
    // the DOM's value rather than the (always absent) server one.
    <html lang={locale} className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeSync />
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          <InstallAppProvider>{children}</InstallAppProvider>
          <footer className="safe-bottom border-t border-line px-gutter py-4">
            <LegalLinks />
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
