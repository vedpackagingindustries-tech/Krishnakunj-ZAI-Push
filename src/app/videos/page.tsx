import { db, isDbAvailable } from "@/lib/db";
import Navigation from "@/components/temple/Navigation";
import OrnamentalDivider from "@/components/temple/OrnamentalDivider";
import { TEMPLE } from "@/lib/temple-config";
import { Video } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `वीडियो — ${TEMPLE.name}`,
  description: `${TEMPLE.name} — मंदिर निर्माण एवं धार्मिक गतिविधियों के वीडियो।`,
};

export default async function VideosPage() {
  let videos: { id: string; title: string; url: string; thumbnailUrl: string | null; description: string; category: string }[] = [];

  if (isDbAvailable()) {
    try {
      videos = await db.video.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: "asc" },
      });
    } catch {
      // DB query failed
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-relaxed"
              style={{ color: "#7A3B3B" }}
            >
              मंदिर निर्माण एवं धार्मिक गतिविधियों की झलकियां
            </h1>
            <OrnamentalDivider />
            <p className="text-sm sm:text-base text-muted-brown mt-1">
              {TEMPLE.name}
            </p>
          </div>
        </div>

        {/* ─── Videos Grid ─── */}
        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="rounded-2xl border-2 border-light-beige bg-warm-white overflow-hidden transition-colors hover:border-light-gold"
                    style={{
                      boxShadow: "0 2px 12px rgba(214,174,92,0.08)",
                    }}
                  >
                    {/* Video Thumbnail or Placeholder */}
                    <div className="relative aspect-video bg-warm-ivory">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video
                            size={48}
                            className="text-light-gold"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3
                        className="text-base font-semibold leading-snug mb-1"
                        style={{ color: "#5A3A24" }}
                      >
                        {video.title || "अनाम वीडियो"}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-muted-brown line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      {video.url && (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-elegant-orange hover:text-soft-saffron transition-colors mt-3"
                        >
                          <Video size={14} />
                          वीडियो देखें
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl border-2 border-dashed border-light-gold bg-warm-ivory/50 p-10 sm:p-14 text-center"
              >
                <Video size={40} className="mx-auto mb-3 text-light-gold" />
                <p className="text-muted-brown text-sm sm:text-base">
                  वीडियो जल्द ही यहाँ अपलोड किए जाएंगे।
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p
            className="text-base sm:text-lg font-bold mb-1"
            style={{ color: "#E88A24" }}
          >
            {TEMPLE.name}
          </p>
          <p className="text-xs sm:text-sm text-muted-brown">
            {TEMPLE.address}
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
            © {new Date().getFullYear()} {TEMPLE.name} — {TEMPLE.organization}
          </p>
        </div>
      </footer>
    </div>
  );
}
