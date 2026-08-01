import type { Metadata } from "next";
import { Familjen_Grotesk, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blindfold Trainer",
  description: "Train your chess visualization and memory.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${familjen.variable} ${publicSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
      <GoogleAnalytics gaId="G-R7R8T90C26" />
    </html>
  );
}