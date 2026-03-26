import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Rotary Anubandha Awards 2026",
  description: "Registration & Admin Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
