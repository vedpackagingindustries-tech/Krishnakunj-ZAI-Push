import type { Metadata } from "next";
import Navigation from "@/components/temple/Navigation";

export const metadata: Metadata = {
  title: "दान करें — कृष्णकुंज माँ कर्मा धाम",
  description:
    "कृष्णकुंज माँ कर्मा धाम मंदिर निर्माण हेतु दान। आपकी श्रद्धा और सहयोग इस पावन मंदिर निर्माण कार्य में महत्वपूर्ण योगदान है।",
  openGraph: {
    title: "दान करें — कृष्णकुंज माँ कर्मा धाम",
    description:
      "साहू समाज के स्वाभिमान, गौरव और अटूट एकता का पावन प्रतीक — कृष्णकुंज माँ कर्मा धाम मंदिर निर्माण। दान करें और पुण्य के भागीदार बनें।",
    siteName: "कृष्णकुंज माँ कर्मा धाम",
    type: "website",
  },
};

export default function DonateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFF9ED" }}>
      <Navigation />
      <main className="flex-1 w-full">{children}</main>
      <footer className="mt-auto border-t border-light-beige py-4 px-4 text-center">
        <p className="text-xs sm:text-sm text-muted-brown">
          कृष्णकुंज माँ कर्मा धाम — सिविल लाईन रोड, खैरागढ़ (छ.ग.)
        </p>
      </footer>
    </div>
  );
}
