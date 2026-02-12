import "./globals.css";
import { Providers } from "./providers";

// Essential brand variations (9-10 key ones)
const brandVariations = [
  "Ashokheli",
  "Ashokeli",
  "Asokheli",
  "Asokeli",
  "Aso Kheli",
  "Aso Keli",
  "আসোকেলি",
  "Ashokheli Tash",
  "Ashokheli Game",
  "Ashokheli Casino"
];

export const metadata = {
  title: "Ashokheli - Play Aviator, Callbreak, Ludo Games Online",
  description: `Ashokheli - Play Aviator, Callbreak, Ludo, Spribe, JILI games. Real money online casino. Ashokeli, Asokheli, আসোকেলি খেলুন।`,
  keywords: "Ashokheli, Ashokeli, Asokheli, আসোকেলি, Aviator game, Callbreak, Ludo, online casino",
  manifest: "/manifest.json",
  themeColor: "#000000",
  openGraph: {
    title: "Ashokheli - Play & Win Real Money",
    description: "Play Aviator, Callbreak, Ludo and casino games online",
    images: ["https://ashokheli.top/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* Theme & PWA */}
        <meta name="theme-color" content="#10B981" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Essential Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Social/OG Image */}
        <meta property="og:image" content="https://ashokheli.top/icon-192.png" />
        <meta property="og:image:width" content="192" />
        <meta property="og:image:height" content="192" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Story+Script&display=swap"
          rel="stylesheet"
        />

        {/* Clean Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ashokheli",
              "alternateName": brandVariations,
              "url": "https://ashokheli.top",
              "logo": "https://ashokheli.top/icon-192.png"
            })
          }}
        />
      </head>

      <body className="bg-gray-950 text-white">
        {/* Minimal hidden text for variations */}
        <div style={{ display: 'none' }} aria-hidden="true">
          Ashokheli Ashokeli Asokheli আসোকেলি
        </div>
        
        <div className="app-root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}