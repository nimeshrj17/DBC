import type { Metadata, Viewport } from "next";
import { Karla } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "राखा भाई की चाय and Cafe",
  description: "Management system for राखा भाई की चाय and Cafe",
  // Lets "Add to Home Screen" open the app full-screen like a native app
  appleWebApp: { capable: true, title: "Rakha Bhai Cafe", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // use the whole screen; the app pads for the notch and home bar itself
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${karla.variable} font-sans h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" richColors mobileOffset={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }} />
      </body>
    </html>
  );
}
