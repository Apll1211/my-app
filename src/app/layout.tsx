import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SplashCursor from "@/components/SplashCursor";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { SplashCursorProvider } from "@/context/SplashCursorContext";

export const metadata: Metadata = {
  title: "ApllGeo",
  description: "ApllGeo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/dingtalk-jinbuti/result.css" />
        <style>
          {`
            @font-face {
              font-family: "dingtalk-jinbuti";
              src: local("dingtalk-jinbuti"), url("/dingtalk-jinbuti/0b76bcfbb117a80057d1f8b1fabcc927.woff2") format("woff2");
              font-display: swap;
              font-weight: 400;
            }
          `}
        </style>
      </head>
      <body
        className="font-sans antialiased"
        style={{
          fontFamily:
            '"dingtalk-jinbuti", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <SplashCursorProvider>
          <SplashCursor />
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </SplashCursorProvider>
        <Toaster />
      </body>
    </html>
  );
}
