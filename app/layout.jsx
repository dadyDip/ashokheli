import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="
            width=device-width,
            height=device-height,
            initial-scale=1,
            minimum-scale=1,
            maximum-scale=3,
            user-scalable=yes,
            viewport-fit=cover
          "
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Story+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
