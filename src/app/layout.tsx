import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ClientBody from "./ClientBody";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "GameStop Kenya - Gaming Consoles, Games & Digital Content",
  description: "Kenya's premier gaming destination for PlayStation, Xbox, Nintendo Switch consoles, games, and digital content. Fast delivery in Nairobi, M-Pesa payments accepted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientBody className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
      </ClientBody>
    </html>
  );
}
