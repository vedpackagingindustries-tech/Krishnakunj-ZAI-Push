'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import OrnamentalDivider from '@/components/temple/OrnamentalDivider';
import { Loader2, Printer, Download, Share2, Home, Eye, AlertTriangle, WifiOff, FileQuestion } from 'lucide-react';

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
interface DonationRecord {
  id: string;
  receiptNumber: string;
  donorName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentOrderId: string;
  transactionId: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string;
  receiptGeneratedAt: string;
}

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */
function formatDateHindi(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getPaymentMethodLabel(method: string): string {
  if (!method) return 'UPI';
  const map: Record<string, string> = {
    UPI: 'UPI',
    upi: 'UPI',
    CARD: 'कार्ड',
    card: 'कार्ड',
    NET_BANKING: 'नेट बैंकिंग',
    NETBANKING: 'नेट बैंकिंग',
    net_banking: 'नेट बैंकिंग',
    BANK_TRANSFER: 'बैंक ट्रांसफर',
    bank_transfer: 'बैंक ट्रांसफर',
    CASH: 'नकद',
    cash: 'नकद',
  };
  return map[method] || method;
}

/* ------------------------------------------------------------------
   Error States
   ------------------------------------------------------------------ */
function PaymentFailedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-deep-maroon" />
        </div>
        <h2 className="text-xl font-bold text-deep-warm-brown mb-3">
          भुगतान असफल
        </h2>
        <p className="text-muted-brown mb-8 leading-relaxed">
          भुगतान पूरा नहीं हो सका। कृपया पुनः प्रयास करें।
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-6 py-3 text-deep-warm-brown font-semibold hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
        >
          दोबारा प्रयास करें
        </button>
      </div>
    </div>
  );
}

function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warm-ivory flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-muted-brown" />
        </div>
        <h2 className="text-xl font-bold text-deep-warm-brown mb-3">
          संपर्क विफल
        </h2>
        <p className="text-muted-brown mb-8 leading-relaxed">
          नेटवर्क समस्या के कारण प्रक्रिया पूरी नहीं हो सकी। कृपया पुनः प्रयास करें।
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-6 py-3 text-deep-warm-brown font-semibold hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
        >
          पुनः प्रयास करें
        </button>
      </div>
    </div>
  );
}

function NotFoundError() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warm-ivory flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-muted-brown" />
        </div>
        <h2 className="text-xl font-bold text-deep-warm-brown mb-3">
          प्रवेश नहीं मिला
        </h2>
        <p className="text-muted-brown mb-8 leading-relaxed">
          यह भुगतान अनुरोध समाप्त हो चुका है। कृपया नया भुगतान अनुरोध बनाएं।
        </p>
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-6 py-3 text-deep-warm-brown font-semibold hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
        >
          दान करें
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Loading State
   ------------------------------------------------------------------ */
function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-elegant-orange animate-spin mx-auto mb-4" />
        <p className="text-muted-brown text-sm">भुगतान की जानकारी प्राप्त की जा रही है…</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Gold Ornamental Divider (receipt-internal)
   ------------------------------------------------------------------ */
function GoldDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="block h-px flex-1" style={{ backgroundColor: '#D6AE5C' }} />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mx-2" aria-hidden="true">
        <circle cx="6" cy="6" r="4" fill="#D6AE5C" opacity="0.5" />
      </svg>
      <span className="block h-px flex-1" style={{ backgroundColor: '#D6AE5C' }} />
    </div>
  );
}

/* ------------------------------------------------------------------
   Lotus / Diya SVG (bottom of receipt)
   ------------------------------------------------------------------ */
function LotusDiya() {
  return (
    <svg
      width="60"
      height="36"
      viewBox="0 0 60 36"
      fill="none"
      className="mx-auto mt-2"
      aria-hidden="true"
    >
      {/* Diya base */}
      <ellipse cx="30" cy="30" rx="16" ry="5" fill="#D6AE5C" opacity="0.4" />
      <path d="M18 28 Q18 22 22 20 L38 20 Q42 22 42 28" fill="#E88A24" opacity="0.5" />
      {/* Flame */}
      <path d="M28 20 Q30 8 32 20" fill="#E8A23A" opacity="0.6" />
      <path d="M29 20 Q30 12 31 20" fill="#F3C46B" opacity="0.8" />
      {/* Small petals around */}
      <ellipse cx="14" cy="28" rx="4" ry="2" fill="#D6AE5C" opacity="0.25" transform="rotate(-20 14 28)" />
      <ellipse cx="46" cy="28" rx="4" ry="2" fill="#D6AE5C" opacity="0.25" transform="rotate(20 46 28)" />
      <ellipse cx="18" cy="24" rx="3" ry="1.5" fill="#D6AE5C" opacity="0.2" transform="rotate(-40 18 24)" />
      <ellipse cx="42" cy="24" rx="3" ry="1.5" fill="#D6AE5C" opacity="0.2" transform="rotate(40 42 24)" />
    </svg>
  );
}

/* ------------------------------------------------------------------
   Main Page Component
   ------------------------------------------------------------------ */
type ErrorType = 'payment_failed' | 'network' | 'not_found' | null;

export default function DonationSuccessPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params.orderId;

  const [donation, setDonation] = useState<DonationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(null);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const audioAttempted = useRef(false);

  const fetchDonation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donate/receipt/${orderId}`);
      if (res.status === 404) {
        setError('not_found');
        return;
      }
      if (!res.ok) {
        setError('network');
        return;
      }
      const json = await res.json();
      const data: DonationRecord = json.donation;
      if (!data) {
        setError('not_found');
        return;
      }
      if (data.paymentStatus !== 'SUCCESS') {
        setError('payment_failed');
        return;
      }
      setDonation(data);
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /* Fetch on mount */
  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  /* Attempt autoplay of devotional audio */
  useEffect(() => {
    if (!donation || audioAttempted.current) return;
    audioAttempted.current = true;

    const audio = new Audio('/audio/jai-shri-krishna.mp3');
    audio.loop = false;

    const tryPlay = audio.play();
    if (tryPlay !== undefined) {
      tryPlay
        .then(() => {
          setAudioPlayed(true);
        })
        .catch(() => {
          setAudioAllowed(true);
        });
    }
  }, [donation]);

  const handlePlayAudio = () => {
    const audio = new Audio('/audio/jai-shri-krishna.mp3');
    audio.loop = false;
    audio.play().then(() => {
      setAudioPlayed(true);
      setAudioAllowed(false);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!donation) return;
    const text = `🙏 *कृष्णकुंज माँ कर्मा धाम*

मैंने मंदिर निर्माण हेतु ₹${donation.amount.toLocaleString('en-IN')} का दान किया।

पावती क्रमांक: ${donation.receiptNumber}
आप भी इस पावन कार्य में सहयोग करें।

जय श्री कृष्ण 🙏 जय श्री राधे 🙏`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleScrollToReceipt = () => {
    const el = document.getElementById('donation-receipt');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ── Render ── */

  if (loading) return <LoadingState />;

  if (error === 'payment_failed') {
    return <PaymentFailedError onRetry={() => router.push('/donate')} />;
  }
  if (error === 'network') {
    return <NetworkError onRetry={fetchDonation} />;
  }
  if (error === 'not_found') {
    return <NotFoundError />;
  }

  if (!donation) return null;

  const hindiDate = formatDateHindi(donation.paidAt || donation.createdAt);
  const paymentLabel = getPaymentMethodLabel(donation.paymentMethod);

  return (
    <>
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #donation-receipt,
          #donation-receipt * {
            visibility: visible;
          }
          #donation-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            border: 2px solid #D6AE5C !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #FFFFFF !important;
          }
          @page {
            margin: 0.5cm;
            size: auto;
          }
        }
      `}</style>

      <div className="flex-1 flex flex-col">
        {/* ══════════════════════════════════════════════
            SUCCESS SCREEN
           ══════════════════════════════════════════════ */}
        <section className="px-4 pt-8 pb-4 sm:pt-12 sm:pb-6 text-center">
          <div className="max-w-md mx-auto">
            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-deep-warm-brown leading-snug mb-2">
              आपका दान सफलतापूर्वक प्राप्त हुआ
            </h1>

            {/* Temple Name */}
            <p className="text-lg sm:text-xl text-elegant-orange font-semibold mb-5">
              श्री कृष्णकुंज माँ कर्मा धाम
            </p>

            {/* Donor Name */}
            <p className="text-base sm:text-lg text-deep-warm-brown mb-1">
              दानदाता: {donation.donorName}
            </p>

            {/* Amount — Very Large */}
            <p className="text-4xl sm:text-5xl font-extrabold text-elegant-orange my-4">
              ₹{donation.amount.toLocaleString('en-IN')}
            </p>

            {/* Receipt Number */}
            <p className="text-sm text-muted-brown mb-4">
              पावती क्रमांक: {donation.receiptNumber}
            </p>

            {/* Status Badge — ONLY green used */}
            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              सफल
            </span>

            {/* Transaction ID */}
            {donation.transactionId && (
              <p className="text-sm text-muted-brown mb-1">
                Transaction ID: {donation.transactionId}
              </p>
            )}

            {/* Date */}
            <p className="text-sm text-muted-brown mb-4">
              दिनांक: {hindiDate}
            </p>

            {/* Ornamental Divider */}
            <OrnamentalDivider />

            {/* Blessing Message */}
            <p className="italic text-muted-brown leading-relaxed mt-2 text-base sm:text-lg">
              मंदिर निर्माण के इस पावन कार्य में सहयोग करने के लिए आपका सादर धन्यवाद।
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            DEVOTIONAL AUDIO BUTTON
           ══════════════════════════════════════════════ */}
        {audioAllowed && !audioPlayed && (
          <div className="flex justify-center px-4 pb-6 no-print">
            <button
              onClick={handlePlayAudio}
              className="rounded-full bg-elegant-orange text-white px-6 py-3 text-base font-semibold hover:bg-soft-saffron transition-colors shadow-md"
            >
              🔊 जय श्री कृष्ण, जय श्री राधे
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ACTION BUTTONS (above receipt)
           ══════════════════════════════════════════════ */}
        <section className="px-4 pb-6 no-print">
          <div className="max-w-md mx-auto flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleScrollToReceipt}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Eye className="w-4 h-4" />
              दान पावती देखें
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Printer className="w-4 h-4" />
              प्रिंट करें
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Download className="w-4 h-4" />
              पावती डाउनलोड करें
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp पर साझा करें
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Home className="w-4 h-4" />
              मुख्यपृष्ठ पर जाएँ
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            RECEIPT SECTION
           ══════════════════════════════════════════════ */}
        <section className="px-4 pb-12">
          <h2 className="text-2xl font-bold text-deep-warm-brown text-center mb-6">
            दान पावती
          </h2>

          <div
            id="donation-receipt"
            className="max-w-md mx-auto rounded-2xl p-6 sm:p-8"
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #D6AE5C',
            }}
          >
            {/* Gold ornamental divider at top */}
            <GoldDivider />

            {/* Temple Name — centered */}
            <h3 className="text-center text-lg font-bold text-elegant-orange mt-2 mb-1">
              कृष्णकुंज माँ कर्मा धाम
            </h3>
            <p className="text-center text-xs text-muted-brown mb-3">
              सिविल लाईन रोड, (अकरजन) खैरागढ़, (छ.ग.)
            </p>

            <GoldDivider />

            {/* सादर धन्यवाद */}
            <p className="text-center text-deep-maroon font-semibold py-2">
              सादर धन्यवाद
            </p>

            <GoldDivider />

            {/* Key-Value Pairs */}
            <div className="space-y-3 py-3">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">दानदाता का नाम:</span>
                <span className="text-base font-semibold text-deep-warm-brown">{donation.donorName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">दान राशि:</span>
                <span className="text-base font-semibold text-deep-warm-brown">₹{donation.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">पावती क्रमांक:</span>
                <span className="text-base font-semibold text-deep-warm-brown">{donation.receiptNumber}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">भुगतान माध्यम:</span>
                <span className="text-base font-semibold text-deep-warm-brown">{paymentLabel}</span>
              </div>
              {donation.transactionId && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="text-sm text-muted-brown sm:min-w-[140px]">Transaction ID:</span>
                  <span className="text-base font-semibold text-deep-warm-brown">{donation.transactionId}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">दिनांक:</span>
                <span className="text-base font-semibold text-deep-warm-brown">{hindiDate}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-sm text-muted-brown sm:min-w-[140px]">भुगतान स्थिति:</span>
                <span className="text-base font-semibold text-green-700">सफल</span>
              </div>
            </div>

            <GoldDivider />

            {/* Blessing message (centered) */}
            <p className="text-center text-sm italic text-deep-warm-brown leading-relaxed py-2">
              मंदिर निर्माण के इस पावन कार्य में सहयोग करने के लिए आपका सादर धन्यवाद।
            </p>

            {/* CRITICAL — Bottom blessing lines (exact, do not modify) */}
            <div className="text-center mt-4 space-y-1">
              <p className="text-sm italic text-deep-warm-brown leading-relaxed">
                इस दिव्य कार्य में सहयोग करने पर ईश्वर आपकी सारी मनोकामनाएँ पूरी करे एवं आपको और आपके प्रियजनों को स्वस्थ रखे।
              </p>
              <p className="text-base font-bold text-elegant-orange mt-3">जय श्री कृष्ण</p>
              <p className="text-base font-bold text-elegant-orange">जय श्री राधे</p>
            </div>

            {/* Lotus / Diya decorative element */}
            <LotusDiya />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            ACTION BUTTONS (below receipt — repeat for convenience)
           ══════════════════════════════════════════════ */}
        <section className="px-4 pb-12 no-print">
          <div className="max-w-md mx-auto flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleScrollToReceipt}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Eye className="w-4 h-4" />
              दान पावती देखें
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Printer className="w-4 h-4" />
              प्रिंट करें
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Download className="w-4 h-4" />
              पावती डाउनलोड करें
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp पर साझा करें
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-light-gold px-5 py-2.5 text-sm font-semibold text-deep-warm-brown hover:bg-elegant-orange hover:text-white hover:border-elegant-orange transition-colors"
            >
              <Home className="w-4 h-4" />
              मुख्यपृष्ठ पर जाएँ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
