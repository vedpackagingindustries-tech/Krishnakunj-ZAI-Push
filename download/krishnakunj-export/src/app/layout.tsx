import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import FloatingWhatsAppWrapper from "@/components/FloatingWhatsAppWrapper";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "कृष्णकुंज माँ कर्मा धाम — मंदिर निर्माण दान",
  description:
    "कृष्णकुंज माँ कर्मा धाम, सिविल लाईन रोड, खैरागढ़ (छ.ग.) — जिला साहू संघ खैरागढ़-छुईखदान-गंडई द्वारा संत माता कर्मा के दिव्य भव्य मंदिर का निर्माण। अनुमानित लागत ₹25 लाख। प्राण-प्रतिष्ठा फरवरी 2027।",
  keywords: [
    "कृष्णकुंज",
    "माँ कर्मा धाम",
    "खैरागढ़",
    "साहू संघ",
    "मंदिर निर्माण",
    "दान",
    "संत माता कर्मा",
    "छत्तीसगढ़",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "कृष्णकुंज माँ कर्मा धाम — मंदिर निर्माण दान",
    description:
      "साहू समाज के स्वाभिमान, गौरव और अटूट एकता का पावन प्रतीक — कृष्णकुंज माँ कर्मा धाम मंदिर निर्माण। दान करें और पुण्य के भागीदार बनें।",
    siteName: "कृष्णकुंज माँ कर्मा धाम",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} font-sans antialiased`}
        style={{ backgroundColor: "#FFF9ED", color: "#5A3A24" }}
      >
        {children}
        <Toaster />
        <FloatingWhatsAppWrapper />
      </body>
    </html>
  );
}
