import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
