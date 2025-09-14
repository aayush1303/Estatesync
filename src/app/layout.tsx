import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import ErrorBoundary from "../components/ErrorBoundary";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstateSync",
  description: "A comprehensive CRM for real estate professionals",
  icons: {
    icon: [
      {
        url: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/icon.png',
    shortcut: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extension attributes
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = function(...args) {
                  if (args[0]?.includes?.('fdprocessedid') || 
                      args[0]?.includes?.('Hydration failed') ||
                      args[0]?.includes?.('server rendered HTML')) {
                    return;
                  }
                  originalError.apply(this, args);
                };
              }
            `,
          }}
        />
      </head>
      <body
        className={`${oswald.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
    </ClerkProvider>
  );
}
