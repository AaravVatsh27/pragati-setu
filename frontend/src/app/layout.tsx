import type { Metadata } from "next";
import { Cormorant_Garamond, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    variable: "--font-cormorant",
    weight: ["400", "700"],
});

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-sora",
    weight: ["300", "400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    weight: ["400"],
});

export const metadata: Metadata = {
    title: "Pragati Setu | Every Journey. Decided With Certainty.",
    description: "The world's first accountable travel intelligence platform. A premium product for Indian travelers going international.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${cormorant.variable} ${sora.variable} ${jetbrains.variable}`}>
            <body className="font-sans antialiased text-text-primary bg-bg-void selection:bg-saffron/30 overflow-x-hidden">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
