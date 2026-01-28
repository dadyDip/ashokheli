import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Ashokheli",
  description: "Play games on Ashokheli",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Viewport (keep yours, slightly safer limits) */}
        <meta
          name="viewport"
          content="
            width=device-width,
            height=device-height,
            initial-scale=1,
            maximum-scale=1,
            user-scalable=no,
            viewport-fit=cover
          "
        />

        <meta name="theme-color" content="#10B981" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />


        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Story+Script&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="bg-gray-950 text-white">
        <div className="app-root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
