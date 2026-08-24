import { db, isDbAvailable } from "@/lib/db";
import Link from "next/link";
import Navigation from "@/components/temple/Navigation";
import OrnamentalDivider from "@/components/temple/OrnamentalDivider";
import { Phone, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "संपर्क — कृष्णकुंज माँ कर्मा धाम",
  description:
    "कृष्णकुंज माँ कर्मा धाम — पदाधिकारियों से संपर्क करें। सिविल लाईन रोड, खैरागढ़ (छ.ग.)",
};

export default async function ContactPage() {
  let officials: { name: string; designation: string; phone: string | null }[] = [];

  if (isDbAvailable()) {
    try {
      officials = await db.officialMember.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          name: true,
          designation: true,
          phone: true,
        },
      });
    } catch {
      // DB query failed — show empty state
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFF9ED" }}
    >
      <Navigation />

      <main className="flex-1">
        {/* ─── Page Heading ─── */}
        <div className="bg-warm-white border-b border-light-beige">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-relaxed"
              style={{ color: "#7A3B3B" }}
            >
              संपर्क
            </h1>
            <OrnamentalDivider />
            <p className="text-sm sm:text-base text-muted-brown mt-1">
              कृष्णकुंज माँ कर्मा धाम — सिविल लाईन रोड, (अकरजन) खैरागढ़,
              (छ.ग.)
            </p>
          </div>
        </div>

        {/* ─── Officials List ─── */}
        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            {officials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {officials.map((official) => (
                  <div
                    key={official.name}
                    className="rounded-2xl border-2 border-light-beige bg-warm-white p-5 sm:p-6 transition-colors hover:border-light-gold"
                    style={{
                      boxShadow: "0 2px 12px rgba(214,174,92,0.08)",
                    }}
                  >
                    <p
                      className="text-base sm:text-lg font-semibold leading-snug"
                      style={{ color: "#5A3A24" }}
                    >
                      {official.name}
                    </p>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ color: "#E8A23A" }}
                    >
                      {official.designation}
                    </p>
                    {official.phone && (
                      <a
                        href={`tel:${official.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-brown hover:text-elegant-orange transition-colors mt-2"
                      >
                        <Phone size={14} className="text-soft-saffron" />
                        मो.नं. {official.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl border-2 border-dashed border-light-gold bg-warm-ivory/50 p-10 sm:p-14 text-center"
              >
                <MapPin size={40} className="mx-auto mb-3 text-light-gold" />
                <p className="text-muted-brown text-sm sm:text-base">
                  कोई संपर्क जानकारी उपलब्ध नहीं है।
                </p>
              </div>
            )}

            {/* ─── Donate CTA ─── */}
            <div className="mt-10 sm:mt-14 text-center">
              <OrnamentalDivider />
              <p
                className="text-base sm:text-lg max-w-xl mx-auto leading-8 mt-4 mb-6"
                style={{ color: "#5A3A24" }}
              >
                मंदिर निर्माण के पावन कार्य में अपनी श्रद्धा अनुसार सहयोग
                करें और पुण्य के भागीदार बनें।
              </p>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-elegant-orange hover:bg-soft-saffron text-white text-lg font-semibold rounded-full transition-colors shadow-lg min-h-[52px]"
                style={{
                  boxShadow: "0 6px 20px rgba(232,138,36,0.35)",
                }}
              >
                🙏 अभी दान करें
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-light-beige bg-warm-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p
            className="text-base sm:text-lg font-bold mb-1"
            style={{ color: "#E88A24" }}
          >
            कृष्णकुंज माँ कर्मा धाम
          </p>
          <p className="text-xs sm:text-sm text-muted-brown">
            सिविल लाईन रोड, (अकरजन) खैरागढ़ (छ.ग.)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
            <Link
              href="/"
              className="text-xs sm:text-sm text-muted-brown hover:text-elegant-orange transition-colors"
            >
              मुख्यपृष्ठ
            </Link>
            <span className="hidden sm:inline text-light-beige">|</span>
            <Link
              href="/donate"
              className="text-xs sm:text-sm text-muted-brown hover:text-elegant-orange transition-colors"
            >
              दान करें
            </Link>
          </div>
          <OrnamentalDivider />
          <p className="text-xs text-muted-brown mt-1">
            © {new Date().getFullYear()} कृष्णकुंज माँ कर्मा धाम — जिला साहू
            संघ खैरागढ़-छुईखदान-गंडई
          </p>
        </div>
      </footer>
    </div>
  );
}
