"use client";

import Image from "next/image";
import {
  MapPin,
  CalendarDays,
  Heart,
  Camera,
  Video,
  ChevronRight,
  Flower2,
} from "lucide-react";
import Navigation from "@/components/temple/Navigation";
import OrnamentalDivider from "@/components/temple/OrnamentalDivider";

/* ─── Data Constants ─── */
const TEMPLE_NAME = "कृष्णकुंज माँ कर्मा धाम";
const TEMPLE_ADDRESS = "सिविल लाईन रोड, (अकरजन) खैरागढ़, (छ.ग.)";

const JAI_SLOGANS = "।।जय कर्मा।।      ।।जय भामाशाह।।    ।।जय राजिम।।";

const COMMITTEE_MEMBERS = [
  { name: "श्री गिरधारी साहू", post: "अध्यक्ष", phone: "9691065812" },
  { name: "श्री भागवत साहू", post: "सचिव", phone: "8103144031" },
  { name: "श्रीमती कांति साहू", post: "कोषाध्यक्ष", phone: "9340159613" },
  { name: "श्री फुलदास साहू", post: "सामग्री प्रभारी", phone: "9589781615" },
  { name: "श्री सुशील साहू", post: "उपकोषाध्यक्ष", phone: "9009250736" },
  { name: "श्रीमती प्रमिला साहू", post: "प्रचार सचिव", phone: "9907271071" },
];

const MAIN_MESSAGE =
  "केवल एक मंदिर का निर्माण नहीं है, यह जिला साहू संघ खैरागढ़-छुईखदान-गंडई क्षेत्र के संपूर्ण साहू समाज के स्वाभिमान, गौरव और अटूट एकता का पावन प्रतीक है। साहू समाज के राष्ट्र गौरव परम पूज्य संत माता कर्मा और छत्तीसगढ़ के राजिम धाम मे बिराजे साहू समाज के आराध्य माता राजिम का दिव्य भव्य नवनिर्मित मंदिर (अनुमानित लागत ₹25 लाख) आकार ले रहा है। आगामी फरवरी 2027 को मंदिर के गर्भगृह में दिव्य मूर्तियों की प्राण-प्रतिष्ठा की जाएगी।आप सभी से करबद्ध और भावपूर्ण निवेदन है कि अपने पूर्वजों की पावन स्मृति में, इस महायज्ञ में अपनी श्रद्धा अनुसार समर्पण निधि या निर्माण सामग्री प्रदान कर पुण्य के भागीदार बनें।";

const PROGRESS_STAGES = [
  { label: "भूमि कार्य" },
  { label: "नींव" },
  { label: "निर्माण कार्य" },
  { label: "गर्भगृह" },
  { label: "अन्य कार्य" },
];

const FOOTER_LINKS = [
  { label: "मुख्यपृष्ठ", href: "/" },
  { label: "वीडियो", href: "/videos" },
  { label: "संपर्क", href: "/contact" },
  { label: "दान करें", href: "/donate" },
];

/* ─── Decorative SVG: Lotus ─── */
function LotusIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 4C20 4 14 12 14 20C14 24.4 16.7 28 20 30C23.3 28 26 24.4 26 20C26 12 20 4 20 4Z"
        fill="#F3C46B"
        opacity="0.35"
      />
      <path
        d="M20 8C20 8 10 16 10 22C10 26.4 14.5 30 20 32C25.5 30 30 26.4 30 22C30 16 20 8 20 8Z"
        fill="#E8A23A"
        opacity="0.2"
      />
      <path
        d="M20 14C20 14 6 18 4 24C2 30 10 34 20 36C30 34 38 30 36 24C34 18 20 14 20 14Z"
        fill="#D6AE5C"
        opacity="0.15"
      />
      <circle cx="20" cy="20" r="2" fill="#E8A23A" opacity="0.5" />
    </svg>
  );
}

/* ─── Decorative SVG: Diya (lamp) ─── */
function DiyaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2C12 2 8 6 8 12C8 14 9 16 10.5 17H13.5C15 16 16 14 16 12C16 6 12 2 12 2Z"
        fill="#F3C46B"
        opacity="0.6"
      />
      <ellipse cx="12" cy="18" rx="5" ry="2" fill="#E8A23A" opacity="0.4" />
      <path
        d="M12 6V10"
        stroke="#E88A24"
        strokeWidth="1"
        opacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Decorative SVG: Temple arch ─── */
function TempleArchDivider() {
  return (
    <div className="flex items-center justify-center py-6" aria-hidden="true">
      <span className="block h-px flex-1 max-w-24 bg-gradient-to-r from-transparent via-light-gold to-transparent" />
      <svg
        width="32"
        height="20"
        viewBox="0 0 32 20"
        fill="none"
        className="mx-3"
      >
        <path
          d="M2 18V8C2 4 6 1 16 1C26 1 30 4 30 8V18"
          stroke="#D6AE5C"
          strokeWidth="1.5"
          opacity="0.5"
          fill="none"
        />
        <path
          d="M0 19H32"
          stroke="#D6AE5C"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
      <span className="block h-px flex-1 max-w-24 bg-gradient-to-l from-transparent via-light-gold to-transparent" />
    </div>
  );
}

/* ─── Section Wrapper ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}

/* ─── Section Heading ─── */
function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-2xl sm:text-3xl font-bold text-deep-warm-brown text-center mb-3 leading-relaxed ${className}`}
    >
      {children}
    </h2>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function HomePage() {

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFF9ED" }}>
      {/* ─── NAVIGATION ─── */}
      <Navigation />

      <main className="flex-1">
        {/* ─── TOP BRAND TITLE WITH MATA PHOTOS ─── */}
        <div className="bg-warm-white border-b border-light-beige">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            {/* Jai Slogans */}
            <p
              className="text-center text-sm sm:text-base md:text-lg font-semibold tracking-wide mb-5 sm:mb-7"
              style={{ color: "#E8A23A" }}
            >
              {JAI_SLOGANS}
            </p>

            {/* Mata Photos + Temple Name */}
            <div className="flex flex-col items-center gap-3 sm:gap-0 sm:flex-row sm:justify-center sm:gap-6 md:gap-10">
              {/* Mobile: photos side by side above heading */}
              <div className="flex items-center justify-center gap-4 sm:hidden">
                <div className="flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden border-2 border-light-gold"
                  style={{ boxShadow: "0 4px 16px rgba(214,174,92,0.25)", backgroundColor: "#FFF9ED" }}
                >
                  <Image
                    src="/images/karma-mata.png"
                    alt="संत माता कर्मा"
                    width={200}
                    height={250}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden border-2 border-light-gold"
                  style={{ boxShadow: "0 4px 16px rgba(214,174,92,0.25)", backgroundColor: "#FFF9ED" }}
                >
                  <Image
                    src="/images/mata-photo.png"
                    alt="माता राजिम"
                    width={200}
                    height={250}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Desktop/tablet: LEFT photo (before heading) */}
              <div className="hidden sm:block flex-shrink-0 w-28 h-32 md:w-36 md:h-44 rounded-2xl overflow-hidden border-2 border-light-gold"
                style={{ boxShadow: "0 4px 16px rgba(214,174,92,0.25)", backgroundColor: "#FFF9ED" }}
              >
                <Image
                  src="/images/karma-mata.png"
                  alt="संत माता कर्मा"
                  width={200}
                  height={250}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              {/* Center: Temple Name */}
              <h1
                className="temple-title-animated text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-center whitespace-nowrap overflow-visible sm:flex-1"
              >
                {TEMPLE_NAME}
              </h1>

              {/* Desktop/tablet: RIGHT photo (after heading) */}
              <div className="hidden sm:block flex-shrink-0 w-28 h-32 md:w-36 md:h-44 rounded-2xl overflow-hidden border-2 border-light-gold"
                style={{ boxShadow: "0 4px 16px rgba(214,174,92,0.25)", backgroundColor: "#FFF9ED" }}
              >
                <Image
                  src="/images/mata-photo.png"
                  alt="माता राजिम"
                  width={200}
                  height={250}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── HERO SECTION ─── */}
        <section className="relative" aria-label="मंदिर चित्र और संदेश">
          {/* Temple Photo with Divine Effects */}
          <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 8px 30px rgba(214,174,92,0.15)" }}
            >
              <Image
                src="/images/temple-photo.jpeg"
                alt="कृष्णकुंज माँ कर्मा धाम मंदिर"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px"
              />

              {/* ── Divine rays from centre (subtle) ── */}
              <div className="divine-rays-container">
                <div className="divine-ray" />
                <div className="divine-ray" />
                <div className="divine-ray" />
                <div className="divine-glow-center" />
              </div>

              {/* ── Sparkle particles (few, subtle) ── */}
              <div className="sparkle-container">
                <div className="sparkle" /><div className="sparkle" />
                <div className="sparkle" /><div className="sparkle" />
                <div className="sparkle" /><div className="sparkle" />
              </div>
            </div>
          </div>

          {/* Hero Heading & Main Message */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8 sm:pb-12 text-center">
            <h2
              className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed mb-6"
              style={{ color: "#7A3B3B" }}
            >
              प्रिय स्वजातीय बंधुओं एवं पदाधिकारीयो
            </h2>

            <p
              className="text-base sm:text-lg leading-8 sm:leading-9 text-justify sm:text-center"
              style={{ color: "#5A3A24", lineHeight: "2" }}
            >
              {MAIN_MESSAGE}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <a
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-elegant-orange hover:bg-soft-saffron text-white text-base sm:text-lg font-semibold rounded-full transition-colors shadow-md min-h-[48px]"
                style={{ boxShadow: "0 4px 15px rgba(232,138,36,0.3)" }}
              >
                🙏 अभी दान करें
              </a>
              <a
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-warm-white text-deep-warm-brown text-base sm:text-lg font-medium rounded-full border-2 border-light-gold hover:border-soft-saffron hover:bg-warm-ivory transition-colors min-h-[48px]"
              >
                अभी दान करें
              </a>
            </div>
          </div>
        </section>

        <TempleArchDivider />

        {/* ─── TEMPLE INFORMATION SECTION ─── */}
        <Section id="temple-info" className="bg-warm-white">
          <LotusIcon className="w-12 h-12 mx-auto mb-4" />
          <SectionHeading>{TEMPLE_NAME}</SectionHeading>
          <OrnamentalDivider />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-muted-brown">
              <MapPin size={18} className="text-soft-saffron" />
              <span className="text-sm sm:text-base">{TEMPLE_ADDRESS}</span>
            </div>
          </div>
        </Section>

        {/* ─── CONSTRUCTION COST HIGHLIGHT ─── */}
        <Section id="construction-cost">
          <DiyaIcon className="w-10 h-10 mx-auto mb-3" />
          <SectionHeading>मंदिर निर्माण का पावन संकल्प</SectionHeading>
          <OrnamentalDivider />
          <div className="flex flex-col items-center gap-4 mt-2">
            <div
              className="inline-block px-8 py-5 rounded-2xl border-2 border-light-gold bg-warm-white"
              style={{ boxShadow: "0 4px 20px rgba(214,174,92,0.12)" }}
            >
              <p className="text-sm text-muted-brown text-center mb-1">
                अनुमानित लागत
              </p>
              <p
                className="text-3xl sm:text-4xl font-extrabold text-center"
                style={{ color: "#E88A24" }}
              >
                ₹25 लाख
              </p>
            </div>
          </div>
        </Section>

        {/* ─── PRAN-PRATISHTHA SECTION ─── */}
        <Section
          id="pran-pratishtha"
          className="bg-warm-white"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <CalendarDays size={24} className="text-soft-saffron" />
          </div>
          <SectionHeading>प्राण-प्रतिष्ठा — फरवरी 2027</SectionHeading>
          <OrnamentalDivider />
          <p
            className="text-center text-base sm:text-lg max-w-2xl mx-auto leading-8"
            style={{ color: "#5A3A24" }}
          >
            आगामी फरवरी 2027 को मंदिर के गर्भगृह में दिव्य मूर्तियों की प्राण-प्रतिष्ठा
            की जाएगी।
          </p>
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-3">
              {[...Array(3)].map((_, i) => (
                <DiyaIcon key={i} className="w-8 h-8" />
              ))}
            </div>
          </div>
        </Section>

        {/* ─── DONATION CTA SECTION ─── */}
        <Section
          id="donation-cta"
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FFF9ED 0%, #EDE2D0 50%, #FFF9ED 100%)" }}
        >
          {/* Subtle decorative elements */}
          <LotusIcon className="absolute top-4 left-4 w-16 h-16 opacity-20" aria-hidden="true" />
          <LotusIcon className="absolute bottom-4 right-4 w-16 h-16 opacity-20" aria-hidden="true" />

          <div className="relative z-10 text-center">
            <Heart size={32} className="mx-auto mb-3 text-deep-maroon" />
            <SectionHeading>इस पावन महायज्ञ में अपना योगदान दें</SectionHeading>
            <OrnamentalDivider />
            <p
              className="text-base sm:text-lg max-w-2xl mx-auto leading-8 mb-2"
              style={{ color: "#5A3A24" }}
            >
              अपनी श्रद्धा अनुसार समर्पण निधि अथवा निर्माण सामग्री प्रदान कर पुण्य
              के भागीदार बनें।
            </p>

            <a
              href="/donate"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-elegant-orange hover:bg-soft-saffron text-white text-lg font-semibold rounded-full transition-colors shadow-lg mt-6 min-h-[52px]"
              style={{ boxShadow: "0 6px 20px rgba(232,138,36,0.35)" }}
            >
              🙏 अभी दान करें
            </a>

            <p
              className="text-sm text-muted-brown mt-4 max-w-lg mx-auto leading-7"
            >
              आपका सहयोग मंदिर निर्माण के इस पावन कार्य में महत्वपूर्ण योगदान है।
            </p>
          </div>
        </Section>

        <TempleArchDivider />

        {/* ─── CONSTRUCTION PROGRESS ─── */}
        <Section id="progress" className="bg-warm-white">
          <SectionHeading>मंदिर निर्माण की प्रगति</SectionHeading>
          <OrnamentalDivider />
          <div className="mt-6 max-w-2xl mx-auto">
            {/* Placeholder/Empty State */}
            <div
              className="rounded-2xl border-2 border-dashed border-light-gold bg-warm-ivory/50 p-8 sm:p-12 text-center"
            >
              <Flower2 size={40} className="mx-auto mb-3 text-light-gold" />
              <p className="text-muted-brown text-sm sm:text-base">
                मंदिर निर्माण की प्रगति जल्द ही यहाँ अपडेट की जाएगी।
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {PROGRESS_STAGES.map((stage) => (
                  <span
                    key={stage.label}
                    className="px-4 py-2 bg-warm-white rounded-full text-sm font-medium border border-light-beige text-muted-brown"
                  >
                    {stage.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <a
              href="/donate"
              className="inline-flex items-center gap-1 text-sm font-medium text-soft-saffron hover:text-elegant-orange transition-colors"
            >
              दान करें
              <ChevronRight size={16} />
            </a>
          </div>
        </Section>

        {/* ─── TEMPLE PHOTO GALLERY ─── */}
        <Section id="gallery">
          <Camera size={24} className="mx-auto mb-3 text-soft-saffron" />
          <SectionHeading>मंदिर निर्माण की झलकियाँ</SectionHeading>
          <OrnamentalDivider />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Featured: The attached temple photo */}
            <div
              className="sm:col-span-2 rounded-2xl overflow-hidden border border-light-gold"
              style={{ boxShadow: "0 2px 12px rgba(214,174,92,0.1)" }}
            >
              <Image
                src="/images/temple-photo.jpeg"
                alt="कृष्णकुंज माँ कर्मा धाम मंदिर — मुख्य दृश्य"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </div>
          {/* Empty state for additional photos */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-brown">
              अधिक चित्र जल्द ही जोड़े जाएंगे।
            </p>
          </div>
        </Section>

        {/* ─── VIDEO SECTION ─── */}
        <Section id="videos" className="bg-warm-white">
          <Video size={24} className="mx-auto mb-3 text-soft-saffron" />
          <SectionHeading>
            मंदिर निर्माण एवं धार्मिक गतिविधियों की झलकियाँ
          </SectionHeading>
          <OrnamentalDivider />
          <div className="mt-6">
            {/* Empty State */}
            <div
              className="rounded-2xl border-2 border-dashed border-light-gold bg-warm-ivory/50 p-8 sm:p-12 text-center max-w-lg mx-auto"
            >
              <Video size={40} className="mx-auto mb-3 text-light-gold" />
              <p className="text-muted-brown text-sm sm:text-base">
                वीडियो जल्द ही यहाँ अपलोड किए जाएंगे।
              </p>
            </div>
          </div>
        </Section>

        {/* ─── DONOR GRATITUDE ─── */}
        <Section
          id="gratitude"
          style={{ background: "linear-gradient(135deg, #FFF9ED 0%, #EDE2D0 50%, #FFF9ED 100%)" }}
        >
          <Heart size={28} className="mx-auto mb-3 text-deep-maroon" />
          <SectionHeading>सभी सहयोगकर्ताओं का हार्दिक धन्यवाद</SectionHeading>
          <OrnamentalDivider />
          <p
            className="text-center text-base sm:text-lg max-w-2xl mx-auto leading-8"
            style={{ color: "#5A3A24" }}
          >
            आपका सहयोग मंदिर निर्माण के इस पावन कार्य को आगे बढ़ाने में
            महत्वपूर्ण योगदान है।
          </p>
          <div className="text-center mt-6">
            <a
              href="/donate"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-elegant-orange hover:bg-soft-saffron text-white text-base font-semibold rounded-full transition-colors shadow-md min-h-[48px]"
            >
              मंदिर निर्माण में सहयोग करें
            </a>
          </div>
        </Section>

        {/* ─── CONTACT SECTION ─── */}
        <Section id="contact" className="bg-warm-white">
          <MapPin size={24} className="mx-auto mb-3 text-soft-saffron" />
          <SectionHeading>संपर्क</SectionHeading>
          <OrnamentalDivider />
          <div className="flex flex-col items-center gap-3 mt-2">
            <p
              className="text-lg font-bold"
              style={{ color: "#E88A24" }}
            >
              {TEMPLE_NAME}
            </p>
            <div className="flex items-center gap-2 text-muted-brown">
              <MapPin size={16} className="text-soft-saffron" />
              <span className="text-sm sm:text-base">{TEMPLE_ADDRESS}</span>
            </div>
            <p className="text-sm text-muted-brown mt-2">
              अधिक जानकारी के लिए कृपया संपर्क करें।
            </p>
          </div>
        </Section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer
        className="border-t border-light-beige bg-warm-white mt-auto"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Temple Name & Address */}
          <div className="text-center mb-6">
            <p
              className="text-lg sm:text-xl font-bold mb-1"
              style={{ color: "#E88A24" }}
            >
              {TEMPLE_NAME}
            </p>
            <p className="text-xs sm:text-sm text-muted-brown">
              {TEMPLE_ADDRESS}
            </p>
          </div>

          {/* Committee Contact Details */}
          <div className="mb-6">
            <h3
              className="text-base sm:text-lg font-bold text-center mb-4"
              style={{ color: "#7A3B3B" }}
            >
              संपर्क
            </h3>
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {COMMITTEE_MEMBERS.map((member) => (
                <div
                  key={member.phone}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 py-2 px-3 rounded-lg bg-warm-ivory/60 border border-light-beige"
                >
                  <span className="font-semibold text-sm sm:text-base" style={{ color: "#5A3A24" }}>
                    {member.name}
                  </span>
                  <span className="text-xs sm:text-sm font-medium" style={{ color: "#E8A23A" }}>
                    {member.post}
                  </span>
                  <a
                    href={`tel:${member.phone}`}
                    className="text-xs sm:text-sm text-muted-brown hover:text-elegant-orange transition-colors"
                  >
                    मो.नं. {member.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4"
            aria-label="फुटर नेविगेशन"
          >
            {FOOTER_LINKS.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs sm:text-sm text-muted-brown hover:text-elegant-orange transition-colors"
              >
                {link.label}
                {idx < FOOTER_LINKS.length - 1 && (
                  <span className="hidden sm:inline text-light-beige ml-4">|</span>
                )}
              </a>
            ))}
          </nav>

          <OrnamentalDivider />

          <p className="text-xs text-muted-brown mt-2 text-center">
            © {new Date().getFullYear()} {TEMPLE_NAME} — जिला साहू संघ
            खैरागढ़-छुईखदान-गंडई
          </p>

          {/* Admin Login — only in footer */}
          <p className="text-center mt-4">
            <a
              href="/admin"
              className="text-xs text-muted-brown/50 hover:text-muted-brown transition-colors"
            >
              एडमिन लॉगिन
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
